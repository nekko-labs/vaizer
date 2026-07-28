'use client';

/**
 * A tiny, dependency-free toast system. The app had no way to confirm an
 * action or surface a recoverable error, which reads badly once real run
 * feeds and prompt/config persistence land. `ToastProvider` owns a queue and
 * exposes `useToast()`; toasts stack bottom-right, auto-dismiss, and are
 * announced to assistive tech (polite for info/success, assertive for danger).
 * Colors come from the Vellum token layer, never raw hex.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type ToastTone = 'default' | 'success' | 'danger' | 'warn';

export type ToastOptions = {
  tone?: ToastTone;
  /** Milliseconds before auto-dismiss; 0 keeps it until dismissed. */
  duration?: number;
};

type Toast = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  toast: (message: string, options?: ToastOptions) => number;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_CLS: Record<ToastTone, string> = {
  default: 'border-border',
  success: 'border-signal/50',
  danger: 'border-danger/50',
  warn: 'border-warn/50',
};

const DOT_CLS: Record<ToastTone, string> = {
  default: 'bg-accent',
  success: 'bg-signal',
  danger: 'bg-danger',
  warn: 'bg-warn',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (message: string, options?: ToastOptions) => {
      const id = nextId.current++;
      const tone = options?.tone ?? 'default';
      const duration = options?.duration ?? 4000;
      setToasts((prev) => [...prev, { id, message, tone }]);
      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration),
        );
      }
      return id;
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === 'danger' ? 'alert' : 'status'}
            className={`vaizer-enter pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-surface p-3.5 shadow-lg ${TONE_CLS[t.tone]}`}
          >
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT_CLS[t.tone]}`} />
            <p className="min-w-0 flex-1 text-sm leading-relaxed text-fg">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="-mr-1 -mt-1 shrink-0 rounded-md p-1 text-muted transition-colors hover:text-fg"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-4 w-4">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
