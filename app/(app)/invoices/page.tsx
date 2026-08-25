"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  FileText,
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
  draft: "bg-[#26262e] text-[#a1a1aa]",
  sending: "bg-[#26262e] text-[#a1a1aa]",
  sent: "bg-[#1e3a5f] text-[#60a5fa]",
  viewed: "bg-[#3d2e00] text-[#e6b566]",
  paid: "bg-[#0c2e26] text-[#57c9b0]",
  overdue: "bg-[#3d0a0a] text-[#ef4444]",
  cancelled: "bg-[#26262e] text-[#6b7280]",
};

const statusTabs = [
  { label: "All", value: "" },
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
  { label: "Viewed", value: "viewed" },
  { label: "Paid", value: "paid" },
  { label: "Overdue", value: "overdue" },
];

function InvoiceStatusBadge({ status }: { status: string }) {
  if (status === "sending") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full ${statusColors.sending}`}
      >
        <Loader2 size={12} className="animate-spin" />
        Sending...
      </span>
    );
  }

  return (
    <span
      className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
        statusColors[status] || "bg-[#26262e] text-[#a1a1aa]"
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [pagination, setPagination] = useState<{
    totalPages: number;
    total: number;
    hasMore: boolean;
  } | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (statusFilter) params.set("status", statusFilter);
      if (searchQuery) params.set("search", searchQuery);

      const response = await fetch(`/api/invoices?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch invoices");
      }

      setInvoices(data.invoices || []);
      setPagination(data.pagination || null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, pageSize, statusFilter, searchQuery]);

  // Client name filter on current page (invoice # is filtered server-side)
  const filteredInvoices = useMemo(() => {
    if (!searchQuery) return invoices;

    const query = searchQuery.toLowerCase();
    return invoices.filter((inv) =>
      inv.clients?.name?.toLowerCase().includes(query),
    );
  }, [invoices, searchQuery]);

  const stats = useMemo(() => {
    const total = pagination?.total ?? invoices.length;
    const paid = invoices.filter((i) => i.status === "paid");
    const totalPaid = paid.reduce((sum, i) => sum + Number(i.total), 0);
    const outstanding = invoices.filter(
      (i) =>
        i.status === "sent" || i.status === "overdue" || i.status === "viewed",
    ).length;

    return { total, totalPaid, outstanding };
  }, [invoices, pagination]);

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
      fetchInvoices();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(null);
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
      fetchInvoices();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(null);
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
          className="inline-flex items-center gap-2 px-5 py-3 bg-[#2563eb] text-[#ffffff] font-medium rounded-lg hover:bg-[#1d4ed8] transition-colors"
        >
          <Plus size={18} />
          New Invoice
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#141419] border border-[#26262e] rounded-xl p-4">
          <p className="text-sm text-[#a1a1aa] mb-1">Total</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-[#141419] border border-[#26262e] rounded-xl p-4">
          <p className="text-sm text-[#a1a1aa] mb-1">Total Paid</p>
          <p className="text-2xl font-bold text-[#3b82f6]">
            {stats.totalPaid > 0 ? `$${stats.totalPaid.toLocaleString()}` : "—"}
          </p>
        </div>
        <div className="bg-[#141419] border border-[#26262e] rounded-xl p-4">
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
                setPage(1);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === tab.value
                  ? "bg-[#2563eb] text-[#ffffff]"
                  : "bg-[#141419] text-[#a1a1aa] hover:text-white border border-[#26262e]"
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
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-[#141419] border border-[#26262e] rounded-lg text-white placeholder-[#52525b] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-colors"
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
              className="bg-[#141419] border border-[#26262e] rounded-xl p-4 animate-pulse"
            >
              <div className="flex justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-[#26262e] rounded w-24" />
                  <div className="h-3 bg-[#26262e] rounded w-32" />
                </div>
                <div className="h-6 bg-[#26262e] rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredInvoices.length === 0 ? (
        /* Empty State */
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#141419] border border-[#26262e] rounded-full mb-6">
            <FileText size={40} className="text-[#26262e]" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No invoices yet
          </h3>
          <p className="text-[#a1a1aa] mb-6">
            Create your first invoice to get started
          </p>
          <Link
            href="/invoices/new"
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#2563eb] text-[#ffffff] font-medium rounded-lg hover:bg-[#1d4ed8] transition-colors"
          >
            <Plus size={18} />
            Create Invoice
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-[#141419] border border-[#26262e] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-[#26262e]">
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
                {filteredInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-[#26262e] last:border-0 hover:bg-[#0d0d10] transition-colors"
                  >
                    <td className="py-4 px-6">
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="text-[#3b82f6] hover:underline font-medium"
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
                      <InvoiceStatusBadge status={invoice.status} />
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
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="p-2 hover:bg-[#26262e] rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye size={16} className="text-[#a1a1aa]" />
                        </Link>

                        {invoice.status === "draft" && (
                          <Link
                            href={`/invoices/${invoice.id}/edit`}
                            className="p-2 hover:bg-[#26262e] rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} className="text-[#a1a1aa]" />
                          </Link>
                        )}

                        {(invoice.status === "sent" ||
                          invoice.status === "viewed" ||
                          invoice.status === "overdue") && (
                          <button
                            onClick={() => handleMarkAsPaid(invoice.id)}
                            disabled={updating === invoice.id}
                            className="p-2 hover:bg-[#26262e] rounded-lg transition-colors disabled:opacity-50"
                            title="Mark as paid"
                          >
                            {updating === invoice.id ? (
                              <Loader2
                                size={16}
                                className="text-[#a1a1aa] animate-spin"
                              />
                            ) : (
                              <CheckCircle size={16} className="text-[#3b82f6]" />
                            )}
                          </button>
                        )}

                        <button
                          onClick={() =>
                            window.open(
                              `/api/invoices/${invoice.id}/generate-pdf`,
                              "_blank",
                            )
                          }
                          className="p-2 hover:bg-[#26262e] rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <Download size={16} className="text-[#a1a1aa]" />
                        </button>

                        {invoice.status === "draft" && (
                          <button
                            onClick={() => handleDelete(invoice.id)}
                            disabled={updating === invoice.id}
                            className="p-2 hover:bg-[#ef4444]/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 size={16} className="text-[#ef4444]" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="bg-[#141419] border border-[#26262e] rounded-xl p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <Link
                    href={`/invoices/${invoice.id}`}
                    className="text-[#3b82f6] hover:underline font-medium"
                  >
                    {invoice.invoice_number}
                  </Link>
                  <InvoiceStatusBadge status={invoice.status} />
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

                <div className="flex gap-2 mt-4 pt-4 border-t border-[#26262e]">
                  <Link
                    href={`/invoices/${invoice.id}`}
                    className="flex-1 py-2 text-center text-sm text-[#a1a1aa] hover:text-white border border-[#26262e] rounded-lg transition-colors"
                  >
                    View
                  </Link>
                  {(invoice.status === "sent" ||
                    invoice.status === "viewed" ||
                    invoice.status === "overdue") && (
                    <button
                      onClick={() => handleMarkAsPaid(invoice.id)}
                      disabled={updating === invoice.id}
                      className="flex-1 py-2 text-center text-sm text-[#3b82f6] hover:text-white border border-[#26262e] rounded-lg transition-colors disabled:opacity-50"
                    >
                      {updating === invoice.id ? "Updating..." : "Mark Paid"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#26262e] px-4 py-3 mt-6 rounded-xl bg-[#141419]">
              <p className="text-sm text-[#a1a1aa]">
                Showing page {page} of {pagination.totalPages} (
                {pagination.total} total)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-md text-sm bg-[#141419] border border-[#26262e] hover:border-[#3b82f6] disabled:opacity-40 disabled:cursor-not-allowed text-white"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasMore}
                  className="px-3 py-1.5 rounded-md text-sm bg-[#141419] border border-[#26262e] hover:border-[#3b82f6] disabled:opacity-40 disabled:cursor-not-allowed text-white"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
