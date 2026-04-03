import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendContractEmail } from "@/lib/email";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    // Fetch contract with client
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select(
        `
        *,
        clients (
          name,
          email
        )
      `
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      );
    }

    // Fetch profile separately
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, business_name, email")
      .eq("id", user.id)
      .single();

    const now = new Date().toISOString();

    // Update contract to sent
    const { error: updateError } = await supabase
      .from("contracts")
      .update({ status: "sent", sent_at: now, updated_at: now })
      .eq("id", id);

    if (updateError) throw updateError;

    // Generate signing link
    const signingLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/sign/${id}`;

    // Send email to client (non-blocking)
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
      // Don't block - contract is still marked as sent
    }

    return NextResponse.json({ success: true, signingLink });
  } catch (error: any) {
    console.error("Error sending contract:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send contract" },
      { status: 500 }
    );
  }
}
