import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException, HttpStatus } from '@nestjs/common';
import { OpenAIService } from './openai.service';

describe('OpenAIService fail-safe', () => {
  function createService(apiKey = '') {
    const config = {
      get: (key: string) => {
        const map: Record<string, string> = {
          OPENAI_API_KEY: apiKey,
          OPENAI_MODEL: 'gpt-4',
          OPENAI_TEMPERATURE: '0.7',
          OPENAI_MAX_TOKENS: '200',
          OPENAI_EMBEDDING_MODEL: 'text-embedding-3-small',
          OPENAI_TIMEOUT_MS: '5000',
          AI_RATE_LIMIT_PER_MINUTE: '60',
        };
        return map[key];
      },
    } as unknown as ConfigService;
    return new OpenAIService(config);
  }

  it('reports not configured when API key is missing', () => {
    const service = createService('');
    expect(service.isConfigured()).toBe(false);
    expect(service.getConfig().configured).toBe(false);
  });

  it('chatCompletion throws ServiceUnavailable when key missing', async () => {
    const service = createService('');
    await expect(
      service.chatCompletion([{ role: 'user', content: 'hi' }]),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('chatWithAssistant soft-falls back when key missing', async () => {
    const service = createService('');
    const result = await service.chatWithAssistant('hello');
    expect(result.response).toMatch(/apologize|trouble|support/i);
  });

  it('generateEmbedding returns empty array when key missing', async () => {
    const service = createService('');
    await expect(service.generateEmbedding('test')).resolves.toEqual([]);
  });

  it('maps rate-limit window to 429 after burst', async () => {
    const service = createService('sk-test');
    // Force configured path without real SDK by stubbing internals
    (service as any).openai = { chat: { completions: { create: async () => {
      throw Object.assign(new Error('Rate limit'), { status: 429 });
    } } } };
    (service as any).config.apiKey = 'sk-test';

    await expect(
      service.chatCompletion([{ role: 'user', content: 'x' }]),
    ).rejects.toMatchObject({ status: HttpStatus.TOO_MANY_REQUESTS });
  });
});
