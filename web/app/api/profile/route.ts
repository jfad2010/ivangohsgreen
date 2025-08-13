import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(req: Request){
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  if(!userId) return NextResponse.json({ ok:false, error:'userId required' }, { status:400 });
  try{
    const rows = await sql`SELECT user_id, handle, unlocked_levels, upgrades, updated_at FROM profiles WHERE user_id = ${userId}`;
    return NextResponse.json({ ok:true, row: rows[0] ?? null });
  }catch(err:any){
    return NextResponse.json({ ok:false, error: err?.message ?? 'error' }, { status:500 });
  }
}

export async function POST(req: Request){
  try{
    const { userId, handle = null, unlocked_levels = [], upgrades = {} } = await req.json();
    if(!userId) return NextResponse.json({ ok:false, error:'userId required' }, { status:400 });
    await sql`
      INSERT INTO profiles (user_id, handle, unlocked_levels, upgrades)
      VALUES (${userId}, ${handle}, ${JSON.stringify(unlocked_levels)}, ${JSON.stringify(upgrades)})
      ON CONFLICT (user_id) DO UPDATE SET
        handle = EXCLUDED.handle,
        unlocked_levels = EXCLUDED.unlocked_levels,
        upgrades = EXCLUDED.upgrades,
        updated_at = now()
    `;
    return NextResponse.json({ ok:true });
  }catch(err:any){
    return NextResponse.json({ ok:false, error: err?.message ?? 'error' }, { status:500 });
  }
}
