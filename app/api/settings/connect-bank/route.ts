import { NextResponse } from "next/server";
import { createClient, createPublicClient } from "@/lib/supabase/server";
import { createFlutterwaveSubaccount } from "@/lib/flutterwave";
import { errorMessage } from "@/lib/log-redact";

function logPostgresError(prefix: string, error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const pg = error as { message?: string; code?: string; details?: string };
    console.error(prefix, pg.message, pg.code, pg.details);
    return;
  }
  console.error(prefix, errorMessage(error));
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, business_name, email, plan")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      account_number,
      account_name,
      bank_code,
      bank_name,
      account_bank,
    } = body;

    const resolvedBankCode = bank_code || account_bank;

    if (!account_number || !resolvedBankCode || !account_name || !bank_name) {
      return NextResponse.json(
        {
          error:
            "Missing account_number, bank_code, bank_name, or account_name",
        },
        { status: 400 },
      );
    }

    const splitValue = profile.plan === "pro" ? 0 : 0.05;

    const result = await createFlutterwaveSubaccount({
      account_bank: resolvedBankCode,
      account_number,
      business_name: profile.business_name || profile.name,
      business_email: profile.email || user.email || "",
      country: "NG",
      split_type: "percentage",
      split_value: splitValue,
    });

    // CRITICAL: Use service role client for the profile update.
    // The C4 trigger blocks bank field updates from authenticated
    // users — only service role can update these fields.
    const adminSupabase = createPublicClient();

    const { error: updateError } = await adminSupabase
      .from("profiles")
      .update({
        flutterwave_subaccount_id: result.subaccount_id,
        bank_account_number: account_number,
        bank_account_name: account_name,
        bank_name: bank_name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      logPostgresError("[connect-bank] profile update failed:", updateError);
      return NextResponse.json(
        { error: "Failed to save bank account details" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to connect bank account";
    console.error("[connect-bank] error:", errorMessage(error));
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Service role required — C4 trigger blocks bank field clears from auth users.
    const adminSupabase = createPublicClient();

    const { error: updateError } = await adminSupabase
      .from("profiles")
      .update({
        flutterwave_subaccount_id: null,
        bank_name: null,
        bank_account_number: null,
        bank_account_name: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      logPostgresError("[connect-bank] disconnect failed:", updateError);
      return NextResponse.json(
        { error: "Failed to disconnect bank account" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to disconnect bank account";
    console.error("[connect-bank] disconnect error:", errorMessage(error));
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
