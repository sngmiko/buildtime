// Generic migration runner for Supabase
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const CONN = 'postgresql://postgres.lxeuiiwgnvtibyacanyp:Miko123456789!!!ojilsadfaoödsifkj@aws-1-eu-north-1.pooler.supabase.com:5432/postgres';

async function run() {
  const file = process.argv[2];
  if (!file) { console.error('Usage: node scripts/migrate.js <migration-file>'); process.exit(1); }

  const client = new Client({ connectionString: CONN, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected');

  const sql = fs.readFileSync(file, 'utf8');

  // Execute as single transaction
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Migration applied:', path.basename(file));
  } catch(e) {
    await client.query('ROLLBACK');
    // Try statement by statement for partial application
    console.log('Full transaction failed, trying per-statement...');
    const lines = sql.split('\n');
    let stmt = '';
    let success = 0, errors = 0;

    for (const line of lines) {
      if (line.trim().startsWith('--')) continue;
      stmt += line + '\n';

      // Simple heuristic: if line ends with ; and we're not inside parens
      if (line.trim().endsWith(';')) {
        try {
          await client.query(stmt);
          success++;
        } catch(err) {
          if (!err.message.includes('already exists') && !err.message.includes('duplicate')) {
            errors++;
            console.log('ERROR:', err.message.substring(0, 100));
          }
        }
        stmt = '';
      }
    }

    // Handle remaining statement without trailing semicolon
    if (stmt.trim()) {
      try { await client.query(stmt); success++; } catch(err) {
        if (!err.message.includes('already exists')) console.log('ERROR:', err.message.substring(0, 100));
      }
    }

    console.log(`Per-statement: ${success} succeeded, ${errors} errors`);
  }

  const { rows } = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
  console.log('Tables:', rows.map(r => r.tablename).join(', '));

  await client.end();
}
run().catch(e => { console.error(e.message); process.exit(1); });
