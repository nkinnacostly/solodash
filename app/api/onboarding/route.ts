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
    const {
      name,
      businessName,
      country,
      timezone,
      currency,
      defaultPaymentTerms,
    } = body;

    // UPSERT profile
    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        name: name,
        business_name: businessName || null,
        country: country,
        timezone: timezone,
        currency: currency,
        default_payment_terms: parseInt(defaultPaymentTerms),
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      }
    );

    if (error) {
      console.error("Profile upsert error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to save profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
