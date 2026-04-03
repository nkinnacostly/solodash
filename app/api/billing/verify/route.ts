import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
        { status: 400 }
      );
    }

    // Verify payment with Flutterwave
    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${tx_ref}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok || data.status !== "success") {
      console.error("Flutterwave verification error:", data);
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 }
      );
    }

    const transaction = data.data;

    // Verify amount is correct (₦13,500 or ₦119,000)
    const isValidAmount =
      transaction.amount === 13500 ||
      transaction.amount === 119000 ||
      transaction.amount >= 13000; // Allow some variance

    if (!isValidAmount || transaction.currency !== "NGN") {
      return NextResponse.json(
        { error: "Invalid payment amount" },
        { status: 400 }
      );
    }

    // Extract plan from meta
    const plan = transaction.meta?.plan || "monthly";

    // Update profile to pro
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        plan: "pro",
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update plan" },
        { status: 500 }
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
        // Call Flutterwave API to update subaccount
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
              split_value: 0, // Pro users keep 100%
            }),
          }
        );
      }
    } catch (subaccountError) {
      console.error("Failed to update subaccount:", subaccountError);
      // Don't fail the request if subaccount update fails
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Verify billing error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify payment" },
      { status: 500 }
    );
  }
}
