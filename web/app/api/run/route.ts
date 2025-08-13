import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sql } from '../../../lib/db';

const RunSchema = z.object({
  userId: z.string().uuid().nullable().optional(),
  score: z.number().int(),
  timeMs: z.number().int(),
  difficulty: z.string(),
  bosses: z.number().int(),
  lettuce: z.number().int(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = RunSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'invalid payload' }, { status: 400 });
    }
    const { userId = null, score, timeMs, difficulty, bosses, lettuce } = parsed.data;

    await sql`INSERT INTO runs (user_id, score, time_ms, difficulty, bosses_defeated, lettuce)
              VALUES (${userId}, ${score}, ${timeMs}, ${difficulty}, ${bosses}, ${lettuce})`;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? 'error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const rows = await sql`SELECT id, score, time_ms, difficulty, bosses_defeated, lettuce, created_at
                           FROM runs ORDER BY score DESC, created_at DESC LIMIT 20`;
    return NextResponse.json({ ok: true, data: rows });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? 'error' }, { status: 500 });
  }
}
