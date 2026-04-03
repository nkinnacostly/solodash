"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, Plus, Loader2, Trash2, Eye } from "lucide-react";
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
  clients: {
    name: string;
    email: string;
  } | null;
}

const statusColors: Record<string, string> = {
  draft: "bg-[#27272a] text-[#a1a1aa]",
  sent: "bg-[#1e3a5f] text-[#60a5fa]",
  signed: "bg-[#052e16] text-[#10b981]",
  active: "bg-[#052e16] text-[#10b981]",
  completed: "bg-[#27272a] text-[#6b7280]",
};

const typeColors: Record<string, string> = {
  hourly: "bg-[#1e3a5f] text-[#60a5fa]",
  project: "bg-[#3b0764] text-[#a78bfa]",
  retainer: "bg-[#3d2e00] text-[#fbbf24]",
};

export default function ContractsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const response = await fetch("/api/contracts");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch contracts");
      }

      setContracts(data.contracts || []);
    } catch (err: any) {
      toast.error("Failed to load contracts", err.message);
    } finally {
      setLoading(false);
    }
  };

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

  const filteredContracts =
    filter === "all" ? contracts : contracts.filter((c) => c.status === filter);

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
          <div className="h-10 bg-[#18181b] rounded w-48" />
          <div className="h-12 bg-[#18181b] rounded" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-[#18181b] rounded" />
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
          <p className="text-[#a1a1aa] mt-1">
            Create and manage client contracts
          </p>
        </div>
        <Link
          href="/contracts/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors"
        >
          <Plus size={18} />
          New Contract
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-2 mb-6 flex gap-2 overflow-x-auto">
        {["all", "draft", "sent", "signed", "active", "completed"].map(
          (status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                filter === status
                  ? "bg-[#10b981] text-white"
                  : "text-[#a1a1aa] hover:text-white hover:bg-[#27272a]"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status === "all" && ` (${contracts.length})`}
            </button>
          ),
        )}
      </div>

      {/* Contracts List */}
      {filteredContracts.length === 0 ? (
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-12 text-center">
          <FileText size={48} className="text-[#27272a] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            No contracts yet
          </h3>
          <p className="text-[#a1a1aa] mb-6">
            {filter === "all"
              ? "Create your first contract to get started"
              : `No ${filter} contracts found`}
          </p>
          {filter === "all" && (
            <Link
              href="/contracts/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors"
            >
              <Plus size={18} />
              Create Contract
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-[#27272a]">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#a1a1aa]">
                    Contract
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#a1a1aa]">
                    Client
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#a1a1aa]">
                    Type
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#a1a1aa]">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#a1a1aa]">
                    Value
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#a1a1aa]">
                    Date
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[#a1a1aa]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {filteredContracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-[#111111]">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-white">
                        {contract.title}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-[#a1a1aa]">
                        {contract.clients?.name || "N/A"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${typeColors[contract.type] || "bg-[#27272a] text-[#a1a1aa]"}`}
                      >
                        {contract.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${statusColors[contract.status] || "bg-[#27272a] text-[#a1a1aa]"}`}
                      >
                        {contract.status}
                      </span>
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
                      <p className="text-sm text-[#a1a1aa]">
                        {formatDate(contract.created_at)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            router.push(`/contracts/${contract.id}`)
                          }
                          className="p-2 hover:bg-[#27272a] rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye size={16} className="text-[#a1a1aa]" />
                        </button>
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
            {filteredContracts.map((contract) => (
              <div
                key={contract.id}
                className="bg-[#18181b] border border-[#27272a] rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white mb-1">
                      {contract.title}
                    </h3>
                    <p className="text-xs text-[#a1a1aa]">
                      {contract.clients?.name || "No client"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${typeColors[contract.type]}`}
                    >
                      {contract.type}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${statusColors[contract.status]}`}
                    >
                      {contract.status}
                    </span>
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
                      className="text-xs text-[#10b981] hover:underline"
                    >
                      View
                    </button>
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
