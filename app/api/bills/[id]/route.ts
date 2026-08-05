import { createClient } from "@/lib/supabase/server";
import { errorMessage } from "@/lib/log-redact";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
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

    const { data: bill, error } = await supabase
      .from("bills")
      .select(
        `
        *,
        vendors (name, email, phone, address),
        bill_items (id, description, quantity, rate, amount, sort_order)
      `,
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    return NextResponse.json({ bill });
  } catch (error: unknown) {
    console.error("[bills] get error:", errorMessage(error));
    return NextResponse.json(
      { error: "Failed to fetch bill" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: existing } = await supabase
    .from("bills")
    .select("status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  }

  const body = await request.json();

  try {
    // Mark-as-paid / cancel: a lightweight status-only update.
    if (
      body.status &&
      (body.status === "paid" || body.status === "cancelled")
    ) {
      const { data: updated, error: statusError } = await supabase
        .from("bills")
        .update({
          status: body.status,
          paid_at: body.status === "paid" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (statusError) throw statusError;
      return NextResponse.json({ bill: updated });
    }

    // Full edit is only allowed while the bill is still unpaid.
    if (existing.status !== "unpaid") {
      return NextResponse.json(
        { error: "Only unpaid bills can be edited" },
        { status: 400 },
      );
    }

    // Verify the vendor belongs to this user before assigning it.
    if (body.vendorId) {
      const { data: vendor } = await supabase
        .from("vendors")
        .select("id")
        .eq("id", body.vendorId)
        .eq("user_id", user.id)
        .single();

      if (!vendor) {
        return NextResponse.json({ error: "Invalid vendor" }, { status: 400 });
      }
    }

    const lineItems: { description: string; quantity: number; rate: number }[] =
      body.lineItems || [];
    const subtotal = lineItems.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.rate),
      0,
    );
    const taxRate = Number(body.taxRate) || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    const { error: billError } = await supabase
      .from("bills")
      .update({
        vendor_id: body.vendorId,
        bill_number: body.billNumber,
        currency: body.currency,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
        category: body.category || null,
        issue_date: body.issueDate,
        due_date: body.dueDate || null,
        notes: body.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (billError) throw billError;

    // Replace line items
    await supabase.from("bill_items").delete().eq("bill_id", id);

    if (lineItems.length > 0) {
      const itemsToInsert = lineItems.map((item, index) => ({
        bill_id: id,
        description: item.description,
        quantity: Number(item.quantity),
        rate: Number(item.rate),
        amount: Number(item.quantity) * Number(item.rate),
        sort_order: index,
      }));

      const { error: itemsError } = await supabase
        .from("bill_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
    }

    const { data: updatedBill } = await supabase
      .from("bills")
      .select(
        `
        *,
        vendors (name, email, phone, address),
        bill_items (id, description, quantity, rate, amount, sort_order)
      `,
      )
      .eq("id", id)
      .single();

    return NextResponse.json({ bill: updatedBill });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update bill";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
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

    const { data: existing } = await supabase
      .from("bills")
      .select("status")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    if (existing.status === "paid") {
      return NextResponse.json(
        { error: "Paid bills cannot be deleted" },
        { status: 400 },
      );
    }

    const { error: deleteError } = await supabase
      .from("bills")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[bills] delete error:", errorMessage(error));
    return NextResponse.json(
      { error: "Failed to delete bill" },
      { status: 500 },
    );
  }
}
