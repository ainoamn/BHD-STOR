/**
 * WhatsApp /order may reveal PII only when the session is bound to the order.
 * Prefer linked userId; fall back to exact phone match (provider-verified digits).
 */

export function normalizePhoneDigits(phone: string | null | undefined): string {
  return String(phone || '').replace(/\D/g, '');
}

export function phonesMatch(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const da = normalizePhoneDigits(a);
  const db = normalizePhoneDigits(b);
  if (!da || !db) return false;
  if (da === db) return true;
  // Oman mobiles often stored with/without country code 968
  const strip968 = (d: string) => (d.startsWith('968') && d.length > 8 ? d.slice(3) : d);
  return strip968(da) === strip968(db);
}

export interface WhatsAppOrderAccessInput {
  orderUserId?: string | null;
  shippingPhone?: string | null;
  customerPhone?: string | null;
  sessionUserId?: string | null;
  sessionPhone?: string | null;
}

/**
 * True when the WhatsApp session may see full order status / totals.
 */
export function canRevealWhatsAppOrder(input: WhatsAppOrderAccessInput): boolean {
  const sessionUserId = input.sessionUserId?.trim();
  if (sessionUserId && input.orderUserId && sessionUserId === input.orderUserId) {
    return true;
  }

  const sessionPhone = input.sessionPhone;
  if (!sessionPhone) return false;

  return (
    phonesMatch(sessionPhone, input.shippingPhone) ||
    phonesMatch(sessionPhone, input.customerPhone)
  );
}
