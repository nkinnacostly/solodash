"use client";

import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { WidgetWrapper } from "@/components/dashboard/WidgetWrapper";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data as T;
}

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

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17) return "Good evening";
  return "Good morning";
}

interface ProfileData {
  profile: {
    name: string | null;
    currency: string | null;
    business_name: string | null;
    plan: string | null;
  } | null;
}

interface StatsData {
  monthlyTotal: number;
  yearlyTotal: number;
  outstandingCount: number;
  activeContracts: number;
  year: number;
  currency: string;
}

interface MonthlyData {
  monthly: { month: number; total: number }[];
}

interface RecentInvoicesData {
  invoices: {
    id: string;
    invoice_number: string;
    status: string;
    total: number;
    currency: string;
    clients: { name: string } | { name: string }[] | null;
  }[];
}

interface RecentContractsData {
  contracts: {
    id: string;
    title: string;
    status: string;
    clients: { name: string } | { name: string }[] | null;
  }[];
}

interface TopClientsData {
  clients: {
    client_id: string | null;
    client_name: string | null;
    total: number;
    invoice_count: number;
  }[];
}

function clientName(
  clients: { name: string } | { name: string }[] | null,
): string {
  if (!clients) return "Unknown client";
  if (Array.isArray(clients)) return clients[0]?.name || "Unknown client";
  return clients.name || "Unknown client";
}

export default function DashboardPage() {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <WidgetWrapper<ProfileData>
          fetcher={() => fetchJson("/api/dashboard/profile")}
          errorTitle="Could not load profile"
          loadingFallback={
            <div className="animate-pulse space-y-2">
              <div className="h-9 bg-[#1c202a] rounded w-64" />
              <div className="h-4 bg-[#1c202a] rounded w-48" />
            </div>
          }
        >
          {(data) => {
            const firstName =
              data.profile?.name?.split(" ")[0] || "there";
            return (
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {getGreeting()}, {firstName}
                </h1>
                <p className="text-[#8f9db1] mt-1">
                  Here&apos;s what&apos;s happening with your business
                </p>
              </div>
            );
          }}
        </WidgetWrapper>
        <Link
          href="/invoices/new"
          className="inline-flex items-center gap-2 px-5 py-3 bg-[#6ea8ff] text-[#0e1116] font-medium rounded-lg hover:bg-[#5b93e6] transition-colors shrink-0"
        >
          <Plus size={18} />
          New Invoice
        </Link>
      </div>

      <WidgetWrapper<StatsData>
        fetcher={() => fetchJson("/api/dashboard/stats")}
        errorTitle="Could not load stats"
        className="mb-8"
        loadingFallback={
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse bg-[#1c202a] border border-[#2a303c] rounded-xl h-24"
              />
            ))}
          </div>
        }
      >
        {(stats) => {
          const symbol = getCurrencySymbol(stats.currency);
          return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#1c202a] border border-[#2a303c] rounded-xl p-5">
                <p className="text-sm text-[#8f9db1] mb-2">This month</p>
                <p className="text-2xl font-bold text-white">
                  {symbol}
                  {stats.monthlyTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="bg-[#1c202a] border border-[#2a303c] rounded-xl p-5">
                <p className="text-sm text-[#8f9db1] mb-2">Outstanding</p>
                <p className="text-2xl font-bold text-white">
                  {stats.outstandingCount}
                </p>
              </div>
              <div className="bg-[#1c202a] border border-[#2a303c] rounded-xl p-5">
                <p className="text-sm text-[#8f9db1] mb-2">Paid this year</p>
                <p className="text-2xl font-bold text-white">
                  {symbol}
                  {stats.yearlyTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="bg-[#1c202a] border border-[#2a303c] rounded-xl p-5">
                <p className="text-sm text-[#8f9db1] mb-2">Active contracts</p>
                <p className="text-2xl font-bold text-white">
                  {stats.activeContracts}
                </p>
              </div>
            </div>
          );
        }}
      </WidgetWrapper>

      <WidgetWrapper<MonthlyData & { currency: string }>
        fetcher={async () => {
          const [monthly, profile] = await Promise.all([
            fetchJson<MonthlyData>("/api/dashboard/monthly"),
            fetchJson<ProfileData>("/api/dashboard/profile"),
          ]);
          return {
            ...monthly,
            currency: profile.profile?.currency || "USD",
          };
        }}
        errorTitle="Could not load monthly chart"
        className="mb-8"
        loadingFallback={
          <div className="animate-pulse bg-[#1c202a] border border-[#2a303c] rounded-xl h-[340px]" />
        }
      >
        {(data) => {
          const symbol = getCurrencySymbol(data.currency);
          const chartData = Array.from({ length: 12 }, (_, i) => {
            const row = data.monthly.find((m) => m.month === i + 1);
            return {
              name: MONTHS[i],
              amount: Number(row?.total ?? 0),
            };
          });

          return (
            <div className="bg-[#1c202a] border border-[#2a303c] rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-6">
                Monthly earnings
              </h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a303c" />
                  <XAxis dataKey="name" stroke="#8f9db1" />
                  <YAxis stroke="#8f9db1" />
                  <Tooltip
                    formatter={(value) => [
                      `${symbol}${Number(value).toLocaleString()}`,
                      "Amount",
                    ]}
                    contentStyle={{
                      backgroundColor: "#1c202a",
                      border: "1px solid #2a303c",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="amount" fill="#6ea8ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        }}
      </WidgetWrapper>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <WidgetWrapper<RecentInvoicesData>
          fetcher={() => fetchJson("/api/dashboard/recent-invoices")}
          errorTitle="Could not load recent invoices"
          loadingFallback={
            <div className="animate-pulse bg-[#1c202a] border border-[#2a303c] rounded-xl h-64" />
          }
        >
          {(data) => (
            <div className="bg-[#1c202a] border border-[#2a303c] rounded-xl">
              <div className="flex items-center justify-between p-5 border-b border-[#2a303c]">
                <h2 className="text-lg font-semibold text-white">
                  Recent invoices
                </h2>
                <Link
                  href="/invoices"
                  className="text-sm text-[#6ea8ff] hover:underline flex items-center gap-1"
                >
                  View all <ArrowRight size={14} />
                </Link>
              </div>
              <div className="p-5">
                {data.invoices.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-[#8f9db1] mb-4">No invoices yet</p>
                    <Link
                      href="/invoices/new"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#6ea8ff] text-[#0e1116] text-sm font-medium rounded-lg hover:bg-[#5b93e6] transition-colors"
                    >
                      <Plus size={16} />
                      Create your first invoice
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.invoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between py-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {invoice.invoice_number}
                          </p>
                          <p className="text-xs text-[#8f9db1]">
                            {clientName(invoice.clients)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <p className="text-sm font-medium text-white">
                            {getCurrencySymbol(invoice.currency)}
                            {Number(invoice.total).toLocaleString()}
                          </p>
                          <StatusBadge
                            type="invoice"
                            status={invoice.status}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </WidgetWrapper>

        <WidgetWrapper<RecentContractsData>
          fetcher={() => fetchJson("/api/dashboard/recent-contracts")}
          errorTitle="Could not load recent contracts"
          loadingFallback={
            <div className="animate-pulse bg-[#1c202a] border border-[#2a303c] rounded-xl h-64" />
          }
        >
          {(data) => (
            <div className="bg-[#1c202a] border border-[#2a303c] rounded-xl">
              <div className="flex items-center justify-between p-5 border-b border-[#2a303c]">
                <h2 className="text-lg font-semibold text-white">
                  Recent contracts
                </h2>
                <Link
                  href="/contracts"
                  className="text-sm text-[#6ea8ff] hover:underline flex items-center gap-1"
                >
                  View all <ArrowRight size={14} />
                </Link>
              </div>
              <div className="p-5">
                {data.contracts.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-[#8f9db1] mb-4">No contracts yet</p>
                    <Link
                      href="/contracts/new"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#6ea8ff] text-[#0e1116] text-sm font-medium rounded-lg hover:bg-[#5b93e6] transition-colors"
                    >
                      <Plus size={16} />
                      Create your first contract
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.contracts.map((contract) => (
                      <div
                        key={contract.id}
                        className="flex items-center justify-between py-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {contract.title}
                          </p>
                          <p className="text-xs text-[#8f9db1]">
                            {clientName(contract.clients)}
                          </p>
                        </div>
                        <div className="ml-4">
                          <StatusBadge
                            type="contract"
                            status={contract.status}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </WidgetWrapper>
      </div>

      <WidgetWrapper<TopClientsData & { currency: string }>
        fetcher={async () => {
          const [clients, profile] = await Promise.all([
            fetchJson<TopClientsData>("/api/dashboard/top-clients"),
            fetchJson<ProfileData>("/api/dashboard/profile"),
          ]);
          return {
            ...clients,
            currency: profile.profile?.currency || "USD",
          };
        }}
        errorTitle="Could not load top clients"
        loadingFallback={
          <div className="animate-pulse bg-[#1c202a] border border-[#2a303c] rounded-xl h-48" />
        }
      >
        {(data) => {
          const symbol = getCurrencySymbol(data.currency);
          const yearTotal = data.clients.reduce(
            (sum, c) => sum + Number(c.total),
            0,
          );

          return (
            <div className="bg-[#1c202a] border border-[#2a303c] rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Top clients this year
              </h2>
              {data.clients.length === 0 ? (
                <p className="text-sm text-[#8f9db1] py-8 text-center">
                  No client income recorded yet this year
                </p>
              ) : (
                <div className="space-y-3">
                  {data.clients.map((client, idx) => (
                    <div
                      key={client.client_id ?? `manual-${idx}`}
                      className="flex items-center justify-between py-2 border-b border-[#2a303c] last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">
                          {client.client_name || "Manual Entry"}
                        </p>
                        <p className="text-xs text-[#8f9db1]">
                          {client.invoice_count} invoice
                          {client.invoice_count === 1 ? "" : "s"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">
                          {symbol}
                          {Number(client.total).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        {yearTotal > 0 && (
                          <p className="text-xs text-[#8f9db1]">
                            {Math.round(
                              (Number(client.total) / yearTotal) * 100,
                            )}
                            %
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }}
      </WidgetWrapper>
    </div>
  );
}

function StatusBadge({
  type,
  status,
}: {
  type: "invoice" | "contract";
  status: string;
}) {
  const invoiceStyles: Record<string, string> = {
    draft: "bg-[#2a303c] text-[#8f9db1]",
    sent: "bg-[#1e3a5f] text-[#60a5fa]",
    viewed: "bg-[#3d2e00] text-[#e6b566]",
    paid: "bg-[#0c2e26] text-[#57c9b0]",
    overdue: "bg-[#3d0a0a] text-[#ef4444]",
    cancelled: "bg-[#2a303c] text-[#6b7280]",
  };

  const contractStyles: Record<string, string> = {
    draft: "bg-[#2a303c] text-[#8f9db1]",
    sent: "bg-[#1e3a5f] text-[#60a5fa]",
    signed: "bg-[#0c2e26] text-[#57c9b0]",
    active: "bg-[#0c2e26] text-[#57c9b0]",
    completed: "bg-[#2a303c] text-[#6b7280]",
  };

  const styles = type === "invoice" ? invoiceStyles : contractStyles;

  return (
    <span
      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
        styles[status] || "bg-[#2a303c] text-[#8f9db1]"
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
