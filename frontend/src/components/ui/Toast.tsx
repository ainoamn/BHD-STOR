"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

/* ------------------------------------------------------------------ */
/*                              Types                                  */
/* ------------------------------------------------------------------ */

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, "id">) => void;
  removeToast: (id: string) => void;
}

/* ------------------------------------------------------------------ */
/*                            Context                                  */
/* ------------------------------------------------------------------ */

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

/* ------------------------------------------------------------------ */
/*                        Toast Provider                               */
/* ------------------------------------------------------------------ */

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((toast: Omit<ToastData, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*                        Toast Container                              */
/* ------------------------------------------------------------------ */

function ToastContainer() {
  const { toasts } = useToast();

  return (
    <div className="fixed top-4 left-4 z-[9999] flex flex-col gap-3 rtl:right-4 rtl:left-auto">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*                          Toast Item                                 */
/* ------------------------------------------------------------------ */

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
  error: <XCircle className="w-5 h-5 text-[#C41E3A]" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
};

const borderColorMap: Record<ToastType, string> = {
  success: "border-r-4 border-r-emerald-500",
  error: "border-r-4 border-r-[#C41E3A]",
  warning: "border-r-4 border-r-amber-500",
  info: "border-r-4 border-r-blue-500",
};

function ToastItem({ toast }: { toast: ToastData }) {
  const { removeToast } = useToast();
  const duration = toast.duration ?? 5000;
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), duration);
    return () => clearTimeout(timer);
  }, [toast.id, duration, removeToast]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -120, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -120, scale: 0.9 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className={cn(
        "relative min-w-[320px] max-w-[420px] bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden",
        borderColorMap[toast.type],
        "rtl:border-r-0 rtl:border-l-4 rtl:border-l-current"
      )}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">{iconMap[toast.type]}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-[#1a1a1a] dark:text-white">{toast.title}</h4>
          {toast.message && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
              {toast.message}
            </p>
          )}
        </div>

        {/* Close */}
        <button
          onClick={() => removeToast(toast.id)}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100 dark:bg-gray-800">
        <motion.div
          ref={progressRef}
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: duration / 1000, ease: "linear" }}
          className={cn(
            "h-full",
            toast.type === "success" && "bg-emerald-500",
            toast.type === "error" && "bg-[#C41E3A]",
            toast.type === "warning" && "bg-amber-500",
            toast.type === "info" && "bg-blue-500"
          )}
        />
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*                         Toast Hook Helpers                          */
/* ------------------------------------------------------------------ */

export function useToastHelpers() {
  const { addToast } = useToast();

  return {
    success: (title: string, message?: string, duration?: number) =>
      addToast({ type: "success", title, message, duration }),
    error: (title: string, message?: string, duration?: number) =>
      addToast({ type: "error", title, message, duration }),
    warning: (title: string, message?: string, duration?: number) =>
      addToast({ type: "warning", title, message, duration }),
    info: (title: string, message?: string, duration?: number) =>
      addToast({ type: "info", title, message, duration }),
  };
}
