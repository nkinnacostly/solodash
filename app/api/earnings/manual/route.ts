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
    const { amount, currency, date, description, client_id } = body;

    // Validate
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400 }
      );
    }

    if (!description || description.trim().length === 0) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    // Insert into income_log
    const { data: entry, error } = await supabase
      .from("income_log")
      .insert({
        user_id: user.id,
        amount,
        currency: currency || "USD",
        date,
        description,
        type: "manual",
        client_id: client_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting manual income:", error);
      return NextResponse.json(
        { error: "Failed to add income" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, entry });
  } catch (error: any) {
    console.error("Error adding manual income:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add income" },
      { status: 500 }
    );
  }
}
