import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  if (profile?.plan !== "pro") {
    return NextResponse.json(
      { error: "Custom branding is a Pro feature" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { brand_color } = body;

  // Validate hex color format
  if (!brand_color || !/^#[0-9A-Fa-f]{6}$/.test(brand_color)) {
    return NextResponse.json(
      { error: "Invalid color format. Must be a valid hex color (#xxxxxx)" },
      { status: 400 }
    );
  }

  try {
    await supabase
      .from("profiles")
      .update({ brand_color })
      .eq("id", user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Brand color update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update brand color" },
      { status: 500 }
    );
  }
}
