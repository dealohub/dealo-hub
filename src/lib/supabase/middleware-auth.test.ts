import { describe, expect, it } from 'vitest';
import { isAdminPath, isProtectedPath } from './middleware-auth';

describe('isAdminPath', () => {
  it('matches /admin at root', () => {
    expect(isAdminPath('/admin')).toBe(true);
  });

  it('matches /admin/ trailing slash', () => {
    expect(isAdminPath('/admin/')).toBe(true);
  });

  it('matches /admin/listings', () => {
    expect(isAdminPath('/admin/listings')).toBe(true);
  });

  it('matches /ar/admin', () => {
    expect(isAdminPath('/ar/admin')).toBe(true);
  });

  it('matches /en/admin/users', () => {
    expect(isAdminPath('/en/admin/users')).toBe(true);
  });

  it('matches /ar/admin/ai-reviews', () => {
    expect(isAdminPath('/ar/admin/ai-reviews')).toBe(true);
  });

  // Negative cases — these MUST NOT match, or we risk auth-gating public paths
  it('does NOT match /administrator', () => {
    expect(isAdminPath('/administrator')).toBe(false);
  });

  it('does NOT match /ar/administrator', () => {
    expect(isAdminPath('/ar/administrator')).toBe(false);
  });

  it('does NOT match /my/admin-panel (admin in middle of segment)', () => {
    expect(isAdminPath('/my/admin-panel')).toBe(false);
  });

  it('does NOT match /ar/my-listings/admin-chair (user content)', () => {
    expect(isAdminPath('/ar/my-listings/admin-chair')).toBe(false);
  });

  it('does NOT match /fr/admin (unsupported locale prefix)', () => {
    // Strict: only ar/en locales are legal. fr/admin would be a 404 from
    // next-intl anyway, so no auth-gate needed.
    expect(isAdminPath('/fr/admin')).toBe(false);
  });

  it('does NOT match /', () => {
    expect(isAdminPath('/')).toBe(false);
  });

  it('does NOT match /ar', () => {
    expect(isAdminPath('/ar')).toBe(false);
  });
});

describe('isProtectedPath (regression)', () => {
  // Sanity: don't accidentally break existing gated routes
  it('matches /ar/my-listings', () => {
    expect(isProtectedPath('/ar/my-listings')).toBe(true);
  });

  it('matches /en/messages', () => {
    expect(isProtectedPath('/en/messages')).toBe(true);
  });

  it('matches /ar/sell', () => {
    expect(isProtectedPath('/ar/sell')).toBe(true);
  });

  it('does not match public /ar/browse', () => {
    expect(isProtectedPath('/ar/browse')).toBe(false);
  });

  it('does not match /ar/profile/fawzi (public viewer)', () => {
    expect(isProtectedPath('/ar/profile/fawzi')).toBe(false);
  });

  it('matches /ar/profile/edit', () => {
    expect(isProtectedPath('/ar/profile/edit')).toBe(true);
  });
});
