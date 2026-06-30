import fs from 'fs';
import path from 'path';
import pool from './mysql';

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, '../../migrations/001_payments.sql'), 'utf-8');
  const stmts = sql.split(';').filter(s => s.trim());
  for (const s of stmts) await pool.execute(s);
  console.log('Payment service migration done');
  process.exit(0);
}
migrate().catch(err => { console.error(err); process.exit(1); });
