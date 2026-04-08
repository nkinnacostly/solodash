import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/server";

export async function POST(
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

    const body = await request.json();
    const { signature_data, signature_type } = body;

    if (!signature_data || !signature_type) {
      return NextResponse.json(
        { error: "Signature data is required" },
        { status: 400 },
      );
    }

    if (signature_type !== "drawn" && signature_type !== "typed") {
      return NextResponse.json(
        { error: "Invalid signature type" },
        { status: 400 },
      );
    }

    // Fetch contract — verify it belongs to this freelancer
    const { data: contract, error: fetchError } = await supabase
      .from("contracts")
      .select("status, client_signed_at, freelancer_signed_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !contract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 },
      );
    }

    // Can only sign if contract is sent or signed by client
    if (contract.status !== "sent" && contract.status !== "signed") {
      return NextResponse.json(
        { error: "This contract cannot be signed at this time" },
        { status: 400 },
      );
    }

    // Already signed by freelancer
    if (contract.freelancer_signed_at) {
      return NextResponse.json(
        { error: "You have already signed this contract" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    let signatureUrl: string;

    if (signature_type === "drawn" && signature_data.startsWith("data:image")) {
      // Upload drawn signature to Supabase Storage
      const adminSupabase = createPublicClient();
      const base64Data = signature_data.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      const { data: uploadData, error: uploadError } =
        await adminSupabase.storage
          .from("documents")
          .upload(`contracts/${id}/freelancer-signature.png`, buffer, {
            contentType: "image/png",
            upsert: true,
          });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        return NextResponse.json(
          { error: "Failed to upload signature" },
          { status: 500 },
        );
      }

      signatureUrl = uploadData.path;
    } else if (signature_type === "typed") {
      // Store typed name as special prefix
      signatureUrl = `typed:${signature_data}`;
    } else {
      return NextResponse.json(
        { error: "Invalid signature data" },
        { status: 400 },
      );
    }

    // Determine new status — if client has also signed, mark as 'signed'
    const newStatus =
      contract.client_signed_at || contract.status === "signed"
        ? "signed"
        : contract.status;

    const { error: updateError } = await supabase
      .from("contracts")
      .update({
        freelancer_signature_url: signatureUrl,
        freelancer_signed_at: now,
        status: newStatus,
      })
      .eq("id", id);

    if (updateError) {
      console.error("Contract update error:", updateError);
      return NextResponse.json(
        { error: "Failed to sign contract" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Freelancer sign error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sign contract" },
      { status: 500 },
    );
  }
}
