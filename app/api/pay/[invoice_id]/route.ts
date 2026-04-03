import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ invoice_id: string }> }
) {
  try {
    const supabase = await createClient();
    const { invoice_id } = await params;

    const { data: invoice, error } = await supabase
      .from("invoices")
      .select(`
        invoice_number,
        status,
        currency,
        subtotal,
        tax_rate,
        tax_amount,
        total,
        due_date,
        notes,
        user_id,
        client_id,
        clients (
          name,
          email
        ),
        invoice_items (
          description,
          quantity,
          rate,
          amount,
          sort_order
        )
      `)
      .eq("id", invoice_id)
      .single();

    if (error || !invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    if (invoice.status === "cancelled") {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, business_name, flutterwave_subaccount_id, plan")
      .eq("id", invoice.user_id)
      .single();

    const client = invoice.clients as any;
    const lineItems = invoice.invoice_items as any[];

    const safeInvoice = {
      invoice_number: invoice.invoice_number,
      status: invoice.status,
      currency: invoice.currency,
      subtotal: invoice.subtotal,
      tax_rate: invoice.tax_rate,
      tax_amount: invoice.tax_amount,
      total: invoice.total,
      due_date: invoice.due_date,
      notes: invoice.notes,
      client: {
        name: client?.name || "",
        email: client?.email || "",
      },
      freelancer: {
        name: profile?.name || "",
        business_name: profile?.business_name || null,
      },
      subaccount_id: profile?.flutterwave_subaccount_id || null,
      is_pro: profile?.plan === "pro",
      line_items: (lineItems || [])
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
        })),
    };

    return NextResponse.json({ invoice: safeInvoice });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}