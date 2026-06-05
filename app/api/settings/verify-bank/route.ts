import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyBankAccount } from "@/lib/flutterwave";
import { errorMessage } from "@/lib/log-redact";

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
    const { account_number, bank_code, account_bank } = body;
    const resolvedBankCode = bank_code || account_bank;

    if (!account_number || !/^\d{10}$/.test(account_number)) {
      return NextResponse.json(
        { error: "Account number must be exactly 10 digits" },
        { status: 400 },
      );
    }

    if (!resolvedBankCode) {
      return NextResponse.json(
        { error: "Missing account_number or bank_code" },
        { status: 400 },
      );
    }

    const result = await verifyBankAccount({
      account_number,
      account_bank: resolvedBankCode,
    });

    return NextResponse.json({
      account_name: result.account_name,
    });
  } catch (error: unknown) {
    console.error("Bank verification error:", errorMessage(error));
    return NextResponse.json(
      {
        error: "Could not verify account. Check your account number and bank.",
      },
      { status: 400 },
    );
  }
}
