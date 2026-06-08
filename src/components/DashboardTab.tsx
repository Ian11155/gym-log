import { SQUAD_USERS, Routine, WorkoutLog, Exercise } from "../types";
import { Flame, Dumbbell, Award, History, Play, Pin, Trophy } from "lucide-react";

interface DashboardTabProps {
  activeUserId: string;
  allWorkoutLogs: WorkoutLog[];
  exerciseLibrary: Exercise[];
  routines: Routine[];
  onStartEmptyWorkout: () => void;
  onLaunchRoutine: (routine: Routine) => void;
}

export default function DashboardTab({
  activeUserId,
  allWorkoutLogs,
  exerciseLibrary,
  routines,
  onStartEmptyWorkout,
  onLaunchRoutine,
}: DashboardTabProps) {
  const currentUser = SQUAD_USERS.find((u) => u.id === activeUserId) || SQUAD_USERS[0];

  // Filter logs representing this user
  const userLogs = allWorkoutLogs
    .filter((log) => log.user_id === activeUserId)
    .sort((a, b) => new Date(b.end_time).getTime() - new Date(a.end_time).getTime());

  const totalWorkoutsCount = userLogs.length;
  const totalVolumeSum = userLogs.reduce((sum, log) => sum + Number(log.total_volume), 0);

  // Helper: Format duration
  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    return `${mins}m`;
  };

  // Helper: Get exercise name
  const getExerciseName = (exId: string) => {
    const ex = exerciseLibrary.find((e) => e.id === exId);
    return ex ? ex.name : "Exercise";
  };

  // Helper: Format date
  const formatDateDay = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <div id="dashboard-tab" className="px-5 py-5 space-y-6">
      
      {/* 3D Floating Profile Card Header */}
      <div className="flex items-center justify-between bg-[#1c181a] p-4.5 rounded-2xl border border-[#6f6d6c]/15 shadow-3d-md hover:shadow-3d-lg transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={currentUser.avatar_url}
              alt={currentUser.username}
              className="w-13 h-13 rounded-full object-cover border-2 border-[#6f6d6c] shadow-3d-sm"
              referrerPolicy="no-referrer"
            />
            {/* Online Stone badge with glow */}
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#6f6d6c] border-2 border-[#1c181a] rounded-full" />
          </div>
          <div className="text-left">
            <div className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Active Athlete</div>
            <h2 className="text-base font-bold text-stone-100">{currentUser.username}</h2>
          </div>
        </div>

        {/* Week Streak widget with premium glow */}
        <div className="flex items-center gap-2 bg-[#6f6d6c]/10 border border-[#6f6d6c]/15 px-3 py-2 rounded-xl shadow-3d-sm">
          <Flame className="w-4.5 h-4.5 text-[#6f6d6c] fill-[#6f6d6c]" />
          <div className="text-left">
            <div className="text-[8px] uppercase font-black text-stone-300 tracking-widest">Streak</div>
            <div className="font-mono text-xs font-bold text-stone-100">{currentUser.streak} Weeks</div>
          </div>
        </div>
      </div>

      {/* Grid of 3D stats cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#1c181a] p-4 rounded-xl border border-[#6f6d6c]/15 shadow-3d-sm flex items-center gap-3 hover:-translate-y-0.5 hover:shadow-3d-md transition-all duration-300">
          <div className="w-10 h-10 rounded-xl bg-[#6f6d6c]/10 flex items-center justify-center text-[#6f6d6c] shadow-inner border border-[#6f6d6c]/10">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">Workouts</div>
            <div className="font-mono text-lg font-black text-white mt-0.5">{totalWorkoutsCount}</div>
          </div>
        </div>

        <div className="bg-[#1c181a] p-4 rounded-xl border border-[#6f6d6c]/15 shadow-3d-sm flex items-center gap-3 hover:-translate-y-0.5 hover:shadow-3d-md transition-all duration-300">
          <div className="w-10 h-10 rounded-xl bg-stone-500/10 flex items-center justify-center text-stone-400 shadow-inner border border-stone-500/10">
            <Award className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">Volume</div>
            <div className="font-mono text-lg font-black text-white mt-0.5">
              {totalVolumeSum.toLocaleString()} <span className="text-[9px] text-stone-400 font-normal">kg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Launch & Start Actions */}
      <div className="space-y-4 pt-1">
        <button
          onClick={onStartEmptyWorkout}
          className="w-full bg-[#6f6d6c] hover:bg-[#868382] active:translate-y-0.5 text-[#f7f5f4] font-black py-4 px-4 rounded-xl flex items-center justify-center gap-2.5 transition-all duration-200 shadow-3d-emerald cursor-pointer group"
        >
          <Play className="w-4 h-4 fill-[#f7f5f4] stroke-none group-hover:scale-110 transition" />
          <span className="text-xs uppercase tracking-widest font-black">Start Empty Workout Session</span>
        </button>

        {/* Pinned Routines list header */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[#a3a3a6] pb-3 border-b border-[#6f6d6c]/15">
            <div className="flex items-center gap-2">
              <Pin className="w-3.5 h-3.5 text-[#6f6d6c] transform rotate-45" />
              <span>Pinned Routines ({routines.length})</span>
            </div>
          </div>

          <div className="space-y-3 mt-3">
            {routines.map((routine) => (
              <div
                key={routine.id}
                className="group bg-[#1c181a] p-4 rounded-2xl border border-[#6f6d6c]/15 shadow-3d-sm hover:border-[#6f6d6c]/40 flex items-center justify-between transition-all duration-300 hover:translate-x-0.5"
              >
                <div className="flex-1 pr-4 text-left">
                  <h4 className="text-xs font-bold text-stone-100 group-hover:text-stone-300 transition-colors">
                    {routine.title}
                  </h4>
                  <p className="text-[11px] text-stone-400 line-clamp-1 mt-1">{routine.notes}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[9px] bg-[#242022] text-stone-400 px-1.5 py-0.5 rounded font-mono font-medium">
                      {routine.exercises.length} Movements
                    </span>
                    <span className="text-[9px] bg-[#6f6d6c]/15 text-stone-300 px-1.5 py-0.5 rounded font-mono font-bold">
                      {routine.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)} sets
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onLaunchRoutine(routine)}
                  className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#6f6d6c]/10 hover:bg-[#6f6d6c] text-[#6f6d6c] hover:text-[#f7f5f4] transition-all duration-300 cursor-pointer shadow-inner"
                  title="Launch workout routine"
                >
                  <Play className="w-3.5 h-3.5 fill-current stroke-none" />
                </button>
              </div>
            ))}

            {routines.length === 0 && (
              <div className="text-center p-6 bg-[#1c181a] text-stone-500 text-xs rounded-xl border border-dashed border-[#6f6d6c]/25">
                No routines created yet. Create routines to launch quickly.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History Snapshots section */}
      <div className="space-y-3 pt-3">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[#a3a3a6] pb-1">
          <div className="flex items-center gap-2">
            <History className="w-3.5 h-3.5 text-stone-400" />
            <span>Recent Activity (Last 3)</span>
          </div>
          <span className="text-[9px] bg-stone-500/10 text-stone-300 px-2 py-0.5 rounded-full font-black tracking-widest border border-stone-500/10 font-mono">History</span>
        </div>

        <div className="space-y-3.5">
          {userLogs.slice(0, 3).map((log) => (
            <div key={log.id} className="bg-[#1c181a] p-4.5 rounded-2xl border border-[#6f6d6c]/15 shadow-3d-sm text-left hover:border-[#6f6d6c]/30 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-mono font-bold text-stone-400 tracking-wider uppercase">
                    {formatDateDay(log.end_time)}
                  </span>
                  <h4 className="text-xs font-bold text-stone-100 mt-1">{log.title}</h4>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-stone-100 font-mono">
                    {log.total_volume.toLocaleString()}{" "}
                    <span className="text-[9px] text-stone-400 font-normal font-sans">kg</span>
                  </div>
                  <div className="text-[9px] text-stone-400 font-mono mt-0.5">{formatDuration(log.duration_seconds)} duration</div>
                </div>
              </div>

              {log.notes && (
                <p className="text-[11px] text-stone-400 mt-3 italic line-clamp-2 border-l-2 border-[#6f6d6c]/60 pl-2">
                  "{log.notes}"
                </p>
              )}

              {/* Minimal compact summarize of sets completed */}
              <div className="mt-3.5 flex flex-wrap gap-1.5 pt-2 border-t border-[#6f6d6c]/10">
                {log.exercises.slice(0, 3).map((ex, idx) => {
                  const nameStr = getExerciseName(ex.exercise_id);
                  const shortName = nameStr.split(" (")[0];
                  const completedSets = ex.sets.filter((s) => s.is_completed).length;
                  return (
                    <span
                      key={idx}
                      className="text-[9px] bg-[#242022] font-semibold text-stone-300 px-2.5 py-1 rounded-lg border border-white/5"
                    >
                      {shortName} • {completedSets} sets
                    </span>
                  );
                })}
                {log.exercises.length > 3 && (
                  <span className="text-[9px] text-stone-500 self-center pl-1">+{log.exercises.length - 3} more</span>
                )}
              </div>
            </div>
          ))}

          {userLogs.length === 0 && (
            <div className="p-8 text-center bg-[#1c181a] rounded-2xl border border-dashed border-[#6f6d6c]/20 text-stone-500">
              <Trophy className="w-8 h-8 text-[#6f6d6c] mx-auto mb-2" />
              <p className="text-xs font-semibold tracking-wide">No logged workouts yet.</p>
              <p className="text-[10px] text-stone-550 mt-1">Tap "Start Empty Workout" above to start your fitness journey!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
