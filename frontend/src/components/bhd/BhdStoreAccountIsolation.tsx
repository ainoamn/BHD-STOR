"use client";

import { useAuth } from "@/hooks/useAuth";
import { BhdPrivacyGate } from "@/components/bhd/BhdPrivacyGate";
import { BhdSilentSso } from "@/components/bhd/BhdSilentSso";

export function BhdStoreAccountIsolation() {
  const { user } = useAuth();
  const productSub =
    (user as { bhdSub?: string } | null | undefined)?.bhdSub || user?.id || null;
  const productEmail = user?.email || null;

  return (
    <>
      <BhdSilentSso />
      <BhdPrivacyGate productSub={productSub} productEmail={productEmail} />
    </>
  );
}
