"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  ReactNode,
} from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
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

// ------------------------------------------------------------------
// Provider
// ------------------------------------------------------------------

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastViewport toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

// ------------------------------------------------------------------
// Viewport — owns the stack geometry (Sonner-style)
// ------------------------------------------------------------------

const MAX_VISIBLE = 4;
const GAP = 14; // px between toasts when expanded
const COLLAPSED_PEEK = 15; // px each stacked toast peeks up when collapsed
const SCALE_STEP = 0.05; // shrink per depth when collapsed
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const DUR = 400; // ms — matches Sonner's expand/collapse

const usePrefersReducedMotion = () => {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduce;
};

function ToastViewport({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const reduce = usePrefersReducedMotion();

  const setHeight = useCallback((id: string, h: number) => {
    setHeights((prev) => (prev[id] === h ? prev : { ...prev, [id]: h }));
  }, []);

  // Front-first: index 0 is the newest toast, sitting at the bottom.
  const ordered = [...toasts.slice(-MAX_VISIBLE)].reverse();
  const count = ordered.length;
  const heightOf = (id: string) => heights[id] ?? 64;

  const totalHeight = ordered.reduce(
    (sum, t, i) => sum + heightOf(t.id) + (i > 0 ? GAP : 0),
    0,
  );
  const frontHeight = count ? heightOf(ordered[0].id) : 0;
  const collapsedHeight = frontHeight + (count - 1) * COLLAPSED_PEEK;
  const viewportHeight = count ? (expanded ? totalHeight : collapsedHeight) : 0;

  if (count === 0) return null;

  return (
    <section
      aria-live="polite"
      aria-label="Notifications"
      className="fixed z-[100] bottom-4 right-4 md:bottom-6 md:right-6 w-[min(400px,calc(100vw-2rem))]"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <ol
        className="relative m-0 list-none p-0"
        style={{
          height: viewportHeight,
          transition: reduce ? undefined : `height ${DUR}ms ${EASE}`,
        }}
      >
        {ordered.map((toast, i) => {
          let offsetBefore = 0;
          for (let j = 0; j < i; j++) {
            offsetBefore += heightOf(ordered[j].id) + GAP;
          }
          return (
            <ToastCard
              key={toast.id}
              toast={toast}
              depth={i}
              expanded={expanded}
              offsetBefore={offsetBefore}
              reduce={reduce}
              onHeight={setHeight}
              onClose={removeToast}
            />
          );
        })}
      </ol>
    </section>
  );
}

// ------------------------------------------------------------------
// Card
// ------------------------------------------------------------------

const ACCENT: Record<ToastType, string> = {
  success: "#57c9b0",
  error: "#f0817d",
  warning: "#e6b566",
  info: "#6ea8ff",
};

const ICONS: Record<ToastType, ReactNode> = {
  success: <CheckCircle2 size={17} strokeWidth={2.4} />,
  error: <XCircle size={17} strokeWidth={2.4} />,
  warning: <AlertTriangle size={17} strokeWidth={2.4} />,
  info: <Info size={17} strokeWidth={2.4} />,
};

function ToastCard({
  toast,
  depth,
  expanded,
  offsetBefore,
  reduce,
  onHeight,
  onClose,
}: {
  toast: Toast;
  depth: number;
  expanded: boolean;
  offsetBefore: number;
  reduce: boolean;
  onHeight: (id: string, h: number) => void;
  onClose: (id: string) => void;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const [entered, setEntered] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [dragX, setDragX] = useState(0);
  const dragStart = useRef<number | null>(null);
  const accent = ACCENT[toast.type];
  const duration = toast.duration ?? (toast.type === "error" ? 6000 : 4000);

  // Measure height for the stack geometry.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const report = () => onHeight(toast.id, el.offsetHeight);
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [toast.id, onHeight]);

  // Trigger the entrance transition on the next frame.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const close = useCallback(() => {
    setRemoving(true);
    window.setTimeout(() => onClose(toast.id), reduce ? 0 : DUR);
  }, [onClose, toast.id, reduce]);

  // Auto-dismiss — paused while the stack is expanded (i.e. hovered).
  useEffect(() => {
    if (expanded || removing) return;
    const timer = window.setTimeout(close, duration);
    return () => window.clearTimeout(timer);
  }, [expanded, removing, duration, close]);

  // Swipe-to-dismiss (rightward).
  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-toast-close]")) return;
    dragStart.current = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStart.current === null) return;
    setDragX(Math.max(0, e.clientX - dragStart.current));
  };
  const onPointerUp = () => {
    if (dragStart.current === null) return;
    if (dragX > 96) close();
    else setDragX(0);
    dragStart.current = null;
  };

  // ---- transform math ----
  const y = expanded ? -offsetBefore : -(depth * COLLAPSED_PEEK);
  const scale = expanded ? 1 : Math.max(1 - depth * SCALE_STEP, 0.9);
  let translateY = y;
  let translateX = dragX;
  let opacity = expanded ? 1 : depth < 3 ? 1 : 0;

  if (!entered) {
    translateY = y + 22; // rise up from below
    opacity = 0;
  }
  if (removing) {
    translateX = dragX > 0 ? dragX + 400 : 0;
    opacity = 0;
  }

  const dragging = dragStart.current !== null;

  return (
    <li
      ref={ref}
      className="group absolute bottom-0 right-0 w-full origin-bottom select-none"
      style={{
        transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`,
        opacity,
        zIndex: 100 - depth,
        transition: reduce
          ? undefined
          : `transform ${dragging ? 0 : DUR}ms ${EASE}, opacity ${DUR}ms ${EASE}`,
        touchAction: "pan-y",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        role={toast.type === "error" ? "alert" : "status"}
        className="flex items-start gap-3 rounded-[14px] border border-[#2a303c] bg-[#1c202a]/95 p-3.5 pr-10 backdrop-blur-sm"
        style={{
          boxShadow:
            "0 8px 24px -6px rgba(0,0,0,0.5), 0 2px 6px -2px rgba(0,0,0,0.4), inset 0 1px 0 0 rgba(255,255,255,0.03)",
        }}
      >
        {/* Icon chip */}
        <span
          className="mt-px flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${accent}22`, color: accent }}
        >
          {ICONS[toast.type]}
        </span>

        {/* Content */}
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm font-semibold leading-tight text-[#eef2f8]">
            {toast.title}
          </p>
          {toast.message && (
            <p className="mt-1 text-[13px] leading-snug text-[#8f9db1]">
              {toast.message}
            </p>
          )}
        </div>

        {/* Close — reveals on hover/focus */}
        <button
          type="button"
          data-toast-close
          onClick={close}
          aria-label="Dismiss notification"
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md text-[#8f9db1] opacity-0 transition-all hover:bg-white/5 hover:text-[#eef2f8] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6ea8ff] group-hover:opacity-100"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      </div>
    </li>
  );
}
