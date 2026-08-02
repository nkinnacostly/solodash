import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { errorMessage } from "@/lib/log-redact";
import { createPublicClient } from "@/lib/supabase/server";
import { sanitizeContractHtml } from "@/lib/sanitize-html";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: contract, error } = await supabase
      .from("contracts")
      .select(
        `
        *,
        clients (
          name,
          email,
          address
        )
      `,
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !contract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 },
      );
    }

    // Fetch profile separately (never join to profiles)
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, business_name")
      .eq("id", user.id)
      .single();

    // Generate signed URL for signature if it exists
    let signature_signed_url: string | null = null;

    // if (contract.client_signature_url) {
    //   const { data: signedUrlData } = await supabase.storage
    //     .from('documents')
    //     .createSignedUrl(contract.client_signature_url, 3600);

    //   signature_signed_url = signedUrlData?.signedUrl || null;
    // }

    if (contract.client_signature_url) {
      // Use service role client to bypass RLS for signed URL generation
      const adminSupabase = createPublicClient();
      const { data: signedUrlData, error: signedUrlError } =
        await adminSupabase.storage
          .from("documents")
          .createSignedUrl(contract.client_signature_url, 3600);

      signature_signed_url = signedUrlData?.signedUrl || null;
    }

    // Generate signed URL for freelancer signature if it exists
    let freelancer_signature_signed_url: string | null = null;

    if (
      contract.freelancer_signature_url &&
      !contract.freelancer_signature_url.startsWith("typed:")
    ) {
      const adminSupabase = createPublicClient();
      const { data: signedUrlData } = await adminSupabase.storage
        .from("documents")
        .createSignedUrl(contract.freelancer_signature_url, 3600);

      freelancer_signature_signed_url = signedUrlData?.signedUrl || null;
    }

    return NextResponse.json({
      contract: {
        ...contract,
        profiles: profile,
        signature_signed_url,
        freelancer_signature_signed_url,
      },
    });
  } catch (error: any) {
    console.error("Error fetching contract:", errorMessage(error));
    return NextResponse.json(
      { error: error.message || "Failed to fetch contract" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch contract to check ownership + status
    const { data: existing, error: fetchError } = await supabase
      .from("contracts")
      .select("status, client_signed_at, freelancer_signed_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 },
      );
    }

    // Editable until it's signed. Draft and sent are fine, but once either
    // party has signed (or the status has advanced past sent) editing would
    // invalidate a signature, so it's locked.
    const isSigned =
      existing.status === "signed" ||
      existing.status === "active" ||
      existing.status === "completed" ||
      Boolean(existing.client_signed_at) ||
      Boolean(existing.freelancer_signed_at);

    if (isSigned) {
      return NextResponse.json(
        { error: "A signed contract can no longer be edited" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { clientId, title, value, currency, startDate, endDate, content } =
      body;

    // Verify the client belongs to this user before assigning (M3)
    if (clientId) {
      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("id", clientId)
        .eq("user_id", user.id)
        .single();

      if (!client) {
        return NextResponse.json(
          { error: "Invalid client" },
          { status: 400 },
        );
      }
    }

    // Restrict writable columns — never let status/signature/user_id be set here
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (clientId !== undefined) updates.client_id = clientId;
    if (title !== undefined) updates.title = title;
    if (value !== undefined) updates.value = Number(value) || 0;
    if (currency !== undefined) updates.currency = currency;
    if (startDate !== undefined) updates.start_date = startDate;
    if (endDate !== undefined) updates.end_date = endDate || null;
    if (content !== undefined) {
      // Always sanitize contract HTML before persisting (H2)
      updates.content = sanitizeContractHtml(content);
    }

    const { data: contract, error: updateError } = await supabase
      .from("contracts")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ contract });
  } catch (error: any) {
    console.error("Error updating contract:", errorMessage(error));
    return NextResponse.json(
      { error: error.message || "Failed to update contract" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch contract to check status
    const { data: contract, error: fetchError } = await supabase
      .from("contracts")
      .select("status")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !contract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 },
      );
    }

    // Only allow deleting drafts
    if (contract.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft contracts can be deleted" },
        { status: 400 },
      );
    }

    const { error: deleteError } = await supabase
      .from("contracts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting contract:", errorMessage(error));
    return NextResponse.json(
      { error: error.message || "Failed to delete contract" },
      { status: 500 },
    );
  }
}
