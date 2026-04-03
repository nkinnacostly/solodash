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
  Download,
  Copy,
  CheckCircle,
} from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";

interface Contract {
  id: string;
  title: string;
  type: string;
  status: string;
  content: string;
  value: number;
  currency: string;
  start_date: string;
  end_date: string | null;
  sent_at: string | null;
  client_signed_at: string | null;
  client_signature_url: string | null;
  created_at: string;
  clients: {
    name: string;
    email: string;
    address: string | null;
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

export default function ContractDetailPage() {
  const router = useRouter();
  const params = useParams();
  const contractId = params.id as string;
  const { toast } = useToast();

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingLoading, setSendingLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchContract();
  }, [contractId]);

  const fetchContract = async () => {
    try {
      const response = await fetch(`/api/contracts/${contractId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch contract");
      }

      setContract(data.contract);
    } catch (err: any) {
      toast.error("Failed to load contract", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    setSendingLoading(true);

    try {
      const response = await fetch(`/api/contracts/${contractId}/send`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send contract");
      }

      toast.success("Contract sent", "Email delivered to client");
      fetchContract();
    } catch (err: any) {
      toast.error("Failed to send", err.message);
    } finally {
      setSendingLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);

    try {
      const response = await fetch(`/api/contracts/${contractId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete contract");
      }

      toast.success("Contract deleted");
      router.push("/contracts");
    } catch (err: any) {
      toast.error("Failed to delete", err.message);
      setDeleteLoading(false);
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleCopySigningLink = () => {
    const signingLink = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/sign/${contractId}`;
    navigator.clipboard.writeText(signingLink);
    toast.success("Copied", "Signing link copied to clipboard");
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
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-[#18181b] rounded w-48" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-[800px] bg-[#18181b] rounded-xl" />
            <div className="h-[800px] bg-[#18181b] rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="max-w-7xl mx-auto text-center py-20">
        <p className="text-[#a1a1aa]">Contract not found</p>
        <Link
          href="/contracts"
          className="text-[#10b981] hover:underline mt-4 inline-block"
        >
          ← Back to Contracts
        </Link>
      </div>
    );
  }

  const timeline = [
    { label: "Created", date: contract.created_at, active: true },
    { label: "Sent", date: contract.sent_at, active: !!contract.sent_at },
    {
      label: "Signed",
      date: contract.client_signed_at,
      active: !!contract.client_signed_at,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/contracts"
          className="p-2 hover:bg-[#18181b] rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-[#a1a1aa]" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">{contract.title}</h1>
          <p className="text-[#a1a1aa] mt-1">
            {contract.clients?.name || "No client"}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* LEFT: Contract Content */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <div dangerouslySetInnerHTML={{ __html: contract.content }} />

            {/* Signature Section — shown after signing */}
            {contract.client_signed_at && (
              <div
                style={{
                  marginTop: "48px",
                  paddingTop: "24px",
                  borderTop: "2px solid #e5e7eb",
                }}
              >
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    marginBottom: "24px",
                    color: "#0f0f0f",
                  }}
                >
                  Digital Signatures
                </h3>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "48px",
                  }}
                >
                  {/* Freelancer side */}
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        marginBottom: "8px",
                      }}
                    >
                      Contractor
                    </p>
                    <div
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        padding: "16px",
                        background: "#f9fafb",
                        minHeight: "60px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <p style={{ fontSize: "14px", color: "#374151" }}>
                        Signed by {contract.clients?.name || "Contractor"} via
                        Paidly
                      </p>
                    </div>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        marginTop: "8px",
                      }}
                    >
                      Awaiting freelancer signature
                    </p>
                  </div>

                  {/* Client side */}
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        marginBottom: "8px",
                      }}
                    >
                      Client
                    </p>
                    <div
                      style={{
                        border: "1px solid #10b981",
                        borderRadius: "8px",
                        padding: "16px",
                        background: "#f0fdf4",
                        minHeight: "60px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      {contract.client_signature_url ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents/${contract.client_signature_url}`}
                          alt="Client signature"
                          style={{
                            maxHeight: "50px",
                            maxWidth: "200px",
                            objectFit: "contain",
                          }}
                        />
                      ) : (
                        <p
                          style={{
                            fontSize: "20px",
                            fontFamily: "cursive",
                            color: "#374151",
                          }}
                        >
                          {contract.clients?.name}
                        </p>
                      )}
                      <span
                        style={{
                          fontSize: "11px",
                          background: "#10b981",
                          color: "white",
                          padding: "2px 8px",
                          borderRadius: "20px",
                          marginLeft: "12px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        ✓ Signed
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        marginTop: "8px",
                      }}
                    >
                      Signed on {formatDate(contract.client_signed_at)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Actions Panel */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Contract Details
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-xs text-[#a1a1aa] mb-1">Status</p>
                <span
                  className={`inline-block px-3 py-1 rounded text-sm font-medium ${statusColors[contract.status]}`}
                >
                  {contract.status}
                </span>
              </div>

              <div>
                <p className="text-xs text-[#a1a1aa] mb-1">Type</p>
                <span
                  className={`inline-block px-3 py-1 rounded text-sm font-medium ${typeColors[contract.type]}`}
                >
                  {contract.type}
                </span>
              </div>

              <div>
                <p className="text-xs text-[#a1a1aa] mb-1">Client</p>
                <p className="text-sm text-white">
                  {contract.clients?.name || "N/A"}
                </p>
              </div>

              <div>
                <p className="text-xs text-[#a1a1aa] mb-1">Start Date</p>
                <p className="text-sm text-white">
                  {formatDate(contract.start_date)}
                </p>
              </div>

              {contract.end_date && (
                <div>
                  <p className="text-xs text-[#a1a1aa] mb-1">End Date</p>
                  <p className="text-sm text-white">
                    {formatDate(contract.end_date)}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {contract.status === "draft" && (
                <>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={sendingLoading}
                    className="w-full py-3 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {sendingLoading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        <Send size={18} />
                        Send for Signature
                      </>
                    )}
                  </button>
                  <Link
                    href={`/contracts/${contract.id}/edit`}
                    className="w-full py-3 border border-[#27272a] text-white font-medium rounded-lg hover:border-[#10b981] transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit size={18} />
                    Edit Contract
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowDeleteDialog(true)}
                    className="w-full py-3 border border-[#ef4444]/30 text-[#ef4444] font-medium rounded-lg hover:bg-[#ef4444]/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={18} />
                    Delete Contract
                  </button>
                </>
              )}

              {contract.status === "sent" && (
                <>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={sendingLoading}
                    className="w-full py-3 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {sendingLoading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        <Send size={18} />
                        Resend
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopySigningLink}
                    className="w-full py-3 border border-[#27272a] text-white font-medium rounded-lg hover:border-[#10b981] transition-colors flex items-center justify-center gap-2"
                  >
                    <Copy size={18} />
                    Copy Signing Link
                  </button>
                </>
              )}

              {(contract.status === "signed" ||
                contract.status === "active") && (
                <>
                  <button
                    type="button"
                    className="w-full py-3 border border-[#27272a] text-white font-medium rounded-lg hover:border-[#10b981] transition-colors flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    Download PDF
                  </button>
                  {contract.client_signed_at && (
                    <div className="bg-[#052e16] border border-[#10b981]/30 rounded-lg p-3 text-center">
                      <CheckCircle
                        size={16}
                        className="text-[#10b981] mx-auto mb-1"
                      />
                      <p className="text-xs text-[#10b981]">
                        Signed on {formatDate(contract.client_signed_at)}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Timeline</h3>
            <div className="space-y-4">
              {timeline.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div
                    className={`w-3 h-3 rounded-full mt-1 ${
                      item.active ? "bg-[#10b981]" : "bg-[#27272a]"
                    }`}
                  />
                  <div className="flex-1">
                    <p
                      className={`text-sm ${
                        item.active ? "text-white" : "text-[#a1a1aa]"
                      }`}
                    >
                      {item.label}
                    </p>
                    {item.date && (
                      <p className="text-xs text-[#a1a1aa] mt-0.5">
                        {formatDate(item.date)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Contract"
        message={`Are you sure you want to delete "${contract.title}"? This action cannot be undone.`}
        confirmLabel="Delete Contract"
        cancelLabel="Keep It"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
