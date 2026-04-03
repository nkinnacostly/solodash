import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import React from "react";

export async function GET(
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

  const { data: invoice, error: fetchError } = await supabase
    .from("invoices")
    .select(`
      *,
      invoice_items (
        id,
        description,
        quantity,
        rate,
        amount,
        sort_order
      ),
      clients (
        name,
        email,
        address
      )
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !invoice) {
    console.log("Fetch error:", fetchError);
    console.log("User ID:", user.id);
    console.log("Invoice ID:", id);
    return NextResponse.json(
      { error: "Invoice not found", details: fetchError },
      { status: 404 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, business_name, email, phone, brand_color, logo_url")
    .eq("id", user.id)
    .single();

  try {
    // Dynamic imports to avoid CJS/ESM conflicts
    const { renderToBuffer } = await import("@react-pdf/renderer");
    const { InvoicePDF } = await import("@/components/InvoicePDF");

    const pdfDocument = React.createElement(InvoicePDF, {
      invoice: {
        invoice_number: invoice.invoice_number,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        currency: invoice.currency,
        subtotal: invoice.subtotal,
        tax_rate: invoice.tax_rate,
        tax_amount: invoice.tax_amount,
        total: invoice.total,
        notes: invoice.notes,
        status: invoice.status,
      },
      client: {
        name: invoice.clients?.name || "Client",
        email: invoice.clients?.email || "",
        address: invoice.clients?.address || null,
      },
      profile: {
        name: profile?.name || "Freelancer",
        business_name: profile?.business_name || null,
        email: profile?.email || "",
        phone: profile?.phone || null,
        address: null,
        logo_url: profile?.logo_url || null,
        brand_color: profile?.brand_color || "#10b981",
      },
      lineItems:
        invoice.invoice_items?.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
        })) || [],
    });

    const pdfBuffer = await renderToBuffer(pdfDocument as any);

    // Upload to Supabase Storage
    const filePath = `invoices/${user.id}/${id}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
    } else {
      await supabase
        .from("invoices")
        .update({ pdf_url: filePath, updated_at: new Date().toISOString() })
        .eq("id", id);
    }

    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoice_number}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate PDF" },
      { status: 500 },
    );
  }
}
   );
  }
}