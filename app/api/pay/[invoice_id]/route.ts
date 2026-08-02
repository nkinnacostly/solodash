import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/server";
import { verifyLinkToken } from "@/lib/link-tokens";
import { errorMessage, redactUserId } from "@/lib/log-redact";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ invoice_id: string }> },
) {
  try {
    const { invoice_id } = await params;
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (token) {
      const payload = verifyLinkToken(token, invoice_id, "pay");
      if (!payload) {
        return NextResponse.json(
          { error: "Invalid or expired payment link" },
          { status: 401 },
        );
      }
    } else {
      console.warn(
        `[pay] Untokenized access for invoice ${redactUserId(invoice_id)}`,
      );
    }

    const supabase = createPublicClient();

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
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status === "cancelled") {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "name, business_name, flutterwave_subaccount_id, plan, logo_url, brand_color",
      )
      .eq("id", invoice.user_id)
      .single();

    // Derive Pro server-side; only expose branding assets for Pro users.
    const isPro = profile?.plan === "pro";

    const client = invoice.clients as {
      name?: string;
      email?: string;
    } | null;
    const lineItems = invoice.invoice_items as {
      description: string;
      quantity: number;
      rate: number;
      amount: number;
      sort_order: number;
    }[];

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
        logo_url: isPro ? profile?.logo_url || null : null,
        brand_color: isPro ? profile?.brand_color || null : null,
      },
      subaccount_id: profile?.flutterwave_subaccount_id || null,
      is_pro: isPro,
      line_items: (lineItems || [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((item) => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
        })),
    };

    return NextResponse.json({ invoice: safeInvoice });
  } catch (error) {
    console.error("Error fetching invoice:", errorMessage(error));
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 },
    );
  }
}
