"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  const { addToast } = context;

  return {
    toast: {
      success: (title: string, message?: string) =>
        addToast({ type: "success", title, message }),
      error: (title: string, message?: string) =>
        addToast({ type: "error", title, message }),
      warning: (title: string, message?: string) =>
        addToast({ type: "warning", title, message }),
      info: (title: string, message?: string) =>
        addToast({ type: "info", title, message }),
    },
  };
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  // Only show max 5 toasts
  const visibleToasts = toasts.slice(-5);

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[100] flex flex-col gap-2 max-h-screen overflow-hidden">
      {visibleToasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onClose,
}: {
  toast: Toast;
  onClose: (id: string) => void;
}) {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(toast.duration || 4000);

  const duration = toast.duration || 4000;

  const colors = {
    success: "#10b981",
    error: "#ef4444",
    warning: "#fbbf24",
    info: "#60a5fa",
  };

  const icons = {
    success: <CheckCircle2 size={20} style={{ color: colors.success }} />,
    error: <XCircle size={20} style={{ color: colors.error }} />,
    warning: <AlertTriangle size={20} style={{ color: colors.warning }} />,
    info: <Info size={20} style={{ color: colors.info }} />,
  };

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(toast.id), 300);
  };

  // Auto-dismiss timer
  useEffect(() => {
    startTimeRef.current = Date.now();

    const timer = setTimeout(() => {
      handleClose();
    }, remainingTimeRef.current);

    return () => clearTimeout(timer);
  }, [isPaused]);

  // Progress bar animation
  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    const updateInterval = 50;
    const decrement = (updateInterval / duration) * 100;

    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev - decrement;
        if (next <= 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          return 0;
        }
        return next;
      });
    }, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, duration]);

  return (
    <div
      className={`min-w-[320px] max-w-[420px] bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl relative overflow-hidden transition-all duration-300 ${
        isExiting ? "opacity-0 translate-x-full" : "opacity-100 translate-x-0"
      }`}
      style={{ borderLeft: `4px solid ${colors[toast.type]}` }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{toast.title}</p>
          {toast.message && (
            <p className="text-xs text-[#a1a1aa] mt-0.5">{toast.message}</p>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-0.5 text-[#a1a1aa] hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#27272a]">
        <div
          className="h-full transition-none"
          style={{
            width: `${progress}%`,
            backgroundColor: colors[toast.type],
          }}
        />
      </div>
    </div>
  );
}
