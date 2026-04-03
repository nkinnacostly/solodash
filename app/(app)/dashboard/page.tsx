import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Fetch user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const firstName = profile?.name?.split(" ")[0] || "there";
  const currency = profile?.currency || "USD";
  const currencySymbol = getCurrencySymbol(currency);

  // Get time-based greeting
  const hour = new Date().getHours();
  let greeting = "Good morning";
  if (hour >= 12 && hour < 17) greeting = "Good afternoon";
  else if (hour >= 17) greeting = "Good evening";

  // Fetch stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const startOfYear = new Date(now.getFullYear(), 0, 1)
    .toISOString()
    .split("T")[0];

  // This month's earnings
  const { data: monthEarnings } = await supabase
    .from("income_log")
    .select("amount")
    .eq("user_id", user.id)
    .gte("date", startOfMonth);

  const monthlyTotal =
    monthEarnings?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

  // Outstanding invoices
  const { count: outstandingCount } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("status", ["sent", "viewed", "overdue"]);

  // Paid this year
  const { data: yearEarnings } = await supabase
    .from("income_log")
    .select("amount")
    .eq("user_id", user.id)
    .gte("date", startOfYear);

  const yearlyTotal =
    yearEarnings?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

  // Active contracts
  const { count: activeContracts } = await supabase
    .from("contracts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "active");

  // Recent invoices
  const { data: recentInvoices } = await supabase
    .from("invoices")
    .select(
      `
      id,
      invoice_number,
      total,
      currency,
      status,
      clients (name)
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Recent contracts
  const { data: recentContracts } = await supabase
    .from("contracts")
    .select(
      `
      id,
      title,
      status,
      clients (name)
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {greeting}, {firstName}
          </h1>
          <p className="text-[#a1a1aa] mt-1">
            Here's what's happening with your business
          </p>
        </div>
        <Link
          href="/invoices/new"
          className="inline-flex items-center gap-2 px-5 py-3 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors"
        >
          <Plus size={18} />
          New Invoice
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* This Month's Earnings */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
          <p className="text-sm text-[#a1a1aa] mb-2">This month</p>
          <p className="text-2xl font-bold text-white">
            {monthlyTotal > 0
              ? `${currencySymbol}${monthlyTotal.toLocaleString()}`
              : "—"}
          </p>
        </div>

        {/* Outstanding */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
          <p className="text-sm text-[#a1a1aa] mb-2">Outstanding</p>
          <p className="text-2xl font-bold text-white">
            {outstandingCount && outstandingCount > 0 ? outstandingCount : "—"}
          </p>
        </div>

        {/* Paid This Year */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
          <p className="text-sm text-[#a1a1aa] mb-2">Paid this year</p>
          <p className="text-2xl font-bold text-white">
            {yearlyTotal > 0
              ? `${currencySymbol}${yearlyTotal.toLocaleString()}`
              : "—"}
          </p>
        </div>

        {/* Active Contracts */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
          <p className="text-sm text-[#a1a1aa] mb-2">Active contracts</p>
          <p className="text-2xl font-bold text-white">
            {activeContracts && activeContracts > 0 ? activeContracts : "—"}
          </p>
        </div>
      </div>

      {/* Two Columns */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl">
          <div className="flex items-center justify-between p-5 border-b border-[#27272a]">
            <h2 className="text-lg font-semibold text-white">
              Recent invoices
            </h2>
            <Link
              href="/invoices"
              className="text-sm text-[#10b981] hover:underline flex items-center gap-1"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          <div className="p-5">
            {!recentInvoices || recentInvoices.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#a1a1aa] mb-4">No invoices yet</p>
                <Link
                  href="/invoices/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#10b981] text-white text-sm font-medium rounded-lg hover:bg-[#059669] transition-colors"
                >
                  <Plus size={16} />
                  Create your first invoice
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentInvoices.map((invoice: any) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {invoice.invoice_number}
                      </p>
                      <p className="text-xs text-[#a1a1aa]">
                        {invoice.clients?.name || "Unknown client"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <p className="text-sm font-medium text-white">
                        {getCurrencySymbol(invoice.currency)}
                        {Number(invoice.total).toLocaleString()}
                      </p>
                      <StatusBadge type="invoice" status={invoice.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Contracts */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl">
          <div className="flex items-center justify-between p-5 border-b border-[#27272a]">
            <h2 className="text-lg font-semibold text-white">
              Recent contracts
            </h2>
            <Link
              href="/contracts"
              className="text-sm text-[#10b981] hover:underline flex items-center gap-1"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          <div className="p-5">
            {!recentContracts || recentContracts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#a1a1aa] mb-4">No contracts yet</p>
                <Link
                  href="/contracts/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#10b981] text-white text-sm font-medium rounded-lg hover:bg-[#059669] transition-colors"
                >
                  <Plus size={16} />
                  Create your first contract
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentContracts.map((contract: any) => (
                  <div
                    key={contract.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {contract.title}
                      </p>
                      <p className="text-xs text-[#a1a1aa]">
                        {contract.clients?.name || "Unknown client"}
                      </p>
                    </div>
                    <div className="ml-4">
                      <StatusBadge type="contract" status={contract.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({
  type,
  status,
}: {
  type: "invoice" | "contract";
  status: string;
}) {
  const invoiceStyles: Record<string, string> = {
    draft: "bg-[#27272a] text-[#a1a1aa]",
    sent: "bg-[#1e3a5f] text-[#60a5fa]",
    viewed: "bg-[#3d2e00] text-[#fbbf24]",
    paid: "bg-[#052e16] text-[#10b981]",
    overdue: "bg-[#3d0a0a] text-[#ef4444]",
    cancelled: "bg-[#27272a] text-[#6b7280]",
  };

  const contractStyles: Record<string, string> = {
    draft: "bg-[#27272a] text-[#a1a1aa]",
    sent: "bg-[#1e3a5f] text-[#60a5fa]",
    signed: "bg-[#052e16] text-[#10b981]",
    active: "bg-[#052e16] text-[#10b981]",
    completed: "bg-[#27272a] text-[#6b7280]",
  };

  const styles = type === "invoice" ? invoiceStyles : contractStyles;

  return (
    <span
      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
        styles[status] || "bg-[#27272a] text-[#a1a1aa]"
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// Helper: Get currency symbol
function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: "$",
    GBP: "£",
    EUR: "€",
    NGN: "₦",
    GHS: "GH₵",
    KES: "KSh",
    ZAR: "R",
  };
  return symbols[currency] || "$";
}
