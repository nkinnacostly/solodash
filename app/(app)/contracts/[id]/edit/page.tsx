"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Save } from "lucide-react";
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

const contractSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  title: z.string().min(1, "Title is required"),
  currency: z.string().min(1),
  value: z
    .number({ message: "Value is required" })
    .min(0, "Value must be 0 or more"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
});

type ContractFormData = z.infer<typeof contractSchema>;

export default function EditContractPage() {
  const router = useRouter();
  const params = useParams();
  const contractId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [clients, setClients] = useState<{ id: string; name: string; email: string }[]>(
    [],
  );
  // Set once after fetch so React never re-writes the editor DOM on re-render.
  const [initialContent, setInitialContent] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      clientId: "",
      title: "",
      currency: "USD",
      value: 0,
      startDate: "",
      endDate: "",
    },
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        // Clients (own rows, RLS-scoped read)
        const { data: clientsData } = await supabase
          .from("clients")
          .select("id, name, email")
          .order("name");
        setClients(clientsData || []);

        const response = await fetch(`/api/contracts/${contractId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch contract");
        }

        const contract = data.contract;

        // Editable until it's signed by either party (draft/sent are fine).
        const isSigned =
          contract.status === "signed" ||
          contract.status === "active" ||
          contract.status === "completed" ||
          Boolean(contract.client_signed_at) ||
          Boolean(contract.freelancer_signed_at);

        if (isSigned) {
          setLocked(true);
          setLoading(false);
          return;
        }

        setValue("clientId", contract.client_id || "");
        setValue("title", contract.title || "");
        setValue("currency", contract.currency || "USD");
        setValue("value", contract.value || 0);
        setValue("startDate", contract.start_date || "");
        setValue("endDate", contract.end_date || "");
        setInitialContent(
          contract.content || contract.content_html || "",
        );
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load contract");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [contractId, supabase, setValue]);

  const onSubmit = async (formData: ContractFormData) => {
    setError(null);
    setSaving(true);

    try {
      const response = await fetch(`/api/contracts/${contractId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: formData.clientId,
          title: formData.title,
          currency: formData.currency,
          value: formData.value,
          startDate: formData.startDate,
          endDate: formData.endDate || null,
          content: contentRef.current?.innerHTML ?? initialContent ?? "",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update contract");
      }

      toast.success("Contract updated");
      router.push(`/contracts/${contractId}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update contract";
      setError(message);
      toast.error("Failed to save", message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-[#141419] rounded w-48" />
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-[#141419] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-20">
          <h3 className="text-xl font-semibold text-white mb-2">
            This contract can no longer be edited
          </h3>
          <p className="text-[#a1a1aa] mb-6">
            It has already been signed.
          </p>
          <Link
            href={`/contracts/${contractId}`}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#2563eb] text-[#ffffff] font-medium rounded-lg hover:bg-[#1d4ed8] transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Contract
          </Link>
        </div>
      </div>
    );
  }

  if (error && initialContent === null) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-20">
          <p className="text-[#ef4444] text-lg">{error}</p>
          <Link
            href="/contracts"
            className="inline-flex items-center gap-2 mt-6 px-5 py-3 bg-[#2563eb] text-[#ffffff] font-medium rounded-lg hover:bg-[#1d4ed8] transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Contracts
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
          href={`/contracts/${contractId}`}
          className="p-2 hover:bg-[#141419] rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-[#a1a1aa]" />
        </Link>
        <h1 className="text-3xl font-bold text-white">Edit Contract</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-[#141419] border border-[#26262e] rounded-xl p-6 space-y-6">
          {/* Client */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Client
            </label>
            <SearchableSelect
              options={clients.map((client) => ({
                value: client.id,
                label: client.name,
                sublabel: client.email,
              }))}
              value={watch("clientId") || ""}
              onChange={(selectedValue) => setValue("clientId", selectedValue)}
              placeholder="Search or select a client..."
              searchPlaceholder="Search clients..."
              error={errors.clientId?.message}
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Title
            </label>
            <input
              {...register("title")}
              className="w-full px-4 py-2 bg-[#0d0d10] border border-[#26262e] rounded-lg text-white placeholder-[#a1a1aa] focus:border-[#3b82f6] focus:outline-none"
              placeholder="Contract title"
            />
            {errors.title && (
              <p className="text-sm text-[#ef4444] mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Value + Currency */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Value
              </label>
              <input
                {...register("value", { valueAsNumber: true })}
                type="number"
                step="0.01"
                className="w-full px-4 py-2 bg-[#0d0d10] border border-[#26262e] rounded-lg text-white placeholder-[#a1a1aa] focus:border-[#3b82f6] focus:outline-none"
                placeholder="0.00"
              />
              {errors.value && (
                <p className="text-sm text-[#ef4444] mt-1">
                  {errors.value.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Currency
              </label>
              <select
                {...register("currency")}
                className="w-full px-4 py-2 bg-[#0d0d10] border border-[#26262e] rounded-lg text-white focus:border-[#3b82f6] focus:outline-none"
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <DatePicker
                label="Start Date"
                value={watch("startDate")}
                onChange={(value) => setValue("startDate", value)}
                placeholder="Select start date..."
              />
              {errors.startDate && (
                <p className="text-sm text-[#ef4444] mt-1">
                  {errors.startDate.message}
                </p>
              )}
            </div>
            <div>
              <DatePicker
                label="End Date (optional)"
                value={watch("endDate") || ""}
                onChange={(value) => setValue("endDate", value)}
                placeholder="Select end date..."
                minDate={watch("startDate")}
              />
            </div>
          </div>

          {/* Contract body */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Contract Body
            </label>
            <p className="text-xs text-[#a1a1aa] mb-3">
              Edit the document text directly. Formatting from the template is
              preserved.
            </p>
            {initialContent !== null && (
              <div
                ref={contentRef}
                contentEditable
                suppressContentEditableWarning
                className="contract-content max-h-[600px] overflow-y-auto rounded-lg bg-white p-8 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "14px",
                  lineHeight: "1.8",
                  color: "#1a1a1a",
                }}
                dangerouslySetInnerHTML={{ __html: initialContent }}
              />
            )}
          </div>
        </div>

        {error && (
          <p className="text-sm text-[#ef4444] mt-4">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-4 mt-6">
          <Link
            href={`/contracts/${contractId}`}
            className="flex-1 py-3 border border-[#26262e] text-white font-medium rounded-lg hover:border-[#3b82f6] transition-colors text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 bg-[#2563eb] text-[#ffffff] font-medium rounded-lg hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
