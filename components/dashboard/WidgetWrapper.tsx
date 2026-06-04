"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

interface WidgetWrapperProps<T> {
  fetcher: () => Promise<T>;
  children: (data: T) => ReactNode;
  loadingFallback?: ReactNode;
  errorTitle?: string;
  className?: string;
}

export function WidgetWrapper<T>({
  fetcher,
  children,
  loadingFallback,
  errorTitle = "Could not load",
  className = "",
}: WidgetWrapperProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      setData(result);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className={className}>
        {loadingFallback || (
          <div className="animate-pulse bg-[#18181b] border border-[#27272a] rounded-xl h-32" />
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <div className="bg-[#18181b] border border-[#ef4444]/30 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="text-[#ef4444] text-lg leading-none">⚠</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#fca5a5]">{errorTitle}</p>
              <p className="text-xs text-[#a1a1aa] mt-1">{error}</p>
              <button
                type="button"
                onClick={load}
                className="mt-3 text-xs px-3 py-1.5 rounded-md bg-[#27272a] hover:bg-[#3f3f46] text-[#a1a1aa] border border-[#27272a] transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return <div className={className}>{children(data)}</div>;
}
