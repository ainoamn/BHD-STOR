import { WebhookProcessingStatus } from '../entities/webhook-event.entity';
import {
  shouldSkipWebhookReplay,
  webhookPayloadHash,
} from './webhook-inbox';

describe('webhook-inbox', () => {
  it('skips only PROCESSED events', () => {
    expect(shouldSkipWebhookReplay(WebhookProcessingStatus.PROCESSED)).toBe(true);
    expect(shouldSkipWebhookReplay(WebhookProcessingStatus.FAILED)).toBe(false);
    expect(shouldSkipWebhookReplay(WebhookProcessingStatus.RECEIVED)).toBe(false);
    expect(shouldSkipWebhookReplay(null)).toBe(false);
  });

  it('hashes payloads stably for replay detection', () => {
    const a = webhookPayloadHash({ id: 'evt_1', amount: 1.5 });
    const b = webhookPayloadHash({ id: 'evt_1', amount: 1.5 });
    const c = webhookPayloadHash({ id: 'evt_1', amount: 1.6 });
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toHaveLength(64);
  });
});
