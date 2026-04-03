"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Send,
  Edit,
  Trash2,
  CheckCircle,
  Bell,
  Link2,
  MessageCircle,
  Download,
  Copy,
} from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  currency: string;
  issue_date: string;
  due_date: string;
  notes: string | null;
  sent_at: string | null;
  viewed_at: string | null;
  paid_at: string | null;
  created_at: string;
  clients: {
    name: string;
    email: string;
    address: string | null;
  } | null;
  invoice_items: {
    id: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
    sort_order: number;
  }[];
}

const statusColors: Record<string, string> = {
  draft: "bg-[#27272a] text-[#a1a1aa]",
  sent: "bg-[#1e3a5f] text-[#60a5fa]",
  viewed: "bg-[#3d2e00] text-[#fbbf24]",
  paid: "bg-[#052e16] text-[#10b981]",
  overdue: "bg-[#3d0a0a] text-[#ef4444]",
  cancelled: "bg-[#27272a] text-[#6b7280]",
};

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchInvoice = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/invoices/${invoiceId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch invoice");
      }

      setInvoice(data.invoice);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

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

  const handleSendInvoice = async () => {
    setUpdating(true);

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invoice");
      }

      fetchInvoice();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkAsPaid = async () => {
    setUpdating(true);

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/mark-paid`, {
        method: "PATCH",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to mark as paid");
      }

      fetchInvoice();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);

    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete invoice");
      }

      router.push("/invoices");
    } catch (err: any) {
      alert(err.message);
      setDeleteLoading(false);
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleCopyPaymentLink = () => {
    const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/pay/${invoiceId}`;
    navigator.clipboard.writeText(paymentLink);
    alert("Payment link copied to clipboard!");
  };

  const handleShareWhatsApp = () => {
    const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/pay/${invoiceId}`;
    const message = `Hi! Here's your invoice ${invoice?.invoice_number}. You can view and pay here: ${paymentLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-[#18181b] rounded w-48" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-[600px] bg-[#18181b] rounded-xl" />
            <div className="h-[600px] bg-[#18181b] rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-20">
          <p className="text-[#ef4444] text-lg">
            {error || "Invoice not found"}
          </p>
          <Link
            href="/invoices"
            className="mt-4 inline-block text-[#10b981] hover:underline"
          >
            ← Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  const currencySymbol = getCurrencySymbol(invoice.currency);
  const isOverdue =
    invoice.status !== "paid" &&
    invoice.status !== "cancelled" &&
    new Date(invoice.due_date) < new Date();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/invoices"
          className="p-2 hover:bg-[#18181b] rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-[#a1a1aa]" />
        </Link>
        <h1 className="text-3xl font-bold text-white">Invoice Details</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Invoice Preview */}
        <div className="lg:col-span-2">
          <div className="relative bg-white text-gray-900 rounded-xl p-8 shadow-2xl">
            {/* Status Badge Overlay */}
            <div className="absolute top-6 right-6">
              <span
                className={`px-4 py-2 text-sm font-bold rounded-full ${
                  statusColors[isOverdue ? "overdue" : invoice.status] ||
                  "bg-[#27272a] text-[#a1a1aa]"
                }`}
              >
                {(isOverdue ? "overdue" : invoice.status)
                  .charAt(0)
                  .toUpperCase() +
                  (isOverdue ? "overdue" : invoice.status).slice(1)}
              </span>
            </div>

            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-3xl font-bold text-[#10b981] mb-1">
                  SoloDash
                </h2>
                <p className="text-sm text-gray-500">Invoice</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{invoice.invoice_number}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Issue Date:{" "}
                  {new Date(invoice.issue_date).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">
                  Due Date: {new Date(invoice.due_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Bill To */}
            <div className="mb-8 pb-6 border-b-2 border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Bill To:
              </p>
              <p className="text-lg font-bold">
                {invoice.clients?.name || "—"}
              </p>
              {invoice.clients?.email && (
                <p className="text-gray-600">{invoice.clients.email}</p>
              )}
              {invoice.clients?.address && (
                <p className="text-gray-600">{invoice.clients.address}</p>
              )}
            </div>

            {/* Line Items Table */}
            <table className="w-full mb-8">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 text-sm font-bold text-gray-700">
                    Description
                  </th>
                  <th className="text-center py-3 text-sm font-bold text-gray-700">
                    Qty
                  </th>
                  <th className="text-right py-3 text-sm font-bold text-gray-700">
                    Rate
                  </th>
                  <th className="text-right py-3 text-sm font-bold text-gray-700">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.invoice_items?.map((item) => (
                  <tr key={item.id} className="border-b border-gray-200">
                    <td className="py-3">{item.description}</td>
                    <td className="py-3 text-center">{item.quantity}</td>
                    <td className="py-3 text-right">
                      {currencySymbol}
                      {Number(item.rate).toFixed(2)}
                    </td>
                    <td className="py-3 text-right font-medium">
                      {currencySymbol}
                      {Number(item.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-72 space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>
                    {currencySymbol}
                    {Number(invoice.subtotal).toFixed(2)}
                  </span>
                </div>
                {invoice.tax_rate > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tax ({invoice.tax_rate}%)</span>
                    <span>
                      {currencySymbol}
                      {Number(invoice.tax_amount).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-2xl font-bold pt-3 border-t-2 border-gray-300">
                  <span>Total</span>
                  <span>
                    {currencySymbol}
                    {Number(invoice.total).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mt-8 pt-6 border-t-2 border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Notes:
                </p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {invoice.notes}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-12 pt-6 border-t-2 border-gray-200 text-center">
              <p className="text-sm font-medium text-gray-700">
                Payment due by {new Date(invoice.due_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Actions Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-6">
            {/* Invoice Info Card */}
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                {invoice.invoice_number}
              </h3>

              <div className="space-y-4 mb-6">
                {/* Status */}
                <div>
                  <p className="text-sm text-[#a1a1aa] mb-1">Status</p>
                  <span
                    className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                      statusColors[isOverdue ? "overdue" : invoice.status] ||
                      "bg-[#27272a] text-[#a1a1aa]"
                    }`}
                  >
                    {(isOverdue ? "overdue" : invoice.status)
                      .charAt(0)
                      .toUpperCase() +
                      (isOverdue ? "overdue" : invoice.status).slice(1)}
                  </span>
                </div>

                {/* Amount Due */}
                <div>
                  <p className="text-sm text-[#a1a1aa] mb-1">
                    {invoice.status === "paid" ? "Amount Paid" : "Amount Due"}
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {currencySymbol}
                    {Number(invoice.total).toLocaleString()}
                  </p>
                </div>

                {/* Client */}
                <div>
                  <p className="text-sm text-[#a1a1aa] mb-1">Client</p>
                  <p className="text-white font-medium">
                    {invoice.clients?.name || "—"}
                  </p>
                  {invoice.clients?.email && (
                    <p className="text-sm text-[#a1a1aa]">
                      {invoice.clients.email}
                    </p>
                  )}
                </div>

                {/* Dates */}
                <div>
                  <p className="text-sm text-[#a1a1aa] mb-1">Due Date</p>
                  <p
                    className={
                      isOverdue ? "text-[#ef4444] font-medium" : "text-white"
                    }
                  >
                    {new Date(invoice.due_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {invoice.status === "draft" && (
                  <>
                    <button
                      onClick={handleSendInvoice}
                      disabled={updating}
                      className="w-full py-3 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {updating ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <>
                          <Send size={18} />
                          Send Invoice
                        </>
                      )}
                    </button>
                    <Link
                      href={`/invoices/${invoice.id}/edit`}
                      className="w-full py-3 border border-[#27272a] text-white font-medium rounded-lg hover:border-[#10b981] transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit size={18} />
                      Edit Invoice
                    </Link>
                    <button
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={updating}
                      className="w-full py-3 border border-[#ef4444]/30 text-[#ef4444] font-medium rounded-lg hover:bg-[#ef4444]/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {updating ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Trash2 size={18} />
                      )}
                      Delete Invoice
                    </button>
                  </>
                )}

                {(invoice.status === "sent" ||
                  invoice.status === "viewed" ||
                  isOverdue) && (
                  <>
                    <button
                      onClick={handleMarkAsPaid}
                      disabled={updating}
                      className="w-full py-3 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {updating ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <>
                          <CheckCircle size={18} />
                          Mark as Paid
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleSendInvoice}
                      disabled={updating}
                      className="w-full py-3 border border-[#27272a] text-white font-medium rounded-lg hover:border-[#10b981] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {updating ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <>
                          <Bell size={18} />
                          Send Reminder
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCopyPaymentLink}
                      className="w-full py-3 border border-[#27272a] text-white font-medium rounded-lg hover:border-[#10b981] transition-colors flex items-center justify-center gap-2"
                    >
                      <Link2 size={18} />
                      Copy Payment Link
                    </button>
                    <button
                      onClick={handleShareWhatsApp}
                      className="w-full py-3 border border-[#25D366] text-[#25D366] font-medium rounded-lg hover:bg-[#25D366]/10 transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={18} />
                      Share on WhatsApp
                    </button>
                  </>
                )}

                {invoice.status === "paid" && (
                  <>
                    <button className="w-full py-3 border border-[#27272a] text-white font-medium rounded-lg hover:border-[#10b981] transition-colors flex items-center justify-center gap-2">
                      <Download size={18} />
                      Download PDF
                    </button>
                    <button className="w-full py-3 border border-[#27272a] text-white font-medium rounded-lg hover:border-[#10b981] transition-colors flex items-center justify-center gap-2">
                      <Copy size={18} />
                      Duplicate Invoice
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">History</h3>
              <div className="space-y-4">
                {/* Created */}
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-[#10b981] rounded-full" />
                    <div className="w-0.5 h-full bg-[#27272a] mt-1" />
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium text-white">Created</p>
                    <p className="text-xs text-[#a1a1aa]">
                      {new Date(invoice.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Sent */}
                {invoice.sent_at && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-[#60a5fa] rounded-full" />
                      <div className="w-0.5 h-full bg-[#27272a] mt-1" />
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium text-white">Sent</p>
                      <p className="text-xs text-[#a1a1aa]">
                        {new Date(invoice.sent_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {/* Viewed */}
                {invoice.viewed_at && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-[#fbbf24] rounded-full" />
                      <div className="w-0.5 h-full bg-[#27272a] mt-1" />
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium text-white">Viewed</p>
                      <p className="text-xs text-[#a1a1aa]">
                        {new Date(invoice.viewed_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {/* Paid */}
                {invoice.paid_at && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-[#10b981] rounded-full" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Paid</p>
                      <p className="text-xs text-[#a1a1aa]">
                        {new Date(invoice.paid_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Invoice"
        message={`Are you sure you want to delete ${invoice?.invoice_number}? This action cannot be undone.`}
        confirmLabel="Delete Invoice"
        cancelLabel="Keep It"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
