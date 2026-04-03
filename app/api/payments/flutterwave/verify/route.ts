import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPaymentConfirmation } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { transaction_id, invoice_id, tx_ref } = body;

    if (!transaction_id || !invoice_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify transaction with Flutterwave
    const verificationResponse = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const verificationData = await verificationResponse.json();

    // Fetch invoice to verify amount and currency
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(
        `
        *,
        clients (
          name,
          email
        )
      `
      )
      .eq("id", invoice_id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Check if already paid
    if (invoice.status === "paid") {
      return NextResponse.json(
        { error: "Invoice already paid" },
        { status: 400 }
      );
    }

    const flutterwaveData = verificationData.data;

    // Verify payment details
    const isValid =
      verificationData.status === "success" &&
      flutterwaveData?.status === "successful" &&
      flutterwaveData.amount >= invoice.total * 0.99 && // Allow 1% rounding
      flutterwaveData.currency === invoice.currency;

    const now = new Date().toISOString();

    if (isValid) {
      // Update invoice to paid
      await supabase
        .from("invoices")
        .update({ status: "paid", paid_at: now, updated_at: now })
        .eq("id", invoice_id);

      // Insert into income_log
      await supabase.from("income_log").insert({
        user_id: invoice.user_id,
        invoice_id: invoice.id,
        client_id: invoice.client_id,
        amount: flutterwaveData.amount,
        currency: flutterwaveData.currency,
        type: "invoice_payment",
        description: `Payment for ${invoice.invoice_number}`,
        date: new Date().toISOString().split("T")[0],
      });

      // Insert into payments table
      await supabase.from("payments").insert({
        invoice_id: invoice.id,
        amount: flutterwaveData.amount,
        currency: flutterwaveData.currency,
        provider: "flutterwave",
        provider_payment_id: transaction_id,
        provider_tx_ref: flutterwaveData.tx_ref || tx_ref,
        status: "success",
        paid_at: now,
      });

      // Fetch freelancer profile and send confirmation email
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, business_name, email")
        .eq("id", invoice.user_id)
        .single();

      // Send payment confirmation (non-blocking)
      try {
        if (profile?.email) {
          const formattedAmount = `${flutterwaveData.currency} ${flutterwaveData.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

          await sendPaymentConfirmation({
            to: profile.email,
            freelancerName: profile.name || "Freelancer",
            invoiceNumber: invoice.invoice_number,
            amount: formattedAmount,
            clientName: invoice.clients?.name || "Client",
            paidAt: now,
          });
        }
      } catch (emailError) {
        console.error("Failed to send payment confirmation:", emailError);
      }

      return NextResponse.json({ success: true });
    } else {
      // Record failed payment
      await supabase.from("payments").insert({
        invoice_id: invoice.id,
        amount: flutterwaveData?.amount || 0,
        currency: flutterwaveData?.currency || invoice.currency,
        provider: "flutterwave",
        provider_payment_id: transaction_id,
        provider_tx_ref: tx_ref,
        status: "failed",
        paid_at: now,
      });

      return NextResponse.json(
        { success: false, error: "Payment verification failed" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
