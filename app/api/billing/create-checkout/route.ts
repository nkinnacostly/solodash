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
    const { plan } = body; // 'monthly' or 'annual'

    if (!plan || !["monthly", "annual"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan. Use 'monthly' or 'annual'" },
        { status: 400 }
      );
    }

    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Create Flutterwave payment
    const amount = plan === "monthly" ? 9 : 79;
    const txRef = `PAIDLY-SUB-${user.id}-${Date.now()}`;

    const response = await fetch(
      "https://api.flutterwave.com/v3/payments",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tx_ref: txRef,
          amount: amount,
          currency: "USD",
          redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/billing/success`,
          customer: {
            email: profile.email || user.email || "",
            name: profile.name || "",
          },
          customizations: {
            title: "Paidly Pro Subscription",
            description: `Pro plan - ${plan === "monthly" ? "Monthly" : "Annual"} billing`,
            logo: "",
          },
          meta: {
            user_id: user.id,
            plan: plan,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || data.status !== "success") {
      console.error("Flutterwave error:", data);
      return NextResponse.json(
        { error: "Failed to create payment" },
        { status: 500 }
      );
    }

    // TODO: Implement recurring billing post-MVP
    // For now, this is a one-time payment that manually sets the plan
    // Future: Use Flutterwave tokenization for automatic monthly charges

    return NextResponse.json({
      payment_link: data.data.link,
      tx_ref: txRef,
    });
  } catch (error: any) {
    console.error("Create checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout" },
      { status: 500 }
    );
  }
}
