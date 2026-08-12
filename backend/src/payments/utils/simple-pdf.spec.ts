import { buildSimplePdf } from './simple-pdf';

describe('buildSimplePdf', () => {
  it('returns a PDF header and EOF', () => {
    const buf = buildSimplePdf(['Invoice Number: INV-1', 'Total: 1.000 OMR'], 'Tax Invoice');
    const text = buf.toString('latin1');
    expect(text.startsWith('%PDF-1.4')).toBe(true);
    expect(text.includes('%%EOF')).toBe(true);
    expect(text.includes('INV-1')).toBe(true);
  });
});
