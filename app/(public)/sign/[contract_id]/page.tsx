"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  Suspense,
  type CSSProperties,
} from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, PenTool, Type, X, Download } from "lucide-react";
import { sanitizeContractHtml } from "@/lib/sanitize-html";

// Signature block styles (rendered on the white contract document).
const sigLabel: CSSProperties = {
  fontSize: "12px",
  color: "#6b7280",
  marginBottom: "8px",
};
const sigBox: CSSProperties = {
  border: "1px solid #57c9b0",
  borderRadius: "8px",
  padding: "16px",
  background: "#f4fbf8",
  minHeight: "60px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};
const sigCursive: CSSProperties = {
  fontSize: "20px",
  fontFamily: "cursive",
  color: "#374151",
  margin: 0,
};
const sigName: CSSProperties = {
  fontSize: "14px",
  color: "#374151",
  margin: 0,
};
const sigImg: CSSProperties = {
  maxHeight: "50px",
  maxWidth: "200px",
  objectFit: "contain",
};
const sigBadge: CSSProperties = {
  fontSize: "11px",
  background: "#57c9b0",
  color: "#ffffff",
  padding: "2px 8px",
  borderRadius: "20px",
  marginLeft: "12px",
  whiteSpace: "nowrap",
};
const sigDate: CSSProperties = {
  fontSize: "12px",
  color: "#6b7280",
  marginTop: "8px",
};
const sigPending: CSSProperties = {
  border: "1px dashed #d1d5db",
  borderRadius: "8px",
  padding: "16px",
  background: "#f9fafb",
  minHeight: "60px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "14px",
  color: "#9ca3af",
};

interface Contract {
  id: string;
  title: string;
  content: string;
  status: string;
  client_signed_at: string | null;
  freelancer_signed_at: string | null;
  signature_signed_url: string | null;
  freelancer_signature_signed_url: string | null;
  freelancer_signature_typed: string | null;
  freelancer: {
    name: string;
    business_name: string | null;
    logo_url: string | null;
    brand_color: string | null;
  };
  is_pro: boolean;
  client: {
    name: string;
    email: string;
  };
}

export default function SignContractPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#14171d] flex items-center justify-center p-4">
          <Loader2 size={32} className="text-[#6ea8ff] animate-spin" />
        </div>
      }
    >
      <SignContractContent />
    </Suspense>
  );
}

function SignContractContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const contractId = params.contract_id as string;
  const linkToken = searchParams.get("token");

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signingSuccess, setSigningSuccess] = useState(false);

  // Signature state
  const [activeTab, setActiveTab] = useState<"draw" | "type">("draw");
  const [signatureData, setSignatureData] = useState<string>("");
  const [signatureType, setSignatureType] = useState<"drawn" | "typed">(
    "drawn",
  );
  const [typedName, setTypedName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [signingLoading, setSigningLoading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const signApiUrl = () => {
    const qs = linkToken
      ? `?token=${encodeURIComponent(linkToken)}`
      : "";
    return `/api/sign/${contractId}${qs}`;
  };

  useEffect(() => {
    fetchContract();
  }, [contractId, linkToken]);

  useEffect(() => {
    if (activeTab === "draw") {
      initCanvas();
    }
  }, [activeTab]);

  const fetchContract = async () => {
    try {
      const response = await fetch(signApiUrl());
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Contract not found");
      }

      setContract(data.contract);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      setIsDrawing(true);
      const pos = getPos(e);
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      }
    },
    [getPos],
  );

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!isDrawing) return;

      const pos = getPos(e);
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
    },
    [isDrawing, getPos],
  );

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    // Save canvas as base64
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureData(canvas.toDataURL("image/png"));
    }
  }, []);

  const clearCanvas = () => {
    initCanvas();
    setSignatureData("");
  };

  const handleTypeSignature = (name: string) => {
    setTypedName(name);
    setSignatureData(name);
  };

  const handleSignContract = async () => {
    if (!signatureData || !agreed || !signerName || !signerEmail) return;

    setSigningLoading(true);

    try {
      const response = await fetch(signApiUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signature_data: signatureData,
          signature_type: activeTab === "draw" ? "drawn" : "typed",
          signer_name: signerName,
          signer_email: signerEmail,
          ...(linkToken ? { token: linkToken } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to sign contract");
      }

      setSigningSuccess(true);
      setContract((prev) =>
        prev ? { ...prev, client_signed_at: new Date().toISOString() } : null,
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSigningLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const canSign = signatureData && agreed && signerName && signerEmail;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#14171d] flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-[#1c202a] rounded w-48 mx-auto" />
            <div className="h-64 bg-[#1c202a] rounded" />
            <div className="h-40 bg-[#1c202a] rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#14171d] flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-white mb-2">
            Contract not found
          </h1>
          <p className="text-[#8f9db1]">
            This contract may have been cancelled or removed.
          </p>
        </div>
      </div>
    );
  }

  if (!contract) return null;

  if (signingSuccess) {
    return (
      <div className="min-h-screen bg-[#14171d] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#1c202a] border border-[#2a303c] rounded-xl p-8 text-center">
          <CheckCircle size={64} className="text-[#6ea8ff] mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-2">
            Contract signed successfully!
          </h1>
          <p className="text-[#8f9db1] mb-6">
            A copy has been sent to your email.
          </p>
          <p className="text-lg text-[#6ea8ff] font-medium">
            Thank you, {signerName}
          </p>
        </div>
      </div>
    );
  }

  const handleDownloadPdf = () => {
    // Mirrors the app-side contract download: browser print scoped to
    // #contract-document via @media print in globals.css (no server PDF).
    const originalTitle = document.title;
    const restore = () => {
      document.title = originalTitle;
      window.removeEventListener("afterprint", restore);
    };
    document.title = `${contract.title || "Contract"} — Paidly`;
    window.addEventListener("afterprint", restore);
    window.print();
  };

  const brandColor =
    (contract.is_pro && contract.freelancer.brand_color) || "#6ea8ff";

  return (
    <div className="min-h-screen bg-[#14171d] p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header — Pro users show their own branding, else Paidly */}
        <div className="text-center mb-8 pt-8">
          {contract.is_pro && contract.freelancer.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={contract.freelancer.logo_url}
              alt={
                contract.freelancer.business_name ||
                contract.freelancer.name ||
                "Logo"
              }
              className="h-12 w-auto object-contain mx-auto mb-2"
            />
          ) : (
            <h1
              className="text-3xl font-bold mb-2"
              style={{ color: brandColor }}
            >
              {contract.is_pro &&
              (contract.freelancer.business_name || contract.freelancer.name)
                ? contract.freelancer.business_name ||
                  contract.freelancer.name
                : "Paidly"}
            </h1>
          )}
          <p className="text-[#8f9db1]">Contract for signature</p>
        </div>

        {/* Already Signed Banner */}
        {contract.client_signed_at && (
          <div className="bg-[#0c2e26] border border-[#57c9b0]/30 rounded-xl p-6 text-center mb-6">
            <CheckCircle size={32} className="text-[#6ea8ff] mx-auto mb-3" />
            <p className="text-lg font-semibold text-[#6ea8ff] mb-1">
              This contract has already been signed
            </p>
            <p className="text-sm text-[#8f9db1]">
              Signed on {formatDate(contract.client_signed_at)}
            </p>
          </div>
        )}

        {/* Contract Info */}
        <div className="bg-[#1c202a] border border-[#2a303c] rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-2">
            {contract.title}
          </h2>
          <p className="text-sm text-[#8f9db1]">
            From:{" "}
            {contract.freelancer.business_name || contract.freelancer.name}
          </p>
        </div>

        {/* Contract document — always visible so the client can read and save
            a branded copy, whether or not it's already signed. */}
        <div className="max-h-[600px] overflow-y-auto mb-4">
          <div
            id="contract-document"
            className="relative bg-white rounded-xl p-10 shadow-lg overflow-hidden"
          >
            {/* Watermark — Pro only */}
            {contract.is_pro && (
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
                {contract.freelancer.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={contract.freelancer.logo_url}
                    alt="watermark"
                    style={{ width: 220, height: 220, objectFit: "contain" }}
                  />
                ) : (
                  <p
                    style={{
                      fontSize: "64px",
                      fontWeight: "bold",
                      color: brandColor,
                      whiteSpace: "nowrap",
                      margin: 0,
                    }}
                  >
                    {contract.freelancer.business_name || "Paidly"}
                  </p>
                )}
              </div>
            )}

            <div
              style={{ position: "relative", zIndex: 1 }}
              dangerouslySetInnerHTML={{
                __html: sanitizeContractHtml(
                  contract.content ||
                    (contract as { content_html?: string }).content_html ||
                    "",
                ),
              }}
            />

            {/* Digital Signatures — inside the document so they appear in the
                downloaded/printed PDF. */}
            {(contract.client_signed_at || contract.freelancer_signed_at) && (
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  marginTop: "48px",
                  paddingTop: "24px",
                  borderTop: "2px solid #e5e7eb",
                }}
              >
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    marginBottom: "20px",
                    color: "#14171d",
                  }}
                >
                  Digital Signatures
                </h3>
                <div style={{ display: "flex", gap: "40px" }}>
                  {/* Contractor */}
                  <div style={{ flex: 1 }}>
                    <p style={sigLabel}>Contractor</p>
                    {contract.freelancer_signed_at ? (
                      <>
                        <div style={sigBox}>
                          {contract.freelancer_signature_typed ? (
                            <p style={sigCursive}>
                              {contract.freelancer_signature_typed}
                            </p>
                          ) : contract.freelancer_signature_signed_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={contract.freelancer_signature_signed_url}
                              alt="Contractor signature"
                              style={sigImg}
                            />
                          ) : (
                            <p style={sigName}>{contract.freelancer.name}</p>
                          )}
                          <span style={sigBadge}>✓ Signed</span>
                        </div>
                        <p style={sigDate}>
                          Signed on {formatDate(contract.freelancer_signed_at)}
                        </p>
                      </>
                    ) : (
                      <div style={sigPending}>Awaiting signature</div>
                    )}
                  </div>

                  {/* Client */}
                  <div style={{ flex: 1 }}>
                    <p style={sigLabel}>Client</p>
                    {contract.client_signed_at ? (
                      <>
                        <div style={sigBox}>
                          {contract.signature_signed_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={contract.signature_signed_url}
                              alt="Client signature"
                              style={sigImg}
                            />
                          ) : (
                            <p style={sigCursive}>{contract.client.name}</p>
                          )}
                          <span style={sigBadge}>✓ Signed</span>
                        </div>
                        <p style={sigDate}>
                          Signed on {formatDate(contract.client_signed_at)}
                        </p>
                      </>
                    ) : (
                      <div style={sigPending}>Awaiting signature</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Download a branded copy */}
        <button
          type="button"
          onClick={handleDownloadPdf}
          className="w-full py-3 mb-6 border border-[#2a303c] text-white font-medium rounded-lg hover:border-[#6ea8ff] transition-colors flex items-center justify-center gap-2"
        >
          <Download size={16} />
          Download PDF
        </button>

        {/* Signature Section */}
        {!contract.client_signed_at && (
          <>
            <div className="bg-[#1c202a] border border-[#2a303c] rounded-xl p-6 space-y-6">
              <h3 className="text-lg font-semibold text-white">
                Sign this contract
              </h3>

              {/* Tabs */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("draw")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === "draw"
                      ? "bg-[#6ea8ff] text-[#0e1116]"
                      : "bg-[#171b23] text-[#8f9db1] hover:text-white"
                  }`}
                >
                  <PenTool size={16} />
                  Draw
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("type")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === "type"
                      ? "bg-[#6ea8ff] text-[#0e1116]"
                      : "bg-[#171b23] text-[#8f9db1] hover:text-white"
                  }`}
                >
                  <Type size={16} />
                  Type
                </button>
              </div>

              {/* Draw Tab */}
              {activeTab === "draw" && (
                <div>
                  <div className="relative bg-white rounded-lg overflow-hidden">
                    <canvas
                      ref={canvasRef}
                      width={640}
                      height={200}
                      className="w-full h-48 cursor-crosshair touch-none"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="absolute top-2 right-2 p-2 bg-[#ef4444] text-white rounded-lg hover:bg-[#dc2626] transition-colors"
                      title="Clear signature"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <p className="text-xs text-[#8f9db1] mt-2">
                    Sign with your mouse or finger
                  </p>
                </div>
              )}

              {/* Type Tab */}
              {activeTab === "type" && (
                <div>
                  <input
                    type="text"
                    value={typedName}
                    onChange={(e) => handleTypeSignature(e.target.value)}
                    placeholder="Type your full name"
                    className="w-full px-4 py-3 bg-[#171b23] border border-[#2a303c] rounded-lg text-white placeholder-[#8f9db1] focus:border-[#6ea8ff] focus:outline-none mb-3"
                  />
                  {typedName && (
                    <div className="bg-white rounded-lg p-6 text-center">
                      <p
                        className="text-4xl text-[#1a1a1a]"
                        style={{
                          fontFamily:
                            "'Brush Script MT', 'Dancing Script', cursive",
                        }}
                      >
                        {typedName}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Agreement Checkbox */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 text-[#6ea8ff] border-[#2a303c] rounded focus:ring-[#6ea8ff]"
                />
                <label className="text-sm text-[#8f9db1]">
                  I agree to the terms of this contract and understand this is a
                  legally binding digital signature
                </label>
              </div>

              {/* Signer Details */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Your full name *
                  </label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-2 bg-[#171b23] border border-[#2a303c] rounded-lg text-white placeholder-[#8f9db1] focus:border-[#6ea8ff] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Your email *
                  </label>
                  <input
                    type="email"
                    value={signerEmail}
                    onChange={(e) => setSignerEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-4 py-2 bg-[#171b23] border border-[#2a303c] rounded-lg text-white placeholder-[#8f9db1] focus:border-[#6ea8ff] focus:outline-none"
                  />
                </div>
              </div>

              {/* Sign Button */}
              <button
                type="button"
                onClick={handleSignContract}
                disabled={!canSign || signingLoading}
                className="w-full py-3 bg-[#6ea8ff] text-[#0e1116] font-medium rounded-lg hover:bg-[#5b93e6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {signingLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>Sign Contract</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
