import {
  matchesReceiverPhoneLast4,
  sanitizePublicTimeline,
} from './public-tracking';

describe('public-tracking helpers', () => {
  it('matchesReceiverPhoneLast4', () => {
    expect(matchesReceiverPhoneLast4('+968 9123 4567', '4567')).toBe(true);
    expect(matchesReceiverPhoneLast4('+96891234567', '9999')).toBe(false);
    expect(matchesReceiverPhoneLast4('+96891234567', '456')).toBe(false);
    expect(matchesReceiverPhoneLast4(null, '4567')).toBe(false);
  });

  it('sanitizePublicTimeline strips notes', () => {
    expect(
      sanitizePublicTimeline([
        { status: 'picked_up', timestamp: 't1', notes: 'secret address' },
      ]),
    ).toEqual([{ status: 'picked_up', timestamp: 't1' }]);
  });
});
