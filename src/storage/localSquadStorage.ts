import {
  Comment,
  Exercise,
  INITIAL_COMMENTS,
  INITIAL_EXERCISES,
  INITIAL_REACTIONS,
  INITIAL_ROUTINES,
  INITIAL_WORKOUT_LOGS,
  Reaction,
  Routine,
  SQUAD_USERS,
  WorkoutLog,
} from "../types";

export const LOCAL_DATA_VERSION = 1;
const STORAGE_KEY = "squadlift_local_state_v1";

const LEGACY_KEYS = {
  workoutLogs: "squad_workout_logs",
  comments: "squad_comments",
  reactions: "squad_reactions",
  exerciseLibrary: "squad_exercises",
  routines: "squad_routines",
} as const;

export interface UserStreaks {
  [userId: string]: number;
}

export interface SquadLocalData {
  workoutLogs: WorkoutLog[];
  comments: Comment[];
  reactions: Reaction[];
  exerciseLibrary: Exercise[];
  routines: Routine[];
  activeUserId: string;
  userStreaks: UserStreaks;
}

interface PersistedPayload {
  version: number;
  savedAt: string;
  data: SquadLocalData;
}

export interface LoadLocalDataResult {
  data: SquadLocalData;
  source: "snapshot" | "legacy" | "seed";
  warning?: string;
}

export const DEFAULT_USER_STREAKS: UserStreaks = {
  "user-1": 4,
  "user-2": 6,
  "user-3": 5,
  "user-4": 3,
};

export function createDefaultSquadData(): SquadLocalData {
  return {
    workoutLogs: INITIAL_WORKOUT_LOGS,
    comments: INITIAL_COMMENTS,
    reactions: INITIAL_REACTIONS,
    exerciseLibrary: INITIAL_EXERCISES,
    routines: INITIAL_ROUTINES,
    activeUserId: "user-1",
    userStreaks: DEFAULT_USER_STREAKS,
  };
}

export function loadLocalSquadData(): LoadLocalDataResult {
  const snapshot = readSnapshot();
  if (snapshot.data) {
    return { data: snapshot.data, source: "snapshot", warning: snapshot.warning };
  }

  const legacy = readLegacyData();
  if (legacy.data) {
    return { data: legacy.data, source: "legacy", warning: legacy.warning };
  }

  return {
    data: createDefaultSquadData(),
    source: "seed",
    warning: snapshot.warning || legacy.warning,
  };
}

export function saveLocalSquadData(data: SquadLocalData): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: LOCAL_DATA_VERSION,
      savedAt: new Date().toISOString(),
      data: normalizeSquadData(data),
    } satisfies PersistedPayload)
  );
}

export function exportLocalSquadData(data: SquadLocalData): string {
  return JSON.stringify(
    {
      version: LOCAL_DATA_VERSION,
      exportedAt: new Date().toISOString(),
      data: normalizeSquadData(data),
    },
    null,
    2
  );
}

export function parseLocalSquadBackup(raw: string): SquadLocalData {
  const parsed = JSON.parse(raw) as Partial<PersistedPayload>;
  return normalizeSquadData(parsed.data);
}

export function clearLocalSquadData(): void {
  localStorage.removeItem(STORAGE_KEY);
  Object.values(LEGACY_KEYS).forEach((key) => localStorage.removeItem(key));
}

function readSnapshot(): { data?: SquadLocalData; warning?: string } {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};

  try {
    const payload = JSON.parse(raw) as Partial<PersistedPayload>;
    if (payload.version !== LOCAL_DATA_VERSION) {
      return { warning: "Local data version changed; loaded seed data instead." };
    }
    return { data: normalizeSquadData(payload.data) };
  } catch {
    return { warning: "Local data was corrupted; loaded seed data instead." };
  }
}

function readLegacyData(): { data?: SquadLocalData; warning?: string } {
  const hasLegacyData = Object.values(LEGACY_KEYS).some((key) => localStorage.getItem(key));
  if (!hasLegacyData) return {};

  try {
    return {
      data: normalizeSquadData({
        workoutLogs: readLegacyArray<WorkoutLog>(LEGACY_KEYS.workoutLogs, INITIAL_WORKOUT_LOGS),
        comments: readLegacyArray<Comment>(LEGACY_KEYS.comments, INITIAL_COMMENTS),
        reactions: readLegacyArray<Reaction>(LEGACY_KEYS.reactions, INITIAL_REACTIONS),
        exerciseLibrary: readLegacyArray<Exercise>(LEGACY_KEYS.exerciseLibrary, INITIAL_EXERCISES),
        routines: readLegacyArray<Routine>(LEGACY_KEYS.routines, INITIAL_ROUTINES),
        activeUserId: "user-1",
        userStreaks: DEFAULT_USER_STREAKS,
      }),
    };
  } catch {
    return { warning: "Legacy local data was corrupted; loaded seed data instead." };
  }
}

function readLegacyArray<T>(key: string, fallback: T[]): T[] {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : fallback;
}

function normalizeSquadData(data: unknown): SquadLocalData {
  const value = (data || {}) as Partial<SquadLocalData>;
  const activeUserId = SQUAD_USERS.some((user) => user.id === value.activeUserId)
    ? value.activeUserId
    : "user-1";

  return {
    workoutLogs: Array.isArray(value.workoutLogs) ? value.workoutLogs : INITIAL_WORKOUT_LOGS,
    comments: Array.isArray(value.comments) ? value.comments : INITIAL_COMMENTS,
    reactions: Array.isArray(value.reactions) ? value.reactions : INITIAL_REACTIONS,
    exerciseLibrary: Array.isArray(value.exerciseLibrary) ? value.exerciseLibrary : INITIAL_EXERCISES,
    routines: Array.isArray(value.routines) ? value.routines : INITIAL_ROUTINES,
    activeUserId,
    userStreaks: value.userStreaks && typeof value.userStreaks === "object" ? value.userStreaks : DEFAULT_USER_STREAKS,
  };
}
