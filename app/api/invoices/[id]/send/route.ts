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

    const { data: invoice, error: fetchError } = await supabase
      .from("invoices")
      .select("id, status, client_id, clients(email)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 },
      );
    }

    const clientEmail = Array.isArray(invoice.clients)
      ? invoice.clients[0]?.email
      : (invoice.clients as { email?: string } | null)?.email;

    if (!clientEmail) {
      return NextResponse.json(
        { error: "Client has no email address" },
        { status: 400 },
      );
    }

    if (invoice.status === "sending") {
      return NextResponse.json(
        { error: "Invoice is already being sent" },
        { status: 409 },
      );
    }

    if (!["draft", "sent", "viewed", "overdue"].includes(invoice.status)) {
      return NextResponse.json(
        { error: "This invoice cannot be sent in its current status" },
        { status: 400 },
      );
    }

    const adminSupabase = createPublicClient();
    const { error: statusError } = await adminSupabase
      .from("invoices")
      .update({
        status: "sending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (statusError) {
      console.error(
        "[invoices/send] status update failed:",
        errorMessage(statusError),
      );
      return NextResponse.json(
        { error: "Failed to start send" },
        { status: 500 },
      );
    }

    const edgeUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-invoice-job`;

    fetch(edgeUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ invoice_id: id }),
    }).catch((err) => {
      console.error("[invoices/send] edge invoke failed:", errorMessage(err));
    });

    return NextResponse.json({
      success: true,
      status: "sending",
    });
  } catch (error: unknown) {
    console.error("[invoices/send] error:", errorMessage(error));
    return NextResponse.json(
      { error: "Failed to send invoice" },
      { status: 500 },
    );
  }
}
