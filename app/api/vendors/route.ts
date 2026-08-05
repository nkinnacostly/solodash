import { createClient } from "@/lib/supabase/server";
import { errorMessage } from "@/lib/log-redact";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: vendors, error } = await supabase
      .from("vendors")
      .select("id, name, email, phone, address")
      .eq("user_id", user.id)
      .order("name");

    if (error) throw error;

    return NextResponse.json({ vendors: vendors || [] });
  } catch (error: unknown) {
    console.error("[vendors] error:", errorMessage(error));
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: "Vendor name is required" },
        { status: 400 },
      );
    }

    const { data: vendor, error } = await supabase
      .from("vendors")
      .insert({
        user_id: user.id,
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ vendor }, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create vendor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
