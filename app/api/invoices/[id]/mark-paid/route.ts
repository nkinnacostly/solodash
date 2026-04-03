import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
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

  // Fetch invoice to verify ownership and get details
  const { data: invoice, error: fetchError } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !invoice) {
    return NextResponse.json(
      { error: "Invoice not found" },
      { status: 404 }
    );
  }

  // Check if already paid
  if (invoice.status === "paid") {
    return NextResponse.json(
      { error: "Invoice is already marked as paid" },
      { status: 400 }
    );
  }

  try {
    const now = new Date().toISOString();

    // Update invoice status
    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        status: "paid",
        paid_at: now,
        updated_at: now,
      })
      .eq("id", id);

    if (updateError) throw updateError;

    // Insert into income_log
    const { error: logError } = await supabase.from("income_log").insert({
      user_id: user.id,
      invoice_id: id,
      client_id: invoice.client_id,
      amount: invoice.total,
      currency: invoice.currency,
      type: "invoice_payment",
      date: new Date().toISOString().split("T")[0],
    });

    if (logError) throw logError;

    // Return updated invoice
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

    return NextResponse.json({ invoice: updatedInvoice });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to mark invoice as paid" },
      { status: 500 }
    );
  }
}
