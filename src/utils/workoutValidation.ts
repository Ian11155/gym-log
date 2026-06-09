import { ActiveWorkout, Exercise, LoggedSet } from "../types";

export const normalizeExerciseName = (name: string) =>
  name.trim().replace(/\s+/g, " ").toLowerCase();

export const hasExerciseName = (exerciseLibrary: Exercise[], name: string) => {
  const normalizedName = normalizeExerciseName(name);
  return exerciseLibrary.some((exercise) => normalizeExerciseName(exercise.name) === normalizedName);
};

export const sanitizeReps = (value: string | number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed));
};

export const sanitizeWeight = (value: string | number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed * 100) / 100);
};

export const isCompletedSetValid = (set: LoggedSet) =>
  set.is_completed && Number.isFinite(set.actual_reps) && Number.isFinite(set.actual_weight) && set.actual_reps > 0 && set.actual_weight >= 0;

export const getInvalidCompletedSetCount = (workout: ActiveWorkout) =>
  workout.exercises.reduce(
    (count, exercise) =>
      count +
      exercise.sets.filter(
        (set) =>
          set.is_completed &&
          (!Number.isFinite(set.actual_reps) || !Number.isFinite(set.actual_weight) || set.actual_reps <= 0 || set.actual_weight < 0)
      ).length,
    0
  );

export const getCompletedWorkoutSets = (workout: ActiveWorkout) =>
  workout.exercises.flatMap((exercise) => exercise.sets.filter(isCompletedSetValid));
