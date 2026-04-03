import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const { data: contract, error } = await supabase
      .from("contracts")
      .select(
        `
        *,
        clients (
          name,
          email,
          address
        )
      `
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !contract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ contract });
  } catch (error: any) {
    console.error("Error fetching contract:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch contract" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    // Fetch contract to check status
    const { data: contract, error: fetchError } = await supabase
      .from("contracts")
      .select("status")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !contract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      );
    }

    // Only allow deleting drafts
    if (contract.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft contracts can be deleted" },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase
      .from("contracts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting contract:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete contract" },
      { status: 500 }
    );
  }
}
