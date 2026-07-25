/** Last-4 phone gate for public shipment tracking. */
export function matchesReceiverPhoneLast4(
  receiverPhone: string | null | undefined,
  phoneLast4?: string,
): boolean {
  if (!phoneLast4 || !/^\d{4}$/.test(phoneLast4)) {
    return false;
  }
  const digits = String(receiverPhone || '').replace(/\D/g, '');
  if (digits.length < 4) return false;
  return digits.slice(-4) === phoneLast4;
}

/** Public timeline: status + timestamp only. */
export function sanitizePublicTimeline(
  timeline: Array<{ status?: string; timestamp?: unknown; notes?: string }> | null | undefined,
): Array<{ status: string | undefined; timestamp: unknown }> {
  return (timeline || []).map((event) => ({
    status: event.status,
    timestamp: event.timestamp,
  }));
}
