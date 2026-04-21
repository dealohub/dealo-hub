'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * ThreadRealtime — headless client component that subscribes to the
 * Supabase Realtime channel for a specific conversation and triggers
 * a router.refresh() whenever a new message INSERT arrives OR the
 * conversation header UPDATES (read-receipts, archive/block flips).
 *
 * Design note: router.refresh() re-runs the server component, which
 * re-fetches getThread() — state stays authoritative (no client cache
 * drift). This trades a few hundred ms of latency for zero stale-state
 * risk, which is the right trade for a trust-first product.
 */

interface Props {
  conversationId: number;
}

export default function ThreadRealtime({ conversationId }: Props) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`conv:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          router.refresh();
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${conversationId}`,
        },
        () => {
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, router]);

  return null;
}
