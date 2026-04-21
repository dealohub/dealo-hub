import { describe, it, expect } from 'vitest';
import {
  containsPhoneNumber,
  containsCounterfeitTerm,
  containsDiscriminatoryWording,
} from './validators';

/**
 * Validator tests — Filter A (phone-in-text), Filter B (counterfeit),
 * Filter C (discriminatory wording).
 *
 * These three filters are the core moat of the platform:
 *   - A keeps contact inside the chat layer (DECISION #2)
 *   - B keeps luxury listings genuine (Phase 5 authenticity pipeline)
 *   - C keeps property listings fair-housing-compliant (Phase 4a)
 *
 * If any of these regress silently, bad listings ship. Therefore we
 * lock them down with exhaustive positive + negative cases, and
 * specifically with the evidence phrases pulled from live Dubizzle KW
 * listings at the time each filter was written.
 */

// ---------------------------------------------------------------------------
// Filter A — phone number detection
// ---------------------------------------------------------------------------

describe('containsPhoneNumber (Filter A)', () => {
  describe('accepts safe text', () => {
    it.each([
      ['plain Arabic description', 'شقة واسعة في منطقة السالمية قرب البحر'],
      ['plain English description', 'Spacious apartment in Salmiya close to the sea'],
      ['year references are not phones', 'Built in 2015, sold in 2024'],
      ['small numbers', '3 bedrooms, 2 bathrooms'],
      ['price-like numbers', 'Asking price 650,000 KWD'],
      ['4-digit PIN-like number', '1948 year stamp'],
      ['7-digit without separators is not caught', 'Reference code 1234567'],
    ])('%s → NOT flagged', (_label, text) => {
      expect(containsPhoneNumber(text)).toBe(false);
    });
  });

  describe('catches Kuwait phones (+965)', () => {
    it.each([
      '+965 66123456',
      '+96566123456',
      '+965-66123456',
      'call me on +965 99887766',
    ])('"%s" flagged', text => {
      expect(containsPhoneNumber(text)).toBe(true);
    });
  });

  describe('catches bare 8-digit Kuwait mobile', () => {
    it.each(['66123456', '99887766', 'my number is 50123456 anytime'])(
      '"%s" flagged',
      text => {
        expect(containsPhoneNumber(text)).toBe(true);
      },
    );
  });

  describe('catches other GCC codes', () => {
    it.each([
      '+966 501234567', // SA
      '+971 501234567', // AE
      '+974 33445566', // QA
    ])('"%s" flagged', text => {
      expect(containsPhoneNumber(text)).toBe(true);
    });
  });

  describe('catches call-to-action patterns', () => {
    // Call-to-action patterns are only meaningful when followed by a
    // plausible phone number. Standalone "call me: 9988" (4 digits)
    // is not a Kuwait phone and is intentionally allowed — if we
    // tightened this we'd flag "call me: 1234" etc. (flight numbers,
    // order IDs). The guardrail is: matching after the CTA is only
    // the first digit, so the subsequent 8-digit pattern above
    // catches the real phones anyway.
    it.each([
      'اتصل: +96550123456',
      'whatsapp 99887766',
      'واتساب: 99887766',
      'wa.me/96599887766',
    ])('"%s" flagged', text => {
      expect(containsPhoneNumber(text)).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Filter B — counterfeit term detection
// ---------------------------------------------------------------------------

describe('containsCounterfeitTerm (Filter B)', () => {
  describe('catches English counterfeit phrases', () => {
    it.each([
      'Louis Vuitton 1st copy — premium quality',
      'Rolex AAA COPY (mirror copy finish)',
      'super copy bag, like new',
      'master copy watch, indistinguishable',
      'Gucci REPLICA — gift from abroad',
      'Chanel knockoff, perfect condition',
      'fake Rolex for sale',
    ])('"%s" flagged', text => {
      expect(containsCounterfeitTerm(text)).toBe(true);
    });
  });

  describe('catches Arabic counterfeit phrases', () => {
    it.each([
      'حقيبة Dior تقليد درجة أولى',
      'ساعة روليكس ماستر كوبي',
      'كوبي درجة أولى',
      'نسخة طبق الأصل',
      'كلاس وان',
    ])('"%s" flagged', text => {
      expect(containsCounterfeitTerm(text)).toBe(true);
    });
  });

  describe('accepts genuine luxury descriptions', () => {
    it.each([
      'Authentic Louis Vuitton with receipts',
      'حقيبة Dior أصلية بالفاتورة',
      'Genuine Rolex, purchased from the official boutique',
      'Original Chanel bag, never used',
    ])('"%s" NOT flagged', text => {
      expect(containsCounterfeitTerm(text)).toBe(false);
    });
  });

  describe('case insensitive', () => {
    it('"FIRST COPY" flagged', () => {
      expect(containsCounterfeitTerm('FIRST COPY Rolex')).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Filter C — discriminatory wording (Phase 4a)
// ---------------------------------------------------------------------------

describe('containsDiscriminatoryWording (Filter C)', () => {
  describe('catches English nationality / ethnicity filters', () => {
    it.each([
      'Non-Arabs Only',
      'Arabs only please',
      'No Indians, no Pakistanis',
      'Asians preferred',
      'preference to Filipinos',
      'for Egyptians only',
    ])('"%s" flagged', text => {
      expect(containsDiscriminatoryWording(text)).toBe(true);
    });
  });

  describe('catches marital / family status filters', () => {
    it.each([
      'Bachelors only',
      'No families',
      'Singles only',
      'no bachelors',
      'students only please',
    ])('"%s" flagged', text => {
      expect(containsDiscriminatoryWording(text)).toBe(true);
    });
  });

  describe('catches Arabic nationality filters', () => {
    it.each([
      'لا يوجد عرب',
      'لا يقبل هنود',
      'ممنوع آسيويين',
      'فلبينيين فقط',
      'عرب فقط',
    ])('"%s" flagged', text => {
      expect(containsDiscriminatoryWording(text)).toBe(true);
    });
  });

  describe('catches Arabic marital filters', () => {
    it.each(['عزاب فقط', 'لا يقبل عائلات', 'ممنوع طلاب'])(
      '"%s" flagged',
      text => {
        expect(containsDiscriminatoryWording(text)).toBe(true);
      },
    );
  });

  describe('catches Arabic religion filters', () => {
    it.each(['مسلمين فقط', 'لا يقبل مسيحيين'])('"%s" flagged', text => {
      expect(containsDiscriminatoryWording(text)).toBe(true);
    });
  });

  describe('accepts neutral property descriptions', () => {
    it.each([
      'Spacious 3-bedroom apartment in Salmiya',
      'شقة واسعة في السالمية، 3 غرف نوم',
      'Close to schools, mosques, and supermarkets',
      'Fully furnished, ready to move in',
      'قرب المسجد والسوبرماركت',
    ])('"%s" NOT flagged', text => {
      expect(containsDiscriminatoryWording(text)).toBe(false);
    });
  });

  describe('false-positive guards', () => {
    it('"bachelor\'s pad" is NOT flagged (apostrophe blocks bachelors-only)', () => {
      expect(containsDiscriminatoryWording("bachelor's pad vibe")).toBe(false);
    });
    it('"only 2 bedrooms" is NOT flagged', () => {
      expect(containsDiscriminatoryWording('only 2 bedrooms available')).toBe(
        false,
      );
    });
    it('describing the neighborhood is not a filter', () => {
      expect(
        containsDiscriminatoryWording(
          'close to Indian school and Filipino community center',
        ),
      ).toBe(false);
    });
  });
});
