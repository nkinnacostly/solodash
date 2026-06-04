import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { errorMessage } from "@/lib/log-redact";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("invoices")
      .select(
        `
        id,
        invoice_number,
        status,
        total,
        currency,
        created_at,
        due_date,
        clients (name)
      `,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) throw error;

    return NextResponse.json({ invoices: data || [] });
  } catch (error: unknown) {
    console.error(
      "[dashboard/recent-invoices] error:",
      errorMessage(error),
    );
    return NextResponse.json(
      { error: "Failed to fetch recent invoices" },
      { status: 500 },
    );
  }
}
