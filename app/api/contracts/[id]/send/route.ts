import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendContractEmail } from "@/lib/email";
import { generatePublicUrl } from "@/lib/link-tokens";

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

    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select(
        `
        *,
        clients (
          name,
          email
        )
      `,
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 },
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, business_name, email")
      .eq("id", user.id)
      .single();

    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("contracts")
      .update({ status: "sent", sent_at: now, updated_at: now })
      .eq("id", id);

    if (updateError) throw updateError;

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const signingLink = generatePublicUrl(baseUrl, "sign", id);

    try {
      if (contract.clients?.email) {
        await sendContractEmail({
          to: contract.clients.email,
          clientName: contract.clients.name,
          freelancerName: profile?.name || "Freelancer",
          businessName: profile?.business_name || null,
          contractTitle: contract.title,
          signingLink,
          contractType: contract.type,
        });
      }
    } catch (emailError) {
      console.error("Failed to send contract email:", emailError);
    }

    return NextResponse.json({ success: true, signingLink });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to send contract";
    console.error("Error sending contract:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
