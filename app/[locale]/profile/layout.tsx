import type { ReactNode } from 'react';
import { Nav } from '@/components/layout/Nav';

/**
 * Public profile-group layout.
 *
 * Renders the shared Nav so anonymous visitors on `/profile/[handle]` and
 * `/profile/u/[uuid]` see the same chrome as signed-in users. Owner-only
 * pages live under `(app)/profile/{me,edit}/` with their own auth guard.
 */
export default function PublicProfileLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Nav />
      {children}
    </>
  );
}
