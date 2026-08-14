import * as SQLite from 'expo-sqlite';

export class SQLiteStateStore {
  private readonly db: SQLite.SQLiteDatabase;

  constructor(databaseName = 'weekflow.db') {
    this.db = SQLite.openDatabaseSync(databaseName);
  }

  private ensureTable() {
    this.db.execSync(`
      CREATE TABLE IF NOT EXISTS weekflow_state (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
  }

  read<T>(key: string): T | null {
    this.ensureTable();
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
    this.ensureTable();
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

  delete(key: string) {
    this.ensureTable();
    this.db.runSync('DELETE FROM weekflow_state WHERE key = ?;', key);
  }
}

export const sqliteStateStore = new SQLiteStateStore();
