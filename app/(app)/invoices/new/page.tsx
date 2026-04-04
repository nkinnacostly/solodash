"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import UpgradeModal from "@/components/UpgradeModal";
import { ArrowLeft, Plus, X, Loader2 } from "lucide-react";
import Image from "next/image";

const currencies = [
  { code: "NGN", symbol: "₦", name: "NGN" },
  { code: "USD", symbol: "$", name: "USD" },
  { code: "GBP", symbol: "£", name: "GBP" },
  { code: "EUR", symbol: "€", name: "EUR" },
  { code: "GHS", symbol: "GH₵", name: "GHS" },
  { code: "KES", symbol: "KSh", name: "KES" },
  { code: "ZAR", symbol: "R", name: "ZAR" },
];

const invoiceSchema = z
  .object({
    clientId: z.string().optional(),
    clientName: z.string().optional(),
    clientEmail: z.string().email("Invalid email").optional().or(z.literal("")),
    clientAddress: z.string().optional(),
    isNewClient: z.boolean(),
    invoiceNumber: z.string().min(1, "Invoice number is required"),
    issueDate: z.string().min(1, "Issue date is required"),
    dueDate: z.string().min(1, "Due date is required"),
    currency: z.string().min(1, "Currency is required"),
    lineItems: z
      .array(
        z.object({
          description: z.string().min(1, "Description is required"),
          quantity: z.coerce.number().min(0.01, "Quantity must be > 0"),
          rate: z.coerce.number().min(0.01, "Rate must be > 0"),
        }),
      )
      .min(1, "At least one line item is required"),
    taxRate: z.coerce.number().min(0).max(100).optional().default(0),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.isNewClient) {
        return data.clientName && data.clientName.length >= 2;
      }
      return !!data.clientId;
    },
    { message: "Client name is required", path: ["clientName"] },
  )
  .refine(
    (data) => {
      if (data.isNewClient && data.clientEmail) {
        return true;
      }
      if (data.isNewClient) {
        return false;
      }
      return true;
    },
    { message: "Client email is required", path: ["clientEmail"] },
  )
  .refine((data) => new Date(data.dueDate) > new Date(data.issueDate), {
    message: "Due date must be after issue date",
    path: ["dueDate"],
  });

export default function NewInvoicePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [showNewClient, setShowNewClient] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const supabase = createClient();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: "",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      currency: "NGN",
      isNewClient: false,
      lineItems: [{ description: "", quantity: 1, rate: 0 }],
      taxRate: 0,
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lineItems",
  });

  // Use useWatch for real-time reactivity
  const watchedLineItems = useWatch({ control, name: "lineItems" });
  const watchedTaxRate = useWatch({ control, name: "taxRate" });
  const watchedCurrency = useWatch({ control, name: "currency" });
  const formValues = watch();

  // Fetch clients and generate invoice number
  useEffect(() => {
    const loadData = async () => {
      // Fetch clients
      const { data: clientsData } = await supabase
        .from("clients")
        .select("*")
        .order("name");
      setClients(clientsData || []);

      // Generate invoice number
      const { data: lastInvoice } = await supabase
        .from("invoices")
        .select("invoice_number")
        .order("created_at", { ascending: false })
        .limit(1);

      let nextNum = 1;
      if (lastInvoice && lastInvoice.length > 0) {
        const lastNum = parseInt(lastInvoice[0].invoice_number.split("-")[1]);
        nextNum = lastNum + 1;
      }
      setValue("invoiceNumber", `INV-${String(nextNum).padStart(3, "0")}`);
    };

    loadData();
  }, [supabase, setValue]);

  // Watch for new client toggle
  const isNewClient = watch("isNewClient");
  useEffect(() => {
    setShowNewClient(isNewClient);
  }, [isNewClient]);

  // Calculate totals using useWatch for real-time updates
  const subtotal = useMemo(() => {
    return (watchedLineItems || []).reduce((sum: number, item: any) => {
      const qty = parseFloat(String(item?.quantity)) || 0;
      const rate = parseFloat(String(item?.rate)) || 0;
      return sum + qty * rate;
    }, 0);
  }, [watchedLineItems]);

  const taxRate = parseFloat(String(watchedTaxRate)) || 0;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const selectedCurrency =
    currencies.find(
      (c) => c.code === (watchedCurrency || formValues.currency),
    ) || currencies[0];

  const onSubmit = async (status: "draft" | "sent") => {
    setError(null);
    setLoading(true);

    try {
      const data = watch();

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: data.isNewClient ? null : data.clientId,
          isNewClient: data.isNewClient,
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          clientAddress: data.clientAddress,
          invoiceNumber: data.invoiceNumber,
          issueDate: data.issueDate,
          dueDate: data.dueDate,
          currency: data.currency,
          lineItems: data.lineItems,
          taxRate: data.taxRate,
          notes: data.notes,
          status,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          setShowUpgradeModal(true);
          return;
        }
        throw new Error(result.error || "Failed to create invoice");
      }

      if (status === "draft") {
        toast.success("Draft saved");
        router.push("/invoices");
      } else {
        router.push(`/invoices/${result.invoice.id}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create invoice");
      toast.error("Failed to save", err.message || "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };
  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/settings/profile");
      const data = await response.json();
      if (response.ok && data.profile) {
        setProfile(data.profile);
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);
  return (
    <>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/invoices"
            className="p-2 hover:bg-[#18181b] rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-[#a1a1aa]" />
          </Link>
          <h1 className="text-3xl font-bold text-white">New Invoice</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* LEFT: Form */}
          <div className="space-y-6">
            {/* Section 1: Client */}
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Client</h2>

              {/* Client Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-white mb-2">
                  Select Client
                </label>
                <select
                  {...register("clientId")}
                  onChange={(e) => {
                    if (e.target.value === "new") {
                      setValue("isNewClient", true);
                    } else {
                      setValue("isNewClient", false);
                      setValue("clientId", e.target.value);
                    }
                  }}
                  className="w-full px-4 py-3 bg-[#111111] border border-[#27272a] rounded-lg text-white focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors"
                >
                  <option value="">Choose a client...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.email})
                    </option>
                  ))}
                  <option value="new">+ Add new client</option>
                </select>
              </div>

              {/* New Client Fields */}
              {showNewClient && (
                <div className="space-y-4 pt-4 border-t border-[#27272a]">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Client Name *
                    </label>
                    <input
                      {...register("clientName")}
                      type="text"
                      placeholder="John Doe"
                      className="w-full px-4 py-3 bg-[#111111] border border-[#27272a] rounded-lg text-white placeholder-[#52525b] focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors"
                    />
                    {errors.clientName && (
                      <p className="mt-1 text-sm text-[#ef4444]">
                        {errors.clientName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Client Email *
                    </label>
                    <input
                      {...register("clientEmail")}
                      type="email"
                      placeholder="john@example.com"
                      className="w-full px-4 py-3 bg-[#111111] border border-[#27272a] rounded-lg text-white placeholder-[#52525b] focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors"
                    />
                    {errors.clientEmail && (
                      <p className="mt-1 text-sm text-[#ef4444]">
                        {errors.clientEmail.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Address (optional)
                    </label>
                    <input
                      {...register("clientAddress")}
                      type="text"
                      placeholder="123 Main St, Lagos"
                      className="w-full px-4 py-3 bg-[#111111] border border-[#27272a] rounded-lg text-white placeholder-[#52525b] focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Invoice Details */}
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Invoice Details
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Invoice Number
                  </label>
                  <input
                    {...register("invoiceNumber")}
                    type="text"
                    className="w-full px-4 py-3 bg-[#111111] border border-[#27272a] rounded-lg text-white focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors"
                  />
                  {errors.invoiceNumber && (
                    <p className="mt-1 text-sm text-[#ef4444]">
                      {errors.invoiceNumber.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Currency
                  </label>
                  <select
                    {...register("currency")}
                    className="w-full px-4 py-3 bg-[#111111] border border-[#27272a] rounded-lg text-white focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors"
                  >
                    {currencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Issue Date
                  </label>
                  <input
                    {...register("issueDate")}
                    type="date"
                    className="w-full px-4 py-3 bg-[#111111] border border-[#27272a] rounded-lg text-white focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Due Date
                  </label>
                  <input
                    {...register("dueDate")}
                    type="date"
                    className="w-full px-4 py-3 bg-[#111111] border border-[#27272a] rounded-lg text-white focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors"
                  />
                  {errors.dueDate && (
                    <p className="mt-1 text-sm text-[#ef4444]">
                      {errors.dueDate.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Line Items */}
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Line Items
              </h2>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-3">
                    <div className="col-span-5">
                      <input
                        {...register(`lineItems.${index}.description`)}
                        type="text"
                        placeholder="Description"
                        className="w-full px-3 py-2 bg-[#111111] border border-[#27272a] rounded-lg text-white placeholder-[#52525b] focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors text-sm"
                      />
                      {errors.lineItems?.[index]?.description && (
                        <p className="mt-1 text-xs text-[#ef4444]">
                          {errors.lineItems[index]?.description?.message}
                        </p>
                      )}
                    </div>

                    <div className="col-span-2">
                      <input
                        {...register(`lineItems.${index}.quantity`)}
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="Qty"
                        className="w-full px-3 py-2 bg-[#111111] border border-[#27272a] rounded-lg text-white placeholder-[#52525b] focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors text-sm"
                      />
                    </div>

                    <div className="col-span-2">
                      <input
                        {...register(`lineItems.${index}.rate`)}
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="Rate"
                        className="w-full px-3 py-2 bg-[#111111] border border-[#27272a] rounded-lg text-white placeholder-[#52525b] focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors text-sm"
                      />
                    </div>

                    <div className="col-span-2 flex items-center px-3 py-2 bg-[#0f0f0f] rounded-lg text-sm text-[#a1a1aa]">
                      {selectedCurrency.symbol}
                      {(() => {
                        const qty =
                          parseFloat(
                            String(watchedLineItems?.[index]?.quantity),
                          ) || 0;
                        const rate =
                          parseFloat(String(watchedLineItems?.[index]?.rate)) ||
                          0;
                        return (qty * rate).toFixed(2);
                      })()}
                    </div>

                    <div className="col-span-1 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        className="p-1 text-[#a1a1aa] hover:text-[#ef4444] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  append({ description: "", quantity: 1, rate: 0 })
                }
                className="mt-4 flex items-center gap-2 text-sm text-[#10b981] hover:underline"
              >
                <Plus size={16} />
                Add line item
              </button>

              {errors.lineItems && (
                <p className="mt-2 text-sm text-[#ef4444]">
                  {errors.lineItems.message}
                </p>
              )}
            </div>

            {/* Section 4: Totals */}
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
              <div className="space-y-3">
                <div className="flex justify-between text-[#a1a1aa]">
                  <span>Subtotal</span>
                  <span>
                    {selectedCurrency.symbol}
                    {subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[#a1a1aa]">Tax</span>
                    <input
                      {...register("taxRate")}
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      className="w-20 px-3 py-2 bg-[#111111] border border-[#27272a] rounded-lg text-white text-sm focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors"
                    />
                    <span className="text-[#a1a1aa]">%</span>
                  </div>
                  <span className="text-[#a1a1aa]">
                    {selectedCurrency.symbol}
                    {taxAmount.toFixed(2)}
                  </span>
                </div>

                <div className="pt-3 border-t border-[#27272a] flex justify-between text-lg font-bold text-white">
                  <span>Total</span>
                  <span>
                    {selectedCurrency.symbol}
                    {total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 5: Notes */}
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Notes</h2>
              <textarea
                {...register("notes")}
                rows={4}
                placeholder="Payment terms, thank you note, bank details..."
                className="w-full px-4 py-3 bg-[#111111] border border-[#27272a] rounded-lg text-white placeholder-[#52525b] focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors resize-none"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg">
                <p className="text-sm text-[#ef4444]">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleSubmit((data) => onSubmit("draft"))()}
                disabled={loading}
                className="flex-1 py-3 border border-[#27272a] text-white font-medium rounded-lg hover:border-[#10b981] transition-colors disabled:opacity-50"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => handleSubmit((data) => onSubmit("sent"))()}
                disabled={loading}
                className="flex-1 py-3 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Preview & Send"
                )}
              </button>
            </div>
          </div>

          {/* RIGHT: Live Preview (Desktop Only) */}
          <div className="hidden lg:block">
            <div className="sticky top-6">
              <p className="text-sm text-[#a1a1aa] mb-3 font-medium">
                Invoice Preview
              </p>
              <div className="bg-white text-gray-900 rounded-xl p-8 shadow-2xl">
                {/* Preview Header */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    {profile?.plan === "pro" && profile?.logo_url ? (
                      <Image
                        src={profile.logo_url || ""}
                        alt="Logo"
                        width={100}
                        height={100}
                        loading="eager"
                        className="h-12 w-auto mb-1 object-contain"
                      />
                    ) : (
                      <h2
                        className="text-3xl font-bold mb-1"
                        style={{
                          color:
                            profile?.plan === "pro" && profile?.brand_color
                              ? profile.brand_color
                              : "#10b981",
                        }}
                      >
                        {profile?.plan === "pro" &&
                        (profile?.business_name || profile?.name)
                          ? profile.business_name || profile.name
                          : "Costly"}
                      </h2>
                    )}
                    <p className="text-sm text-gray-500">Invoice</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formValues.invoiceNumber || "INV-001"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Issue: {formValues.issueDate || "—"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Due: {formValues.dueDate || "—"}
                    </p>
                  </div>
                </div>

                {/* Client Info */}
                <div className="mb-8 pb-6 border-b border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Bill To:</p>
                  <p className="font-medium">
                    {formValues.isNewClient
                      ? formValues.clientName || "Client Name"
                      : clients.find((c) => c.id === formValues.clientId)
                          ?.name || "Select a client"}
                  </p>
                  {formValues.isNewClient && formValues.clientEmail && (
                    <p className="text-sm text-gray-600">
                      {formValues.clientEmail}
                    </p>
                  )}
                </div>

                {/* Line Items Table */}
                <table className="w-full mb-6 text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 font-medium text-gray-600">
                        Description
                      </th>
                      <th className="text-center py-2 font-medium text-gray-600">
                        Qty
                      </th>
                      <th className="text-right py-2 font-medium text-gray-600">
                        Rate
                      </th>
                      <th className="text-right py-2 font-medium text-gray-600">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {formValues.lineItems?.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-2">{item.description || "—"}</td>
                        <td className="py-2 text-center">
                          {Number(item.quantity)}
                        </td>
                        <td className="py-2 text-right">
                          {selectedCurrency.symbol}
                          {Number(item.rate).toFixed(2)}
                        </td>
                        <td className="py-2 text-right">
                          {selectedCurrency.symbol}
                          {(Number(item.quantity) * Number(item.rate)).toFixed(
                            2,
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>
                      {selectedCurrency.symbol}
                      {subtotal.toFixed(2)}
                    </span>
                  </div>
                  {taxRate > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Tax ({taxRate}%)</span>
                      <span>
                        {selectedCurrency.symbol}
                        {taxAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>
                      {selectedCurrency.symbol}
                      {total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                {formValues.notes && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Notes:</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {formValues.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason="You've reached your 3 invoice limit for this month"
        feature="invoices"
      />
    </>
  );
}
