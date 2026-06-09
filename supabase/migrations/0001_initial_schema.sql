-- SquadLift initial Supabase schema
-- React/Vite PWA backend foundation. App integration comes later.

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_not_blank check (length(trim(username)) > 0)
);

create table public.squads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint squads_name_not_blank check (length(trim(name)) > 0)
);

create table public.squad_members (
  squad_id uuid not null references public.squads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (squad_id, user_id),
  constraint squad_members_role_check check (role in ('owner', 'admin', 'member'))
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid not null references public.squads(id) on delete cascade,
  name text not null,
  body_part text not null,
  category text not null default 'Barbell',
  created_by uuid references public.profiles(id) on delete set null,
  is_custom boolean not null default false,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercises_name_not_blank check (length(trim(name)) > 0),
  constraint exercises_body_part_not_blank check (length(trim(body_part)) > 0),
  constraint exercises_category_not_blank check (length(trim(category)) > 0)
);

create table public.routines (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid not null references public.squads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint routines_title_not_blank check (length(trim(title)) > 0)
);

create table public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  order_index integer not null,
  created_at timestamptz not null default now(),
  constraint routine_exercises_order_check check (order_index >= 0),
  constraint routine_exercises_unique_order unique (routine_id, order_index),
  constraint routine_exercises_unique_exercise unique (routine_id, exercise_id)
);

create table public.routine_sets (
  id uuid primary key default gen_random_uuid(),
  routine_exercise_id uuid not null references public.routine_exercises(id) on delete cascade,
  set_number integer not null,
  set_type text not null default 'Normal',
  target_reps integer not null default 0,
  target_weight numeric(8, 2) not null default 0,
  created_at timestamptz not null default now(),
  constraint routine_sets_number_check check (set_number > 0),
  constraint routine_sets_type_check check (set_type in ('Normal', 'Warmup', 'Drop', 'Failure')),
  constraint routine_sets_reps_check check (target_reps >= 0),
  constraint routine_sets_weight_check check (target_weight >= 0),
  constraint routine_sets_unique_number unique (routine_exercise_id, set_number)
);

create table public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid not null references public.squads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  total_volume numeric(12, 2) not null default 0,
  duration_seconds integer not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_logs_title_not_blank check (length(trim(title)) > 0),
  constraint workout_logs_time_check check (end_time >= start_time),
  constraint workout_logs_volume_check check (total_volume >= 0),
  constraint workout_logs_duration_check check (duration_seconds >= 0)
);

create table public.logged_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_log_id uuid not null references public.workout_logs(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  order_index integer not null,
  created_at timestamptz not null default now(),
  constraint logged_exercises_order_check check (order_index >= 0),
  constraint logged_exercises_unique_order unique (workout_log_id, order_index),
  constraint logged_exercises_unique_exercise unique (workout_log_id, exercise_id)
);

create table public.logged_sets (
  id uuid primary key default gen_random_uuid(),
  logged_exercise_id uuid not null references public.logged_exercises(id) on delete cascade,
  set_number integer not null,
  set_type text not null default 'Normal',
  actual_reps integer not null default 0,
  actual_weight numeric(8, 2) not null default 0,
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  constraint logged_sets_number_check check (set_number > 0),
  constraint logged_sets_type_check check (set_type in ('Normal', 'Warmup', 'Drop', 'Failure')),
  constraint logged_sets_reps_check check (actual_reps >= 0),
  constraint logged_sets_weight_check check (actual_weight >= 0),
  constraint logged_sets_unique_number unique (logged_exercise_id, set_number)
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create trigger squads_touch_updated_at
before update on public.squads
for each row execute function public.touch_updated_at();

create trigger exercises_touch_updated_at
before update on public.exercises
for each row execute function public.touch_updated_at();

create trigger routines_touch_updated_at
before update on public.routines
for each row execute function public.touch_updated_at();

create trigger workout_logs_touch_updated_at
before update on public.workout_logs
for each row execute function public.touch_updated_at();

create index profiles_email_idx on public.profiles (lower(email)) where email is not null;
create unique index profiles_username_unique_idx on public.profiles (lower(username));

create index squads_created_by_idx on public.squads (created_by);

create index squad_members_user_id_idx on public.squad_members (user_id);
create index squad_members_squad_id_idx on public.squad_members (squad_id);

create index exercises_squad_id_idx on public.exercises (squad_id);
create index exercises_created_by_idx on public.exercises (created_by);
create unique index exercises_squad_lower_name_unique_idx on public.exercises (squad_id, lower(name));

create index routines_squad_id_created_at_idx on public.routines (squad_id, created_at desc);
create index routines_user_id_created_at_idx on public.routines (user_id, created_at desc);

create index routine_exercises_routine_id_idx on public.routine_exercises (routine_id);
create index routine_exercises_exercise_id_idx on public.routine_exercises (exercise_id);
create index routine_sets_routine_exercise_id_idx on public.routine_sets (routine_exercise_id);

create index workout_logs_squad_id_end_time_idx on public.workout_logs (squad_id, end_time desc);
create index workout_logs_user_id_end_time_idx on public.workout_logs (user_id, end_time desc);

create index logged_exercises_workout_log_id_idx on public.logged_exercises (workout_log_id);
create index logged_exercises_exercise_id_idx on public.logged_exercises (exercise_id);
create index logged_sets_logged_exercise_id_idx on public.logged_sets (logged_exercise_id);
create index logged_sets_completed_idx on public.logged_sets (logged_exercise_id) where is_completed = true;

create or replace function public.is_squad_member(target_squad_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.squad_members
    where squad_id = target_squad_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_squad_admin(target_squad_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.squad_members
    where squad_id = target_squad_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;

create or replace function public.is_squad_creator(target_squad_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.squads
    where id = target_squad_id
      and created_by = auth.uid()
  );
$$;

grant execute on function public.is_squad_member(uuid) to authenticated;
grant execute on function public.is_squad_admin(uuid) to authenticated;
grant execute on function public.is_squad_creator(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.squads enable row level security;
alter table public.squad_members enable row level security;
alter table public.exercises enable row level security;
alter table public.routines enable row level security;
alter table public.routine_exercises enable row level security;
alter table public.routine_sets enable row level security;
alter table public.workout_logs enable row level security;
alter table public.logged_exercises enable row level security;
alter table public.logged_sets enable row level security;

grant usage on schema public to authenticated;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.squads to authenticated;
grant select, insert, update, delete on public.squad_members to authenticated;
grant select, insert, update on public.exercises to authenticated;
grant select, insert, update, delete on public.routines to authenticated;
grant select, insert, update, delete on public.routine_exercises to authenticated;
grant select, insert, update, delete on public.routine_sets to authenticated;
grant select, insert, update on public.workout_logs to authenticated;
grant select, insert, update, delete on public.logged_exercises to authenticated;
grant select, insert, update, delete on public.logged_sets to authenticated;

create policy "Profiles can be read by shared squad members"
on public.profiles for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.squad_members viewer
    join public.squad_members target on target.squad_id = viewer.squad_id
    where viewer.user_id = auth.uid()
      and target.user_id = profiles.id
  )
);

create policy "Users can create their own profile"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Members can read their squads"
on public.squads for select
to authenticated
using (public.is_squad_member(id));

create policy "Users can create squads"
on public.squads for insert
to authenticated
with check (created_by = auth.uid());

create policy "Squad admins can update squads"
on public.squads for update
to authenticated
using (public.is_squad_admin(id))
with check (public.is_squad_admin(id));

create policy "Members can read squad membership"
on public.squad_members for select
to authenticated
using (public.is_squad_member(squad_id));

create policy "Creator can add first squad membership"
on public.squad_members for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.is_squad_creator(squad_id)
);

create policy "Admins can manage squad membership"
on public.squad_members for all
to authenticated
using (public.is_squad_admin(squad_id))
with check (public.is_squad_admin(squad_id));

create policy "Members can read exercises"
on public.exercises for select
to authenticated
using (public.is_squad_member(squad_id));

create policy "Members can add exercises"
on public.exercises for insert
to authenticated
with check (
  public.is_squad_member(squad_id)
  and (created_by is null or created_by = auth.uid())
);

create policy "Creators can update exercises"
on public.exercises for update
to authenticated
using (public.is_squad_member(squad_id) and (created_by is null or created_by = auth.uid()))
with check (public.is_squad_member(squad_id) and (created_by is null or created_by = auth.uid()));

create policy "Members can read routines"
on public.routines for select
to authenticated
using (public.is_squad_member(squad_id));

create policy "Users can create own routines"
on public.routines for insert
to authenticated
with check (public.is_squad_member(squad_id) and user_id = auth.uid());

create policy "Users can update own routines"
on public.routines for update
to authenticated
using (public.is_squad_member(squad_id) and user_id = auth.uid())
with check (public.is_squad_member(squad_id) and user_id = auth.uid());

create policy "Users can delete own routines"
on public.routines for delete
to authenticated
using (public.is_squad_member(squad_id) and user_id = auth.uid());

create policy "Members can read routine exercises"
on public.routine_exercises for select
to authenticated
using (
  exists (
    select 1
    from public.routines
    where routines.id = routine_exercises.routine_id
      and public.is_squad_member(routines.squad_id)
  )
);

create policy "Users can manage own routine exercises"
on public.routine_exercises for all
to authenticated
using (
  exists (
    select 1
    from public.routines
    where routines.id = routine_exercises.routine_id
      and public.is_squad_member(routines.squad_id)
      and routines.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.routines
    join public.exercises on exercises.id = routine_exercises.exercise_id
    where routines.id = routine_exercises.routine_id
      and public.is_squad_member(routines.squad_id)
      and routines.user_id = auth.uid()
      and exercises.squad_id = routines.squad_id
  )
);

create policy "Members can read routine sets"
on public.routine_sets for select
to authenticated
using (
  exists (
    select 1
    from public.routine_exercises
    join public.routines on routines.id = routine_exercises.routine_id
    where routine_exercises.id = routine_sets.routine_exercise_id
      and public.is_squad_member(routines.squad_id)
  )
);

create policy "Users can manage own routine sets"
on public.routine_sets for all
to authenticated
using (
  exists (
    select 1
    from public.routine_exercises
    join public.routines on routines.id = routine_exercises.routine_id
    where routine_exercises.id = routine_sets.routine_exercise_id
      and public.is_squad_member(routines.squad_id)
      and routines.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.routine_exercises
    join public.routines on routines.id = routine_exercises.routine_id
    where routine_exercises.id = routine_sets.routine_exercise_id
      and public.is_squad_member(routines.squad_id)
      and routines.user_id = auth.uid()
  )
);

create policy "Members can read workout logs"
on public.workout_logs for select
to authenticated
using (public.is_squad_member(squad_id));

create policy "Users can create own workout logs"
on public.workout_logs for insert
to authenticated
with check (public.is_squad_member(squad_id) and user_id = auth.uid());

create policy "Users can update own workout logs"
on public.workout_logs for update
to authenticated
using (public.is_squad_member(squad_id) and user_id = auth.uid())
with check (public.is_squad_member(squad_id) and user_id = auth.uid());

create policy "Members can read logged exercises"
on public.logged_exercises for select
to authenticated
using (
  exists (
    select 1
    from public.workout_logs
    where workout_logs.id = logged_exercises.workout_log_id
      and public.is_squad_member(workout_logs.squad_id)
  )
);

create policy "Users can manage own logged exercises"
on public.logged_exercises for all
to authenticated
using (
  exists (
    select 1
    from public.workout_logs
    where workout_logs.id = logged_exercises.workout_log_id
      and public.is_squad_member(workout_logs.squad_id)
      and workout_logs.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.workout_logs
    join public.exercises on exercises.id = logged_exercises.exercise_id
    where workout_logs.id = logged_exercises.workout_log_id
      and public.is_squad_member(workout_logs.squad_id)
      and workout_logs.user_id = auth.uid()
      and exercises.squad_id = workout_logs.squad_id
  )
);

create policy "Members can read logged sets"
on public.logged_sets for select
to authenticated
using (
  exists (
    select 1
    from public.logged_exercises
    join public.workout_logs on workout_logs.id = logged_exercises.workout_log_id
    where logged_exercises.id = logged_sets.logged_exercise_id
      and public.is_squad_member(workout_logs.squad_id)
  )
);

create policy "Users can manage own logged sets"
on public.logged_sets for all
to authenticated
using (
  exists (
    select 1
    from public.logged_exercises
    join public.workout_logs on workout_logs.id = logged_exercises.workout_log_id
    where logged_exercises.id = logged_sets.logged_exercise_id
      and public.is_squad_member(workout_logs.squad_id)
      and workout_logs.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.logged_exercises
    join public.workout_logs on workout_logs.id = logged_exercises.workout_log_id
    where logged_exercises.id = logged_sets.logged_exercise_id
      and public.is_squad_member(workout_logs.squad_id)
      and workout_logs.user_id = auth.uid()
  )
);

-- End SquadLift initial Supabase schema
