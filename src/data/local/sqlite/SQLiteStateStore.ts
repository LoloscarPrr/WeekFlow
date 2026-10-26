import * as SQLite from 'expo-sqlite';
import {
  currentDatabaseVersion,
  pendingDatabaseMigrations,
} from '@/src/data/migrations/databaseSchema';

export class SQLiteStateStore {
  private readonly db: SQLite.SQLiteDatabase;
  private schemaReady = false;

  constructor(databaseName = 'weekflow.db') {
    this.db = SQLite.openDatabaseSync(databaseName);
  }

  private ensureSchema() {
    if (this.schemaReady) return;

    const row = this.db.getFirstSync<{ user_version: number }>('PRAGMA user_version;');
    const currentVersion = row?.user_version ?? 0;

    if (currentVersion <= currentDatabaseVersion) {
      for (const migration of pendingDatabaseMigrations(currentVersion)) {
        this.db.execSync(migration.sql);
        this.db.execSync(`PRAGMA user_version = ${migration.version};`);
      }
    }

    this.schemaReady = true;
  }

  read<T>(key: string): T | null {
    this.ensureSchema();
    const row = this.db.getFirstSync<{ value: string }>(
      'SELECT value FROM weekflow_state WHERE key = ? LIMIT 1;',
      key,
    );

    if (!row?.value) return null;

    try {
      return JSON.parse(row.value) as T;
    } catch {
      return null;
    }
  }

  write(key: string, value: unknown) {
    this.ensureSchema();
    const now = new Date().toISOString();
    this.db.runSync(
      `INSERT INTO weekflow_state (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
      key,
      JSON.stringify(value),
      now,
    );
  }

  // Guarda cambios entre módulos como una única transacción SQLite.
  // Si alguna escritura falla, SQLite revierte todas.
  writeBatch(entries: ReadonlyArray<{ key: string; value: unknown }>) {
    if (!entries.length) return;
    this.ensureSchema();
    const now = new Date().toISOString();
    this.db.withTransactionSync(() => {
      for (const entry of entries) {
        this.db.runSync(
          `INSERT INTO weekflow_state (key, value, updated_at)
           VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
          entry.key,
          JSON.stringify(entry.value),
          now,
        );
      }
    });
  }

  delete(key: string) {
    this.ensureSchema();
    this.db.runSync('DELETE FROM weekflow_state WHERE key = ?;', key);
  }
}

export const sqliteStateStore = new SQLiteStateStore();
