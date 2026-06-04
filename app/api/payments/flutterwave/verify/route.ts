import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { transaction_id, tx_ref, invoice_id } = await request.json();

    if (!transaction_id || !tx_ref || !invoice_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // 1. Validate tx_ref format and that it embeds the invoice_id
    // Format: PAIDLY-{invoice_id}-{timestamp}
    const expectedPrefix = `PAIDLY-${invoice_id}-`;

    if (!tx_ref.startsWith(expectedPrefix)) {
      console.warn(
        "[payment/verify] tx_ref does not match expected invoice prefix",
      );
      return NextResponse.json(
        { error: "Transaction reference does not match invoice" },
        { status: 400 },
      );
    }

    const adminSupabase = createPublicClient();

    // 2. Idempotency check — has this transaction already been processed?
    const { data: existingPayment } = await adminSupabase
      .from("payments")
      .select("id, status, invoice_id")
      .eq("provider_payment_id", String(transaction_id))
      .maybeSingle();

    if (existingPayment) {
      const { data: invoice } = await adminSupabase
        .from("invoices")
        .select("status, paid_at")
        .eq("id", invoice_id)
        .single();

      return NextResponse.json({
        success: true,
        status: invoice?.status || "unknown",
        idempotent: true,
      });
    }

    // 3. Fetch the invoice
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
      .eq("id", invoice_id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // 4. Skip if already paid (additional idempotency)
    if (invoice.status === "paid") {
      return NextResponse.json({
        success: true,
        status: "paid",
        already_paid: true,
      });
    }

    // 5. Verify transaction with Flutterwave
    const verificationResponse = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const verificationData = await verificationResponse.json();

    if (
      verificationData.status !== "success" ||
      verificationData.data?.status !== "successful"
    ) {
      return NextResponse.json(
        { error: "Transaction not successful" },
        { status: 400 },
      );
    }

    const transaction = verificationData.data;

    // 6. Verify tx_ref from Flutterwave matches what we sent
    if (transaction.tx_ref !== tx_ref) {
      console.warn("[payment/verify] Flutterwave tx_ref mismatch");
      return NextResponse.json(
        { error: "Transaction reference mismatch" },
        { status: 400 },
      );
    }

    // 7. Strict amount validation (allow 1% variance for currency rounding)
    const minAcceptable = invoice.total * 0.99;
    if (transaction.amount < minAcceptable) {
      console.warn(
        `[payment/verify] amount too low: paid=${transaction.amount}, expected=${invoice.total}`,
      );
      return NextResponse.json(
        {
          error: "Payment amount is less than invoice total",
          expected: invoice.total,
          received: transaction.amount,
        },
        { status: 400 },
      );
    }

    // 8. Currency must match
    if (transaction.currency !== invoice.currency) {
      console.warn("[payment/verify] currency mismatch");
      return NextResponse.json(
        { error: "Payment currency mismatch" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    const { error: invoiceUpdateError } = await adminSupabase
      .from("invoices")
      .update({
        status: "paid",
        paid_at: now,
        updated_at: now,
      })
      .eq("id", invoice_id);

    if (invoiceUpdateError) {
      console.error("[payment/verify] invoice update failed:", invoiceUpdateError);
      return NextResponse.json(
        { error: "Failed to update invoice" },
        { status: 500 },
      );
    }

    await adminSupabase.from("income_log").insert({
      user_id: invoice.user_id,
      invoice_id: invoice.id,
      client_id: invoice.client_id,
      amount: transaction.amount,
      currency: transaction.currency,
      type: "invoice_payment",
      description: `Payment for ${invoice.invoice_number}`,
      date: new Date().toISOString().split("T")[0],
    });

    await adminSupabase.from("payments").insert({
      invoice_id: invoice.id,
      amount: transaction.amount,
      currency: transaction.currency,
      provider: "flutterwave",
      provider_payment_id: String(transaction_id),
      provider_tx_ref: tx_ref,
      status: "success",
      paid_at: now,
    });

    const clientRecord = Array.isArray(invoice.clients)
      ? invoice.clients[0]
      : invoice.clients;

    // Send payment confirmation email — fire-and-forget
    (async () => {
      try {
        const { data: profile } = await adminSupabase
          .from("profiles")
          .select("name, business_name, email")
          .eq("id", invoice.user_id)
          .single();

        if (!profile?.email) return;

        const { sendPaymentConfirmation } = await import("@/lib/email");

        const formattedAmount = `${transaction.currency} ${Number(transaction.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

        await sendPaymentConfirmation({
          to: profile.email,
          freelancerName: profile.business_name || profile.name || "Freelancer",
          clientName: clientRecord?.name || "Client",
          invoiceNumber: invoice.invoice_number,
          amount: formattedAmount,
          paidAt: now,
        });
      } catch (err) {
        console.error("[payment/verify] email send failed:", err);
      }
    })();

    return NextResponse.json({
      success: true,
      status: "paid",
      invoice_number: invoice.invoice_number,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Verification failed";
    console.error("[payment/verify] error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
