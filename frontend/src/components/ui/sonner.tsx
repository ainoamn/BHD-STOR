"use client";

import { Toaster as HotToaster } from "react-hot-toast";

type ToasterProps = {
  position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
  richColors?: boolean;
  closeButton?: boolean;
  toastOptions?: { duration?: number };
};

export function Toaster({ position = "top-right", toastOptions }: ToasterProps) {
  return <HotToaster position={position} toastOptions={toastOptions} />;
}
