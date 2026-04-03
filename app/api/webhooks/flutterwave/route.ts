import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    // Verify webhook signature
    const verifHash = request.headers.get("verif-hash");

    if (verifHash !== process.env.FLW_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Handle charge.completed event
    if (body.event === "charge.completed") {
      const supabase = await createClient();

      // Extract invoice_id from tx_ref (format: PAIDLY-{invoice_id}-{timestamp})
      const txRef = body.data.tx_ref;
      const parts = txRef.split("-");

      if (parts[0] !== "PAIDLY" || parts.length < 3) {
        console.error("Invalid tx_ref format:", txRef);
        return NextResponse.json({ status: "success" });
      }

      const invoiceId = parts.slice(1, -1).join("-"); // Handle invoice IDs with dashes

      // Fetch invoice
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
        .eq("id", invoiceId)
        .single();

      if (invoiceError || !invoice) {
        console.error("Invoice not found for webhook:", invoiceId);
        return NextResponse.json({ status: "success" });
      }

      // Skip if already paid
      if (invoice.status === "paid") {
        return NextResponse.json({ status: "success" });
      }

      // Verify transaction with Flutterwave (backup verification)
      const transactionId = body.data.id;

      const verificationResponse = await fetch(
        `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const verificationData = await verificationResponse.json();
      const flutterwaveData = verificationData.data;

      const isValid =
        verificationData.status === "success" &&
        flutterwaveData?.status === "successful" &&
        flutterwaveData.amount >= invoice.total * 0.99 &&
        flutterwaveData.currency === invoice.currency;

      const now = new Date().toISOString();

      if (isValid) {
        // Update invoice
        await supabase
          .from("invoices")
          .update({ status: "paid", paid_at: now, updated_at: now })
          .eq("id", invoiceId);

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

        // Insert into payments
        await supabase.from("payments").insert({
          invoice_id: invoice.id,
          amount: flutterwaveData.amount,
          currency: flutterwaveData.currency,
          provider: "flutterwave",
          provider_payment_id: transactionId,
          provider_tx_ref: txRef,
          status: "success",
          paid_at: now,
        });

        console.log(
          `Webhook: Invoice ${invoice.invoice_number} marked as paid`
        );
      } else {
        // Record failed payment
        await supabase.from("payments").insert({
          invoice_id: invoice.id,
          amount: flutterwaveData?.amount || 0,
          currency: flutterwaveData?.currency || invoice.currency,
          provider: "flutterwave",
          provider_payment_id: transactionId,
          provider_tx_ref: txRef,
          status: "failed",
          paid_at: now,
        });

        console.error("Webhook: Payment verification failed for", invoiceId);
      }
    }

    // Always return 200 immediately
    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Webhook error:", error);
    // Still return 200 to acknowledge receipt
    return NextResponse.json({ status: "success" });
  }
}
