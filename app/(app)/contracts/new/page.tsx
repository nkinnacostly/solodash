"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, ChevronRight } from "lucide-react";
import { contractTemplates, ContractTemplate } from "@/lib/contract-templates";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import UpgradeModal from "@/components/UpgradeModal";
import SearchableSelect from "@/components/ui/SearchableSelect";
import DatePicker from "@/components/ui/DatePicker";

const contractSchema = z.object({
  clientId: z.string().optional(),
  isNewClient: z.boolean().default(false),
  clientName: z.string().optional(),
  clientEmail: z.string().email().optional().or(z.literal("")),
  clientAddress: z.string().optional(),
  projectDescription: z
    .string()
    .min(10, "Description must be at least 10 characters"),
  scopeOfWork: z.string().min(20, "Scope must be at least 20 characters"),
  paymentTerms: z.string().min(5, "Payment terms required"),
  startDate: z.string().min(1, "Start date required"),
  endDate: z.string().optional(),
  hourlyRate: z.coerce.number().min(1).optional(),
  estimatedHours: z.coerce.number().min(1).optional(),
  projectFee: z.coerce.number().min(1).optional(),
  retainerFee: z.coerce.number().min(1).optional(),
  currency: z.string().default("USD"),
  revisions: z.coerce.number().min(1).optional(),
  governingLaw: z.string().default("Nigeria"),
});

export default function NewContractPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] =
    useState<ContractTemplate | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const supabase = createClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      isNewClient: false,
      currency: "NGN",
      governingLaw: "Nigeria",
      revisions: 2,
    },
  });

  useEffect(() => {
    fetchClients();
    fetchProfile();
  }, []);

  const fetchClients = async () => {
    const { data } = await supabase
      .from("clients")
      .select("id, name, email")
      .order("name");
    setClients(data || []);
  };

  const fetchProfile = async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, business_name")
        .eq("id", data.user.id)
        .single();
      setProfile(profile);
    }
  };

  const handleTemplateSelect = (template: ContractTemplate) => {
    setSelectedTemplate(template);
  };

  const handleNext = () => {
    if (!selectedTemplate) return;
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const onSubmit = async (data: any, status: "draft" | "sent") => {
    if (!selectedTemplate) return;

    const setLoading = status === "draft" ? setDraftLoading : setSendLoading;
    setLoading(true);

    try {
      const response = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          clientId: data.clientId || null,
          isNewClient: data.isNewClient,
          clientName: data.isNewClient ? data.clientName : undefined,
          clientEmail: data.isNewClient ? data.clientEmail : undefined,
          clientAddress: data.clientAddress || null,
          contractData: {
            freelancerName: profile?.name || "",
            businessName: profile?.business_name || null,
            clientName: data.isNewClient
              ? data.clientName || ""
              : clients.find((c) => c.id === data.clientId)?.name || "",
            projectDescription: data.projectDescription,
            scopeOfWork: data.scopeOfWork,
            paymentTerms: data.paymentTerms,
            startDate: data.startDate,
            endDate: data.endDate || undefined,
            hourlyRate: data.hourlyRate || undefined,
            estimatedHours: data.estimatedHours || undefined,
            projectFee: data.projectFee || undefined,
            retainerFee: data.retainerFee || undefined,
            currency: data.currency,
            revisions: data.revisions || undefined,
            governingLaw: data.governingLaw,
          },
          status,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          setShowUpgradeModal(true);
          return;
        }
        throw new Error(result.error || "Failed to create contract");
      }

      if (status === "draft") {
        toast.success("Draft saved");
        router.push(`/contracts/${result.contract.id}`);
      } else {
        router.push(`/contracts/${result.contract.id}`);
      }
    } catch (err: any) {
      toast.error("Failed to save", err.message);
    } finally {
      setLoading(false);
    }
  };

  const watchIsNewClient = watch("isNewClient");

  return (
    <>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/contracts"
            className="p-2 hover:bg-[#18181b] rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-[#a1a1aa]" />
          </Link>
          <h1 className="text-3xl font-bold text-white">New Contract</h1>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-8">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              step === 1
                ? "bg-[#10b981] text-white"
                : "bg-[#18181b] text-[#a1a1aa]"
            }`}
          >
            <span className="text-sm font-medium">Step 1: Template</span>
          </div>
          <ChevronRight size={16} className="text-[#27272a]" />
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              step === 2
                ? "bg-[#10b981] text-white"
                : "bg-[#18181b] text-[#a1a1aa]"
            }`}
          >
            <span className="text-sm font-medium">Step 2: Details</span>
          </div>
        </div>

        {/* Step 1: Choose Template */}
        {step === 1 && (
          <div>
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {contractTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`p-6 border-2 rounded-xl text-left transition-all ${
                    selectedTemplate?.id === template.id
                      ? "border-[#10b981] bg-[#10b981]/5"
                      : "border-[#27272a] bg-[#18181b] hover:border-[#3f3f46]"
                  }`}
                >
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {template.name}
                  </h3>
                  <p className="text-sm text-[#a1a1aa] mb-4">
                    {template.description}
                  </p>
                  <div
                    className={`inline-block px-3 py-1 rounded text-xs font-medium ${
                      selectedTemplate?.id === template.id
                        ? "bg-[#10b981] text-white"
                        : "bg-[#27272a] text-[#a1a1aa]"
                    }`}
                  >
                    {selectedTemplate?.id === template.id
                      ? "Selected"
                      : "Select"}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={!selectedTemplate}
              className="w-full py-3 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        )}

        {/* Step 2: Fill Details */}
        {step === 2 && selectedTemplate && (
          <form onSubmit={handleSubmit((data) => onSubmit(data, "draft"))}>
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 space-y-6">
              {/* Client Selection */}
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
                  value={watchIsNewClient ? "" : watch("clientId") || ""}
                  onChange={(selectedValue) => {
                    setValue("clientId", selectedValue);
                    setValue("isNewClient", false);
                  }}
                  placeholder="Search or select a client..."
                  searchPlaceholder="Search clients..."
                  allowCustom={true}
                  onAddNew={() => {
                    setValue("isNewClient", true);
                  }}
                  error={errors.clientId?.message as string | undefined}
                />

                {/* New Client Fields */}
                {watchIsNewClient && (
                  <div className="space-y-3 mt-3">
                    <input
                      {...register("clientName")}
                      placeholder="Client name"
                      className="w-full px-4 py-2 bg-[#111111] border border-[#27272a] rounded-lg text-white placeholder-[#a1a1aa] focus:border-[#10b981] focus:outline-none"
                    />
                    <input
                      {...register("clientEmail")}
                      type="email"
                      placeholder="Client email"
                      className="w-full px-4 py-2 bg-[#111111] border border-[#27272a] rounded-lg text-white placeholder-[#a1a1aa] focus:border-[#10b981] focus:outline-none"
                    />
                    <input
                      {...register("clientAddress")}
                      placeholder="Address (optional)"
                      className="w-full px-4 py-2 bg-[#111111] border border-[#27272a] rounded-lg text-white placeholder-[#a1a1aa] focus:border-[#10b981] focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Project Description */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Project Description
                </label>
                <textarea
                  {...register("projectDescription")}
                  rows={3}
                  className="w-full px-4 py-2 bg-[#111111] border border-[#27272a] rounded-lg text-white placeholder-[#a1a1aa] focus:border-[#10b981] focus:outline-none resize-none"
                  placeholder="Brief overview of the project..."
                />
                {errors.projectDescription && (
                  <p className="text-sm text-[#ef4444] mt-1">
                    {errors.projectDescription.message}
                  </p>
                )}
              </div>

              {/* Scope of Work */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Scope of Work
                </label>
                <textarea
                  {...register("scopeOfWork")}
                  rows={5}
                  className="w-full px-4 py-2 bg-[#111111] border border-[#27272a] rounded-lg text-white placeholder-[#a1a1aa] focus:border-[#10b981] focus:outline-none resize-none"
                  placeholder="Detailed description of deliverables and responsibilities..."
                />
                {errors.scopeOfWork && (
                  <p className="text-sm text-[#ef4444] mt-1">
                    {errors.scopeOfWork.message}
                  </p>
                )}
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
                {selectedTemplate.type === "project" && (
                  <div>
                    <DatePicker
                      label="End Date"
                      value={watch("endDate") || ""}
                      onChange={(value) => setValue("endDate", value)}
                      placeholder="Select end date..."
                      minDate={watch("startDate")}
                    />
                  </div>
                )}
              </div>

              {/* Compensation Fields */}
              {selectedTemplate.type === "hourly" && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Hourly Rate
                    </label>
                    <input
                      {...register("hourlyRate")}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full px-4 py-2 bg-[#111111] border border-[#27272a] rounded-lg text-white placeholder-[#a1a1aa] focus:border-[#10b981] focus:outline-none"
                    />
                    {errors.hourlyRate && (
                      <p className="text-sm text-[#ef4444] mt-1">
                        {errors.hourlyRate.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Estimated Hours
                    </label>
                    <input
                      {...register("estimatedHours")}
                      type="number"
                      placeholder="0"
                      className="w-full px-4 py-2 bg-[#111111] border border-[#27272a] rounded-lg text-white placeholder-[#a1a1aa] focus:border-[#10b981] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {selectedTemplate.type === "project" && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Project Fee
                    </label>
                    <input
                      {...register("projectFee")}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full px-4 py-2 bg-[#111111] border border-[#27272a] rounded-lg text-white placeholder-[#a1a1aa] focus:border-[#10b981] focus:outline-none"
                    />
                    {errors.projectFee && (
                      <p className="text-sm text-[#ef4444] mt-1">
                        {errors.projectFee.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Revisions Allowed
                    </label>
                    <input
                      {...register("revisions")}
                      type="number"
                      placeholder="2"
                      className="w-full px-4 py-2 bg-[#111111] border border-[#27272a] rounded-lg text-white placeholder-[#a1a1aa] focus:border-[#10b981] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {selectedTemplate.type === "retainer" && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Monthly Retainer Fee
                  </label>
                  <input
                    {...register("retainerFee")}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-4 py-2 bg-[#111111] border border-[#27272a] rounded-lg text-white placeholder-[#a1a1aa] focus:border-[#10b981] focus:outline-none"
                  />
                  {errors.retainerFee && (
                    <p className="text-sm text-[#ef4444] mt-1">
                      {errors.retainerFee.message}
                    </p>
                  )}
                </div>
              )}

              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Currency
                </label>
                <select
                  {...register("currency")}
                  className="w-full px-4 py-2 bg-[#111111] border border-[#27272a] rounded-lg text-white focus:border-[#10b981] focus:outline-none"
                >
                  <option value="NGN">NGN - Nigerian Naira</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GHS">GHS - Ghanaian Cedi</option>
                  <option value="KES">KES - Kenyan Shilling</option>
                  <option value="ZAR">ZAR - South African Rand</option>
                </select>
              </div>

              {/* Payment Terms */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Payment Terms
                </label>
                <input
                  {...register("paymentTerms")}
                  placeholder="e.g., 50% upfront, 50% on completion"
                  className="w-full px-4 py-2 bg-[#111111] border border-[#27272a] rounded-lg text-white placeholder-[#a1a1aa] focus:border-[#10b981] focus:outline-none"
                />
                {errors.paymentTerms && (
                  <p className="text-sm text-[#ef4444] mt-1">
                    {errors.paymentTerms.message}
                  </p>
                )}
              </div>

              {/* Governing Law */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Governing Law
                </label>
                <input
                  {...register("governingLaw")}
                  placeholder="e.g., Nigeria"
                  className="w-full px-4 py-2 bg-[#111111] border border-[#27272a] rounded-lg text-white placeholder-[#a1a1aa] focus:border-[#10b981] focus:outline-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mt-6">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 py-3 border border-[#27272a] text-white font-medium rounded-lg hover:border-[#10b981] transition-colors"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={draftLoading}
                className="flex-1 py-3 border border-[#27272a] text-white font-medium rounded-lg hover:border-[#10b981] transition-colors disabled:opacity-50"
              >
                {draftLoading ? (
                  <Loader2 size={20} className="animate-spin mx-auto" />
                ) : (
                  "Save as Draft"
                )}
              </button>
              <button
                type="button"
                onClick={handleSubmit((data) => onSubmit(data, "sent"))}
                disabled={sendLoading}
                className="flex-1 py-3 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50"
              >
                {sendLoading ? (
                  <Loader2 size={20} className="animate-spin mx-auto" />
                ) : (
                  "Save & Send"
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason="You've reached your 1 contract limit for this month"
        feature="contracts"
      />
    </>
  );
}
