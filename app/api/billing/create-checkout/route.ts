import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { errorMessage } from "@/lib/log-redact";

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

    const body = await request.json();
    const billing_cycle =
      body.billing_cycle ?? body.plan;

    if (
      !billing_cycle ||
      !["monthly", "annual"].includes(billing_cycle)
    ) {
      return NextResponse.json(
        { error: "Invalid billing_cycle. Use 'monthly' or 'annual'" },
        { status: 400 },
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const amount =
      billing_cycle === "monthly" ? MONTHLY_PRICE : ANNUAL_PRICE;
    const txRef = `PAIDLY-SUB-NGN-${user.id}-${Date.now()}`;

    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount,
        currency: "NGN",
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/billing/success`,
        customer: {
          email: profile.email || user.email || "",
          name: profile.name || "",
        },
        customizations: {
          title: "Paidly Pro Subscription",
          description: `Pro plan - ${billing_cycle === "monthly" ? "Monthly" : "Annual"} billing`,
          logo: "",
        },
        meta: {
          user_id: user.id,
          plan: billing_cycle,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok || data.status !== "success") {
      console.error("[billing/create-checkout] Flutterwave checkout failed");
      return NextResponse.json(
        { error: "Failed to create payment" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      payment_link: data.data.link,
      tx_ref: txRef,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create checkout";
    console.error("[billing/create-checkout] error:", errorMessage(error));
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
