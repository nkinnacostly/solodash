"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import Script from "next/script";

interface Invoice {
  invoice_number: string;
  status: string;
  currency: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  due_date: string;
  notes: string | null;
  client: {
    name: string;
    email: string;
  };
  freelancer: {
    name: string;
    business_name: string | null;
  };
  subaccount_id: string | null;
  is_pro: boolean;
  line_items: {
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }[];
}

declare global {
  interface Window {
    FlutterwaveCheckout: (config: any) => void;
  }
}

export default function PayInvoicePage() {
  const params = useParams();
  const invoiceId = params.invoice_id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/pay/${invoiceId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invoice not found");
      }

      setInvoice(data.invoice);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!invoice) return;

    setPaymentProcessing(true);
    setPaymentError(null);

    const txRef = `PAIDLY-${invoiceId}-${Date.now()}`;

    const config = {
      public_key: process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY || "",
      tx_ref: txRef,
      amount: invoice.total,
      currency: invoice.currency,
      payment_options: "card",
      subaccounts: invoice.subaccount_id
        ? [
            {
              id: invoice.subaccount_id,
              transaction_split_ratio: invoice.is_pro ? 100 : 95,
            },
          ]
        : [],
      customer: {
        email: invoice.client.email,
        name: invoice.client.name,
      },
      customizations: {
        title: `Pay Invoice ${invoice.invoice_number}`,
        description: `Payment for invoice from ${invoice.freelancer.business_name || invoice.freelancer.name}`,
        logo: "",
      },
      callback: async (response: any) => {
        // Close the modal immediately
        if (response.close) response.close();
        setPaymentProcessing(true);
        await verifyPayment(response.transaction_id, txRef);
      },
      onclose: () => {
        if (!paymentSuccess) {
          setPaymentProcessing(false);
        }
      },
    };

    try {
      if (window.FlutterwaveCheckout) {
        window.FlutterwaveCheckout(config);
      } else {
        setPaymentError("Payment system not loaded. Please refresh the page.");
        setPaymentProcessing(false);
      }
    } catch (err: any) {
      setPaymentError(err.message || "Failed to initiate payment");
      setPaymentProcessing(false);
    }
  };

  const verifyPayment = async (transactionId: string, txRef: string) => {
    try {
      const response = await fetch("/api/payments/flutterwave/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_id: transactionId,
          invoice_id: invoiceId,
          tx_ref: txRef,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Payment verification failed");
      }

      setPaymentSuccess(true);
      setPaymentProcessing(false);

      // Update invoice status in UI
      if (invoice) {
        setInvoice({ ...invoice, status: "paid" });
      }
    } catch (err: any) {
      setPaymentError(err.message);
      setPaymentProcessing(false);
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
    return symbols[currency] || currency + " ";
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="animate-pulse bg-[#18181b] border border-[#27272a] rounded-xl p-8">
            <div className="h-8 bg-[#27272a] rounded w-32 mb-4" />
            <div className="h-4 bg-[#27272a] rounded w-48 mb-8" />
            <div className="space-y-3 mb-6">
              <div className="h-4 bg-[#27272a] rounded w-full" />
              <div className="h-4 bg-[#27272a] rounded w-3/4" />
              <div className="h-4 bg-[#27272a] rounded w-5/6" />
            </div>
            <div className="h-12 bg-[#27272a] rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <XCircle size={64} className="text-[#ef4444] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            Invoice Not Found
          </h1>
          <p className="text-[#a1a1aa] mb-6">
            This invoice may have been cancelled or deleted.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Paidly
          </a>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-[#18181b] border border-[#10b981]/30 rounded-xl p-8 text-center">
            <CheckCircle
              size={64}
              className="text-[#10b981] mx-auto mb-4 animate-bounce"
            />
            <h1 className="text-2xl font-bold text-white mb-2">
              Payment Successful!
            </h1>
            <p className="text-[#a1a1aa] mb-6">
              A receipt has been sent to your email.
            </p>
            <div className="bg-[#0f0f0f] border border-[#27272a] rounded-lg p-4 mb-6">
              <p className="text-sm text-[#a1a1aa] mb-1">Invoice</p>
              <p className="text-lg font-bold text-white">
                {invoice.invoice_number}
              </p>
              <p className="text-2xl font-bold text-[#10b981] mt-2">
                {getCurrencySymbol(invoice.currency)}
                {invoice.total.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <p className="text-sm text-[#a1a1aa]">
              Thank you for your payment!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://checkout.flutterwave.com/v3.js"
        strategy="afterInteractive"
      />

      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Invoice Summary Card */}
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-8">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#10b981] mb-1">Paidly</h1>
              <p className="text-sm text-[#a1a1aa]">
                Invoice from{" "}
                {invoice.freelancer.business_name || invoice.freelancer.name}
              </p>
              <p className="text-xs text-[#a1a1aa] mt-1">
                {invoice.invoice_number}
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-[#27272a] mb-6" />

            {/* Line Items */}
            <div className="space-y-3 mb-6">
              {invoice.line_items.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-start text-sm"
                >
                  <div className="flex-1">
                    <p className="text-white">{item.description}</p>
                    <p className="text-xs text-[#a1a1aa]">
                      {item.quantity} × {getCurrencySymbol(invoice.currency)}
                      {item.rate.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <p className="text-white font-medium ml-4">
                    {getCurrencySymbol(invoice.currency)}
                    {item.amount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-[#27272a] mb-4" />

            {/* Totals */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-[#a1a1aa]">Subtotal</span>
                <span className="text-white">
                  {getCurrencySymbol(invoice.currency)}
                  {invoice.subtotal.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              {invoice.tax_rate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#a1a1aa]">
                    Tax ({invoice.tax_rate}%)
                  </span>
                  <span className="text-white">
                    {getCurrencySymbol(invoice.currency)}
                    {invoice.tax_amount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-[#27272a]">
                <span className="text-white">Total</span>
                <span className="text-[#10b981]">
                  {getCurrencySymbol(invoice.currency)}
                  {invoice.total.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            {/* Due Date */}
            <div className="bg-[#0f0f0f] border border-[#27272a] rounded-lg p-3 mb-6">
              <p className="text-xs text-[#a1a1aa] mb-1">Due Date</p>
              <p className="text-sm text-white font-medium">
                {formatDate(invoice.due_date)}
              </p>
            </div>

            {/* Already Paid */}
            {invoice.status === "paid" && (
              <div className="bg-[#052e16] border border-[#10b981]/30 rounded-lg p-4 text-center mb-6">
                <CheckCircle
                  size={20}
                  className="text-[#10b981] mx-auto mb-2"
                />
                <p className="text-sm text-[#10b981] font-medium">
                  This invoice has already been paid
                </p>
              </div>
            )}

            {/* Payment Section */}
            {invoice.status !== "paid" && (
              <>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-white mb-1">
                    Pay {getCurrencySymbol(invoice.currency)}
                    {invoice.total.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    securely
                  </h2>
                </div>

                {invoice.subaccount_id ? (
                  <>
                    <button
                      onClick={handlePayment}
                      disabled={paymentProcessing}
                      className="w-full py-3 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {paymentProcessing ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <>Pay with Card →</>
                      )}
                    </button>

                    {paymentError && (
                      <div className="mt-4 bg-[#3d0a0a] border border-[#ef4444]/30 rounded-lg p-3">
                        <p className="text-sm text-[#ef4444]">{paymentError}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-[#3d2e00] border border-[#fbbf24]/30 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <XCircle
                        size={20}
                        className="text-[#fbbf24] mt-0.5 flex-shrink-0"
                      />
                      <div>
                        <p className="text-sm font-medium text-[#fbbf24] mb-1">
                          Payment unavailable
                        </p>
                        <p className="text-xs text-[#a1a1aa]">
                          The freelancer hasn't connected their bank account
                          yet. Please contact them directly.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Note */}
                <div className="mt-4 text-center">
                  <p className="text-xs text-[#a1a1aa]">
                    Secured by Flutterwave · Your payment is encrypted
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
