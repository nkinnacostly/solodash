import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    // Verify webhook signature
    const verifHash = request.headers.get("verif-hash");

    if (verifHash !== process.env.FLW_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const txRef = body.data?.tx_ref ?? "";

    // ── Route based on tx_ref prefix ──────────────────────────
    // PAIDLY- → this app (invoice payments)
    // topup_  → SMS verification app
    if (txRef.startsWith("topup_")) {
      return forwardToSmsApp(body);
    }

    // ── Existing Paidly logic below (unchanged) ───────────────
    if (body.event === "charge.completed") {
      const supabase = await createClient();

      const parts = txRef.split("-");

      if (parts[0] !== "PAIDLY" || parts.length < 3) {
        console.error("Invalid tx_ref format:", txRef);
        return NextResponse.json({ status: "success" });
      }

      const invoiceId = parts.slice(1, -1).join("-");

      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .select(
          `
          *,
          clients (
            name,
            email
          )
        `,
        )
        .eq("id", invoiceId)
        .single();

      if (invoiceError || !invoice) {
        console.error("Invoice not found for webhook:", invoiceId);
        return NextResponse.json({ status: "success" });
      }

      if (invoice.status === "paid") {
        return NextResponse.json({ status: "success" });
      }

      const transactionId = body.data.id;

      const verificationResponse = await fetch(
        `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        },
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
        await supabase
          .from("invoices")
          .update({ status: "paid", paid_at: now, updated_at: now })
          .eq("id", invoiceId);

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
          `Webhook: Invoice ${invoice.invoice_number} marked as paid`,
        );
      } else {
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

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ status: "success" });
  }
}

// ── Forward to SMS app Edge Function ─────────────────────────
async function forwardToSmsApp(payload: unknown) {
  try {
    const smsWebhookUrl = process.env.SMS_APP_WEBHOOK_URL;

    if (!smsWebhookUrl) {
      console.error("SMS_APP_WEBHOOK_URL not set");
      return NextResponse.json({ status: "success" });
    }

    const res = await fetch(smsWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Forward the same secret — both apps share FLW_WEBHOOK_SECRET
        "verif-hash": process.env.FLW_WEBHOOK_SECRET!,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(
        "Failed to forward to SMS app:",
        res.status,
        await res.text(),
      );
    }
  } catch (err) {
    console.error("Error forwarding to SMS app:", err);
  }

  // Always return 200 to Flutterwave regardless
  return NextResponse.json({ status: "success" });
}
