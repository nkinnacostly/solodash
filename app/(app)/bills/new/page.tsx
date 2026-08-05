"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import SearchableSelect from "@/components/ui/SearchableSelect";
import DatePicker from "@/components/ui/DatePicker";

const currencies = [
  { code: "NGN", label: "NGN - Nigerian Naira" },
  { code: "USD", label: "USD - US Dollar" },
  { code: "GBP", label: "GBP - British Pound" },
  { code: "EUR", label: "EUR - Euro" },
  { code: "GHS", label: "GHS - Ghanaian Cedi" },
  { code: "KES", label: "KES - Kenyan Shilling" },
  { code: "ZAR", label: "ZAR - South African Rand" },
];

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

const billSchema = z
  .object({
    vendorId: z.string().optional(),
    isNewVendor: z.boolean(),
    vendorName: z.string().optional(),
    vendorEmail: z.string().email("Invalid email").optional().or(z.literal("")),
    vendorAddress: z.string().optional(),
    billNumber: z.string().optional(),
    category: z.string().optional(),
    issueDate: z.string().min(1, "Issue date is required"),
    dueDate: z.string().optional(),
    currency: z.string().min(1, "Currency is required"),
    lineItems: z
      .array(
        z.object({
          description: z.string().min(1, "Description is required"),
          quantity: z.coerce.number().min(0.01, "Quantity must be > 0"),
          rate: z.coerce.number().min(0, "Rate must be 0 or more"),
        }),
      )
      .min(1, "At least one line item is required"),
    taxRate: z.coerce.number().min(0).max(100).optional().default(0),
    notes: z.string().optional(),
  })
  .refine(
    (data) => (data.isNewVendor ? !!data.vendorName : !!data.vendorId),
    { message: "Vendor is required", path: ["vendorName"] },
  );

export default function NewBillPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vendors, setVendors] = useState<
    { id: string; name: string; email: string | null }[]
  >([]);

  const supabase = createClient();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(billSchema),
    defaultValues: {
      isNewVendor: false,
      billNumber: "",
      category: "",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      currency: "NGN",
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

  useEffect(() => {
    const loadVendors = async () => {
      const { data } = await supabase
        .from("vendors")
        .select("id, name, email")
        .order("name");
      setVendors(data || []);
    };
    loadVendors();
  }, [supabase]);

  const subtotal = useMemo(
    () =>
      formValues.lineItems?.reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.rate),
        0,
      ) || 0,
    [formValues.lineItems],
  );
  const taxRate = Number(formValues.taxRate) || 0;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;
  const symbol = getCurrencySymbol(formValues.currency || "NGN");
  const watchIsNewVendor = watch("isNewVendor");

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = watch();
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: data.isNewVendor ? null : data.vendorId,
          isNewVendor: data.isNewVendor,
          vendorName: data.isNewVendor ? data.vendorName : undefined,
          vendorEmail: data.isNewVendor ? data.vendorEmail : undefined,
          vendorAddress: data.isNewVendor ? data.vendorAddress : undefined,
          billNumber: data.billNumber,
          category: data.category,
          issueDate: data.issueDate,
          dueDate: data.dueDate,
          currency: data.currency,
          lineItems: data.lineItems,
          taxRate: data.taxRate,
          notes: data.notes,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create bill");
      toast.success("Bill created");
      router.push(`/bills/${result.bill.id}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create bill";
      setError(message);
      toast.error("Failed to save", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/bills"
          className="p-2 hover:bg-[#1c202a] rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-[#8f9db1]" />
        </Link>
        <h1 className="text-3xl font-bold text-white">New Bill</h1>
      </div>

      <form onSubmit={handleSubmit(() => onSubmit())}>
        <div className="bg-[#1c202a] border border-[#2a303c] rounded-xl p-6 space-y-6">
          {/* Vendor */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Vendor
            </label>
            <SearchableSelect
              options={vendors.map((v) => ({
                value: v.id,
                label: v.name,
                sublabel: v.email || undefined,
              }))}
              value={watchIsNewVendor ? "" : watch("vendorId") || ""}
              onChange={(val) => {
                setValue("vendorId", val);
                setValue("isNewVendor", false);
              }}
              placeholder="Search or select a vendor..."
              searchPlaceholder="Search vendors..."
              allowCustom
              onAddNew={() => setValue("isNewVendor", true)}
              error={errors.vendorName?.message as string | undefined}
            />
            {watchIsNewVendor && (
              <div className="space-y-3 mt-3">
                <input
                  {...register("vendorName")}
                  placeholder="Vendor name"
                  className="w-full px-4 py-2 bg-[#171b23] border border-[#2a303c] rounded-lg text-white placeholder-[#8f9db1] focus:border-[#6ea8ff] focus:outline-none"
                />
                <input
                  {...register("vendorEmail")}
                  type="email"
                  placeholder="Vendor email (optional)"
                  className="w-full px-4 py-2 bg-[#171b23] border border-[#2a303c] rounded-lg text-white placeholder-[#8f9db1] focus:border-[#6ea8ff] focus:outline-none"
                />
                <input
                  {...register("vendorAddress")}
                  placeholder="Address (optional)"
                  className="w-full px-4 py-2 bg-[#171b23] border border-[#2a303c] rounded-lg text-white placeholder-[#8f9db1] focus:border-[#6ea8ff] focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Bill number + category */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Bill Number (optional)
              </label>
              <input
                {...register("billNumber")}
                placeholder="Auto-generated if blank"
                className="w-full px-4 py-2 bg-[#171b23] border border-[#2a303c] rounded-lg text-white placeholder-[#8f9db1] focus:border-[#6ea8ff] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Category (optional)
              </label>
              <input
                {...register("category")}
                placeholder="e.g. Design, Software, Subcontractor"
                className="w-full px-4 py-2 bg-[#171b23] border border-[#2a303c] rounded-lg text-white placeholder-[#8f9db1] focus:border-[#6ea8ff] focus:outline-none"
              />
            </div>
          </div>

          {/* Dates + currency */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <DatePicker
                label="Issue Date"
                value={watch("issueDate")}
                onChange={(v) => setValue("issueDate", v)}
                placeholder="Select issue date..."
              />
              {errors.issueDate && (
                <p className="text-sm text-[#ef4444] mt-1">
                  {errors.issueDate.message}
                </p>
              )}
            </div>
            <div>
              <DatePicker
                label="Due Date (optional)"
                value={watch("dueDate") || ""}
                onChange={(v) => setValue("dueDate", v)}
                placeholder="Select due date..."
                minDate={watch("issueDate")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Currency
              </label>
              <select
                {...register("currency")}
                className="w-full px-4 py-2 bg-[#171b23] border border-[#2a303c] rounded-lg text-white focus:border-[#6ea8ff] focus:outline-none"
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-white">
                Line Items
              </label>
              <button
                type="button"
                onClick={() =>
                  append({ description: "", quantity: 1, rate: 0 })
                }
                className="inline-flex items-center gap-1 text-sm text-[#6ea8ff] hover:underline"
              >
                <Plus size={16} />
                Add item
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <input
                      {...register(`lineItems.${index}.description`)}
                      placeholder="Description"
                      className="w-full px-3 py-2 bg-[#171b23] border border-[#2a303c] rounded-lg text-white placeholder-[#8f9db1] focus:border-[#6ea8ff] focus:outline-none"
                    />
                    {errors.lineItems?.[index]?.description && (
                      <p className="text-xs text-[#ef4444] mt-1">
                        {errors.lineItems[index]?.description?.message}
                      </p>
                    )}
                  </div>
                  <input
                    {...register(`lineItems.${index}.quantity`)}
                    type="number"
                    step="0.01"
                    placeholder="Qty"
                    className="w-20 px-3 py-2 bg-[#171b23] border border-[#2a303c] rounded-lg text-white placeholder-[#8f9db1] focus:border-[#6ea8ff] focus:outline-none"
                  />
                  <input
                    {...register(`lineItems.${index}.rate`)}
                    type="number"
                    step="0.01"
                    placeholder="Rate"
                    className="w-28 px-3 py-2 bg-[#171b23] border border-[#2a303c] rounded-lg text-white placeholder-[#8f9db1] focus:border-[#6ea8ff] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => fields.length > 1 && remove(index)}
                    disabled={fields.length <= 1}
                    className="p-2 text-[#ef4444] hover:bg-[#ef4444]/10 rounded-lg transition-colors disabled:opacity-30"
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            {errors.lineItems?.message && (
              <p className="text-sm text-[#ef4444] mt-2">
                {errors.lineItems.message}
              </p>
            )}
          </div>

          {/* Tax + notes */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Tax Rate (%)
              </label>
              <input
                {...register("taxRate")}
                type="number"
                step="0.01"
                className="w-full px-4 py-2 bg-[#171b23] border border-[#2a303c] rounded-lg text-white placeholder-[#8f9db1] focus:border-[#6ea8ff] focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Notes (optional)
            </label>
            <textarea
              {...register("notes")}
              rows={3}
              placeholder="Anything worth noting about this bill..."
              className="w-full px-4 py-2 bg-[#171b23] border border-[#2a303c] rounded-lg text-white placeholder-[#8f9db1] focus:border-[#6ea8ff] focus:outline-none resize-none"
            />
          </div>

          {/* Totals */}
          <div className="border-t border-[#2a303c] pt-4 space-y-2">
            <div className="flex justify-between text-sm text-[#8f9db1]">
              <span>Subtotal</span>
              <span>
                {symbol}
                {subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-sm text-[#8f9db1]">
              <span>Tax ({taxRate}%)</span>
              <span>
                {symbol}
                {taxAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold text-white">
              <span>Total</span>
              <span>
                {symbol}
                {total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-[#ef4444] mt-4">{error}</p>}

        <div className="flex gap-4 mt-6">
          <Link
            href="/bills"
            className="flex-1 py-3 border border-[#2a303c] text-white font-medium rounded-lg hover:border-[#6ea8ff] transition-colors text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-[#6ea8ff] text-[#0e1116] font-medium rounded-lg hover:bg-[#5b93e6] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              "Create Bill"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
