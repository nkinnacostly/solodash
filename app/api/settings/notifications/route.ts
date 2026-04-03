import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      notify_invoice_viewed,
      notify_payment_received,
      notify_contract_signed,
      notify_invoice_overdue,
    } = body;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        notify_invoice_viewed: notify_invoice_viewed ?? true,
        notify_payment_received: notify_payment_received ?? true,
        notify_contract_signed: notify_contract_signed ?? true,
        notify_invoice_overdue: notify_invoice_overdue ?? true,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Notification update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update notifications" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update notifications error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update notifications" },
      { status: 500 }
    );
  }
}
