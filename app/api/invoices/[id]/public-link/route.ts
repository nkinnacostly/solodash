import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generatePublicUrl } from "@/lib/link-tokens";
import { errorMessage } from "@/lib/log-redact";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: invoice } = await supabase
      .from("invoices")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const url = generatePublicUrl(baseUrl, "pay", id);

    return NextResponse.json({ url });
  } catch (error: unknown) {
    console.error("[invoices/public-link] error:", errorMessage(error));
    return NextResponse.json(
      { error: "Failed to generate link" },
      { status: 500 },
    );
  }
}
