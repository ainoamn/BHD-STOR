"use client";

import { ReactNode, createContext, useContext } from "react";
import { useCurrency } from "@/hooks/useCurrency";

const CurrencyContext = createContext<ReturnType<typeof useCurrency> | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useCurrencyContext() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrencyContext must be used within CurrencyProvider");
  }
  return context;
}
