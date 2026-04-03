"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  FileText,
  MoreVertical,
  Eye,
  Edit,
  CheckCircle,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
} from "lucide-react";

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  total: number;
  currency: string;
  due_date: string;
  paid_at: string | null;
  created_at: string;
  clients: {
    name: string;
    email: string;
  } | null;
}

const statusColors: Record<string, string> = {
  draft: "bg-[#27272a] text-[#a1a1aa]",
  sent: "bg-[#1e3a5f] text-[#60a5fa]",
  viewed: "bg-[#3d2e00] text-[#fbbf24]",
  paid: "bg-[#052e16] text-[#10b981]",
  overdue: "bg-[#3d0a0a] text-[#ef4444]",
  cancelled: "bg-[#27272a] text-[#6b7280]",
};

const statusTabs = [
  { label: "All", value: "" },
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
  { label: "Viewed", value: "viewed" },
  { label: "Paid", value: "paid" },
  { label: "Overdue", value: "overdue" },
];

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const itemsPerPage = 20;

  const fetchInvoices = async (status?: string) => {
    setLoading(true);
    setError(null);

    try {
      const url = status ? `/api/invoices?status=${status}` : "/api/invoices";
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch invoices");
      }

      setInvoices(data.invoices || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices(statusFilter);
  }, [statusFilter]);

  // Filter by search query
  const filteredInvoices = useMemo(() => {
    if (!searchQuery) return invoices;

    const query = searchQuery.toLowerCase();
    return invoices.filter(
      (inv) =>
        inv.invoice_number.toLowerCase().includes(query) ||
        inv.clients?.name.toLowerCase().includes(query),
    );
  }, [invoices, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Summary stats
  const stats = useMemo(() => {
    const total = invoices.length;
    const paid = invoices.filter((i) => i.status === "paid");
    const totalPaid = paid.reduce((sum, i) => sum + Number(i.total), 0);
    const outstanding = invoices.filter(
      (i) =>
        i.status === "sent" || i.status === "overdue" || i.status === "viewed",
    ).length;

    return { total, totalPaid, outstanding };
  }, [invoices]);

  const handleMarkAsPaid = async (invoiceId: string) => {
    setUpdating(invoiceId);

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/mark-paid`, {
        method: "PATCH",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to mark as paid");
      }

      // Refresh invoices
      fetchInvoices(statusFilter);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(null);
      setActionMenuOpen(null);
    }
  };

  const handleDelete = async (invoiceId: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;

    setUpdating(invoiceId);

    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete invoice");
      }

      // Refresh invoices
      fetchInvoices(statusFilter);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(null);
      setActionMenuOpen(null);
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
    return symbols[currency] || "$";
  };

  const isOverdue = (invoice: Invoice) => {
    if (invoice.status === "paid" || invoice.status === "cancelled")
      return false;
    return new Date(invoice.due_date) < new Date();
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold text-white">Invoices</h1>
        <Link
          href="/invoices/new"
          className="inline-flex items-center gap-2 px-5 py-3 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors"
        >
          <Plus size={18} />
          New Invoice
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4">
          <p className="text-sm text-[#a1a1aa] mb-1">Total</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4">
          <p className="text-sm text-[#a1a1aa] mb-1">Total Paid</p>
          <p className="text-2xl font-bold text-[#10b981]">
            {stats.totalPaid > 0 ? `$${stats.totalPaid.toLocaleString()}` : "—"}
          </p>
        </div>
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4">
          <p className="text-sm text-[#a1a1aa] mb-1">Outstanding</p>
          <p className="text-2xl font-bold text-white">
            {stats.outstanding > 0 ? stats.outstanding : "—"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Status Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatusFilter(tab.value);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === tab.value
                  ? "bg-[#10b981] text-white"
                  : "bg-[#18181b] text-[#a1a1aa] hover:text-white border border-[#27272a]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa]"
          />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-[#18181b] border border-[#27272a] rounded-lg text-white placeholder-[#52525b] focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg mb-6">
          <p className="text-sm text-[#ef4444]">{error}</p>
        </div>
      )}

      {/* Content */}
      {loading ? (
        /* Loading Skeleton */
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 animate-pulse"
            >
              <div className="flex justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-[#27272a] rounded w-24" />
                  <div className="h-3 bg-[#27272a] rounded w-32" />
                </div>
                <div className="h-6 bg-[#27272a] rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredInvoices.length === 0 ? (
        /* Empty State */
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#18181b] border border-[#27272a] rounded-full mb-6">
            <FileText size={40} className="text-[#27272a]" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No invoices yet
          </h3>
          <p className="text-[#a1a1aa] mb-6">
            Create your first invoice to get started
          </p>
          <Link
            href="/invoices/new"
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors"
          >
            <Plus size={18} />
            Create Invoice
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-[#27272a]">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-medium text-[#a1a1aa]">
                    Invoice
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-[#a1a1aa]">
                    Client
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-[#a1a1aa]">
                    Amount
                  </th>
                  <th className="text-center py-4 px-6 text-sm font-medium text-[#a1a1aa]">
                    Status
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-[#a1a1aa]">
                    Due Date
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-[#a1a1aa]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-[#27272a] last:border-0 hover:bg-[#111111] transition-colors"
                  >
                    <td className="py-4 px-6">
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="text-[#10b981] hover:underline font-medium"
                      >
                        {invoice.invoice_number}
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-white">
                      {invoice.clients?.name || "—"}
                    </td>
                    <td className="py-4 px-6 text-right text-white font-medium">
                      {getCurrencySymbol(invoice.currency)}
                      {Number(invoice.total).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                          statusColors[invoice.status] ||
                          "bg-[#27272a] text-[#a1a1aa]"
                        }`}
                      >
                        {invoice.status.charAt(0).toUpperCase() +
                          invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={
                          isOverdue(invoice)
                            ? "text-[#ef4444] font-medium"
                            : "text-[#a1a1aa]"
                        }
                      >
                        {new Date(invoice.due_date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right relative">
                      <button
                        onClick={() =>
                          setActionMenuOpen(
                            actionMenuOpen === invoice.id ? null : invoice.id,
                          )
                        }
                        className="p-2 hover:bg-[#27272a] rounded-lg transition-colors"
                      >
                        <MoreVertical size={18} className="text-[#a1a1aa]" />
                      </button>

                      {actionMenuOpen === invoice.id && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-[#18181b] border border-[#27272a] rounded-lg shadow-xl z-10">
                          <div className="py-1">
                            <Link
                              href={`/invoices/${invoice.id}`}
                              className="flex items-center gap-3 px-4 py-2 text-sm text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-colors"
                              onClick={() => setActionMenuOpen(null)}
                            >
                              <Eye size={16} />
                              View
                            </Link>

                            {invoice.status === "draft" && (
                              <Link
                                href={`/invoices/${invoice.id}/edit`}
                                className="flex items-center gap-3 px-4 py-2 text-sm text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-colors"
                                onClick={() => setActionMenuOpen(null)}
                              >
                                <Edit size={16} />
                                Edit
                              </Link>
                            )}

                            {(invoice.status === "sent" ||
                              invoice.status === "viewed" ||
                              invoice.status === "overdue") && (
                              <button
                                onClick={() => handleMarkAsPaid(invoice.id)}
                                disabled={updating === invoice.id}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-colors disabled:opacity-50"
                              >
                                {updating === invoice.id ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <CheckCircle size={16} />
                                )}
                                Mark as Paid
                              </button>
                            )}

                            <button
                              className="flex items-center gap-3 px-4 py-2 text-sm text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-colors"
                              onClick={() => setActionMenuOpen(null)}
                            >
                              <Download size={16} />
                              Download PDF
                            </button>

                            {invoice.status === "draft" && (
                              <button
                                onClick={() => handleDelete(invoice.id)}
                                disabled={updating === invoice.id}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#ef4444] hover:bg-[#27272a] transition-colors disabled:opacity-50"
                              >
                                <Trash2 size={16} />
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {paginatedInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="bg-[#18181b] border border-[#27272a] rounded-xl p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <Link
                    href={`/invoices/${invoice.id}`}
                    className="text-[#10b981] hover:underline font-medium"
                  >
                    {invoice.invoice_number}
                  </Link>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      statusColors[invoice.status] ||
                      "bg-[#27272a] text-[#a1a1aa]"
                    }`}
                  >
                    {invoice.status.charAt(0).toUpperCase() +
                      invoice.status.slice(1)}
                  </span>
                </div>

                <p className="text-white mb-2">{invoice.clients?.name}</p>

                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">
                    {getCurrencySymbol(invoice.currency)}
                    {Number(invoice.total).toLocaleString()}
                  </span>
                  <span
                    className={
                      isOverdue(invoice)
                        ? "text-[#ef4444] text-sm"
                        : "text-[#a1a1aa] text-sm"
                    }
                  >
                    Due: {new Date(invoice.due_date).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-[#27272a]">
                  <Link
                    href={`/invoices/${invoice.id}`}
                    className="flex-1 py-2 text-center text-sm text-[#a1a1aa] hover:text-white border border-[#27272a] rounded-lg transition-colors"
                  >
                    View
                  </Link>
                  {(invoice.status === "sent" ||
                    invoice.status === "viewed" ||
                    invoice.status === "overdue") && (
                    <button
                      onClick={() => handleMarkAsPaid(invoice.id)}
                      disabled={updating === invoice.id}
                      className="flex-1 py-2 text-center text-sm text-[#10b981] hover:text-white border border-[#27272a] rounded-lg transition-colors disabled:opacity-50"
                    >
                      {updating === invoice.id ? "Updating..." : "Mark Paid"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-[#a1a1aa]">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredInvoices.length)}{" "}
                of {filteredInvoices.length}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-[#18181b] border border-[#27272a] rounded-lg text-white hover:border-[#10b981] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-[#18181b] border border-[#27272a] rounded-lg text-white hover:border-[#10b981] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
