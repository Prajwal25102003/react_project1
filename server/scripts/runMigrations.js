/**
 * Apply pending SQL files under server/sql/migrations in name order.
 *
 * Usage:
 *   npm run migrate
 *   node server/scripts/runMigrations.js
 *
 * Existing databases that were migrated manually are bootstrapped: historical
 * files are recorded as applied, then only newer pending files run.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import pool, { connectDatabase, query } from '../config/db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env') })

const MIGRATIONS_DIR = path.join(__dirname, '../sql/migrations')

/** Always attempt these on upgrade paths (idempotent SQL). */
const RECENT_MIGRATIONS = new Set([
  '039_upload_files.sql',
  '040_users_token_version.sql',
  '041_leave_type_check.sql',
])

async function ensureMigrationsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
}

async function appliedIds() {
  const result = await query(`SELECT id FROM schema_migrations ORDER BY id ASC`)
  return new Set(result.rows.map((row) => row.id))
}

function listMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return []
  }
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

async function stampMigration(filename) {
  await query(
    `INSERT INTO schema_migrations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`,
    [filename],
  )
}

/**
 * If the DB already has EMS tables but no migration history, record older
 * files as applied so only recent idempotent upgrades run.
 */
async function bootstrapExistingDatabase(files) {
  const countResult = await query(
    `SELECT COUNT(*)::int AS n FROM schema_migrations`,
  )
  if (Number(countResult.rows[0].n) > 0) return

  const emp = await query(`SELECT to_regclass('public.employees') AS reg`)
  if (!emp.rows[0].reg) return

  console.log(
    'Detected existing schema without migration history — stamping prior migrations…',
  )
  for (const file of files) {
    if (RECENT_MIGRATIONS.has(file)) continue
    await stampMigration(file)
  }
}

async function applyMigration(filename) {
  const fullPath = path.join(MIGRATIONS_DIR, filename)
  const sql = fs.readFileSync(fullPath, 'utf8')
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(sql)
    await client.query(
      `INSERT INTO schema_migrations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`,
      [filename],
    )
    await client.query('COMMIT')
    console.log(`Applied ${filename}`)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

async function main() {
  await connectDatabase()
  await ensureMigrationsTable()
  const files = listMigrationFiles()
  await bootstrapExistingDatabase(files)

  const done = await appliedIds()
  let applied = 0

  for (const file of files) {
    if (done.has(file)) continue
    await applyMigration(file)
    applied += 1
  }

  if (applied === 0) {
    console.log(`Migrations up to date (${files.length} file(s) tracked).`)
  } else {
    console.log(`Applied ${applied} migration(s).`)
  }

  await pool.end()
}

main().catch(async (error) => {
  console.error('Migration failed:', error.message || error)
  try {
    await pool.end()
  } catch {
    /* ignore */
  }
  process.exit(1)
})
