import { NextResponse } from "next/server";
import { createClient, createPublicClient } from "@/lib/supabase/server";
import { errorMessage } from "@/lib/log-redact";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: contract, error: fetchError } = await supabase
      .from("contracts")
      .select("id, status, client_id, clients(email)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !contract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 },
      );
    }

    const clientEmail = Array.isArray(contract.clients)
      ? contract.clients[0]?.email
      : (contract.clients as { email?: string } | null)?.email;

    if (!clientEmail) {
      return NextResponse.json(
        { error: "Client has no email address" },
        { status: 400 },
      );
    }

    if (contract.status === "sending") {
      return NextResponse.json(
        { error: "Contract is already being sent" },
        { status: 409 },
      );
    }

    if (!["draft", "sent"].includes(contract.status)) {
      return NextResponse.json(
        { error: "Only draft or sent contracts can be sent" },
        { status: 400 },
      );
    }

    const adminSupabase = createPublicClient();
    const { error: statusError } = await adminSupabase
      .from("contracts")
      .update({
        status: "sending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (statusError) {
      console.error(
        "[contracts/send] status update failed:",
        errorMessage(statusError),
      );
      return NextResponse.json(
        { error: "Failed to start send" },
        { status: 500 },
      );
    }

    const edgeUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-contract-job`;

    fetch(edgeUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contract_id: id }),
    }).catch((err) => {
      console.error("[contracts/send] edge invoke failed:", errorMessage(err));
    });

    return NextResponse.json({
      success: true,
      status: "sending",
    });
  } catch (error: unknown) {
    console.error("[contracts/send] error:", errorMessage(error));
    return NextResponse.json(
      { error: "Failed to send contract" },
      { status: 500 },
    );
  }
}
