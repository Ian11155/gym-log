/**
 * TypeScript definitions & Seed Data for SquadLift (iOS Private Hevyapp Clone)
 */

export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url: string;
  created_at: string;
  streak: number;
}

export interface Exercise {
  id: string;
  name: string;
  body_part: string;
  category: string; // e.g. 'Barbell', 'Dumbbell', 'Machine', 'Bodyweight'
  created_by?: string; // FK to matching User id (collaborative shared library)
  is_custom?: boolean;
  image_url?: string;
}

export interface Routine {
  id: string;
  user_id: string;
  title: string;
  notes: string;
  created_at: string;
  exercises: {
    exercise_id: string;
    sets: {
      set_number: number;
      set_type: string; // 'Normal' | 'Warmup' | 'Drop' | 'Failure'
      target_reps: number;
      target_weight: number;
    }[];
  }[];
}

export interface LoggedSet {
  id: string;
  set_number: number;
  set_type: string; // 'Normal' | 'Warmup' | 'Drop' | 'Failure'
  actual_reps: number;
  actual_weight: number;
  is_completed: boolean;
}

export interface LoggedExercise {
  id: string;
  exercise_id: string;
  order_index: number;
  sets: LoggedSet[];
}

export interface WorkoutLog {
  id: string;
  user_id: string;
  title: string;
  start_time: string;
  end_time: string;
  total_volume: number;
  duration_seconds: number;
  notes: string;
  exercises: LoggedExercise[];
}

export interface Comment {
  id: string;
  workout_log_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
}

export interface Reaction {
  id: string;
  workout_log_id: string;
  user_id: string;
  reaction_type: string; // 'fist_bump'
}

// Global active workout state
export interface ActiveWorkout {
  title: string;
  start_time: string;
  notes: string;
  exercises: LoggedExercise[];
}

// ----------------------------------------------------
// SEED DATA FOR SIMULATING THE SQUAD of 4 FRIENDS
// ----------------------------------------------------

const createAvatarDataUri = (initials: string, bg: string, fg = "#f7f5f4") =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" rx="80" fill="${bg}"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="${fg}" font-family="Inter, Arial, sans-serif" font-size="56" font-weight="800">${initials}</text></svg>`
  )}`;

export const SQUAD_USERS: User[] = [
  {
    id: "user-1",
    username: "Alex 'Apex' Chen",
    email: "killzone1099@gmail.com",
    avatar_url: createAvatarDataUri("AC", "#3f3a34"),
    created_at: "2026-01-15T08:00:00Z",
    streak: 4
  },
  {
    id: "user-2",
    username: "Marcus 'Beast' Vance",
    email: "marcus.vance@beastlift.io",
    avatar_url: createAvatarDataUri("MV", "#2f3535"),
    created_at: "2026-01-16T12:00:00Z",
    streak: 6
  },
  {
    id: "user-3",
    username: "Leo 'Aesthetic' Rossi",
    email: "leo.rossi@classicbody.com",
    avatar_url: createAvatarDataUri("LR", "#3b3442"),
    created_at: "2026-02-01T10:30:00Z",
    streak: 5
  },
  {
    id: "user-4",
    username: "Sarah 'Zenith' Cross",
    email: "sarah.cross@zenithfit.org",
    avatar_url: createAvatarDataUri("SC", "#46342f"),
    created_at: "2026-02-14T09:15:00Z",
    streak: 3
  }
];

export const INITIAL_EXERCISES: Exercise[] = [
  { id: "ex-1", name: "Bench Press (Barbell)", body_part: "Chest", category: "Barbell" },
  { id: "ex-2", name: "Incline Press (Dumbbell)", body_part: "Chest", category: "Dumbbell" },
  { id: "ex-3", name: "Squats (Barbell)", body_part: "Legs", category: "Barbell" },
  { id: "ex-4", name: "Pull-ups", body_part: "Back", category: "Bodyweight" },
  { id: "ex-5", name: "Romanian Deadlift (Barbell)", body_part: "Legs", category: "Barbell" },
  { id: "ex-6", name: "Lateral Raise (Dumbbell)", body_part: "Shoulders", category: "Dumbbell" },
  { id: "ex-7", name: "Incline Hammer Curl", body_part: "Arms", category: "Dumbbell" },
  { id: "ex-8", name: "Overhead Press (Barbell)", body_part: "Shoulders", category: "Barbell" },
  { id: "ex-9", name: "Bicep Curl (Barbell)", body_part: "Arms", category: "Barbell" },
  { id: "ex-10", name: "Tricep Rope Pushdown", body_part: "Arms", category: "Machine" },
  { id: "ex-11", name: "Leg Press", body_part: "Legs", category: "Machine" },
  { id: "ex-12", name: "Leg Extension", body_part: "Legs", category: "Machine" }
];

export const INITIAL_ROUTINES: Routine[] = [
  {
    id: "rt-1",
    user_id: "user-1",
    title: "Apex Push Day A",
    notes: "Targeting chest, front delts, and triceps focus on progressive overload.",
    created_at: "2026-06-01T08:00:00Z",
    exercises: [
      {
        exercise_id: "ex-1",
        sets: [
          { set_number: 1, set_type: "Warmup", target_reps: 10, target_weight: 135 },
          { set_number: 2, set_type: "Normal", target_reps: 8, target_weight: 225 },
          { set_number: 3, set_type: "Normal", target_reps: 8, target_weight: 225 },
          { set_number: 4, set_type: "Drop", target_reps: 12, target_weight: 185 }
        ]
      },
      {
        exercise_id: "ex-2",
        sets: [
          { set_number: 1, set_type: "Normal", target_reps: 8, target_weight: 85 },
          { set_number: 2, set_type: "Normal", target_reps: 8, target_weight: 85 },
          { set_number: 3, set_type: "Normal", target_reps: 10, target_weight: 75 }
        ]
      },
      {
        exercise_id: "ex-6",
        sets: [
          { set_number: 1, set_type: "Normal", target_reps: 12, target_weight: 30 },
          { set_number: 2, set_type: "Normal", target_reps: 12, target_weight: 30 },
          { set_number: 3, set_type: "Normal", target_reps: 15, target_weight: 25 }
        ]
      }
    ]
  },
  {
    id: "rt-2",
    user_id: "user-2",
    title: "Beast Squat Heavy Focus",
    notes: "Strict 3-minute rests. Maximum depth, explode up.",
    created_at: "2026-06-02T12:00:00Z",
    exercises: [
      {
        exercise_id: "ex-3",
        sets: [
          { set_number: 1, set_type: "Warmup", target_reps: 8, target_weight: 135 },
          { set_number: 2, set_type: "Warmup", target_reps: 5, target_weight: 225 },
          { set_number: 3, set_type: "Normal", target_reps: 3, target_weight: 315 },
          { set_number: 4, set_type: "Normal", target_reps: 3, target_weight: 315 },
          { set_number: 5, set_type: "Normal", target_reps: 3, target_weight: 335 }
        ]
      },
      {
        exercise_id: "ex-5",
        sets: [
          { set_number: 1, set_type: "Normal", target_reps: 8, target_weight: 225 },
          { set_number: 2, set_type: "Normal", target_reps: 8, target_weight: 225 },
          { set_number: 3, set_type: "Normal", target_reps: 8, target_weight: 245 }
        ]
      }
    ]
  },
  {
    id: "rt-3",
    user_id: "user-3",
    title: "Aesthetic Back Width",
    notes: "Controlled eccentrics & deep stretch at bottom of reps.",
    created_at: "2026-06-03T10:00:00Z",
    exercises: [
      {
        exercise_id: "ex-4",
        sets: [
          { set_number: 1, set_type: "Normal", target_reps: 12, target_weight: 0 },
          { set_number: 2, set_type: "Normal", target_reps: 10, target_weight: 15 },
          { set_number: 3, set_type: "Normal", target_reps: 8, target_weight: 25 },
          { set_number: 4, set_type: "Failure", target_reps: 8, target_weight: 0 }
        ]
      },
      {
        exercise_id: "ex-7",
        sets: [
          { set_number: 1, set_type: "Normal", target_reps: 12, target_weight: 40 },
          { set_number: 2, set_type: "Normal", target_reps: 10, target_weight: 45 },
          { set_number: 3, set_type: "Normal", target_reps: 10, target_weight: 45 }
        ]
      }
    ]
  }
];

export const INITIAL_WORKOUT_LOGS: WorkoutLog[] = [
  {
    id: "wl-1",
    user_id: "user-2", // Marcus
    title: "🔥 Monday Absolute Bench PR Blast",
    start_time: "2026-06-07T16:00:00Z",
    end_time: "2026-06-07T17:15:00Z",
    duration_seconds: 4500,
    total_volume: 7200,
    notes: "Felt like a tank today. Smashed 140kg for chest reps with full control. Squad accountability made me finish that last drop set!",
    exercises: [
      {
        id: "le-1",
        exercise_id: "ex-1", // Bench Press
        order_index: 0,
        sets: [
          { id: "ls-1", set_number: 1, set_type: "Warmup", actual_reps: 10, actual_weight: 135, is_completed: true },
          { id: "ls-2", set_number: 2, set_type: "Normal", actual_reps: 5, actual_weight: 225, is_completed: true },
          { id: "ls-3", set_number: 3, set_type: "Normal", actual_reps: 3, actual_weight: 275, is_completed: true },
          { id: "ls-4", set_number: 4, set_type: "Normal", actual_reps: 3, actual_weight: 315, is_completed: true },
          { id: "ls-5", set_number: 5, set_type: "Drop", actual_reps: 10, actual_weight: 185, is_completed: true }
        ]
      },
      {
        id: "le-2",
        exercise_id: "ex-6", // Lateral raises
        order_index: 1,
        sets: [
          { id: "ls-6", set_number: 1, set_type: "Normal", actual_reps: 15, actual_weight: 35, is_completed: true },
          { id: "ls-7", set_number: 2, set_type: "Normal", actual_reps: 12, actual_weight: 40, is_completed: true },
          { id: "ls-8", set_number: 3, set_type: "Normal", actual_reps: 12, actual_weight: 40, is_completed: true }
        ]
      }
    ]
  },
  {
    id: "wl-2",
    user_id: "user-4", // Sarah
    title: "⚡ Cross-Fit Endurance & Power Legs",
    start_time: "2026-06-08T05:30:00Z",
    end_time: "2026-06-08T06:40:00Z",
    duration_seconds: 4200,
    total_volume: 8520,
    notes: "Squats moving smooth today! Stretched out the hamstrings on RDLs. Getting ready for the weekend trek.",
    exercises: [
      {
        id: "le-3",
        exercise_id: "ex-3", // Squats
        order_index: 0,
        sets: [
          { id: "ls-9", set_number: 1, set_type: "Normal", actual_reps: 8, actual_weight: 185, is_completed: true },
          { id: "ls-10", set_number: 2, set_type: "Normal", actual_reps: 8, actual_weight: 205, is_completed: true },
          { id: "ls-11", set_number: 3, set_type: "Normal", actual_reps: 6, actual_weight: 225, is_completed: true }
        ]
      },
      {
        id: "le-4",
        exercise_id: "ex-5", // RDL
        order_index: 1,
        sets: [
          { id: "ls-12", set_number: 1, set_type: "Normal", actual_reps: 10, actual_weight: 185, is_completed: true },
          { id: "ls-13", set_number: 2, set_type: "Normal", actual_reps: 10, actual_weight: 185, is_completed: true }
        ]
      }
    ]
  },
  {
    id: "wl-3",
    user_id: "user-3", // Leo
    title: "📐 Classic Aesthetic High Volume Back Day",
    start_time: "2026-06-07T10:00:00Z",
    end_time: "2026-06-07T11:20:00Z",
    duration_seconds: 4800,
    total_volume: 4850,
    notes: "Unbelievable back pump. Weighted pull-ups are finally feeling light. Focused on the lat stretch.",
    exercises: [
      {
        id: "le-5",
        exercise_id: "ex-4", // Pullups
        order_index: 0,
        sets: [
          { id: "ls-14", set_number: 1, set_type: "Normal", actual_reps: 12, actual_weight: 0, is_completed: true },
          { id: "ls-15", set_number: 2, set_type: "Normal", actual_reps: 10, actual_weight: 25, is_completed: true },
          { id: "ls-16", set_number: 3, set_type: "Normal", actual_reps: 8, actual_weight: 35, is_completed: true }
        ]
      }
    ]
  }
];

export const INITIAL_COMMENTS: Comment[] = [
  {
    id: "c-1",
    workout_log_id: "wl-1",
    user_id: "user-1", // Alex
    comment_text: "315 for 3 reps absolute beast mode! 🔥",
    created_at: "2026-06-07T17:35:00Z"
  },
  {
    id: "c-2",
    workout_log_id: "wl-1",
    user_id: "user-3", // Leo
    comment_text: "Your front delts must be crying Marcus. Good stuff!",
    created_at: "2026-06-07T17:50:00Z"
  },
  {
    id: "c-3",
    workout_log_id: "wl-2",
    user_id: "user-2", // Marcus
    comment_text: "Sarah with the sunrise squats, putting us to sleep!",
    created_at: "2026-06-08T07:10:00Z"
  }
];

export const INITIAL_REACTIONS: Reaction[] = [
  { id: "r-1", workout_log_id: "wl-1", user_id: "user-1", reaction_type: "fist_bump" },
  { id: "r-2", workout_log_id: "wl-1", user_id: "user-3", reaction_type: "fist_bump" },
  { id: "r-3", workout_log_id: "wl-1", user_id: "user-4", reaction_type: "fist_bump" },
  { id: "r-4", workout_log_id: "wl-2", user_id: "user-2", reaction_type: "fist_bump" },
  { id: "r-5", workout_log_id: "wl-2", user_id: "user-1", reaction_type: "fist_bump" }
];


// Supabase PostgreSQL Migration string & Matching TypeScript Model string
export const SUPABASE_MIGRATION_SQL = `-- ----------------------------------------------------
-- SquadLift - Supabase / PostgreSQL Schema Migration
-- Designed for 4-friends private workout groups
-- ----------------------------------------------------

-- Ensure extension is active for UUIDs (if needed)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. EXERCISES Table (Shared collaborative library)
CREATE TABLE IF NOT EXISTS public.exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    body_part TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Barbell', -- Barbell, Dumbbell, Machine, etc.
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- 3. ROUTINES Table
CREATE TABLE IF NOT EXISTS public.routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ROUTINE EXERCISES Junction Table
CREATE TABLE IF NOT EXISTS public.routine_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routine_id UUID REFERENCES public.routines(id) ON DELETE CASCADE NOT NULL,
    exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
    order_index INT NOT NULL
);

-- 5. ROUTINE SETS Table
CREATE TABLE IF NOT EXISTS public.routine_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routine_exercise_id UUID REFERENCES public.routine_exercises(id) ON DELETE CASCADE NOT NULL,
    set_number INT NOT NULL,
    set_type TEXT NOT NULL DEFAULT 'Normal', -- Warmup, Normal, Drop, Failure
    target_reps INT NOT NULL,
    target_weight NUMERIC NOT NULL
);

-- 6. WORKOUT LOGS Table
CREATE TABLE IF NOT EXISTS public.workout_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    total_volume NUMERIC NOT NULL DEFAULT 0,
    duration_seconds INT NOT NULL,
    notes TEXT
);

-- 7. LOGGED EXERCISES Table
CREATE TABLE IF NOT EXISTS public.logged_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_log_id UUID REFERENCES public.workout_logs(id) ON DELETE CASCADE NOT NULL,
    exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
    order_index INT NOT NULL
);

-- 8. LOGGED SETS Table
CREATE TABLE IF NOT EXISTS public.logged_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    logged_exercise_id UUID REFERENCES public.logged_exercises(id) ON DELETE CASCADE NOT NULL,
    set_number INT NOT NULL,
    set_type TEXT NOT NULL DEFAULT 'Normal',
    actual_reps INT NOT NULL,
    actual_weight NUMERIC NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE
);

-- 9. COMMENTS Table (Social feed comments)
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_log_id UUID REFERENCES public.workout_logs(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. REACTIONS Table (Fist Bumps)
CREATE TABLE IF NOT EXISTS public.reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_log_id UUID REFERENCES public.workout_logs(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    reaction_type TEXT NOT NULL DEFAULT 'fist_bump',
    CONSTRAINT unique_user_workout_reaction UNIQUE (workout_log_id, user_id, reaction_type)
);

-- ----------------------------------------------------
-- Row Level Security (RLS) & Realtime Config
-- Since it is a private 4-friend team, all logged-in users 
-- can READ/WRITE to keep the app lightweight and collaborative.
-- ----------------------------------------------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logged_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logged_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users unrestricted communication (the 4 squad members)
CREATE POLICY "Squad unrestricted read access" ON public.users FOR SELECT USING (true);
CREATE POLICY "Squad unrestricted insert" ON public.users FOR INSERT WITH CHECK (true);

CREATE POLICY "Squad exercises view" ON public.exercises FOR SELECT USING (true);
CREATE POLICY "Squad exercises collaborative insert" ON public.exercises FOR INSERT WITH CHECK (true);

CREATE POLICY "Squad routines view" ON public.routines FOR SELECT USING (true);
CREATE POLICY "Squad routines write" ON public.routines FOR ALL USING (true);

CREATE POLICY "Squad routine exercises write" ON public.routine_exercises FOR ALL USING (true);
CREATE POLICY "Squad routine sets write" ON public.routine_sets FOR ALL USING (true);

CREATE POLICY "Squad workout logs write & view" ON public.workout_logs FOR ALL USING (true);
CREATE POLICY "Squad logged exercises write" ON public.logged_exercises FOR ALL USING (true);
CREATE POLICY "Squad logged sets write" ON public.logged_sets FOR ALL USING (true);

CREATE POLICY "Squad comments write" ON public.comments FOR ALL USING (true);
CREATE POLICY "Squad reactions write" ON public.reactions FOR ALL USING (true);

-- Enable Realtime for live squad dashboard listeners
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table public.workout_logs;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.reactions;
`;

export const SUPABASE_TYPES_TS = `// ----------------------------------------------------
// TypeScript Types matching Supabase Generated Schema
// ----------------------------------------------------

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          email: string
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          username: string
          email: string
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          avatar_url?: string | null
          created_at?: string
        }
      }
      exercises: {
        Row: {
          id: string
          name: string
          body_part: string
          category: string
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          body_part: string
          category?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          body_part?: string
          category?: string
          created_by?: string | null
        }
      }
      workout_logs: {
        Row: {
          id: string
          user_id: string
          title: string
          start_time: string
          end_time: string
          total_volume: number
          duration_seconds: number
          notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          start_time: string
          end_time: string
          total_volume?: number
          duration_seconds: number
          notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          start_time?: string
          end_time?: string
          total_volume?: number
          duration_seconds?: number
          notes?: string | null
        }
      }
    }
  }
}
`;
