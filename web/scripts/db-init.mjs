import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const url = process.env.NEON_DATABASE_URL;
if (!url) {
  console.error('NEON_DATABASE_URL env var is required');
  process.exit(1);
}

const sql = neon(url);

// Check for existing users table to keep init idempotent
const [{ exists }] = await sql`SELECT to_regclass('public.users') IS NOT NULL AS exists`;
if (exists) {
  console.log('Schema already initialized.');
  process.exit(0);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const initSql = await readFile(path.join(__dirname, '..', 'db', 'init.sql'), 'utf8');

for (const statement of initSql.split(/;\s*\n/)) {
  const trimmed = statement.trim();
  if (trimmed) {
    await sql(trimmed);
  }
}

console.log('Database initialized.');
