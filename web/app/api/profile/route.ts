import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sql } from '../../../lib/db';

const ProfileQuerySchema = z.object({
  userId: z.string().uuid(),
});

const ProfileSchema = z.object({
  userId: z.string().uuid(),
  handle: z.string().nullable().optional(),
  unlocked_levels: z.array(z.string()).default([]),
  upgrades: z.record(z.unknown()).default({}),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = ProfileQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'userId required' }, { status: 400 });
  }
  const { userId } = parsed.data;
  try {
    const rows = await sql`SELECT user_id, handle, unlocked_levels, upgrades, updated_at FROM profiles WHERE user_id = ${userId}`;
    return NextResponse.json({ ok: true, data: rows[0] ?? null });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? 'error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = ProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'invalid payload' }, { status: 400 });
    }
    const { userId, handle = null, unlocked_levels = [], upgrades = {} } = parsed.data;
    await sql`
      INSERT INTO profiles (user_id, handle, unlocked_levels, upgrades)
      VALUES (${userId}, ${handle}, ${JSON.stringify(unlocked_levels)}, ${JSON.stringify(upgrades)})
      ON CONFLICT (user_id) DO UPDATE SET
        handle = EXCLUDED.handle,
        unlocked_levels = EXCLUDED.unlocked_levels,
        upgrades = EXCLUDED.upgrades,
        updated_at = now()
    `;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? 'error' }, { status: 500 });
  }
}
