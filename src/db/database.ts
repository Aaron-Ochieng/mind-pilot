import * as SQLite from "expo-sqlite";
import {
  DBLevel,
  HydratedLevel,
  UserProgress,
  mapDBLevelToState,
} from "./schema";

export const DATABASE_NAME = "nativeloop.db";

const toJsonString = (value: unknown, fallback: unknown) => {
  const v = value ?? fallback;
  if (typeof v === "string") {
    try {
      JSON.parse(v);
      return v;
    } catch {
      return JSON.stringify(v);
    }
  }
  return JSON.stringify(v);
};

/**
 * Migration Function: Handles the creation of tables and versioning.
 * Used in SQLiteProvider's 'onInit' or 'onOpen' lifecycle.
 */
export async function migrateDbIfNeeded(db: SQLite.SQLiteDatabase) {
  const DATABASE_VERSION = 3;

  // 1. Get current version from user_version pragma
  const result = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  );
  let currentDbVersion = result?.user_version ?? 0;

  if (currentDbVersion >= DATABASE_VERSION) {
    return;
  }

  // Use a transaction for the entire migration process
  await db.withTransactionAsync(async () => {
    if (currentDbVersion === 0) {
      // Create levels table (Initial)
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS levels (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          remote_id TEXT UNIQUE NOT NULL,
          difficulty_level INTEGER NOT NULL,
          instructions_json TEXT NOT NULL,
          game_loop_json TEXT NOT NULL,
          rotation_degree TEXT NOT NULL DEFAULT '{"from":0,"to":0}',
          solved INTEGER DEFAULT 0,
          created_at INTEGER DEFAULT (CAST(strftime('%s','now') AS INTEGER)),
          updated_at INTEGER DEFAULT (CAST(strftime('%s','now') AS INTEGER))
        );
      `);

      // Create user_progress table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS user_progress (
          level_remote_id TEXT PRIMARY KEY,
          is_completed INTEGER DEFAULT 0,
          best_time INTEGER,
          stars INTEGER DEFAULT 0,
          last_played_at INTEGER,
          FOREIGN KEY (level_remote_id) REFERENCES levels (remote_id) ON DELETE CASCADE
        );
      `);

      // Create sync_meta table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS sync_meta (
          key TEXT PRIMARY KEY,
          value TEXT,
          last_sync_timestamp INTEGER
        );
      `);
    }

    if (currentDbVersion === 1) {
      // Migration from 1 to 2: Add solved column if it doesn't exist (it shouldn't if they followed previous turn exactly)
      await db.execAsync(`
        ALTER TABLE levels ADD COLUMN solved INTEGER DEFAULT 0;
      `);
    }

    if (currentDbVersion === 1 || currentDbVersion === 2) {
      // Migration from 2 to 3: Add rotation_degree column
      await db.execAsync(`
        ALTER TABLE levels ADD COLUMN rotation_degree TEXT NOT NULL DEFAULT '{"from":0,"to":0}';
      `);
    }

    // Update the version in the database
    const pragma_version = `PRAGMA user_version = ${DATABASE_VERSION}`;
    await db.execAsync(pragma_version);
  });
}

/**
 * Query Helper: Fetch all levels
 */
export async function getAllLevels(
  db: SQLite.SQLiteDatabase,
): Promise<DBLevel[]> {
  return await db.getAllAsync<DBLevel>(
    "SELECT * FROM levels ORDER BY difficulty_level ASC",
  );
}

/**
 * Query Helper: Fetch all levels (hydrated)
 */
export async function getAllHydratedLevels(
  db: SQLite.SQLiteDatabase,
): Promise<HydratedLevel[]> {
  const rows = await getAllLevels(db);
  return rows.map(mapDBLevelToState);
}

/**
 * Query Helper: Fetch a single level by difficulty
 */
export async function getLevelByDifficulty(
  db: SQLite.SQLiteDatabase,
  level: number,
): Promise<HydratedLevel | null> {
  const row = await db.getFirstAsync<DBLevel>(
    "SELECT * FROM levels WHERE difficulty_level = ? LIMIT 1",
    level,
  );
  return row ? mapDBLevelToState(row) : null;
}

/**
 * Helper: Count levels in the local database
 */
export async function getLevelsCount(
  db: SQLite.SQLiteDatabase,
): Promise<number> {
  const result = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM levels",
  );
  return result?.count ?? 0;
}

/**
 * Helper: Get last sync timestamp for a sync key
 */
export async function getLastSyncTimestamp(
  db: SQLite.SQLiteDatabase,
  key: string,
): Promise<number | null> {
  const result = await db.getFirstAsync<{ last_sync_timestamp: number }>(
    "SELECT last_sync_timestamp FROM sync_meta WHERE key = ?",
    key,
  );
  return result?.last_sync_timestamp ?? null;
}

/**
 * Sync Helper: Insert or Update levels from Firebase
 */
export async function upsertLevels(db: SQLite.SQLiteDatabase, levels: any[]) {
  const query = `INSERT OR REPLACE INTO levels(remote_id, difficulty_level, instructions_json, game_loop_json, rotation_degree, updated_at) VALUES (?, ?, ?, ?, ?, CAST(strftime('%s','now') AS INTEGER))`;

  for (const level of levels) {
    const rotation =
      level.rotation_degree ?? level.rotationDegree ?? { from: 0, to: 0 };
    await db.runAsync(
      query,
      level.id.toString(),
      level.level,
      toJsonString(level.instructions, []),
      toJsonString(level.gameLoop, []),
      toJsonString(rotation, { from: 0, to: 0 }),
    );
  }
}

/**
 * Mark a level as solved in the local database
 */
export async function markLevelAsSolved(
  db: SQLite.SQLiteDatabase,
  remoteId: string,
) {
  await db.runAsync(
    "UPDATE levels SET solved = 1, updated_at = CAST(strftime('%s','now') AS INTEGER) WHERE remote_id = ?",
    remoteId,
  );
}

/**
 * Progress Helper: Save user progress
 */
export async function saveUserProgress(
  db: SQLite.SQLiteDatabase,
  progress: UserProgress,
) {
  const query =
    "INSERT OR REPLACE INTO user_progress (level_remote_id, is_completed, best_time, stars, last_played_at) VALUES (?, ?, ?, ?, CAST(strftime('%s','now') AS INTEGER))";

  await db.runAsync(
    query,
    progress.level_remote_id,
    progress.is_completed ? 1 : 0,
    progress.best_time ?? null,
    progress.stars,
    Date.now(),
  );
}
