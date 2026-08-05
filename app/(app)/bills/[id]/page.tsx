"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface BillItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  sort_order: number;
}

interface Bill {
  id: string;
  bill_number: string;
  status: string;
  currency: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  category: string | null;
  issue_date: string;
  due_date: string | null;
  paid_at: string | null;
  notes: string | null;
  vendors: {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  } | null;
  bill_items: BillItem[];
}

const statusColors: Record<string, string> = {
  unpaid: "bg-[#3d2e00] text-[#e6b566]",
  paid: "bg-[#0c2e26] text-[#57c9b0]",
  cancelled: "bg-[#2a303c] text-[#6b7280]",
};

const getCurrencySymbol = (code: string) =>
  ({
    USD: "$",
    GBP: "£",
    EUR: "€",
    NGN: "₦",
    GHS: "GH₵",
    KES: "KSh",
    ZAR: "R",
  })[code] || code + " ";

export default function BillDetailPage() {
  const params = useParams();
  const router = useRouter();
  const billId = params.id as string;
  const { toast } = useToast();

  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const fetchBill = useCallback(async () => {
    try {
      const res = await fetch(`/api/bills/${billId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load bill");
      setBill(data.bill);
    } catch {
      setBill(null);
    } finally {
      setLoading(false);
    }
  }, [billId]);

  useEffect(() => {
    fetchBill();
  }, [fetchBill]);

  const handleMarkPaid = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/bills/${billId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update bill");
      }
      toast.success("Bill marked as paid");
      fetchBill();
    } catch (err: unknown) {
      toast.error(
        "Failed",
        err instanceof Error ? err.message : "Could not update bill",
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/bills/${billId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete bill");
      }
      toast.success("Bill deleted");
      router.push("/bills");
    } catch (err: unknown) {
      toast.error(
        "Failed",
        err instanceof Error ? err.message : "Could not delete bill",
      );
      setUpdating(false);
      setShowDelete(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center py-20">
        <Loader2 size={28} className="text-[#6ea8ff] animate-spin" />
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <p className="text-[#ef4444] text-lg mb-6">Bill not found</p>
        <Link
          href="/bills"
          className="inline-flex items-center gap-2 px-5 py-3 bg-[#6ea8ff] text-[#0e1116] font-medium rounded-lg hover:bg-[#5b93e6] transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Bills
        </Link>
      </div>
    );
  }

  const symbol = getCurrencySymbol(bill.currency);
  const items = [...(bill.bill_items || [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/bills"
            className="p-2 hover:bg-[#1c202a] rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-[#8f9db1]" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {bill.bill_number}
            </h1>
            <span
              className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${
                statusColors[bill.status] || "bg-[#2a303c] text-[#8f9db1]"
              }`}
            >
              {bill.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {bill.status === "unpaid" && (
            <button
              onClick={handleMarkPaid}
              disabled={updating}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#6ea8ff] text-[#0e1116] font-medium rounded-lg hover:bg-[#5b93e6] transition-colors disabled:opacity-50"
            >
              {updating ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <CheckCircle size={18} />
              )}
              Mark as Paid
            </button>
          )}
          {bill.status !== "paid" && (
            <button
              onClick={() => setShowDelete(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#ef4444]/30 text-[#ef4444] font-medium rounded-lg hover:bg-[#ef4444]/10 transition-colors"
            >
              <Trash2 size={18} />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Document */}
      <div className="bg-[#1c202a] border border-[#2a303c] rounded-xl p-8">
        {/* Vendor + meta */}
        <div className="flex justify-between flex-wrap gap-6 mb-8">
          <div>
            <p className="text-xs uppercase text-[#8f9db1] mb-1">Bill from</p>
            <p className="text-white font-semibold">
              {bill.vendors?.name || "—"}
            </p>
            {bill.vendors?.email && (
              <p className="text-sm text-[#8f9db1]">{bill.vendors.email}</p>
            )}
            {bill.vendors?.address && (
              <p className="text-sm text-[#8f9db1]">{bill.vendors.address}</p>
            )}
          </div>
          <div className="text-right">
            {bill.category && (
              <p className="text-sm text-[#8f9db1]">
                Category: <span className="text-white">{bill.category}</span>
              </p>
            )}
            <p className="text-sm text-[#8f9db1]">
              Issued: {new Date(bill.issue_date).toLocaleDateString()}
            </p>
            {bill.due_date && (
              <p className="text-sm text-[#8f9db1]">
                Due: {new Date(bill.due_date).toLocaleDateString()}
              </p>
            )}
            {bill.paid_at && (
              <p className="text-sm text-[#6ea8ff]">
                Paid: {new Date(bill.paid_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Items */}
        <table className="w-full mb-6">
          <thead>
            <tr className="border-b border-[#2a303c] text-left">
              <th className="py-2 text-xs font-medium text-[#8f9db1] uppercase">
                Description
              </th>
              <th className="py-2 text-xs font-medium text-[#8f9db1] uppercase text-right">
                Qty
              </th>
              <th className="py-2 text-xs font-medium text-[#8f9db1] uppercase text-right">
                Rate
              </th>
              <th className="py-2 text-xs font-medium text-[#8f9db1] uppercase text-right">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-[#2a303c]">
                <td className="py-3 text-sm text-white">{item.description}</td>
                <td className="py-3 text-sm text-[#8f9db1] text-right">
                  {Number(item.quantity)}
                </td>
                <td className="py-3 text-sm text-[#8f9db1] text-right">
                  {symbol}
                  {Number(item.rate).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td className="py-3 text-sm text-white text-right">
                  {symbol}
                  {Number(item.amount).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-sm text-[#8f9db1]">
              <span>Subtotal</span>
              <span>
                {symbol}
                {Number(bill.subtotal).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between text-sm text-[#8f9db1]">
              <span>Tax ({Number(bill.tax_rate)}%)</span>
              <span>
                {symbol}
                {Number(bill.tax_amount).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold text-white border-t border-[#2a303c] pt-2">
              <span>Total</span>
              <span>
                {symbol}
                {Number(bill.total).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        {bill.notes && (
          <div className="mt-8 pt-6 border-t border-[#2a303c]">
            <p className="text-xs uppercase text-[#8f9db1] mb-1">Notes</p>
            <p className="text-sm text-white whitespace-pre-wrap">
              {bill.notes}
            </p>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showDelete}
        title="Delete bill"
        message="This will permanently remove this bill. This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={updating}
        onConfirm={handleDelete}
        onClose={() => setShowDelete(false)}
      />
    </div>
  );
}
