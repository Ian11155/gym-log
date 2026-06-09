import { Exercise, Routine, WorkoutLog } from "../types";
import { SquadLocalData } from "../storage/localSquadStorage";
import { getSupabaseClient, getSupabaseSession } from "./supabaseClient";

interface UploadResult {
  exerciseCount: number;
  routineCount: number;
  workoutCount: number;
  setCount: number;
}

export interface CloudPreview {
  squadName: string;
  exerciseCount: number;
  routineCount: number;
  workoutCount: number;
  latestRoutineTitle: string;
  latestWorkoutTitle: string;
}

interface ExerciseCloudMap {
  [localExerciseId: string]: string;
}

export async function uploadLocalDataToSupabase(data: SquadLocalData): Promise<UploadResult> {
  const supabase = await getSupabaseClient();
  const session = await getSupabaseSession();

  if (!supabase || !session) {
    throw new Error("Sign in before uploading local data.");
  }

  const membership = await getPrimarySquadMembership(session.user.id);
  if (!membership?.squad_id) {
    throw new Error("No Supabase squad membership found for this account.");
  }

  const profile = await ensureCurrentProfile(session.user.id, session.user.email || "");
  const squadId = membership.squad_id;
  const cloudExerciseIds = await upsertExerciseLibrary(data.exerciseLibrary, squadId, profile.id);
  const routines = data.routines.filter((routine) => routine.user_id === data.activeUserId);
  const workouts = data.workoutLogs.filter((workout) => workout.user_id === data.activeUserId);

  await upsertRoutines(routines, squadId, profile.id, cloudExerciseIds);
  const setCount = await upsertWorkoutLogs(workouts, squadId, profile.id, cloudExerciseIds);

  return {
    exerciseCount: data.exerciseLibrary.length,
    routineCount: routines.length,
    workoutCount: workouts.length,
    setCount,
  };
}

export async function previewSupabaseData(): Promise<CloudPreview> {
  const session = await getSupabaseSession();
  if (!session) {
    throw new Error("Sign in before previewing cloud data.");
  }

  const membership = await getPrimarySquadMembership(session.user.id);
  if (!membership?.squad_id) {
    throw new Error("No Supabase squad membership found for this account.");
  }

  const squadId = membership.squad_id;
  const squad = await getSquadSummary(squadId);
  const [exerciseCount, routineCount, workoutCount, latestRoutineTitle, latestWorkoutTitle] = await Promise.all([
    getTableCount("exercises", "squad_id", squadId),
    getTableCount("routines", "squad_id", squadId),
    getTableCount("workout_logs", "squad_id", squadId),
    getLatestTitle("routines", "squad_id", squadId, "created_at"),
    getLatestTitle("workout_logs", "squad_id", squadId, "end_time"),
  ]);

  return {
    squadName: squad?.name || "Unknown squad",
    exerciseCount,
    routineCount,
    workoutCount,
    latestRoutineTitle,
    latestWorkoutTitle,
  };
}

async function getPrimarySquadMembership(userId: string) {
  const supabase = await requireSupabaseClient();
  const { data, error } = await supabase
    .from("squad_members")
    .select("squad_id, role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function getSquadSummary(squadId: string) {
  const supabase = await requireSupabaseClient();
  const { data, error } = await supabase
    .from("squads")
    .select("name")
    .eq("id", squadId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function getTableCount(table: "exercises" | "routines" | "workout_logs", column: "squad_id", value: string) {
  const supabase = await requireSupabaseClient();
  const { data, error } = await supabase
    .from(table)
    .select("id")
    .eq(column, value);

  if (error) throw error;
  return data?.length || 0;
}

async function getLatestTitle(
  table: "routines" | "workout_logs",
  column: "squad_id",
  value: string,
  orderColumn: "created_at" | "end_time"
) {
  const supabase = await requireSupabaseClient();
  const { data, error } = await supabase
    .from(table)
    .select("title")
    .eq(column, value)
    .order(orderColumn, { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.title || "None";
}

async function ensureCurrentProfile(userId: string, email: string) {
  const supabase = await requireSupabaseClient();
  const { data: existingProfile, error: fetchError } = await supabase
    .from("profiles")
    .select("id, username, email")
    .eq("id", userId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (existingProfile) return existingProfile;

  const username = email.split("@")[0] || "SquadLift User";
  const { data, error } = await supabase
    .from("profiles")
    .insert({ id: userId, username, email })
    .select("id, username, email")
    .single();

  if (error) throw error;
  return data;
}

async function upsertExerciseLibrary(exercises: Exercise[], squadId: string, userId: string): Promise<ExerciseCloudMap> {
  const supabase = await requireSupabaseClient();
  const { data: existingExercises, error: fetchError } = await supabase
    .from("exercises")
    .select("id, name")
    .eq("squad_id", squadId);

  if (fetchError) throw fetchError;

  const existingByName = new Map(
    (existingExercises || []).map((exercise) => [normalizeExerciseName(exercise.name), exercise.id])
  );
  const cloudIds: ExerciseCloudMap = {};
  const missingExercises = [];

  for (const exercise of exercises) {
    const existingId = existingByName.get(normalizeExerciseName(exercise.name));
    const cloudId = existingId || (await localIdToUuid("exercise", `${squadId}:${exercise.id}`));

    cloudIds[exercise.id] = cloudId;

    if (!existingId) {
      missingExercises.push({
        id: cloudId,
        squad_id: squadId,
        name: exercise.name,
        body_part: exercise.body_part,
        category: exercise.category,
        created_by: exercise.is_custom ? userId : null,
        is_custom: Boolean(exercise.is_custom),
        image_url: exercise.image_url || null,
      });
    }
  }

  if (missingExercises.length > 0) {
    const { error } = await supabase.from("exercises").insert(missingExercises);
    if (error) throw error;
  }

  return cloudIds;
}

async function upsertRoutines(
  routines: Routine[],
  squadId: string,
  userId: string,
  cloudExerciseIds: ExerciseCloudMap
) {
  if (routines.length === 0) return;

  const supabase = await requireSupabaseClient();
  const routineRows = await Promise.all(
    routines.map(async (routine) => ({
      id: await localIdToUuid("routine", `${squadId}:${routine.id}`),
      squad_id: squadId,
      user_id: userId,
      title: routine.title,
      notes: routine.notes || "",
      created_at: routine.created_at,
    }))
  );
  const routineIds = routineRows.map((routine) => routine.id);

  const { error: routineError } = await supabase.from("routines").upsert(routineRows, { onConflict: "id" });
  if (routineError) throw routineError;

  const { error: deleteError } = await supabase.from("routine_exercises").delete().in("routine_id", routineIds);
  if (deleteError) throw deleteError;

  const routineExerciseRows = [];
  const routineSetRows = [];

  for (const routine of routines) {
    const routineId = await localIdToUuid("routine", `${squadId}:${routine.id}`);

    for (const [exerciseIndex, exercise] of routine.exercises.entries()) {
      const routineExerciseId = await localIdToUuid("routine-exercise", `${routineId}:${exercise.exercise_id}:${exerciseIndex}`);
      routineExerciseRows.push({
        id: routineExerciseId,
        routine_id: routineId,
        exercise_id: cloudExerciseIds[exercise.exercise_id],
        order_index: exerciseIndex,
      });

      for (const set of exercise.sets) {
        routineSetRows.push({
          id: await localIdToUuid("routine-set", `${routineExerciseId}:${set.set_number}`),
          routine_exercise_id: routineExerciseId,
          set_number: set.set_number,
          set_type: set.set_type,
          target_reps: Number(set.target_reps || 0),
          target_weight: Number(set.target_weight || 0),
        });
      }
    }
  }

  if (routineExerciseRows.length > 0) {
    const { error } = await supabase.from("routine_exercises").insert(routineExerciseRows);
    if (error) throw error;
  }

  if (routineSetRows.length > 0) {
    const { error } = await supabase.from("routine_sets").insert(routineSetRows);
    if (error) throw error;
  }
}

async function upsertWorkoutLogs(
  workouts: WorkoutLog[],
  squadId: string,
  userId: string,
  cloudExerciseIds: ExerciseCloudMap
) {
  if (workouts.length === 0) return 0;

  const supabase = await requireSupabaseClient();
  const workoutRows = await Promise.all(
    workouts.map(async (workout) => ({
      id: await localIdToUuid("workout", `${squadId}:${workout.id}`),
      squad_id: squadId,
      user_id: userId,
      title: workout.title,
      start_time: workout.start_time,
      end_time: workout.end_time,
      total_volume: Number(workout.total_volume || 0),
      duration_seconds: Number(workout.duration_seconds || 0),
      notes: workout.notes || "",
    }))
  );
  const workoutIds = workoutRows.map((workout) => workout.id);

  const { error: workoutError } = await supabase.from("workout_logs").upsert(workoutRows, { onConflict: "id" });
  if (workoutError) throw workoutError;

  const { error: deleteError } = await supabase.from("logged_exercises").delete().in("workout_log_id", workoutIds);
  if (deleteError) throw deleteError;

  const loggedExerciseRows = [];
  const loggedSetRows = [];

  for (const workout of workouts) {
    const workoutId = await localIdToUuid("workout", `${squadId}:${workout.id}`);

    for (const [exerciseIndex, exercise] of workout.exercises.entries()) {
      const loggedExerciseId = await localIdToUuid("logged-exercise", `${workoutId}:${exercise.id}:${exerciseIndex}`);
      loggedExerciseRows.push({
        id: loggedExerciseId,
        workout_log_id: workoutId,
        exercise_id: cloudExerciseIds[exercise.exercise_id],
        order_index: exercise.order_index ?? exerciseIndex,
      });

      for (const set of exercise.sets) {
        loggedSetRows.push({
          id: await localIdToUuid("logged-set", `${loggedExerciseId}:${set.id}`),
          logged_exercise_id: loggedExerciseId,
          set_number: set.set_number,
          set_type: set.set_type,
          actual_reps: Number(set.actual_reps || 0),
          actual_weight: Number(set.actual_weight || 0),
          is_completed: Boolean(set.is_completed),
        });
      }
    }
  }

  if (loggedExerciseRows.length > 0) {
    const { error } = await supabase.from("logged_exercises").insert(loggedExerciseRows);
    if (error) throw error;
  }

  if (loggedSetRows.length > 0) {
    const { error } = await supabase.from("logged_sets").insert(loggedSetRows);
    if (error) throw error;
  }

  return loggedSetRows.length;
}

async function requireSupabaseClient() {
  const supabase = await getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase env vars are missing.");
  }
  return supabase;
}

function normalizeExerciseName(name: string) {
  return name.trim().toLowerCase();
}

async function localIdToUuid(entity: string, localId: string) {
  const bytes = new TextEncoder().encode(`squadlift:${entity}:${localId}`);
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)).slice(0, 16);

  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;

  const hex = Array.from(hash, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
