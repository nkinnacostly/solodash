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

    const { data, error } = await supabase.rpc("get_monthly_income", {
      p_user_id: user.id,
      p_year: new Date().getFullYear(),
    });

    if (error) throw error;

    return NextResponse.json({ monthly: data || [] });
  } catch (error: unknown) {
    console.error("[dashboard/monthly] error:", errorMessage(error));
    return NextResponse.json(
      { error: "Failed to fetch monthly breakdown" },
      { status: 500 },
    );
  }
}
