"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Loader2,
  Plus,
  Download,
  ChevronDown,
  X,
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface EarningsEntry {
  id: string;
  date: string;
  amount: number;
  currency: string;
  description: string;
  type: string;
  client_name: string | null;
}

interface EarningsStats {
  totalEarned: number;
  year: number;
  currency: string;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

const months = [
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

export default function EarningsPage() {
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState<EarningsStats | null>(null);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<
    { month: number; total: number }[]
  >([]);
  const [clientBreakdown, setClientBreakdown] = useState<
    {
      client_id: string | null;
      client_name: string | null;
      total: number;
      invoice_count: number;
    }[]
  >([]);
  const [entries, setEntries] = useState<EarningsEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [manualForm, setManualForm] = useState({
    amount: "",
    currency: "USD",
    date: new Date().toISOString().split("T")[0],
    description: "",
    client_id: "",
  });

  useEffect(() => {
    setPage(1);
  }, [selectedYear]);

  useEffect(() => {
    fetchEarnings();
  }, [page, selectedYear]);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        year: String(selectedYear),
        includeStats: page === 1 ? "true" : "false",
      });

      const response = await fetch(`/api/earnings?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch earnings");
      }

      setEntries(data.entries || []);
      setPagination(data.pagination || null);

      if (data.stats) {
        setStats(data.stats);
        setMonthlyBreakdown(data.monthlyBreakdown || []);
        setClientBreakdown(data.clientBreakdown || []);
      }
    } catch (err: unknown) {
      toast.error(
        "Failed to load earnings",
        err instanceof Error ? err.message : "Unknown error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualLoading(true);

    try {
      const response = await fetch("/api/earnings/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(manualForm.amount),
          currency: manualForm.currency,
          date: manualForm.date,
          description: manualForm.description,
          client_id: manualForm.client_id || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add income");
      }

      toast.success("Income added");
      setShowManualForm(false);
      setManualForm({
        amount: "",
        currency: "USD",
        date: new Date().toISOString().split("T")[0],
        description: "",
        client_id: "",
      });
      fetchEarnings();
    } catch (err: any) {
      toast.error("Failed to add income", err.message);
    } finally {
      setManualLoading(false);
    }
  };

  const handleExport = async (format: "pdf" | "csv") => {
    try {
      window.open(
        `/api/earnings/export?year=${selectedYear}&format=${format}`,
        "_blank",
      );
      toast.success("Export started", "Your file is being downloaded");
    } catch (err: any) {
      toast.error("Export failed", err.message);
    }
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      USD: "$",
      GBP: "£",
      EUR: "€",
      NGN: "₦",
      GHS: "GH₵",
      KES: "KSh",
      ZAR: "R",
    };
    return symbols[currency] || currency;
  };

  const currency = stats?.currency || "USD";
  const totalEarned = stats?.totalEarned ?? 0;

  const byMonth = Array.from({ length: 12 }, (_, i) => {
    const row = monthlyBreakdown.find((m) => m.month === i + 1);
    return { month: i + 1, amount: row?.total ?? 0 };
  });

  const byClient = clientBreakdown.map((c) => ({
    client_id: c.client_id,
    client_name: c.client_name || "Manual Entry",
    count: c.invoice_count,
    total: c.total,
  }));

  const bestMonth = byMonth.reduce(
    (max, month) => (month.amount > max.amount ? month : max),
    { month: 1, amount: 0 },
  );

  const avgPerMonth = totalEarned / 12;

  const paidInvoices = byClient.reduce((sum, c) => sum + c.count, 0);

  const years = [
    new Date().getFullYear(),
    new Date().getFullYear() - 1,
    new Date().getFullYear() - 2,
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-[#1c202a] rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-[#1c202a] rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-[#1c202a] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Earnings</h1>
          <p className="text-[#8f9db1] mt-1">
            Track your income and export tax reports
          </p>
        </div>
        <div className="relative">
          <select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(parseInt(e.target.value));
              setPage(1);
            }}
            className="appearance-none px-4 py-2 pr-10 bg-[#1c202a] border border-[#2a303c] rounded-lg text-white focus:border-[#6ea8ff] focus:outline-none cursor-pointer"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8f9db1] pointer-events-none"
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1c202a] border border-[#2a303c] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign size={20} className="text-[#6ea8ff]" />
            <p className="text-sm text-[#8f9db1]">Total Earned</p>
          </div>
          <p className="text-2xl font-bold text-white">
            {getCurrencySymbol(currency)}
            {totalEarned.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            }) || "0.00"}
          </p>
        </div>

        <div className="bg-[#1c202a] border border-[#2a303c] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={20} className="text-[#6ea8ff]" />
            <p className="text-sm text-[#8f9db1]">Paid Invoices</p>
          </div>
          <p className="text-2xl font-bold text-white">{paidInvoices}</p>
        </div>

        <div className="bg-[#1c202a] border border-[#2a303c] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar size={20} className="text-[#6ea8ff]" />
            <p className="text-sm text-[#8f9db1]">Best Month</p>
          </div>
          <p className="text-2xl font-bold text-white">
            {bestMonth && bestMonth.amount > 0
              ? `${months[bestMonth.month - 1]}`
              : "N/A"}
          </p>
        </div>

        <div className="bg-[#1c202a] border border-[#2a303c] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users size={20} className="text-[#6ea8ff]" />
            <p className="text-sm text-[#8f9db1]">Average/Month</p>
          </div>
          <p className="text-2xl font-bold text-white">
            {getCurrencySymbol(currency)}
            {avgPerMonth.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="bg-[#1c202a] border border-[#2a303c] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6">
          Monthly Earnings
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={byMonth.map((m) => ({
              name: months[m.month - 1],
              amount: m.amount,
            }))}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2a303c" />
            <XAxis dataKey="name" stroke="#8f9db1" />
            <YAxis stroke="#8f9db1" />
            <Tooltip
              formatter={(value: any) => [
                `${getCurrencySymbol(currency)}${value.toLocaleString()}`,
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

      {/* Income by Client */}
      {byClient.length > 0 && (
        <div className="bg-[#1c202a] border border-[#2a303c] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Income by Client
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[#2a303c]">
                <tr>
                  <th className="text-left py-3 text-sm font-medium text-[#8f9db1]">
                    Client
                  </th>
                  <th className="text-left py-3 text-sm font-medium text-[#8f9db1]">
                    Invoices
                  </th>
                  <th className="text-left py-3 text-sm font-medium text-[#8f9db1]">
                    Total
                  </th>
                  <th className="text-left py-3 text-sm font-medium text-muted">
                    % of Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {byClient.map((client, idx) => (
                  <tr key={idx}>
                    <td className="py-3 text-sm text-white">
                      {client.client_name || "Manual Entry"}
                    </td>
                    <td className="py-3 text-sm text-[#8f9db1]">
                      {client.count}
                    </td>
                    <td className="py-3 text-sm text-white font-medium">
                      {getCurrencySymbol(currency)}
                      {client.total.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-3 text-sm text-[#8f9db1]">
                      {totalEarned
                        ? Math.round((client.total / totalEarned) * 100)
                        : 0}
                      %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Income Log */}
      <div className="bg-[#1c202a] border border-[#2a303c] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Income Log</h2>
          <button
            onClick={() => setShowManualForm(!showManualForm)}
            className="flex items-center gap-2 px-4 py-2 bg-[#6ea8ff] text-[#0e1116] text-sm font-medium rounded-lg hover:bg-[#5b93e6] transition-colors"
          >
            <Plus size={16} />
            Add Income
          </button>
        </div>

        {showManualForm && (
          <form
            onSubmit={handleManualSubmit}
            className="bg-[#14171d] border border-[#2a303c] rounded-lg p-4 mb-4 space-y-4"
          >
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={manualForm.amount}
                  onChange={(e) =>
                    setManualForm((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  required
                  placeholder="0.00"
                  className="w-full px-4 py-2 bg-[#1c202a] border border-[#2a303c] rounded-lg text-white placeholder-[#8f9db1] focus:border-[#6ea8ff] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Currency
                </label>
                <select
                  value={manualForm.currency}
                  onChange={(e) =>
                    setManualForm((prev) => ({
                      ...prev,
                      currency: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 bg-[#1c202a] border border-[#2a303c] rounded-lg text-white focus:border-[#6ea8ff] focus:outline-none"
                >
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                  <option value="EUR">EUR</option>
                  <option value="NGN">NGN</option>
                  <option value="GHS">GHS</option>
                  <option value="KES">KES</option>
                  <option value="ZAR">ZAR</option>
                </select>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={manualForm.date}
                  onChange={(e) =>
                    setManualForm((prev) => ({ ...prev, date: e.target.value }))
                  }
                  required
                  className="w-full px-4 py-2 bg-[#1c202a] border border-[#2a303c] rounded-lg text-white focus:border-[#6ea8ff] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Description *
                </label>
                <input
                  type="text"
                  value={manualForm.description}
                  onChange={(e) =>
                    setManualForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  required
                  placeholder="Freelance work"
                  className="w-full px-4 py-2 bg-[#1c202a] border border-[#2a303c] rounded-lg text-white placeholder-[#8f9db1] focus:border-[#6ea8ff] focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={manualLoading}
                className="flex-1 py-2 bg-[#6ea8ff] text-[#0e1116] text-sm font-medium rounded-lg hover:bg-[#5b93e6] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {manualLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Add Income"
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowManualForm(false)}
                className="px-4 py-2 border border-[#2a303c] text-white text-sm font-medium rounded-lg hover:border-[#6ea8ff] transition-colors flex items-center gap-2"
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-[#2a303c]">
              <tr>
                <th className="text-left py-3 text-sm font-medium text-[#8f9db1]">
                  Date
                </th>
                <th className="text-left py-3 text-sm font-medium text-[#8f9db1]">
                  Description
                </th>
                <th className="text-left py-3 text-sm font-medium text-[#8f9db1]">
                  Client
                </th>
                <th className="text-left py-3 text-sm font-medium text-[#8f9db1]">
                  Amount
                </th>
                <th className="text-left py-3 text-sm font-medium text-[#8f9db1]">
                  Type
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a303c]">
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="py-3 text-sm text-[#8f9db1]">
                    {new Date(entry.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="py-3 text-sm text-white">
                    {entry.description}
                  </td>
                  <td className="py-3 text-sm text-[#8f9db1]">
                    {entry.client_name || "—"}
                  </td>
                  <td className="py-3 text-sm text-white font-medium">
                    {getCurrencySymbol(entry.currency)}
                    {entry.amount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        entry.type === "invoice_payment"
                          ? "bg-[#0c2e26] text-[#57c9b0]"
                          : "bg-[#1e3a5f] text-[#60a5fa]"
                      }`}
                    >
                      {entry.type === "invoice_payment" ? "Invoice" : "Manual"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#2a303c]">
            <p className="text-sm text-[#8f9db1]">
              Showing page {page} of {pagination.totalPages} (
              {pagination.total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-[#2a303c] rounded-lg disabled:opacity-50 text-white hover:border-[#6ea8ff]"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!pagination.hasMore}
                className="px-3 py-1 text-sm border border-[#2a303c] rounded-lg disabled:opacity-50 text-white hover:border-[#6ea8ff]"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tax Export */}
      <div className="bg-[#1c202a] border border-[#2a303c] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Tax Export</h2>
        <p className="text-sm text-[#8f9db1] mb-4">
          Export your {selectedYear} income data for tax filing
        </p>

        <div className="bg-[#14171d] border border-[#2a303c] rounded-lg p-4 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#8f9db1] mb-1">Total Income</p>
              <p className="text-lg font-bold text-white">
                {getCurrencySymbol(currency)}
                {totalEarned.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#8f9db1] mb-1">Clients</p>
              <p className="text-lg font-bold text-white">
                {byClient.length}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => handleExport("pdf")}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#6ea8ff] text-[#0e1116] font-medium rounded-lg hover:bg-[#5b93e6] transition-colors"
          >
            <Download size={18} />
            Export PDF
          </button>
          <button
            onClick={() => handleExport("csv")}
            className="flex-1 flex items-center justify-center gap-2 py-3 border border-[#2a303c] text-white font-medium rounded-lg hover:border-[#6ea8ff] transition-colors"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>

        <p className="text-xs text-[#8f9db1] mt-4">
          Paidly provides income data only. Consult a tax professional for
          filing guidance.
        </p>
      </div>
    </div>
  );
}
