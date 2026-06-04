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

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("name, currency, business_name, plan")
      .eq("id", user.id)
      .single();

    if (error) throw error;

    return NextResponse.json({ profile: profile || null });
  } catch (error: unknown) {
    console.error("[dashboard/profile] error:", errorMessage(error));
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}
