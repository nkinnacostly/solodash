"use client";

import { X, Crown } from "lucide-react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: string;
  feature: "invoices" | "contracts" | "general";
}

export default function UpgradeModal({
  isOpen,
  onClose,
  reason,
  feature,
}: UpgradeModalProps) {
  if (!isOpen) return null;

  const comparisons = {
    invoices: {
      label: "Invoices",
      free: "3/month",
      pro: "Unlimited",
    },
    contracts: {
      label: "Contracts",
      free: "1/month",
      pro: "Unlimited",
    },
    general: {
      label: "Platform fee",
      free: "5%",
      pro: "0%",
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#18181b] border border-[#27272a] rounded-2xl max-w-md w-full p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-[#27272a] rounded-lg transition-colors"
        >
          <X size={20} className="text-[#a1a1aa]" />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 bg-[#10b981]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Crown size={32} className="text-[#10b981]" />
        </div>

        {/* Header */}
        <h2 className="text-2xl font-bold text-white text-center mb-2">
          Upgrade to Pro
        </h2>

        {reason && (
          <p className="text-sm text-[#a1a1aa] text-center mb-6">{reason}</p>
        )}

        {/* Feature Comparison */}
        <div className="bg-[#0f0f0f] border border-[#27272a] rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-white mb-4">Free vs Pro</h3>
          <div className="space-y-3">
            {Object.values(comparisons).map((comp, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm text-[#a1a1aa]">{comp.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#a1a1aa] line-through">
                    {comp.free}
                  </span>
                  <span className="text-xs text-[#10b981] font-medium">
                    → {comp.pro}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Price */}
        <div className="text-center mb-6">
          <p className="text-3xl font-bold text-white">₦13,500/month</p>
          <p className="text-sm text-[#a1a1aa]">or ₦119,000/year (save 30%)</p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <a
            href="/pricing"
            className="w-full py-3 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors flex items-center justify-center gap-2"
          >
            Upgrade to Pro →
          </a>
          <button
            onClick={onClose}
            className="w-full py-3 border border-[#27272a] text-[#a1a1aa] font-medium rounded-lg hover:border-[#3f3f46] hover:text-white transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
