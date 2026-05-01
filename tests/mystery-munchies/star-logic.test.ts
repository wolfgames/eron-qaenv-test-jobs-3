import { describe, expect, it } from 'vitest';
import { computeStars } from '~/game/mystery-munchies/logic/starLogic';

const thresholds = { one: 1, two: 5, three: 10 };

describe('star-logic: threshold calculation', () => {
  it('3 stars when tapsRemaining >= threshold.three', () => {
    expect(computeStars(10, thresholds)).toBe(3);
    expect(computeStars(20, thresholds)).toBe(3);
  });

  it('2 stars when tapsRemaining >= threshold.two but < threshold.three', () => {
    expect(computeStars(5, thresholds)).toBe(2);
    expect(computeStars(9, thresholds)).toBe(2);
  });

  it('1 star for any other win (minimum win award)', () => {
    expect(computeStars(0, thresholds)).toBe(1);
    expect(computeStars(4, thresholds)).toBe(1);
    expect(computeStars(-5, thresholds)).toBe(1);
  });
});
