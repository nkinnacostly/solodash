import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { sendInvoiceReminder } from "@/lib/email";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  try {
    const today = new Date().toISOString().split("T")[0];

    // Fetch all overdue invoices (sent or viewed, past due date)
    const { data: overdueInvoices, error } = await supabase
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

    // Process each overdue invoice
    for (const invoice of overdueInvoices || []) {
      try {
        // Update status to overdue
        await supabase
          .from("invoices")
          .update({ status: "overdue", updated_at: new Date().toISOString() })
          .eq("id", invoice.id);

        // Fetch profile separately
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, business_name, email")
          .eq("id", invoice.user_id)
          .single();

        // Calculate days overdue
        const dueDate = new Date(invoice.due_date);
        const todayDate = new Date();
        const daysOverdue = Math.floor(
          (todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Generate payment link
        const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pay/${invoice.id}`;

        // Format amount
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

        // Format due date
        const formattedDueDate = dueDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        // Send reminder email
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
          `Failed to process invoice ${invoice.id}:`,
          invoiceError
        );
        // Continue with next invoice
      }
    }

    return NextResponse.json({ processed });
  } catch (error: any) {
    console.error("Overdue check cron error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process overdue invoices" },
      { status: 500 }
    );
  }
}
