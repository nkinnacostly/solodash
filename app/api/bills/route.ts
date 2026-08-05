import { createClient } from "@/lib/supabase/server";
import { errorMessage } from "@/lib/log-redact";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  try {
    let vendorId = body.vendorId;

    // Inline vendor creation (mirror invoice's inline-client flow)
    if (body.isNewVendor && body.vendorName) {
      const { data: newVendor, error: vendorError } = await supabase
        .from("vendors")
        .insert({
          user_id: user.id,
          name: body.vendorName,
          email: body.vendorEmail || null,
          address: body.vendorAddress || null,
        })
        .select()
        .single();

      if (vendorError) throw vendorError;
      vendorId = newVendor.id;
    }

    if (!vendorId) {
      return NextResponse.json(
        { error: "Vendor is required" },
        { status: 400 },
      );
    }

    // Verify the vendor belongs to this user before assigning it (M3-style).
    const { data: vendor } = await supabase
      .from("vendors")
      .select("id")
      .eq("id", vendorId)
      .eq("user_id", user.id)
      .single();

    if (!vendor) {
      return NextResponse.json({ error: "Invalid vendor" }, { status: 400 });
    }

    // Auto-generate a bill number if none supplied
    let billNumber = body.billNumber;
    if (!billNumber) {
      const { data: lastBill } = await supabase
        .from("bills")
        .select("bill_number")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      let nextNum = 1;
      if (lastBill && lastBill.length > 0) {
        const parsed = parseInt(
          String(lastBill[0].bill_number).split("-")[1],
          10,
        );
        if (!Number.isNaN(parsed)) nextNum = parsed + 1;
      }
      billNumber = `BILL-${String(nextNum).padStart(3, "0")}`;
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

    const { data: bill, error: billError } = await supabase
      .from("bills")
      .insert({
        user_id: user.id,
        vendor_id: vendorId,
        bill_number: billNumber,
        status: "unpaid",
        currency: body.currency || "USD",
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
        category: body.category || null,
        issue_date: body.issueDate,
        due_date: body.dueDate || null,
        notes: body.notes || null,
      })
      .select()
      .single();

    if (billError) throw billError;

    if (lineItems.length > 0) {
      const itemsToInsert = lineItems.map((item, index) => ({
        bill_id: bill.id,
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

    return NextResponse.json({ bill }, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create bill";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get("pageSize") || "20", 10)),
    );
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("bills")
      .select(
        `
        id,
        bill_number,
        status,
        total,
        currency,
        category,
        issue_date,
        due_date,
        paid_at,
        created_at,
        vendor_id,
        vendors (
          name,
          email
        )
      `,
        { count: "exact" },
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.ilike("bill_number", `%${search}%`);
    }

    const { data: bills, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      bills: bills || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: count ? Math.ceil(count / pageSize) : 0,
        hasMore: count ? from + pageSize < count : false,
      },
    });
  } catch (error: unknown) {
    console.error("[bills] error:", errorMessage(error));
    return NextResponse.json(
      { error: "Failed to fetch bills" },
      { status: 500 },
    );
  }
}
