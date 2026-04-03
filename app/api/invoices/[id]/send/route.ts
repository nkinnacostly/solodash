import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  // Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch invoice with client and user profile data
  const { data: invoice, error: fetchError } = await supabase
    .from("invoices")
    .select(`
      *,
      clients (
        name,
        email
      )
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !invoice) {
    return NextResponse.json(
      { error: "Invoice not found" },
      { status: 404 }
    );
  }

  // Check if already sent or paid
  if (invoice.status === "sent" || invoice.status === "paid") {
    // Allow resending (reminder), just update sent_at
  } else if (invoice.status !== "draft") {
    return NextResponse.json(
      { error: "Cannot send invoice with status: " + invoice.status },
      { status: 400 }
    );
  }

  try {
    const now = new Date().toISOString();

    // Update invoice status
    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        status: invoice.status === "draft" ? "sent" : invoice.status,
        sent_at: now,
        updated_at: now,
      })
      .eq("id", id);

    if (updateError) throw updateError;

    // Fetch updated invoice
    const { data: updatedInvoice } = await supabase
      .from("invoices")
      .select(`
        *,
        clients (
          name,
          email
        )
      `)
      .eq("id", id)
      .single();

    // TODO: Send email with Resend (next phase)
    // await sendInvoiceEmail(updatedInvoice);

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to send invoice" },
      { status: 500 }
    );
  }
}
