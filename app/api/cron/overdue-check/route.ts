import { createPublicClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { sendInvoiceReminder } from "@/lib/email";
import { generatePublicUrl } from "@/lib/link-tokens";
import { errorMessage, redactUserId } from "@/lib/log-redact";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminSupabase = createPublicClient();
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const today = new Date().toISOString().split("T")[0];

    const { data: overdueInvoices, error } = await adminSupabase
      .from("invoices")
      .select(`
        *,
        clients (
          name,
          email
        )
      `)
      .in("status", ["sent", "viewed"])
      .lt("due_date", today);

    if (error) throw error;

    let processed = 0;

    for (const invoice of overdueInvoices || []) {
      try {
        await adminSupabase
          .from("invoices")
          .update({ status: "overdue", updated_at: new Date().toISOString() })
          .eq("id", invoice.id);

        const { data: profile } = await adminSupabase
          .from("profiles")
          .select("name, business_name, email")
          .eq("id", invoice.user_id)
          .single();

        const dueDate = new Date(invoice.due_date);
        const todayDate = new Date();
        const daysOverdue = Math.floor(
          (todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        const paymentLink = generatePublicUrl(baseUrl, "pay", invoice.id);

        const currencySymbols: Record<string, string> = {
          USD: "$",
          GBP: "£",
          EUR: "€",
          NGN: "NGN ",
          GHS: "GHS ",
          KES: "KES ",
          ZAR: "R ",
        };
        const symbol =
          currencySymbols[invoice.currency] || invoice.currency + " ";
        const formattedAmount = `${symbol}${Number(invoice.total).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        const formattedDueDate = dueDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        if (invoice.clients?.email) {
          await sendInvoiceReminder({
            to: invoice.clients.email,
            clientName: invoice.clients.name,
            freelancerName: profile?.name || "Freelancer",
            businessName: profile?.business_name || null,
            invoiceNumber: invoice.invoice_number,
            amount: formattedAmount,
            dueDate: formattedDueDate,
            paymentLink,
            daysOverdue,
          });
        }

        processed++;
      } catch (invoiceError) {
        console.error(
          `[cron/overdue-check] Failed to process invoice ${redactUserId(invoice.id)}:`,
          errorMessage(invoiceError),
        );
      }
    }

    return NextResponse.json({ processed });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to process overdue invoices";
    console.error("[cron/overdue-check] error:", errorMessage(error));
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
