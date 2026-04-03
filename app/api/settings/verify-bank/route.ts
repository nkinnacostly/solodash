import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyBankAccount } from "@/lib/flutterwave";

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
    const { account_number, account_bank } = body;

    // Validate account number
    if (!account_number || !/^\d{10}$/.test(account_number)) {
      return NextResponse.json(
        { error: "Account number must be exactly 10 digits" },
        { status: 400 }
      );
    }

    if (!account_bank) {
      return NextResponse.json(
        { error: "Bank is required" },
        { status: 400 }
      );
    }

    console.log('Sending to Flutterwave:', {
      account_number: body.account_number,
      account_bank: body.account_bank,
    });
    // Verify bank account
    const result = await verifyBankAccount({
      account_number,
      account_bank,
    });

    return NextResponse.json({
      account_name: result.account_name,
    });
  } catch (error: any) {
    console.error("Bank verification error:", error);
    return NextResponse.json(
      {
        error: "Could not verify account. Check your account number and bank.",
      },
      { status: 400 }
    );
  }
}
