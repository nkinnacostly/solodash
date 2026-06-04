import { NextResponse } from "next/server";
import { createClient, createPublicClient } from "@/lib/supabase/server";

const TX_REF_PREFIX = "PAIDLY-SUB-NGN-";

/** Parse user id from PAIDLY-SUB-NGN-{userId}-{timestamp} */
function parseUserIdFromTxRef(txRef: string): string | null {
  if (!txRef.startsWith(TX_REF_PREFIX)) {
    return null;
  }
  const rest = txRef.slice(TX_REF_PREFIX.length);
  const lastDash = rest.lastIndexOf("-");
  if (lastDash <= 0) {
    return null;
  }
  const timestamp = rest.slice(lastDash + 1);
  if (!/^\d+$/.test(timestamp)) {
    return null;
  }
  return rest.slice(0, lastDash);
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tx_ref } = body;

    if (!tx_ref) {
      return NextResponse.json(
        { error: "Transaction reference is required" },
        { status: 400 },
      );
    }

    const txRefUserId = parseUserIdFromTxRef(tx_ref);
    if (!txRefUserId || txRefUserId !== user.id) {
      return NextResponse.json(
        { error: "Invalid transaction reference for this account" },
        { status: 400 },
      );
    }

    // Verify payment with Flutterwave
    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(tx_ref)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        },
      },
    );

    const data = await response.json();

    if (!response.ok || data.status !== "success") {
      console.error("Flutterwave verification error:", data);
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 },
      );
    }

    const transaction = data.data;

    const plan = transaction.meta?.plan === "annual" ? "annual" : "monthly";
    const expectedAmount = plan === "annual" ? 130000 : 15000;

    const isValidAmount =
      transaction.amount === expectedAmount &&
      transaction.currency === "NGN";

    if (!isValidAmount) {
      return NextResponse.json(
        { error: "Invalid payment amount" },
        { status: 400 },
      );
    }

    // Plan update requires service role (profiles trigger blocks authenticated updates)
    const adminSupabase = createPublicClient();
    const { error: updateError } = await adminSupabase
      .from("profiles")
      .update({
        plan: "pro",
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update plan" },
        { status: 500 },
      );
    }

    // Update Flutterwave subaccount split to 0% if exists
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("flutterwave_subaccount_id")
        .eq("id", user.id)
        .single();

      if (profile?.flutterwave_subaccount_id) {
        await fetch(
          `https://api.flutterwave.com/v3/subaccounts/${profile.flutterwave_subaccount_id}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              split_type: "percentage",
              split_value: 0,
            }),
          },
        );
      }
    } catch (subaccountError) {
      console.error("Failed to update subaccount:", subaccountError);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to verify payment";
    console.error("Verify billing error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
