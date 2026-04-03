import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select(`
      *,
      clients (
        name,
        email,
        address
      ),
      invoice_items (
        id,
        description,
        quantity,
        rate,
        amount,
        sort_order
      )
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !invoice) {
    return NextResponse.json(
      { error: "Invoice not found" },
      { status: 404 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, business_name, email, phone, address")
    .eq("id", user.id)
    .single();

  return NextResponse.json({ invoice: { ...invoice, profiles: profile } });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: existingInvoice } = await supabase
    .from("invoices")
    .select("status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existingInvoice) {
    return NextResponse.json(
      { error: "Invoice not found" },
      { status: 404 }
    );
  }

  if (existingInvoice.status !== "draft") {
    return NextResponse.json(
      { error: "Only draft invoices can be edited" },
      { status: 400 }
    );
  }

  const body = await request.json();

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

    const subtotal = body.lineItems?.reduce(
      (sum: number, item: any) =>
        sum + Number(item.quantity) * Number(item.rate),
      0
    ) || 0;

    const taxRate = Number(body.taxRate) || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    const { error: invoiceError } = await supabase
      .from("invoices")
      .update({
        client_id: clientId,
        invoice_number: body.invoiceNumber,
        currency: body.currency,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
        issue_date: body.issueDate,
        due_date: body.dueDate,
        notes: body.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (invoiceError) throw invoiceError;

    await supabase
      .from("invoice_items")
      .delete()
      .eq("invoice_id", id);

    if (body.lineItems && body.lineItems.length > 0) {
      const lineItemsToInsert = body.lineItems.map(
        (item: any, index: number) => ({
          invoice_id: id,
          description: item.description,
          quantity: Number(item.quantity),
          rate: Number(item.rate),
          amount: Number(item.quantity) * Number(item.rate),
          sort_order: index,
        })
      );

      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(lineItemsToInsert);

      if (itemsError) throw itemsError;
    }

    const { data: updatedInvoice } = await supabase
      .from("invoices")
      .select(`
        *,
        clients (name, email, address),
        invoice_items (id, description, quantity, rate, amount, sort_order)
      `)
      .eq("id", id)
      .single();

    return NextResponse.json({ invoice: updatedInvoice });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update invoice" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: existingInvoice } = await supabase
    .from("invoices")
    .select("status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existingInvoice) {
    return NextResponse.json(
      { error: "Invoice not found" },
      { status: 404 }
    );
  }

  if (existingInvoice.status !== "draft") {
    return NextResponse.json(
      { error: "Only draft invoices can be deleted" },
      { status: 400 }
    );
  }

  await supabase
    .from("invoice_items")
    .delete()
    .eq("invoice_id", id);

  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}