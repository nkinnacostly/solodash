"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Loader2, CheckCircle, PenTool, Type, X } from "lucide-react";

interface Contract {
  id: string;
  title: string;
  content: string;
  status: string;
  client_signed_at: string | null;
  freelancer: {
    name: string;
    business_name: string | null;
  };
  client: {
    name: string;
    email: string;
  };
}

export default function SignContractPage() {
  const params = useParams();
  const contractId = params.contract_id as string;

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

  useEffect(() => {
    fetchContract();
  }, [contractId]);

  useEffect(() => {
    if (activeTab === "draw") {
      initCanvas();
    }
  }, [activeTab]);

  const fetchContract = async () => {
    try {
      const response = await fetch(`/api/sign/${contractId}`);
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
      const response = await fetch(`/api/sign/${contractId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signature_data: signatureData,
          signature_type: activeTab === "draw" ? "drawn" : "typed",
          signer_name: signerName,
          signer_email: signerEmail,
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
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-[#18181b] rounded w-48 mx-auto" />
            <div className="h-64 bg-[#18181b] rounded" />
            <div className="h-40 bg-[#18181b] rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-white mb-2">
            Contract not found
          </h1>
          <p className="text-[#a1a1aa]">
            This contract may have been cancelled or removed.
          </p>
        </div>
      </div>
    );
  }

  if (!contract) return null;

  if (signingSuccess) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#18181b] border border-[#27272a] rounded-xl p-8 text-center">
          <CheckCircle size={64} className="text-[#10b981] mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-2">
            Contract signed successfully!
          </h1>
          <p className="text-[#a1a1aa] mb-6">
            A copy has been sent to your email.
          </p>
          <p className="text-lg text-[#10b981] font-medium">
            Thank you, {signerName}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-3xl font-bold text-[#10b981] mb-2">Paidly</h1>
          <p className="text-[#a1a1aa]">Contract for signature</p>
        </div>

        {/* Already Signed Banner */}
        {contract.client_signed_at && (
          <div className="bg-[#052e16] border border-[#10b981]/30 rounded-xl p-6 text-center mb-6">
            <CheckCircle size={32} className="text-[#10b981] mx-auto mb-3" />
            <p className="text-lg font-semibold text-[#10b981] mb-1">
              This contract has already been signed
            </p>
            <p className="text-sm text-[#a1a1aa]">
              Signed on {formatDate(contract.client_signed_at)}
            </p>
          </div>
        )}

        {/* Contract Info */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-2">
            {contract.title}
          </h2>
          <p className="text-sm text-[#a1a1aa]">
            From:{" "}
            {contract.freelancer.business_name || contract.freelancer.name}
          </p>
        </div>

        {/* Contract Content */}
        {!contract.client_signed_at && (
          <>
            <div
              className="bg-white rounded-xl p-10 mb-6 shadow-lg max-h-[600px] overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: contract.content }}
            />

            {/* Signature Section */}
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 space-y-6">
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
                      ? "bg-[#10b981] text-white"
                      : "bg-[#111111] text-[#a1a1aa] hover:text-white"
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
                      ? "bg-[#10b981] text-white"
                      : "bg-[#111111] text-[#a1a1aa] hover:text-white"
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
                  <p className="text-xs text-[#a1a1aa] mt-2">
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
                    className="w-full px-4 py-3 bg-[#111111] border border-[#27272a] rounded-lg text-white placeholder-[#a1a1aa] focus:border-[#10b981] focus:outline-none mb-3"
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
                  className="mt-1 w-4 h-4 text-[#10b981] border-[#27272a] rounded focus:ring-[#10b981]"
                />
                <label className="text-sm text-[#a1a1aa]">
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
                    className="w-full px-4 py-2 bg-[#111111] border border-[#27272a] rounded-lg text-white placeholder-[#a1a1aa] focus:border-[#10b981] focus:outline-none"
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
                    className="w-full px-4 py-2 bg-[#111111] border border-[#27272a] rounded-lg text-white placeholder-[#a1a1aa] focus:border-[#10b981] focus:outline-none"
                  />
                </div>
              </div>

              {/* Sign Button */}
              <button
                type="button"
                onClick={handleSignContract}
                disabled={!canSign || signingLoading}
                className="w-full py-3 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
