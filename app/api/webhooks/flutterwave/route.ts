import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/server";
import { errorMessage } from "@/lib/log-redact";

export async function POST(request: Request) {
  try {
    const verifHash = request.headers.get("verif-hash");

    if (verifHash !== process.env.FLW_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const txRef = body.data?.tx_ref ?? "";

    if (txRef.startsWith("topup_")) {
      return forwardToSmsApp(body);
    }

    if (txRef.startsWith("TRADEPAD-")) {
      return forwardToTradepad(body, request.headers.get("verif-hash") ?? "");
    }

    // Subscription payments are verified via /api/billing/verify
    if (txRef.startsWith("PAIDLY-SUB-")) {
      return NextResponse.json({ status: "success" });
    }

    if (body.event === "charge.completed") {
      const adminSupabase = createPublicClient();

      const parts = txRef.split("-");

      if (parts[0] !== "PAIDLY" || parts.length < 3) {
        console.error("[webhook] Invalid invoice tx_ref format");
        return NextResponse.json({ status: "success" });
      }

      const invoiceId = parts.slice(1, -1).join("-");

      const { data: invoice, error: invoiceError } = await adminSupabase
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
        console.error("[webhook] Invoice not found");
        return NextResponse.json({ status: "success" });
      }

      if (invoice.status === "paid") {
        return NextResponse.json({ status: "success" });
      }

      const transactionId = body.data.id;

      const { data: existingPayment } = await adminSupabase
        .from("payments")
        .select("id")
        .eq("provider_payment_id", String(transactionId))
        .maybeSingle();

      if (existingPayment) {
        console.log("Webhook: transaction already processed (idempotent)");
        return NextResponse.json({ status: "success", idempotent: true });
      }

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

      if (flutterwaveData?.tx_ref !== txRef) {
        console.warn("[webhook] Flutterwave tx_ref mismatch");
        return NextResponse.json({ status: "success" });
      }

      const isValid =
        verificationData.status === "success" &&
        flutterwaveData?.status === "successful" &&
        flutterwaveData.amount >= invoice.total * 0.99 &&
        flutterwaveData.currency === invoice.currency;

      const now = new Date().toISOString();

      if (isValid) {
        await adminSupabase
          .from("invoices")
          .update({ status: "paid", paid_at: now, updated_at: now })
          .eq("id", invoiceId);

        await adminSupabase.from("income_log").insert({
          user_id: invoice.user_id,
          invoice_id: invoice.id,
          client_id: invoice.client_id,
          amount: flutterwaveData.amount,
          currency: flutterwaveData.currency,
          type: "invoice_payment",
          description: `Payment for ${invoice.invoice_number}`,
          date: new Date().toISOString().split("T")[0],
        });

        await adminSupabase.from("payments").insert({
          invoice_id: invoice.id,
          amount: flutterwaveData.amount,
          currency: flutterwaveData.currency,
          provider: "flutterwave",
          provider_payment_id: String(transactionId),
          provider_tx_ref: txRef,
          status: "success",
          paid_at: now,
        });

        console.log(
          `Webhook: Invoice ${invoice.invoice_number} marked as paid`,
        );
      } else {
        await adminSupabase.from("payments").insert({
          invoice_id: invoice.id,
          amount: flutterwaveData?.amount || 0,
          currency: flutterwaveData?.currency || invoice.currency,
          provider: "flutterwave",
          provider_payment_id: String(transactionId),
          provider_tx_ref: txRef,
          status: "failed",
          paid_at: now,
        });

        console.error("[webhook] Payment verification failed");
      }
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("[webhook] error:", errorMessage(error));
    return NextResponse.json({ status: "success" });
  }
}

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
        "verif-hash": process.env.FLW_WEBHOOK_SECRET!,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error("Failed to forward to SMS app:", res.status);
    }
  } catch (err) {
    console.error(
      "Error forwarding to SMS app:",
      errorMessage(err),
    );
  }

  return NextResponse.json({ status: "success" });
}

async function forwardToTradepad(payload: unknown, verifHash: string) {
  try {
    const tradepadWebhookUrl =
      "https://xytaymcapbmswbsrntdm.supabase.co/functions/v1/flutterwave-webhook";

    const res = await fetch(tradepadWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "verif-hash": verifHash,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error("Failed to forward to Tradepad:", res.status);
    }
  } catch (err) {
    console.error(
      "Error forwarding to Tradepad:",
      errorMessage(err),
    );
  }

  return NextResponse.json({ status: "success" });
}
