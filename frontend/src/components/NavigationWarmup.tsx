"use client";

import { hopOrigins } from "@/lib/bhd/apps";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const STORE_WARMUP_ROUTES = [
  "/",
  "/products",
  "/stores",
  "/deals",
  "/categories",
  "/about",
  "/dashboard",
];

/** Prefetch after first interaction — never on tab restore. preconnect all BHD app origins. */
export function NavigationWarmup() {
  const router = useRouter();

  useEffect(() => {
    const run = () => {
      STORE_WARMUP_ROUTES.forEach((route) => router.prefetch(route));
      hopOrigins().forEach((origin) => {
        if (document.head.querySelector(`link[data-bhd-hop="${origin}"]`)) return;
        const pre = document.createElement("link");
        pre.rel = "preconnect";
        pre.href = origin;
        pre.setAttribute("data-bhd-hop", origin);
        document.head.appendChild(pre);
      });
    };

    window.addEventListener("pointerdown", run, { once: true, passive: true });
    window.addEventListener("keydown", run, { once: true });
    return () => {
      window.removeEventListener("pointerdown", run);
      window.removeEventListener("keydown", run);
    };
  }, [router]);

  return null;
}
