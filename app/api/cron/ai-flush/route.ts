import { NextResponse } from 'next/server';
import { flushDueAiDrafts } from '@/lib/chat/ai-flusher';

/**
 * Vercel Cron endpoint — flushes due AI-negotiator drafts.
 *
 * Schedule (defined in vercel.json):
 *   `* * * * *` — every minute. Cheap; the flusher bails early when
 *   no drafts are due, and each row is a single INSERT.
 *
 * Security: Vercel Cron sets the `Authorization: Bearer ${CRON_SECRET}`
 * header; we verify it so third parties can't trigger the endpoint.
 * In dev / local, allow the endpoint if `CRON_SECRET` isn't set so the
 * `scripts/flush-ai-drafts.ts` helper works without ceremony.
 *
 * Reference: planning/PHASE-6A-AI-NEGOTIATOR.md §P14 (cadence).
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = req.headers.get('authorization') ?? '';
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  const report = await flushDueAiDrafts({ limit: 50 });
  return NextResponse.json({
    ok: true,
    ...report,
    at: new Date().toISOString(),
  });
}
