import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
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

  try {
    const formData = await request.formData();
    const file = formData.get("logo") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.type.match(/^image\/(png|jpeg)$/)) {
      return NextResponse.json(
        { error: "Only PNG and JPG files are allowed" },
        { status: 400 }
      );
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File must be under 2MB" },
        { status: 400 }
      );
    }

    const ext = file.type === "image/png" ? "png" : "jpg";
    const filePath = `logos/${user.id}/logo.${ext}`;

    // Convert File to Buffer to avoid EPIPE stream issues
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from("logos")
      .getPublicUrl(filePath);

    const logoUrl = urlData.publicUrl;

    await supabase
      .from("profiles")
      .update({ logo_url: logoUrl })
      .eq("id", user.id);

    return NextResponse.json({ logo_url: logoUrl });
  } catch (error: any) {
    console.error("Logo upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload logo" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
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

  try {
    const { data: files } = await supabase.storage
      .from("logos")
      .list(`logos/${user.id}`);

    if (files && files.length > 0) {
      const paths = files.map((file) => `logos/${user.id}/${file.name}`);
      await supabase.storage.from("logos").remove(paths);
    }

    await supabase
      .from("profiles")
      .update({ logo_url: null })
      .eq("id", user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Logo removal error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove logo" },
      { status: 500 }
    );
  }
}