"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Loader2, Receipt, Eye, Trash2, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface Bill {
  id: string;
  bill_number: string;
  status: string;
  total: number;
  currency: string;
  category: string | null;
  issue_date: string;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
  vendors: { name: string; email: string } | null;
}

const statusColors: Record<string, string> = {
  unpaid: "bg-[#3d2e00] text-[#e6b566]",
  paid: "bg-[#0c2e26] text-[#57c9b0]",
  cancelled: "bg-[#2a303c] text-[#6b7280]",
};

const tabs = [
  { key: "all", label: "All" },
  { key: "unpaid", label: "Unpaid" },
  { key: "paid", label: "Paid" },
];

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
  return symbols[currency] || currency + " ";
};

export default function BillsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== "all") params.set("status", activeTab);
      const res = await fetch(`/api/bills?${params.toString()}`);
      const data = await res.json();
      if (res.ok) setBills(data.bills || []);
    } catch {
      // inline empty state handles the rest
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const handleMarkPaid = async (id: string) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/bills/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update bill");
      }
      toast.success("Bill marked as paid");
      fetchBills();
    } catch (err: unknown) {
      toast.error(
        "Failed",
        err instanceof Error ? err.message : "Could not update bill",
      );
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const id = deleteId;
    setUpdating(id);
    try {
      const res = await fetch(`/api/bills/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete bill");
      }
      toast.success("Bill deleted");
      fetchBills();
    } catch (err: unknown) {
      toast.error(
        "Failed",
        err instanceof Error ? err.message : "Could not delete bill",
      );
    } finally {
      setUpdating(null);
      setDeleteId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Bills</h1>
          <p className="text-[#8f9db1] mt-1">
            Track what you owe vendors and contractors.
          </p>
        </div>
        <Link
          href="/bills/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#6ea8ff] text-[#0e1116] font-medium rounded-lg hover:bg-[#5b93e6] transition-colors"
        >
          <Plus size={18} />
          New Bill
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-[#6ea8ff] text-[#0e1116]"
                : "bg-[#1c202a] text-[#8f9db1] hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="text-[#6ea8ff] animate-spin" />
        </div>
      ) : bills.length === 0 ? (
        <div className="text-center py-20 bg-[#1c202a] border border-[#2a303c] rounded-xl">
          <Receipt size={40} className="text-[#8f9db1] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-1">
            No bills yet
          </h3>
          <p className="text-[#8f9db1] mb-6">
            Record what you owe a vendor or contractor to start tracking.
          </p>
          <Link
            href="/bills/new"
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#6ea8ff] text-[#0e1116] font-medium rounded-lg hover:bg-[#5b93e6] transition-colors"
          >
            <Plus size={18} />
            New Bill
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-[#1c202a] border border-[#2a303c] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2a303c] text-left">
                  <th className="px-6 py-4 text-xs font-medium text-[#8f9db1] uppercase">
                    Bill
                  </th>
                  <th className="px-6 py-4 text-xs font-medium text-[#8f9db1] uppercase">
                    Vendor
                  </th>
                  <th className="px-6 py-4 text-xs font-medium text-[#8f9db1] uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-medium text-[#8f9db1] uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-xs font-medium text-[#8f9db1] uppercase">
                    Due
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-[#8f9db1] uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr
                    key={bill.id}
                    className="border-b border-[#2a303c] last:border-0"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/bills/${bill.id}`}
                        className="text-[#6ea8ff] hover:underline font-medium"
                      >
                        {bill.bill_number}
                      </Link>
                      {bill.category && (
                        <p className="text-xs text-[#8f9db1] mt-0.5">
                          {bill.category}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-white">
                      {bill.vendors?.name || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          statusColors[bill.status] ||
                          "bg-[#2a303c] text-[#8f9db1]"
                        }`}
                      >
                        {bill.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white font-medium">
                      {getCurrencySymbol(bill.currency)}
                      {Number(bill.total).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#8f9db1]">
                      {bill.due_date
                        ? new Date(bill.due_date).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/bills/${bill.id}`}
                          className="p-2 hover:bg-[#2a303c] rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye size={16} className="text-[#8f9db1]" />
                        </Link>
                        {bill.status === "unpaid" && (
                          <button
                            onClick={() => handleMarkPaid(bill.id)}
                            disabled={updating === bill.id}
                            className="p-2 hover:bg-[#2a303c] rounded-lg transition-colors disabled:opacity-50"
                            title="Mark as paid"
                          >
                            {updating === bill.id ? (
                              <Loader2
                                size={16}
                                className="text-[#8f9db1] animate-spin"
                              />
                            ) : (
                              <CheckCircle size={16} className="text-[#6ea8ff]" />
                            )}
                          </button>
                        )}
                        {bill.status !== "paid" && (
                          <button
                            onClick={() => setDeleteId(bill.id)}
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

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {bills.map((bill) => (
              <div
                key={bill.id}
                className="bg-[#1c202a] border border-[#2a303c] rounded-xl p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <Link
                    href={`/bills/${bill.id}`}
                    className="text-[#6ea8ff] hover:underline font-medium"
                  >
                    {bill.bill_number}
                  </Link>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      statusColors[bill.status] ||
                      "bg-[#2a303c] text-[#8f9db1]"
                    }`}
                  >
                    {bill.status}
                  </span>
                </div>
                <p className="text-white mb-2">{bill.vendors?.name || "—"}</p>
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">
                    {getCurrencySymbol(bill.currency)}
                    {Number(bill.total).toLocaleString()}
                  </span>
                  <span className="text-[#8f9db1] text-sm">
                    {bill.due_date
                      ? `Due: ${new Date(bill.due_date).toLocaleDateString()}`
                      : "No due date"}
                  </span>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-[#2a303c]">
                  {bill.status === "unpaid" && (
                    <button
                      onClick={() => handleMarkPaid(bill.id)}
                      disabled={updating === bill.id}
                      className="flex-1 py-2 text-center text-sm text-[#6ea8ff] border border-[#2a303c] rounded-lg disabled:opacity-50"
                    >
                      Mark paid
                    </button>
                  )}
                  {bill.status !== "paid" && (
                    <button
                      onClick={() => setDeleteId(bill.id)}
                      className="flex-1 py-2 text-center text-sm text-[#ef4444] border border-[#2a303c] rounded-lg"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={deleteId !== null}
        title="Delete bill"
        message="This will permanently remove this bill. This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={updating !== null}
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
