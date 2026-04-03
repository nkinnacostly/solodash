import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // DEBUG - remove after fixing
  console.log("User from API route:", user?.id);
  console.log("Cookies:", request.cookies.getAll());

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Check plan limits
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  if (profile?.plan === "free") {
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
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
        { status: 403 }
      );
    }
  }

  try {
    let clientId = body.clientId;

    // Create new client if provided
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
        { status: 400 }
      );
    }

    // Generate invoice number
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

    // Calculate totals
    const subtotal = body.lineItems.reduce(
      (sum: number, item: any) => sum + Number(item.quantity) * Number(item.rate),
      0
    );
    const taxRate = Number(body.taxRate) || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    // Create invoice
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

    // Insert line items
    const lineItemsToInsert = body.lineItems.map((item: any, index: number) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: Number(item.quantity),
      rate: Number(item.rate),
      amount: Number(item.quantity) * Number(item.rate),
      sort_order: index,
    }));

    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(lineItemsToInsert);

    if (itemsError) throw itemsError;

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create invoice" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get status filter from query params
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");

  let query = supabase
    .from("invoices")
    .select(`
      *,
      clients (
        name,
        email
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data: invoices, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ invoices });
}
