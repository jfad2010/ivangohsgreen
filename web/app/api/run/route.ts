import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(req: Request){
  try{
    const body = await req.json();
    const { userId = null, score = 0, timeMs = 0, difficulty = 'standard', bosses = 0, lettuce = 0 } = body ?? {};

    await sql`INSERT INTO runs (user_id, score, time_ms, difficulty, bosses_defeated, lettuce)
              VALUES (${userId}, ${score}, ${timeMs}, ${difficulty}, ${bosses}, ${lettuce})`;

    return NextResponse.json({ ok: true });
  }catch(err: any){
    return NextResponse.json({ ok: false, error: err?.message ?? 'error' }, { status: 500 });
  }
}

export async function GET(){
  try{
    const rows = await sql`SELECT id, score, time_ms, difficulty, bosses_defeated, lettuce, created_at
                           FROM runs ORDER BY score DESC, created_at DESC LIMIT 20`;
    return NextResponse.json({ ok: true, rows });
  }catch(err: any){
    return NextResponse.json({ ok: false, error: err?.message ?? 'error' }, { status: 500 });
  }
}
