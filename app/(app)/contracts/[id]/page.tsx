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
  ExternalLink,
} from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import SignatureModal from "@/components/SignatureModal";
import { useToast } from "@/components/ui/Toast";
import { sanitizeContractHtml } from "@/lib/sanitize-html";

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
  signature_signed_url: string | null;
  freelancer_signed_at: string | null;
  freelancer_signature_url: string | null;
  freelancer_signature_signed_url: string | null;
  created_at: string;
  clients: {
    name: string;
    email: string;
    address: string | null;
  } | null;
  profiles: {
    name: string;
    business_name: string;
  } | null;
}

const statusColors: Record<string, string> = {
  draft: "bg-[#26262e] text-[#a1a1aa]",
  sending: "bg-[#26262e] text-[#a1a1aa]",
  sent: "bg-[#1e3a5f] text-[#60a5fa]",
  signed: "bg-[#0c2e26] text-[#57c9b0]",
  active: "bg-[#0c2e26] text-[#57c9b0]",
  completed: "bg-[#26262e] text-[#6b7280]",
};

const typeColors: Record<string, string> = {
  hourly: "bg-[#1e3a5f] text-[#60a5fa]",
  project: "bg-[#3b0764] text-[#a78bfa]",
  retainer: "bg-[#3d2e00] text-[#e6b566]",
};

export default function ContractDetailPage() {
  const router = useRouter();
  const params = useParams();
  const contractId = params.id as string;
  const { toast } = useToast();

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingLoading, setSendingLoading] = useState(false);
  const [sendingPoll, setSendingPoll] = useState<ReturnType<
    typeof setInterval
  > | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [signingLoading, setSigningLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [publicLinkLoading, setPublicLinkLoading] = useState(false);

  useEffect(() => {
    fetchContract();
    fetch("/api/settings/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) setUserProfile(data.profile);
      })
      .catch(() => {});
  }, [contractId]);

  useEffect(() => {
    if (!contract?.id || contract.status !== "sent") {
      setPublicUrl(null);
      setPublicLinkLoading(false);
      return;
    }

    setPublicLinkLoading(true);
    fetch(`/api/contracts/${contract.id}/public-link`)
      .then((r) => r.json())
      .then((data) => {
        if (data.url) setPublicUrl(data.url);
        else setPublicUrl(null);
      })
      .catch(() => setPublicUrl(null))
      .finally(() => setPublicLinkLoading(false));
  }, [contract?.id, contract?.status]);

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

  const handleDownloadPdf = () => {
    // No server-side contract PDF pipeline exists — use the browser's
    // print-to-PDF, scoped to #contract-document via @media print in globals.css.
    const originalTitle = document.title;
    const restore = () => {
      document.title = originalTitle;
      window.removeEventListener("afterprint", restore);
    };
    document.title = `${contract?.title || "Contract"} — Paidly`;
    window.addEventListener("afterprint", restore);
    window.print();
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

      toast.success(
        "Sending contract...",
        "You can navigate away — we'll update status when complete",
      );

      const interval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/contracts/${contractId}`);
          const statusData = await statusRes.json();
          const currentStatus = statusData.contract?.status;

          if (currentStatus === "sent") {
            clearInterval(interval);
            setSendingPoll(null);
            toast.success("Contract sent ✓");
            fetchContract();
          } else if (currentStatus === "draft") {
            clearInterval(interval);
            setSendingPoll(null);
            toast.error("Failed to send contract", "Please try again");
            fetchContract();
          }
        } catch {
          // keep polling
        }
      }, 2000);

      setSendingPoll(interval);
      fetchContract();
    } catch (err: unknown) {
      toast.error(
        "Failed to send",
        err instanceof Error ? err.message : "Unknown error",
      );
    } finally {
      setSendingLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (sendingPoll) clearInterval(sendingPoll);
    };
  }, [sendingPoll]);

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

  const handleFreelancerSign = async (
    signatureData: string,
    signatureType: "drawn" | "typed",
  ) => {
    setSigningLoading(true);
    try {
      const response = await fetch(
        `/api/contracts/${contractId}/sign-freelancer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            signature_data: signatureData,
            signature_type: signatureType,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      toast.success("Contract signed successfully");
      setShowSignModal(false);
      fetchContract();
    } catch (err: any) {
      toast.error("Failed to sign", err.message);
    } finally {
      setSigningLoading(false);
    }
  };

  const handleCopySigningLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    toast.success("Copied", "Signing link copied to clipboard");
  };

  const handlePreviewSignPage = () => {
    if (!publicUrl) return;
    window.open(publicUrl, "_blank", "noopener,noreferrer");
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
          <div className="h-8 bg-[#141419] rounded w-48" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-[800px] bg-[#141419] rounded-xl" />
            <div className="h-[800px] bg-[#141419] rounded-xl" />
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
          className="text-[#3b82f6] hover:underline mt-4 inline-block"
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
          className="p-2 hover:bg-[#141419] rounded-lg transition-colors"
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
          <div
            id="contract-document"
            className="bg-white rounded-xl shadow-lg overflow-hidden relative"
          >
            {/* Document header bar */}
            <div style={{ background: "#3b82f6" }} className="h-2 w-full" />

            <div className="p-10 relative" style={{ zIndex: 1 }}>
              {/* Watermark — Pro only */}
              {userProfile?.plan === "pro" && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%) rotate(-20deg)",
                    opacity: 0.08,
                    pointerEvents: "none",
                    zIndex: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                  }}
                >
                  {userProfile.logo_url ? (
                    <img
                      src={userProfile.logo_url}
                      alt="watermark"
                      style={{
                        width: 220,
                        height: 220,
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <p
                      style={{
                        fontSize: "64px",
                        fontWeight: "bold",
                        color: userProfile.brand_color || "#3b82f6",
                        whiteSpace: "nowrap",
                        margin: 0,
                      }}
                    >
                      {userProfile.business_name || "Paidly"}
                    </p>
                  )}
                </div>
              )}

              {/* Paidly watermark top right */}
              <div className="flex justify-end mb-6">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  Generated by
                  <span className="text-[#2563eb] font-semibold">Paidly</span>
                </span>
              </div>

              {/* Contract content with proper typography */}
              <div
                className="contract-content"
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "14px",
                  lineHeight: "1.8",
                  color: "#1a1a1a",
                }}
                dangerouslySetInnerHTML={{
                  __html: sanitizeContractHtml(
                    contract.content ||
                      (contract as { content_html?: string }).content_html ||
                      ""
                  ),
                }}
              />

              {/* Document footer */}
              <div className="mt-12 pt-6 border-t border-gray-200 flex justify-between items-center">
                <span className="text-xs text-gray-400">
                  Contract ID: {contract.id}
                </span>
                <span className="text-xs text-gray-400">
                  Status:{" "}
                  <span className="font-medium capitalize">
                    {contract.status}
                  </span>
                </span>
              </div>

              {/* Signature Section — shown when either party has signed or contract is signable */}
              {(contract.client_signed_at ||
                contract.freelancer_signed_at ||
                contract.status === "sent" ||
                contract.status === "signed") && (
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
                      color: "#0a0a0b",
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
                      {contract.freelancer_signed_at ? (
                        <>
                          <div
                            style={{
                              border: "1px solid #3b82f6",
                              borderRadius: "8px",
                              padding: "16px",
                              background: "#f0fdf4",
                              minHeight: "60px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            {contract.freelancer_signature_url?.startsWith(
                              "typed:",
                            ) ? (
                              <p
                                style={{
                                  fontSize: "20px",
                                  fontFamily: "cursive",
                                  color: "#374151",
                                }}
                              >
                                {contract.freelancer_signature_url.replace(
                                  "typed:",
                                  "",
                                )}
                              </p>
                            ) : contract.freelancer_signature_signed_url ? (
                              <img
                                src={contract.freelancer_signature_signed_url}
                                alt="Freelancer signature"
                                style={{
                                  maxHeight: "50px",
                                  maxWidth: "200px",
                                  objectFit: "contain",
                                }}
                              />
                            ) : (
                              <p style={{ fontSize: "14px", color: "#374151" }}>
                                {contract.profiles?.name || "Contractor"}
                              </p>
                            )}
                            <span
                              style={{
                                fontSize: "11px",
                                background: "#3b82f6",
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
                            Signed on{" "}
                            {formatDate(contract.freelancer_signed_at)}
                          </p>
                        </>
                      ) : (
                        <>
                          <div
                            style={{
                              border: "1px dashed #d1d5db",
                              borderRadius: "8px",
                              padding: "16px",
                              background: "#f9fafb",
                              minHeight: "60px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <p style={{ fontSize: "14px", color: "#9ca3af" }}>
                              Awaiting your signature
                            </p>
                          </div>
                          {(contract.status === "sent" ||
                            contract.status === "signed") && (
                            <button
                              onClick={() => setShowSignModal(true)}
                              style={{
                                fontSize: "13px",
                                color: "#2563eb",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                marginTop: "8px",
                                padding: 0,
                                fontWeight: 500,
                              }}
                            >
                              Sign now →
                            </button>
                          )}
                        </>
                      )}
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
                      {contract.client_signed_at ? (
                        <>
                          <div
                            style={{
                              border: "1px solid #3b82f6",
                              borderRadius: "8px",
                              padding: "16px",
                              background: "#f0fdf4",
                              minHeight: "60px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            {contract.signature_signed_url ? (
                              <img
                                src={contract.signature_signed_url}
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
                                background: "#3b82f6",
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
                        </>
                      ) : (
                        <div
                          style={{
                            border: "1px dashed #d1d5db",
                            borderRadius: "8px",
                            padding: "16px",
                            background: "#f9fafb",
                            minHeight: "60px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <p style={{ fontSize: "14px", color: "#9ca3af" }}>
                            Awaiting client signature
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Actions Panel */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-[#141419] border border-[#26262e] rounded-xl p-6 sticky top-6">
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
              {contract.status === "sending" && (
                <button
                  type="button"
                  disabled
                  className="w-full py-3 bg-[#26262e] text-[#a1a1aa] font-medium rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Loader2 size={20} className="animate-spin" />
                  Sending...
                </button>
              )}

              {contract.status === "draft" && (
                <>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={sendingLoading}
                    className="w-full py-3 bg-[#2563eb] text-[#ffffff] font-medium rounded-lg hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
                    className="w-full py-3 border border-[#26262e] text-white font-medium rounded-lg hover:border-[#3b82f6] transition-colors flex items-center justify-center gap-2"
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
                  {!contract.freelancer_signed_at && (
                    <button
                      type="button"
                      onClick={() => setShowSignModal(true)}
                      className="w-full py-3 bg-[#2563eb] text-[#ffffff] font-medium rounded-lg hover:bg-[#1d4ed8] transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={18} />
                      Sign Contract
                    </button>
                  )}
                  {/* Editable while awaiting the client — but not after either
                      party has signed (would invalidate a signature). */}
                  {!contract.freelancer_signed_at &&
                    !contract.client_signed_at && (
                      <Link
                        href={`/contracts/${contract.id}/edit`}
                        className="w-full py-3 border border-[#26262e] text-white font-medium rounded-lg hover:border-[#3b82f6] transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit size={18} />
                        Edit Contract
                      </Link>
                    )}
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={sendingLoading}
                    className="w-full py-3 border border-[#26262e] text-white font-medium rounded-lg hover:border-[#3b82f6] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
                    onClick={handlePreviewSignPage}
                    disabled={publicLinkLoading || !publicUrl}
                    className="w-full py-3 border border-[#26262e] text-white font-medium rounded-lg hover:border-[#3b82f6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {publicLinkLoading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <ExternalLink size={18} />
                    )}
                    Preview Sign Page
                  </button>
                  <button
                    type="button"
                    onClick={handleCopySigningLink}
                    disabled={publicLinkLoading || !publicUrl}
                    className="w-full py-3 border border-[#26262e] text-white font-medium rounded-lg hover:border-[#3b82f6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Copy size={18} />
                    Copy Signing Link
                  </button>
                </>
              )}

              {(contract.status === "signed" ||
                contract.status === "active") && (
                <>
                  {!contract.freelancer_signed_at && (
                    <button
                      type="button"
                      onClick={() => setShowSignModal(true)}
                      className="w-full py-3 bg-[#2563eb] text-[#ffffff] font-medium rounded-lg hover:bg-[#1d4ed8] transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={18} />
                      Sign Contract
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="w-full py-3 border border-[#26262e] text-white font-medium rounded-lg cursor-pointer hover:border-[#3b82f6] hover:text-[#3b82f6] transition-colors flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    Download PDF
                  </button>
                  {contract.freelancer_signed_at && (
                    <div className="bg-[#0c2e26] border border-[#57c9b0]/30 rounded-lg p-3 text-center">
                      <CheckCircle
                        size={16}
                        className="text-[#3b82f6] mx-auto mb-1"
                      />
                      <p className="text-xs text-[#3b82f6]">
                        You signed on{" "}
                        {formatDate(contract.freelancer_signed_at)}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-[#141419] border border-[#26262e] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Timeline</h3>
            <div className="space-y-4">
              {timeline.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div
                    className={`w-3 h-3 rounded-full mt-1 ${
                      item.active ? "bg-[#3b82f6]" : "bg-[#26262e]"
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

      {/* Signature Modal */}
      <SignatureModal
        isOpen={showSignModal}
        onClose={() => setShowSignModal(false)}
        onSign={handleFreelancerSign}
        loading={signingLoading}
        title="Sign this contract"
        userName={contract.profiles?.name || ""}
      />
    </div>
  );
}
