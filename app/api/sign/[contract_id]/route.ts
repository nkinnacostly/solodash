import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/server";
import { verifyLinkToken } from "@/lib/link-tokens";

function validateSignToken(
  token: string | null,
  contract_id: string,
): NextResponse | null {
  if (token) {
    const payload = verifyLinkToken(token, contract_id, "sign");
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired sign link" },
        { status: 401 },
      );
    }
  } else {
    console.warn(`[sign] Untokenized access for contract ${contract_id}`);
  }
  return null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ contract_id: string }> },
) {
  try {
    const { contract_id } = await params;
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    const tokenError = validateSignToken(token, contract_id);
    if (tokenError) return tokenError;

    const supabase = createPublicClient();

    const { data: contract, error } = await supabase
      .from("contracts")
      .select(`
        id,
        title,
        content,
        status,
        client_signed_at,
        client_id,
        user_id,
        clients (
          name,
          email
        )
      `)
      .eq("id", contract_id)
      .single();

    if (error || !contract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 },
      );
    }

    if (contract.status === "cancelled") {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 },
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, business_name")
      .eq("id", contract.user_id)
      .single();

    const client = contract.clients as {
      name?: string;
      email?: string;
    } | null;

    const safeContract = {
      id: contract.id,
      title: contract.title,
      content: contract.content,
      status: contract.status,
      client_signed_at: contract.client_signed_at,
      freelancer: {
        name: profile?.name || "",
        business_name: profile?.business_name || null,
      },
      client: {
        name: client?.name || "",
        email: client?.email || "",
      },
    };

    return NextResponse.json({ contract: safeContract });
  } catch (error) {
    console.error("Error fetching contract:", error);
    return NextResponse.json(
      { error: "Failed to fetch contract" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ contract_id: string }> },
) {
  try {
    const { contract_id } = await params;
    const url = new URL(request.url);

    const body = await request.json();
    const token = body.token || url.searchParams.get("token");

    const tokenError = validateSignToken(token, contract_id);
    if (tokenError) return tokenError;

    const { signature_data, signature_type, signer_name, signer_email } = body;

    if (!signature_data || !signature_type || !signer_name || !signer_email) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    const supabase = createPublicClient();

    const { data: contract, error: fetchError } = await supabase
      .from("contracts")
      .select("status, client_signed_at, user_id, title")
      .eq("id", contract_id)
      .single();

    if (fetchError || !contract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 },
      );
    }

    if (contract.status !== "sent") {
      return NextResponse.json(
        { error: "This contract cannot be signed" },
        { status: 400 },
      );
    }

    if (contract.client_signed_at) {
      return NextResponse.json(
        { error: "This contract has already been signed" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    let signatureUrl: string | null = null;

    if (signature_type === "drawn" && signature_data.startsWith("data:image")) {
      try {
        const base64Data = signature_data.replace(
          /^data:image\/\w+;base64,/,
          "",
        );
        const buffer = Buffer.from(base64Data, "base64");

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("documents")
          .upload(`contracts/${contract_id}/client-signature.png`, buffer, {
            contentType: "image/png",
            upsert: true,
          });

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
        } else {
          signatureUrl = uploadData.path;
        }
      } catch (uploadErr) {
        console.error("Failed to upload signature:", uploadErr);
      }
    }

    const { error: updateError } = await supabase
      .from("contracts")
      .update({
        status: "signed",
        client_signed_at: now,
        client_signature_url: signatureUrl,
      })
      .eq("id", contract_id);

    if (updateError) {
      console.error("Contract update error:", updateError);
      return NextResponse.json(
        { error: "Failed to sign contract" },
        { status: 500 },
      );
    }

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", contract.user_id)
        .single();

      if (profile?.email) {
        const { sendContractSignedEmail } = await import("@/lib/email");
        await sendContractSignedEmail({
          to: profile.email,
          freelancerName: profile.name || "Freelancer",
          clientName: signer_name,
          contractTitle: contract.title || "Contract",
          contractLink: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/contracts/${contract_id}`,
        });
      }
    } catch (emailError) {
      console.error("Failed to send notification email:", emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to sign contract";
    console.error("Sign contract error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
