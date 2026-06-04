import { NextResponse } from "next/server";
import { createClient, createPublicClient } from "@/lib/supabase/server";
import { createFlutterwaveSubaccount } from "@/lib/flutterwave";
import { errorMessage } from "@/lib/log-redact";

const BANK_NAMES: Record<string, string> = {
  "044": "Access Bank",
  "023": "Citibank",
  "050": "Ecobank Nigeria",
  "070": "Fidelity Bank",
  "011": "First Bank of Nigeria",
  "214": "First City Monument Bank",
  "058": "Guaranty Trust Bank",
  "030": "Heritage Bank",
  "082": "Keystone Bank",
  "076": "Polaris Bank",
  "101": "Providus Bank",
  "221": "Stanbic IBTC Bank",
  "068": "Standard Chartered Bank",
  "232": "Sterling Bank",
  "100": "Suntrust Bank",
  "032": "Union Bank of Nigeria",
  "033": "United Bank for Africa",
  "215": "Unity Bank",
  "035": "Wema Bank",
  "057": "Zenith Bank",
  "50211": "Kuda Bank",
  "999992": "OPay",
  "999991": "PalmPay",
  "50515": "Moniepoint",
  "566": "VFD Microfinance Bank",
  "565": "Carbon",
  "125": "Rubies Bank",
  "104": "Parallex Bank",
  "102": "Titan Trust Bank",
};

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
    const { account_number, account_bank, account_name } = body;

    const splitValue = profile.plan === "pro" ? 0 : 0.05;

    const result = await createFlutterwaveSubaccount({
      account_bank,
      account_number,
      business_name: profile.business_name || profile.name,
      business_email: profile.email || user.email || "",
      country: "NG",
      split_type: "percentage",
      split_value: splitValue,
    });

    const adminSupabase = createPublicClient();
    const { error: updateError } = await adminSupabase
      .from("profiles")
      .update({
        flutterwave_subaccount_id: result.subaccount_id,
        bank_account_number: account_number,
        bank_code: account_bank,
        bank_account_name: account_name,
        bank_name: BANK_NAMES[account_bank] || account_bank,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Profile update error:", errorMessage(updateError));
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
    console.error("Connect bank error:", errorMessage(error));
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminSupabase = createPublicClient();
    const { error: updateError } = await adminSupabase
      .from("profiles")
      .update({
        flutterwave_subaccount_id: null,
        bank_name: null,
        bank_account_number: null,
        bank_code: null,
        bank_account_name: null,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Profile update error:", errorMessage(updateError));
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
    console.error("Disconnect bank error:", errorMessage(error));
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
