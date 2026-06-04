import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { sendInvoiceEmail } from "@/lib/email";
import { generatePublicUrl } from "@/lib/link-tokens";
import { errorMessage } from "@/lib/log-redact";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (invoice.status === "sent" || invoice.status === "paid") {
    // Allow resending (reminder)
  } else if (invoice.status !== "draft") {
    return NextResponse.json(
      { error: "Cannot send invoice with status: " + invoice.status },
      { status: 400 },
    );
  }

  try {
    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        status: invoice.status === "draft" ? "sent" : invoice.status,
        sent_at: now,
        updated_at: now,
      })
      .eq("id", id);

    if (updateError) throw updateError;

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, business_name, email")
      .eq("id", user.id)
      .single();

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const paymentLink = generatePublicUrl(baseUrl, "pay", id);

    await supabase
      .from("invoices")
      .update({ payment_link: paymentLink, updated_at: now })
      .eq("id", id);

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

    const dueDate = new Date(invoice.due_date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

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
      console.error(
        "Failed to send invoice email:",
        errorMessage(emailError),
      );
    }

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to send invoice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
