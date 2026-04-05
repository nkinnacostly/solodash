"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Plus, X, Loader2 } from "lucide-react";
import DatePicker from "@/components/ui/DatePicker";

const currencies = [
  { code: "USD", symbol: "$", name: "USD" },
  { code: "GBP", symbol: "£", name: "GBP" },
  { code: "EUR", symbol: "€", name: "EUR" },
  { code: "NGN", symbol: "₦", name: "NGN" },
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

type InvoiceFormData = z.infer<typeof invoiceSchema> & {
  lineItems: {
    description: string;
    quantity: number;
    rate: number;
  }[];
  taxRate: number;
};

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [notDraft, setNotDraft] = useState(false);

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
      issueDate: "",
      dueDate: "",
      currency: "USD",
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

  const formValues = watch();

  // Fetch invoice data and clients
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch clients
        const { data: clientsData } = await supabase
          .from("clients")
          .select("*")
          .order("name");
        setClients(clientsData || []);

        // Fetch invoice
        const response = await fetch(`/api/invoices/${invoiceId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch invoice");
        }

        const invoice = data.invoice;

        // Check if draft
        if (invoice.status !== "draft") {
          setNotDraft(true);
          setLoading(false);
          return;
        }

        // Pre-fill form
        setValue("clientId", invoice.client_id);
        setValue("invoiceNumber", invoice.invoice_number);
        setValue("issueDate", invoice.issue_date);
        setValue("dueDate", invoice.due_date);
        setValue("currency", invoice.currency);
        setValue("taxRate", invoice.tax_rate || 0);
        setValue("notes", invoice.notes || "");
        setValue("isNewClient", false);

        // Pre-fill line items
        if (invoice.invoice_items && invoice.invoice_items.length > 0) {
          setValue(
            "lineItems",
            invoice.invoice_items.map((item: any) => ({
              description: item.description,
              quantity: item.quantity,
              rate: item.rate,
            })),
          );
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [invoiceId, supabase, setValue]);

  // Calculate totals
  const subtotal = useMemo(() => {
    return (
      formValues.lineItems?.reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.rate),
        0,
      ) || 0
    );
  }, [formValues.lineItems]);

  const taxRate = Number(formValues.taxRate) || 0;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const selectedCurrency =
    currencies.find((c) => c.code === formValues.currency) || currencies[0];

  const onSubmit = async () => {
    setError(null);
    setSaving(true);

    try {
      const data = watch();

      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: data.clientId,
          invoiceNumber: data.invoiceNumber,
          issueDate: data.issueDate,
          dueDate: data.dueDate,
          currency: data.currency,
          lineItems: data.lineItems,
          taxRate: data.taxRate,
          notes: data.notes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update invoice");
      }

      router.push(`/invoices/${invoiceId}`);
    } catch (err: any) {
      setError(err.message || "Failed to update invoice");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-[#18181b] rounded w-48" />
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-[#18181b] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (notDraft) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-20">
          <h3 className="text-xl font-semibold text-white mb-2">
            Only draft invoices can be edited
          </h3>
          <p className="text-[#a1a1aa] mb-6">
            This invoice has already been sent or paid.
          </p>
          <Link
            href={`/invoices/${invoiceId}`}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Invoice
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-20">
          <p className="text-[#ef4444] text-lg">{error}</p>
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={`/invoices/${invoiceId}`}
          className="p-2 hover:bg-[#18181b] rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-[#a1a1aa]" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Edit Invoice</h1>
          <p className="text-sm text-[#a1a1aa] mt-1">
            {formValues.invoiceNumber}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Client Selection */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Client</h2>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Client
            </label>
            <select
              {...register("clientId")}
              className="w-full px-4 py-3 bg-[#111111] border border-[#27272a] rounded-lg text-white focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors"
            >
              <option value="">Choose a client...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Invoice Details */}
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
              <DatePicker
                label="Issue Date"
                value={formValues.issueDate}
                onChange={(value) => setValue("issueDate", value)}
                placeholder="Select issue date..."
              />
            </div>

            <div>
              <DatePicker
                label="Due Date"
                value={formValues.dueDate}
                onChange={(value) => setValue("dueDate", value)}
                placeholder="Select due date..."
                minDate={formValues.issueDate}
              />
              {errors.dueDate && (
                <p className="mt-1 text-sm text-[#ef4444]">
                  {errors.dueDate.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Line Items</h2>

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
                  {(
                    Number(formValues.lineItems?.[index]?.quantity || 0) *
                    Number(formValues.lineItems?.[index]?.rate || 0)
                  ).toFixed(2)}
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
            onClick={() => append({ description: "", quantity: 1, rate: 0 })}
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

        {/* Totals */}
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

        {/* Notes */}
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
          <Link
            href={`/invoices/${invoiceId}`}
            className="flex-1 py-3 border border-[#27272a] text-white font-medium rounded-lg hover:border-[#10b981] transition-colors text-center"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={saving}
            className="flex-1 py-3 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
