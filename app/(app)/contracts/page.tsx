"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, Plus, Loader2, Trash2, Eye, Edit } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";

interface Contract {
  id: string;
  title: string;
  type: string;
  status: string;
  value: number;
  currency: string;
  created_at: string;
  client_signed_at: string | null;
  freelancer_signed_at: string | null;
  clients: {
    name: string;
    email: string;
  } | null;
}

// Editable until the client signs — draft, or sent with no signatures yet.
const isEditable = (contract: Contract) =>
  contract.status === "draft" ||
  (contract.status === "sent" &&
    !contract.client_signed_at &&
    !contract.freelancer_signed_at);

const statusColors: Record<string, string> = {
  draft: "bg-[#2a303c] text-[#8f9db1]",
  sending: "bg-[#2a303c] text-[#8f9db1]",
  sent: "bg-[#1e3a5f] text-[#60a5fa]",
  signed: "bg-[#0c2e26] text-[#57c9b0]",
  active: "bg-[#0c2e26] text-[#57c9b0]",
  completed: "bg-[#2a303c] text-[#6b7280]",
};

const typeColors: Record<string, string> = {
  hourly: "bg-[#1e3a5f] text-[#60a5fa]",
  project: "bg-[#3b0764] text-[#a78bfa]",
  retainer: "bg-[#3d2e00] text-[#e6b566]",
};

function ContractStatusBadge({ status }: { status: string }) {
  if (status === "sending") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusColors.sending}`}
      >
        <Loader2 size={12} className="animate-spin" />
        Sending...
      </span>
    );
  }

  return (
    <span
      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
        statusColors[status] || "bg-[#2a303c] text-[#8f9db1]"
      }`}
    >
      {status}
    </span>
  );
}

export default function ContractsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [pagination, setPagination] = useState<{
    totalPages: number;
    total: number;
    hasMore: boolean;
  } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (filter !== "all") params.set("status", filter);

      const response = await fetch(`/api/contracts?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch contracts");
      }

      setContracts(data.contracts || []);
      setPagination(data.pagination || null);
    } catch (err: unknown) {
      toast.error(
        "Failed to load contracts",
        err instanceof Error ? err.message : "Unknown error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [page, pageSize, filter]);

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleteLoading(true);

    try {
      const response = await fetch(`/api/contracts/${deleteId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete contract");
      }

      toast.success("Contract deleted");
      fetchContracts();
    } catch (err: any) {
      toast.error("Failed to delete", err.message);
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-[#1c202a] rounded w-48" />
          <div className="h-12 bg-[#1c202a] rounded" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-[#1c202a] rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Contracts</h1>
          <p className="text-[#8f9db1] mt-1">
            Create and manage client contracts
          </p>
        </div>
        <Link
          href="/contracts/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#6ea8ff] text-[#0e1116] font-medium rounded-lg hover:bg-[#5b93e6] transition-colors"
        >
          <Plus size={18} />
          New Contract
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="bg-[#1c202a] border border-[#2a303c] rounded-xl p-2 mb-6 flex gap-2 overflow-x-auto">
        {["all", "draft", "sent", "signed", "active", "completed"].map(
          (status) => (
            <button
              key={status}
              onClick={() => {
                setFilter(status);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                filter === status
                  ? "bg-[#6ea8ff] text-[#0e1116]"
                  : "text-[#8f9db1] hover:text-white hover:bg-[#2a303c]"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status === "all" &&
                pagination &&
                ` (${pagination.total})`}
            </button>
          ),
        )}
      </div>

      {/* Contracts List */}
      {contracts.length === 0 ? (
        <div className="bg-[#1c202a] border border-[#2a303c] rounded-xl p-12 text-center">
          <FileText size={48} className="text-[#2a303c] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            No contracts yet
          </h3>
          <p className="text-[#8f9db1] mb-6">
            {filter === "all"
              ? "Create your first contract to get started"
              : `No ${filter} contracts found`}
          </p>
          {filter === "all" && (
            <Link
              href="/contracts/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#6ea8ff] text-[#0e1116] font-medium rounded-lg hover:bg-[#5b93e6] transition-colors"
            >
              <Plus size={18} />
              Create Contract
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-[#1c202a] border border-[#2a303c] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-[#2a303c]">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#8f9db1]">
                    Contract
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#8f9db1]">
                    Client
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#8f9db1]">
                    Type
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#8f9db1]">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#8f9db1]">
                    Value
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#8f9db1]">
                    Date
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#8f9db1]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a303c]">
                {contracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-[#171b23]">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-white">
                        {contract.title}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-[#8f9db1]">
                        {contract.clients?.name || "N/A"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${typeColors[contract.type] || "bg-[#2a303c] text-[#8f9db1]"}`}
                      >
                        {contract.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <ContractStatusBadge status={contract.status} />
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-white font-medium">
                        {getCurrencySymbol(contract.currency)}
                        {contract.value.toLocaleString("en-US", {
                          minimumFractionDigits: 0,
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-[#8f9db1]">
                        {formatDate(contract.created_at)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            router.push(`/contracts/${contract.id}`)
                          }
                          className="p-2 hover:bg-[#2a303c] rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye size={16} className="text-[#8f9db1]" />
                        </button>
                        {isEditable(contract) && (
                          <button
                            onClick={() =>
                              router.push(`/contracts/${contract.id}/edit`)
                            }
                            className="p-2 hover:bg-[#2a303c] rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} className="text-[#8f9db1]" />
                          </button>
                        )}
                        {contract.status === "draft" && (
                          <button
                            onClick={() => setDeleteId(contract.id)}
                            className="p-2 hover:bg-[#ef4444]/10 rounded-lg transition-colors"
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
            {contracts.map((contract) => (
              <div
                key={contract.id}
                className="bg-[#1c202a] border border-[#2a303c] rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white mb-1">
                      {contract.title}
                    </h3>
                    <p className="text-xs text-[#8f9db1]">
                      {contract.clients?.name || "No client"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${typeColors[contract.type]}`}
                    >
                      {contract.type}
                    </span>
                    <ContractStatusBadge status={contract.status} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white font-medium">
                    {getCurrencySymbol(contract.currency)}
                    {contract.value.toLocaleString("en-US", {
                      minimumFractionDigits: 0,
                    })}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/contracts/${contract.id}`)}
                      className="text-xs text-[#6ea8ff] hover:underline"
                    >
                      View
                    </button>
                    {isEditable(contract) && (
                      <button
                        onClick={() =>
                          router.push(`/contracts/${contract.id}/edit`)
                        }
                        className="text-xs text-[#8f9db1] hover:underline"
                      >
                        Edit
                      </button>
                    )}
                    {contract.status === "draft" && (
                      <button
                        onClick={() => setDeleteId(contract.id)}
                        className="text-xs text-[#ef4444] hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#2a303c] px-4 py-3 mt-6 rounded-xl bg-[#1c202a]">
              <p className="text-sm text-[#8f9db1]">
                Showing page {page} of {pagination.totalPages} (
                {pagination.total} total)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-md text-sm bg-[#1c202a] border border-[#2a303c] hover:border-[#6ea8ff] disabled:opacity-40 disabled:cursor-not-allowed text-white"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasMore}
                  className="px-3 py-1.5 rounded-md text-sm bg-[#1c202a] border border-[#2a303c] hover:border-[#6ea8ff] disabled:opacity-40 disabled:cursor-not-allowed text-white"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Contract"
        message="Are you sure you want to delete this contract? This action cannot be undone."
        confirmLabel="Delete Contract"
        cancelLabel="Keep It"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
