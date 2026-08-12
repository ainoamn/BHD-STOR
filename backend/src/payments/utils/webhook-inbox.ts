import { createHash } from 'crypto';
import {
  WebhookProcessingStatus,
} from '../entities/webhook-event.entity';

/**
 * Pure webhook-inbox decision (mirrors PaymentsService.registerWebhookEvent).
 * PROCESSED → skip; FAILED/incomplete → retry.
 */
export function shouldSkipWebhookReplay(
  status: WebhookProcessingStatus | string | null | undefined,
): boolean {
  return String(status || '').toLowerCase() === WebhookProcessingStatus.PROCESSED;
}

export function webhookPayloadHash(payload: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(payload ?? {}))
    .digest('hex');
}
