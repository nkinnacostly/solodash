import { NextResponse } from "next/server";
import { createClient, createPublicClient } from "@/lib/supabase/server";
import { errorMessage, redactUserId } from "@/lib/log-redact";

const MONTHLY_PRICE = 15000;
const ANNUAL_PRICE = 130000;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { transaction_id, tx_ref } = await request.json();

    if (!transaction_id || !tx_ref) {
      return NextResponse.json(
        { error: "Missing transaction_id or tx_ref" },
        { status: 400 },
      );
    }

    // 1. Validate tx_ref format and ownership
    // Format: PAIDLY-SUB-NGN-{userId}-{timestamp}
    const txRefPattern = /^PAIDLY-SUB-NGN-([0-9a-f-]+)-\d+$/i;
    const match = tx_ref.match(txRefPattern);

    if (!match) {
      return NextResponse.json(
        { error: "Invalid tx_ref format" },
        { status: 400 },
      );
    }

    const txRefUserId = match[1];
    if (txRefUserId !== user.id) {
      console.warn(
        `[billing/verify] tx_ref user mismatch: ${redactUserId(txRefUserId)} vs ${redactUserId(user.id)}`,
      );
      return NextResponse.json(
        { error: "Transaction does not belong to this user" },
        { status: 403 },
      );
    }

    // 2. Idempotency check — has this transaction already been processed?
    const adminSupabase = createPublicClient();

    const { data: existingPayment } = await adminSupabase
      .from("payments")
      .select("id, status")
      .eq("provider_payment_id", String(transaction_id))
      .maybeSingle();

    if (existingPayment) {
      const { data: profile } = await adminSupabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .single();

      return NextResponse.json({
        success: true,
        plan: profile?.plan || "free",
        idempotent: true,
      });
    }

    // 3. Verify transaction with Flutterwave API
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

    // 4. Strict tx_ref match — Flutterwave's tx_ref must match ours
    if (transaction.tx_ref !== tx_ref) {
      console.warn("[billing/verify] tx_ref mismatch with Flutterwave");
      return NextResponse.json(
        { error: "Transaction reference mismatch" },
        { status: 400 },
      );
    }

    // 5. Strict amount validation — EXACT amounts only
    if (transaction.currency !== "NGN") {
      return NextResponse.json(
        { error: "Invalid currency" },
        { status: 400 },
      );
    }

    const isExactMonthly = transaction.amount === MONTHLY_PRICE;
    const isExactAnnual = transaction.amount === ANNUAL_PRICE;

    if (!isExactMonthly && !isExactAnnual) {
      console.warn("[billing/verify] payment amount does not match plan price");
      return NextResponse.json(
        {
          error: "Incorrect payment amount",
          expected: `${MONTHLY_PRICE} or ${ANNUAL_PRICE}`,
          received: transaction.amount,
        },
        { status: 400 },
      );
    }

    // 6. All checks passed — upgrade plan using service role
    const { error: planUpdateError } = await adminSupabase
      .from("profiles")
      .update({
        plan: "pro",
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (planUpdateError) {
      console.error(
        "[billing/verify] plan update failed:",
        errorMessage(planUpdateError),
      );
      return NextResponse.json(
        { error: "Failed to upgrade plan" },
        { status: 500 },
      );
    }

    // 7. Update subaccount split to 0% for Pro users (if subaccount exists)
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("flutterwave_subaccount_id")
      .eq("id", user.id)
      .single();

    if (profile?.flutterwave_subaccount_id) {
      fetch(
        `https://api.flutterwave.com/v3/subaccounts/${profile.flutterwave_subaccount_id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ split_value: 0 }),
        },
      ).catch((err) =>
        console.error(
          "[billing/verify] subaccount update failed:",
          errorMessage(err),
        ),
      );
    }

    // 8. Record the payment for idempotency and audit
    await adminSupabase.from("payments").insert({
      invoice_id: null,
      amount: transaction.amount,
      currency: transaction.currency,
      provider: "flutterwave",
      provider_payment_id: String(transaction_id),
      provider_tx_ref: tx_ref,
      status: "success",
      paid_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      plan: "pro",
      billing_cycle: isExactAnnual ? "annual" : "monthly",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Verification failed";
    console.error("[billing/verify] error:", errorMessage(error));
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
