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

interface EarningsData {
  total: number;
  by_month: { month: number; amount: number }[];
  by_client: {
    client_id: string | null;
    client_name: string;
    count: number;
    total: number;
  }[];
  entries: {
    id: string;
    date: string;
    amount: number;
    currency: string;
    description: string;
    type: string;
    client_name: string | null;
  }[];
  currency: string;
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
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 20;

  const [manualForm, setManualForm] = useState({
    amount: "",
    currency: "USD",
    date: new Date().toISOString().split("T")[0],
    description: "",
    client_id: "",
  });

  useEffect(() => {
    fetchEarnings();
  }, [selectedYear]);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/earnings?year=${selectedYear}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch earnings");
      }

      setEarnings(data);
    } catch (err: any) {
      toast.error("Failed to load earnings", err.message);
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

  const bestMonth = earnings?.by_month.reduce((max, month) =>
    month.amount > max.amount ? month : max,
  );

  const avgPerMonth = earnings ? earnings.total / 12 : 0;

  const paidInvoices =
    earnings?.entries.filter((e) => e.type === "invoice_payment").length || 0;

  const paginatedEntries = earnings?.entries.slice(
    (page - 1) * perPage,
    page * perPage,
  );

  const totalPages = earnings
    ? Math.ceil(earnings.entries.length / perPage)
    : 0;

  const years = [
    new Date().getFullYear(),
    new Date().getFullYear() - 1,
    new Date().getFullYear() - 2,
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-[#18181b] rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-[#18181b] rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-[#18181b] rounded-xl" />
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
          <p className="text-[#a1a1aa] mt-1">
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
            className="appearance-none px-4 py-2 pr-10 bg-[#18181b] border border-[#27272a] rounded-lg text-white focus:border-[#10b981] focus:outline-none cursor-pointer"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1a1aa] pointer-events-none"
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign size={20} className="text-[#10b981]" />
            <p className="text-sm text-[#a1a1aa]">Total Earned</p>
          </div>
          <p className="text-2xl font-bold text-white">
            {getCurrencySymbol(earnings?.currency || "USD")}
            {earnings?.total.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            }) || "0.00"}
          </p>
        </div>

        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={20} className="text-[#10b981]" />
            <p className="text-sm text-[#a1a1aa]">Paid Invoices</p>
          </div>
          <p className="text-2xl font-bold text-white">{paidInvoices}</p>
        </div>

        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar size={20} className="text-[#10b981]" />
            <p className="text-sm text-[#a1a1aa]">Best Month</p>
          </div>
          <p className="text-2xl font-bold text-white">
            {bestMonth && bestMonth.amount > 0
              ? `${months[bestMonth.month - 1]}`
              : "N/A"}
          </p>
        </div>

        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users size={20} className="text-[#10b981]" />
            <p className="text-sm text-[#a1a1aa]">Average/Month</p>
          </div>
          <p className="text-2xl font-bold text-white">
            {getCurrencySymbol(earnings?.currency || "USD")}
            {avgPerMonth.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6">
          Monthly Earnings
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={earnings?.by_month.map((m) => ({
              name: months[m.month - 1],
              amount: m.amount,
            }))}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="name" stroke="#a1a1aa" />
            <YAxis stroke="#a1a1aa" />
            <Tooltip
              formatter={(value: any) => [
                `${getCurrencySymbol(earnings?.currency || "USD")}${value.toLocaleString()}`,
                "Amount",
              ]}
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                borderRadius: "8px",
                color: "#fff",
              }}
            />
            <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Income by Client */}
      {earnings?.by_client.length! > 0 && (
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Income by Client
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[#27272a]">
                <tr>
                  <th className="text-left py-3 text-sm font-medium text-[#a1a1aa]">
                    Client
                  </th>
                  <th className="text-left py-3 text-sm font-medium text-[#a1a1aa]">
                    Invoices
                  </th>
                  <th className="text-left py-3 text-sm font-medium text-[#a1a1aa]">
                    Total
                  </th>
                  <th className="text-left py-3 text-sm font-medium text-[#a1a1aa]">
                    % of Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {earnings?.by_client.map((client, idx) => (
                  <tr key={idx}>
                    <td className="py-3 text-sm text-white">
                      {client.client_name || "Manual Entry"}
                    </td>
                    <td className="py-3 text-sm text-[#a1a1aa]">
                      {client.count}
                    </td>
                    <td className="py-3 text-sm text-white font-medium">
                      {getCurrencySymbol(earnings?.currency || "USD")}
                      {client.total.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-3 text-sm text-[#a1a1aa]">
                      {earnings?.total
                        ? Math.round((client.total / earnings.total) * 100)
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
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Income Log</h2>
          <button
            onClick={() => setShowManualForm(!showManualForm)}
            className="flex items-center gap-2 px-4 py-2 bg-[#10b981] text-white text-sm font-medium rounded-lg hover:bg-[#059669] transition-colors"
          >
            <Plus size={16} />
            Add Income
          </button>
        </div>

        {showManualForm && (
          <form
            onSubmit={handleManualSubmit}
            className="bg-[#0f0f0f] border border-[#27272a] rounded-lg p-4 mb-4 space-y-4"
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
                  className="w-full px-4 py-2 bg-[#18181b] border border-[#27272a] rounded-lg text-white placeholder-[#a1a1aa] focus:border-[#10b981] focus:outline-none"
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
                  className="w-full px-4 py-2 bg-[#18181b] border border-[#27272a] rounded-lg text-white focus:border-[#10b981] focus:outline-none"
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
                  className="w-full px-4 py-2 bg-[#18181b] border border-[#27272a] rounded-lg text-white focus:border-[#10b981] focus:outline-none"
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
                  className="w-full px-4 py-2 bg-[#18181b] border border-[#27272a] rounded-lg text-white placeholder-[#a1a1aa] focus:border-[#10b981] focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={manualLoading}
                className="flex-1 py-2 bg-[#10b981] text-white text-sm font-medium rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
                className="px-4 py-2 border border-[#27272a] text-white text-sm font-medium rounded-lg hover:border-[#10b981] transition-colors flex items-center gap-2"
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-[#27272a]">
              <tr>
                <th className="text-left py-3 text-sm font-medium text-[#a1a1aa]">
                  Date
                </th>
                <th className="text-left py-3 text-sm font-medium text-[#a1a1aa]">
                  Description
                </th>
                <th className="text-left py-3 text-sm font-medium text-[#a1a1aa]">
                  Client
                </th>
                <th className="text-left py-3 text-sm font-medium text-[#a1a1aa]">
                  Amount
                </th>
                <th className="text-left py-3 text-sm font-medium text-[#a1a1aa]">
                  Type
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {paginatedEntries?.map((entry) => (
                <tr key={entry.id}>
                  <td className="py-3 text-sm text-[#a1a1aa]">
                    {new Date(entry.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="py-3 text-sm text-white">
                    {entry.description}
                  </td>
                  <td className="py-3 text-sm text-[#a1a1aa]">
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
                          ? "bg-[#052e16] text-[#10b981]"
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#27272a]">
            <p className="text-sm text-[#a1a1aa]">
              Showing {(page - 1) * perPage + 1}-
              {Math.min(page * perPage, earnings?.entries.length || 0)} of{" "}
              {earnings?.entries.length || 0}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-[#27272a] rounded-lg disabled:opacity-50 text-white hover:border-[#10b981]"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm border border-[#27272a] rounded-lg disabled:opacity-50 text-white hover:border-[#10b981]"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tax Export */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Tax Export</h2>
        <p className="text-sm text-[#a1a1aa] mb-4">
          Export your {selectedYear} income data for tax filing
        </p>

        <div className="bg-[#0f0f0f] border border-[#27272a] rounded-lg p-4 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#a1a1aa] mb-1">Total Income</p>
              <p className="text-lg font-bold text-white">
                {getCurrencySymbol(earnings?.currency || "USD")}
                {earnings?.total.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#a1a1aa] mb-1">Clients</p>
              <p className="text-lg font-bold text-white">
                {earnings?.by_client.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => handleExport("pdf")}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors"
          >
            <Download size={18} />
            Export PDF
          </button>
          <button
            onClick={() => handleExport("csv")}
            className="flex-1 flex items-center justify-center gap-2 py-3 border border-[#27272a] text-white font-medium rounded-lg hover:border-[#10b981] transition-colors"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>

        <p className="text-xs text-[#a1a1aa] mt-4">
          Paidly provides income data only. Consult a tax professional for
          filing guidance.
        </p>
      </div>
    </div>
  );
}
