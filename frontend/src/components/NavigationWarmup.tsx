"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const STORE_WARMUP_ROUTES = [
  "/",
  "/products",
  "/stores",
  "/deals",
  "/categories",
  "/about",
  "/auth/login",
];

export function NavigationWarmup() {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      STORE_WARMUP_ROUTES.forEach((route) => router.prefetch(route));
    }, 200);
    return () => window.clearTimeout(timer);
  }, [router]);

  return null;
}
