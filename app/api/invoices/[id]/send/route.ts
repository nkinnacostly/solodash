import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { sendInvoiceEmail } from "@/lib/email";

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

  // Fetch invoice with client data
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

    // Fetch profile separately (NEVER join to profiles)
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, business_name, email")
      .eq("id", user.id)
      .single();

    // Generate payment link
    const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pay/${id}`;

    // Update invoice with payment link
    await supabase
      .from("invoices")
      .update({ payment_link: paymentLink, updated_at: now })
      .eq("id", id);

    // Format amount with currency symbol
    const currencySymbols: Record<string, string> = {
      USD: "$",
      GBP: "£",
      EUR: "€",
      NGN: "NGN ",
      GHS: "GHS ",
      KES: "KES ",
      ZAR: "R ",
    };
    const symbol = currencySymbols[invoice.currency] || invoice.currency + " ";
    const formattedAmount = `${symbol}${Number(invoice.total).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Format due date
    const dueDate = new Date(invoice.due_date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

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

    // Send email to client (non-blocking)
    try {
      if (invoice.clients?.email) {
        await sendInvoiceEmail({
          to: invoice.clients.email,
          clientName: invoice.clients.name,
          freelancerName: profile?.name || "Freelancer",
          businessName: profile?.business_name || null,
          invoiceNumber: invoice.invoice_number,
          amount: formattedAmount,
          dueDate,
          paymentLink,
          invoiceId: id,
        });
      }
    } catch (emailError) {
      console.error("Failed to send invoice email:", emailError);
      // Don't block - invoice is still marked as sent
    }

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
