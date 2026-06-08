import { SQUAD_USERS, WorkoutLog, Exercise } from "../types";
import { Clock, Zap, Users } from "lucide-react";

interface FeedTabProps {
  activeUserId: string;
  allWorkoutLogs: WorkoutLog[];
  exerciseLibrary: Exercise[];
  onSimulateFeedUpdate: (friendIndex: number) => void;
}

export default function FeedTab({
  activeUserId,
  allWorkoutLogs,
  exerciseLibrary,
  onSimulateFeedUpdate,
}: FeedTabProps) {
  const currentUser = SQUAD_USERS.find((u) => u.id === activeUserId) || SQUAD_USERS[0];

  // Sort logs by end_time desc
  const sortedLogs = [...allWorkoutLogs].sort(
    (a, b) => new Date(b.end_time).getTime() - new Date(a.end_time).getTime()
  );

  // Helpers
  const getUserInfo = (userId: string) => {
    return SQUAD_USERS.find((u) => u.id === userId) || SQUAD_USERS[0];
  };

  const getExerciseName = (exId: string) => {
    return exerciseLibrary.find((e) => e.id === exId)?.name || "Exercise";
  };

  const formatDuration = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const timeAgo = (dateStr: string) => {
    const diffMs = new Date().getTime() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div id="feed-tab" className="px-5 py-5 space-y-5">
      
      {/* Real-time sync banner status */}
      <div className="bg-[#1e1a1c] border border-[#6f6d6c]/20 px-4 py-3 rounded-2xl flex items-center justify-between shadow-3d-sm">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6f6d6c] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6f6d6c]"></span>
          </span>
          <span className="text-[10px] font-black text-[#f7f5f4] font-mono tracking-widest uppercase">REALTIME SYNC ACTIVE</span>
        </div>
        <span className="text-[9px] bg-[#242022] border border-[#6f6d6c]/20 text-stone-300 font-bold font-mono px-2 py-0.5 rounded uppercase">
          Squad (4/4)
        </span>
      </div>

      {/* Quick Simulators Bar to display interactivity */}
      <div className="bg-[#1c181a] p-4 rounded-2xl border border-[#6f6d6c]/15 shadow-3d-sm">
        <div className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-[#6f6d6c]" />
          <span>Simulate Friend Workouts</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onSimulateFeedUpdate(1)} // Marcus
            className="text-[9px] font-mono font-bold bg-[#2d2729] hover:bg-[#3d3437] text-stone-200 border border-[#6f6d6c]/20 py-2.5 px-1 rounded-xl transition-all shadow-3d-sm cursor-pointer text-center truncate"
          >
            Marcus Logs
          </button>
          <button
            onClick={() => onSimulateFeedUpdate(3)} // Sarah
            className="text-[9px] font-mono font-bold bg-[#2d2729] hover:bg-[#3d3437] text-stone-200 border border-[#6f6d6c]/20 py-2.5 px-1 rounded-xl transition-all shadow-3d-sm cursor-pointer text-center truncate"
          >
            Sarah Logs
          </button>
          <button
            onClick={() => onSimulateFeedUpdate(2)} // Leo
            className="text-[9px] font-mono font-bold bg-[#2d2729] hover:bg-[#3d3437] text-stone-200 border border-[#6f6d6c]/20 py-2.5 px-1 rounded-xl transition-all shadow-3d-sm cursor-pointer text-center truncate"
          >
            Leo Logs
          </button>
        </div>
      </div>

      {/* Logs timeline list with 3D floating aesthetics */}
      <div className="space-y-4">
        {sortedLogs.map((log) => {
          const author = getUserInfo(log.user_id);

          return (
            <div
              key={log.id}
              className="bg-[#1c181a] border border-[#6f6d6c]/20 rounded-2xl p-5 space-y-4 shadow-3d-md text-left transition-all duration-300 hover:shadow-3d-lg"
            >
              {/* User Identity Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={author.avatar_url}
                    alt={author.username}
                    className="w-10 h-10 rounded-full object-cover border border-[#6f6d6c]/20 shadow-3d-sm"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-stone-100">{author.username}</h4>
                    <span className="text-[9px] text-[#8e8d8d] font-mono tracking-wide font-bold uppercase">
                      {timeAgo(log.end_time)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-[#242022] px-2.5 py-1 rounded-xl border border-[#6f6d6c]/15 shadow-inner">
                  <Clock className="w-3.5 h-3.5 text-[#6f6d6c]" />
                  <span className="font-mono text-[10px] text-[#f7f5f4] font-bold">
                    {formatDuration(log.duration_seconds)}
                  </span>
                </div>
              </div>

              {/* Workout Title */}
              <div>
                <h3 className="text-xs font-bold text-stone-100 tracking-wide">
                  {log.title}
                </h3>
              </div>

              {/* Aggregated Stats Banner with refined gradients resembling metallic dark frame */}
              <div className="grid grid-cols-2 gap-3 bg-[#242022] p-3 rounded-xl border border-[#6f6d6c]/20 shadow-inner">
                <div>
                  <div className="text-[8px] text-stone-400 uppercase tracking-widest font-black">Live Volume</div>
                  <div className="text-xs font-black text-[#f7f5f4] font-mono mt-0.5">
                    {Number(log.total_volume).toLocaleString()} <span className="font-sans text-[8px] text-stone-500 font-bold uppercase">kg</span>
                  </div>
                </div>
                <div>
                  <div className="text-[8px] text-[#817f7e] uppercase tracking-widest font-black font-sans">Exercise Pool</div>
                  <div className="text-xs font-black text-[#a3a1a1] font-mono mt-0.5">
                    {log.exercises.length} <span className="font-sans text-[8px] text-stone-500 font-bold uppercase">completed</span>
                  </div>
                </div>
              </div>

              {/* Compact Breakdown of Exercises and Sets completed */}
              <div className="space-y-2 py-1 text-[11px] border-t border-[#6f6d6c]/10 pt-3">
                {log.exercises.map((le, idx) => {
                  const exName = getExerciseName(le.exercise_id);
                  const cleanName = exName.split(" (")[0];
                  // Filter out only completed sets for correct representation
                  const activeSets = le.sets.filter((s) => s.is_completed);
                  if (activeSets.length === 0) return null;

                  return (
                    <div key={idx} className="flex justify-between items-center text-stone-300">
                      <span className="font-bold flex items-center gap-2 text-stone-300">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#6f6d6c] shadow-[0_0_4px_#6f6d6c]" />
                        {cleanName}
                      </span>
                      <span className="font-mono text-[9px] text-[#a3a1a1] font-semibold bg-[#242022] px-2 py-0.5 rounded border border-[#6f6d6c]/15 shadow-inner">
                        {activeSets.map((s) => `${s.actual_reps}r @ ${s.actual_weight}lb`).join(" • ")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {sortedLogs.length === 0 && (
          <div className="p-12 text-center text-stone-500 bg-[#1c181a] rounded-2xl border border-dashed border-[#6f6d6c]/25">
            <Users className="w-8 h-8 mx-auto mb-2 text-[#6f6d6c]" />
            <p className="text-xs font-semibold">No group logs completed yet.</p>
            <p className="text-[10px] mt-1 text-[#6f6d6c] font-mono">Simulate a workout log to preview feed!</p>
          </div>
        )}
      </div>
    </div>
  );
}
