"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, X } from "lucide-react";

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSign: (signatureData: string, signatureType: "drawn" | "typed") => void;
  loading: boolean;
  title?: string;
  userName?: string;
}

export default function SignatureModal({
  isOpen,
  onClose,
  onSign,
  loading,
  title = "Sign Contract",
  userName = "",
}: SignatureModalProps) {
  const [activeTab, setActiveTab] = useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = useState(userName);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const hasDrawnRef = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Prevent body scroll and handle escape
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Initialize canvas
  useEffect(() => {
    if (!isOpen || activeTab !== "draw") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw baseline
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, rect.height - 40);
    ctx.lineTo(rect.width - 20, rect.height - 40);
    ctx.stroke();

    // Reset drawn state
    hasDrawnRef.current = false;
  }, [isOpen, activeTab]);

  // Auto-fill typed name
  useEffect(() => {
    if (userName) {
      setTypedName(userName);
    }
  }, [userName]);

  // Canvas drawing handlers
  const getPos = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  };

  const startDrawing = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    e.preventDefault();
    isDrawingRef.current = true;
    hasDrawnRef.current = true;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getPos(e);
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Redraw baseline
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, rect.height - 40);
    ctx.lineTo(rect.width - 20, rect.height - 40);
    ctx.stroke();

    hasDrawnRef.current = false;
  };

  const handleSign = () => {
    if (activeTab === "draw") {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawnRef.current) return;
      const dataUrl = canvas.toDataURL("image/png");
      onSign(dataUrl, "drawn");
    } else {
      if (!typedName.trim()) return;
      onSign(typedName.trim(), "typed");
    }
  };

  const canSign =
    activeTab === "draw" ? hasDrawnRef.current : typedName.trim().length > 0;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={dialogRef}
        className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 max-w-[560px] w-full mx-4 shadow-2xl"
        style={{
          animation: "sigModalIn 0.2s ease-out",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-[#a1a1aa] hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-[#0f0f0f] rounded-lg p-1">
          <button
            onClick={() => setActiveTab("draw")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "draw"
                ? "bg-[#27272a] text-white"
                : "text-[#a1a1aa] hover:text-white"
            }`}
          >
            Draw
          </button>
          <button
            onClick={() => setActiveTab("type")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "type"
                ? "bg-[#27272a] text-white"
                : "text-[#a1a1aa] hover:text-white"
            }`}
          >
            Type
          </button>
        </div>

        {/* Draw Tab */}
        {activeTab === "draw" && (
          <div>
            <div className="relative rounded-lg overflow-hidden border border-[#27272a]">
              <canvas
                ref={canvasRef}
                className="w-full cursor-crosshair"
                style={{ height: "160px" }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-[#a1a1aa]">
                Sign with your mouse or finger
              </p>
              <button
                onClick={clearCanvas}
                className="text-xs text-[#a1a1aa] hover:text-white transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Type Tab */}
        {activeTab === "type" && (
          <div>
            <input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Type your full name"
              className="w-full px-4 py-3 bg-[#111111] border border-[#27272a] rounded-lg text-white placeholder-[#52525b] focus:outline-none focus:border-[#10b981] transition-colors"
            />
            {typedName && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-[#27272a]">
                <p
                  style={{
                    fontFamily: "'Brush Script MT', 'Dancing Script', cursive",
                    fontSize: "36px",
                    color: "#1a1a1a",
                    lineHeight: "1.2",
                  }}
                >
                  {typedName}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <button
            onClick={handleSign}
            disabled={!canSign || loading}
            className="w-full py-3 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Signing...
              </>
            ) : (
              title
            )}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full py-3 border border-[#27272a] text-[#a1a1aa] font-medium rounded-lg hover:border-[#52525b] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Animation */}
      <style jsx>{`
        @keyframes sigModalIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
