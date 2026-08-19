import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js'
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import { get, set } from 'idb-keyval'
import { runMigrations } from './migrations'
import { SCHEMA_SQL } from './schema'

const STORAGE_KEY = 'skopos-db'

let sqlPromise: Promise<SqlJsStatic> | null = null
let db: Database | null = null
let saveTimer: ReturnType<typeof setTimeout> | null = null

function getSql(): Promise<SqlJsStatic> {
  if (!sqlPromise) {
    sqlPromise = initSqlJs({ locateFile: () => sqlWasmUrl })
  }
  return sqlPromise
}

export async function getDb(): Promise<Database> {
  if (db) return db

  const SQL = await getSql()
  const existing = await get<Uint8Array>(STORAGE_KEY)

  db = existing ? new SQL.Database(existing) : new SQL.Database()
  const migrou = runMigrations(db)
  db.run(SCHEMA_SQL)
  db.run('PRAGMA foreign_keys = ON')
  if (!existing || migrou) await persist()

  return db
}

async function persist(): Promise<void> {
  if (!db) return
  const bytes = db.export()
  await set(STORAGE_KEY, bytes)
}

export function scheduleSave(): void {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    void persist()
  }, 300)
}

export async function run(sql: string, params: (string | number | null)[] = []): Promise<void> {
  const database = await getDb()
  database.run(sql, params)
  scheduleSave()
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  params: (string | number | null)[] = [],
): Promise<T[]> {
  const database = await getDb()
  const stmt = database.prepare(sql)
  stmt.bind(params)
  const rows: T[] = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T)
  }
  stmt.free()
  return rows
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params: (string | number | null)[] = [],
): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return rows[0] ?? null
}

export async function exportDbFile(): Promise<Uint8Array> {
  const database = await getDb()
  return database.export()
}

export async function importDbFile(bytes: Uint8Array): Promise<void> {
  const SQL = await getSql()
  db = new SQL.Database(bytes)
  runMigrations(db)
  db.run(SCHEMA_SQL)
  db.run('PRAGMA foreign_keys = ON')
  await persist()
}

const TABELAS = [
  'perfil',
  'medidas_antropometricas',
  'registros_hidratacao',
  'registros_sono',
  'registros_nutricao',
  'planos_nutricionais',
  'planos_treino',
  'dias_plano',
  'exercicios_plano',
  'registros_treino',
  'execucoes_exercicio',
]

export async function exportDbAsJson(): Promise<Record<string, unknown[]>> {
  const resultado: Record<string, unknown[]> = {}
  for (const tabela of TABELAS) {
    resultado[tabela] = await query(`SELECT * FROM ${tabela}`)
  }
  return resultado
}
