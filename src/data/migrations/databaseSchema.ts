export const currentDatabaseVersion = 1;

type DatabaseMigration = {
  version: number;
  sql: string;
};

const migrations: DatabaseMigration[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS weekflow_state (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `,
  },
];

export function pendingDatabaseMigrations(currentVersion: number) {
  if (!Number.isInteger(currentVersion) || currentVersion < 0) {
    throw new Error(`Invalid database version: ${currentVersion}`);
  }

  return migrations.filter((migration) => migration.version > currentVersion);
}
