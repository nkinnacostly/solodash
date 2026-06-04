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

    const { data, error } = await supabase.rpc("get_income_by_client", {
      p_user_id: user.id,
      p_year: new Date().getFullYear(),
    });

    if (error) throw error;

    const top5 = (data || []).slice(0, 5);

    return NextResponse.json({ clients: top5 });
  } catch (error: unknown) {
    console.error("[dashboard/top-clients] error:", errorMessage(error));
    return NextResponse.json(
      { error: "Failed to fetch top clients" },
      { status: 500 },
    );
  }
}
