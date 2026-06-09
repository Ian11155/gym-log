import { LoggedExercise, WorkoutLog } from "../types";

export const getCompletedSets = (workout: WorkoutLog) =>
  workout.exercises.flatMap((exercise) => exercise.sets.filter((set) => set.is_completed));

export const getExerciseVolume = (exercise: LoggedExercise) =>
  exercise.sets
    .filter((set) => set.is_completed)
    .reduce((total, set) => total + Number(set.actual_weight) * Number(set.actual_reps), 0);

export const getCompletedSetCount = (workout: WorkoutLog) => getCompletedSets(workout).length;

export const getWorkoutStats = (workouts: WorkoutLog[]) => {
  const totalDurationSeconds = workouts.reduce((total, workout) => total + Number(workout.duration_seconds || 0), 0);
  const latestWorkout = workouts.reduce<WorkoutLog | null>((latest, workout) => {
    if (!latest) return workout;
    return new Date(workout.end_time).getTime() > new Date(latest.end_time).getTime() ? workout : latest;
  }, null);

  return {
    totalWorkouts: workouts.length,
    totalVolume: workouts.reduce((total, workout) => total + Number(workout.total_volume || 0), 0),
    totalCompletedSets: workouts.reduce((total, workout) => total + getCompletedSetCount(workout), 0),
    totalDurationSeconds,
    averageDurationSeconds: workouts.length > 0 ? Math.round(totalDurationSeconds / workouts.length) : 0,
    mostRecentWorkoutDate: latestWorkout?.end_time,
  };
};

export const formatDuration = (secs: number) => {
  const safeSeconds = Math.max(0, Number(secs) || 0);
  const hrs = Math.floor(safeSeconds / 3600);
  const mins = Math.floor((safeSeconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
};

export const formatShortDate = (dateStr?: string) => {
  if (!dateStr) return "No workouts";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};
