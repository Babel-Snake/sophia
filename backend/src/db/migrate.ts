import { sequelize } from './connection';
import { QueryTypes } from 'sequelize';
import fs from 'fs';
import path from 'path';

/**
 * Simple migration runner
 * Migrations are SQL files in src/db/migrations/ named like 001_initial.sql
 * Tracks applied migrations in a _migrations table
 */

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function createMigrationsTable() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getAppliedMigrations(): Promise<string[]> {
  const rows = await sequelize.query<{ name: string }>(
    'SELECT name FROM _migrations ORDER BY id',
    { type: QueryTypes.SELECT }
  );
  return (rows || []).map((r) => r.name);
}

async function applyMigration(file: string) {
  const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    await sequelize.query(stmt);
  }

  await sequelize.query('INSERT INTO _migrations (name) VALUES (?)', {
    replacements: [file],
  });
}

async function runMigrations() {
  await createMigrationsTable();
  const applied = await getAppliedMigrations();
  
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.log('No migrations directory found, creating...');
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    return;
  }

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (!applied.includes(file)) {
      console.log(`Applying migration: ${file}`);
      await applyMigration(file);
      console.log(`✓ ${file}`);
    }
  }

  console.log('All migrations applied successfully.');
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migration complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

export { runMigrations };
