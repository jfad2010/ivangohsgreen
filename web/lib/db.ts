import { neon } from '@neondatabase/serverless';

const url = process.env.NEON_DATABASE_URL;
if (!url) {
  console.warn('NEON_DATABASE_URL is not set. API writes will fail.');
}

export const sql = url ? neon(url) : (async () => { throw new Error('NEON_DATABASE_URL missing'); }) as any;
