import { Instruction, Rotate } from "@/store/loop-game-instructions";
import { Loop } from "@/loops/gameLoop";

/**
 * Raw data from SQLite (where arrays are stored as JSON strings)
 */
export interface DBLevel {
  id: number;
  remote_id: string;
  difficulty_level: number;
  instructions_json: string;
  game_loop_json: string;
  rotation_degree: string;
  solved: number; // 0 or 1
}

/**
 * Hydrated level data, ready for the Zustand store
 */
export interface HydratedLevel {
  id: string;
  level: number;
  instructions: Instruction[][];
  gameLoop: Loop[][];
  rotationDegree: Rotate;
  solved: boolean;
}

/**
 * User's progress on a specific level
 */
export interface UserProgress {
  level_remote_id: string;
  is_completed: boolean;
  best_time?: number;
  stars: number;
  last_played_at?: number;
}

/**
 * Utility: Map a DBLevel (SQLite) to a HydratedLevel (State)
 */
const parseMaybeJson = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }
  return value;
};

const normalizeGrid = <T>(grid: unknown): T[][] => {
  const normalizeRow = (row: unknown): T[] => {
    const parsedRow = parseMaybeJson(row);
    if (Array.isArray(parsedRow)) return parsedRow as T[];
    if (parsedRow && typeof parsedRow === "object") {
      const keys = Object.keys(parsedRow as Record<string, T>).sort(
        (a, b) => Number(a) - Number(b),
      );
      return keys.map((k) => (parsedRow as Record<string, T>)[k]);
    }
    return [];
  };

  const parsedGrid = parseMaybeJson(grid);

  if (Array.isArray(parsedGrid)) {
    return (parsedGrid as unknown[]).map((row) => normalizeRow(row));
  }

  if (parsedGrid && typeof parsedGrid === "object") {
    const keys = Object.keys(parsedGrid as Record<string, unknown>).sort(
      (a, b) => Number(a) - Number(b),
    );
    return keys.map((k) =>
      normalizeRow((parsedGrid as Record<string, unknown>)[k]),
    );
  }

  return [];
};

const safeJsonParse = (value: string) => {
  try {
    const first = JSON.parse(value);
    if (typeof first === "string") {
      const trimmed = first.trim();
      if (
        (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
        (trimmed.startsWith("[") && trimmed.endsWith("]"))
      ) {
        try {
          return JSON.parse(first);
        } catch {
          return first;
        }
      }
    }
    return first;
  } catch {
    return null;
  }
};

const normalizeRotate = (value: unknown): Rotate => {
  if (value && typeof value === "object") {
    const maybe = value as { from?: unknown; to?: unknown };
    if (typeof maybe.from === "number" && typeof maybe.to === "number") {
      return { from: maybe.from, to: maybe.to };
    }
  }

  if (Array.isArray(value) && value.length >= 2) {
    const [from, to] = value;
    if (typeof from === "number" && typeof to === "number") {
      return { from, to };
    }
  }

  if (typeof value === "number") {
    return { from: 0, to: value };
  }

  return { from: 0, to: 0 };
};

export const mapDBLevelToState = (row: DBLevel): HydratedLevel => {
  const rawInstructions = safeJsonParse(row.instructions_json);
  const rawGameLoop = safeJsonParse(row.game_loop_json);
  const rawRotation = safeJsonParse(row.rotation_degree);

  return {
    id: row.remote_id,
    level: row.difficulty_level,
    instructions: normalizeGrid<Instruction>(rawInstructions),
    gameLoop: normalizeGrid<Loop>(rawGameLoop),
    rotationDegree: normalizeRotate(rawRotation),
    solved: row.solved === 1,
  };
};

/**
 * Utility: Prepare a level from Firebase/JSON for SQLite Insertion
 */
export const mapJsonToDBParams = (levelData: any) => ({
  remote_id: levelData.id.toString(),
  difficulty_level: levelData.level,
  instructions_json: JSON.stringify(levelData.instructions),
  rotation_degree: JSON.stringify(
    levelData.rotation_degree ?? levelData.rotationDegree ?? { from: 0, to: 0 },
  ),
  game_loop_json: JSON.stringify(levelData.gameLoop),
});
