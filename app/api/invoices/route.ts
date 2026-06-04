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

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  if (profile?.plan === "free") {
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    )
      .toISOString()
      .split("T")[0];

    const { count } = await supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth);

    if (count && count >= 3) {
      return NextResponse.json(
        { error: "Free plan limit reached. Upgrade to Pro." },
        { status: 403 },
      );
    }
  }

  try {
    let clientId = body.clientId;

    if (body.isNewClient && body.clientName && body.clientEmail) {
      const { data: newClient, error: clientError } = await supabase
        .from("clients")
        .insert({
          user_id: user.id,
          name: body.clientName,
          email: body.clientEmail,
          address: body.clientAddress || null,
        })
        .select()
        .single();

      if (clientError) throw clientError;
      clientId = newClient.id;
    }

    if (!clientId) {
      return NextResponse.json(
        { error: "Client is required" },
        { status: 400 },
      );
    }

    const { data: lastInvoice } = await supabase
      .from("invoices")
      .select("invoice_number")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    let invoiceNumber = body.invoiceNumber;
    if (!invoiceNumber) {
      let nextNum = 1;
      if (lastInvoice && lastInvoice.length > 0) {
        const lastNum = parseInt(lastInvoice[0].invoice_number.split("-")[1]);
        nextNum = lastNum + 1;
      }
      invoiceNumber = `INV-${String(nextNum).padStart(3, "0")}`;
    }

    const subtotal = body.lineItems.reduce(
      (sum: number, item: { quantity: number; rate: number }) =>
        sum + Number(item.quantity) * Number(item.rate),
      0,
    );
    const taxRate = Number(body.taxRate) || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        user_id: user.id,
        client_id: clientId,
        invoice_number: invoiceNumber,
        status: body.status || "draft",
        currency: body.currency || "USD",
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
        issue_date: body.issueDate,
        due_date: body.dueDate,
        notes: body.notes || null,
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    const lineItemsToInsert = body.lineItems.map(
      (
        item: { description: string; quantity: number; rate: number },
        index: number,
      ) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: Number(item.quantity),
        rate: Number(item.rate),
        amount: Number(item.quantity) * Number(item.rate),
        sort_order: index,
      }),
    );

    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(lineItemsToInsert);

    if (itemsError) throw itemsError;

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create invoice";
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
      .from("invoices")
      .select(
        `
        id,
        invoice_number,
        status,
        total,
        currency,
        issue_date,
        due_date,
        paid_at,
        created_at,
        client_id,
        clients (
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
      query = query.ilike("invoice_number", `%${search}%`);
    }

    const { data: invoices, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      invoices: invoices || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: count ? Math.ceil(count / pageSize) : 0,
        hasMore: count ? from + pageSize < count : false,
      },
    });
  } catch (error: unknown) {
    console.error("[invoices] error:", errorMessage(error));
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 },
    );
  }
}
