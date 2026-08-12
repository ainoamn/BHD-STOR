import { resolveCorsAllowlist } from './cors.util';

describe('resolveCorsAllowlist', () => {
  it('never includes wildcard *', () => {
    const list = resolveCorsAllowlist({
      nodeEnv: 'production',
      frontendUrl: 'https://bhdoman.com',
      trustedOrigins: '*,https://evil.example',
      corsOrigin: '*',
    });
    expect(list).not.toContain('*');
    expect(list).toContain('https://bhdoman.com');
    expect(list).toContain('https://evil.example');
  });

  it('adds localhost defaults outside production', () => {
    const list = resolveCorsAllowlist({
      nodeEnv: 'development',
      frontendUrl: 'http://localhost:3000',
    });
    expect(list).toContain('http://localhost:3000');
    expect(list).toContain('http://localhost:3002');
  });
});
