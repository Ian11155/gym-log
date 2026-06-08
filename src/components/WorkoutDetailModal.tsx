import { WorkoutLog, Exercise, SQUAD_USERS } from "../types";
import { X, Clock, Dumbbell, Calendar, Weight, Info } from "lucide-react";
import ExerciseImage from "./ExerciseImage";

interface WorkoutDetailModalProps {
  workoutLog: WorkoutLog;
  exerciseLibrary: Exercise[];
  onClose: () => void;
}

export default function WorkoutDetailModal({
  workoutLog,
  exerciseLibrary,
  onClose,
}: WorkoutDetailModalProps) {
  const author = SQUAD_USERS.find((u) => u.id === workoutLog.user_id) || SQUAD_USERS[0];

  const getFriendlyDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getAvatarBg = (username: string) => {
    const code = username.charCodeAt(0);
    const colors = ["bg-orange-600", "bg-rose-600", "bg-[#6f6d6c]", "bg-zinc-700", "bg-stone-600"];
    return colors[code % colors.length];
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#121011] flex flex-col pt-10 pb-16 animate-slide-up select-none font-sans">
      {/* Scrollable Container with absolute inset layout to match viewport */}
      <div className="flex-1 flex flex-col h-full bg-[#181818] overflow-hidden relative">
        
        {/* Dynamic ambient header background shine */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#6f6d6c]/10 to-transparent pointer-events-none" />

        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2d2729] relative z-20">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full overflow-hidden border border-stone-800 flex items-center justify-center ${getAvatarBg(author.username)} text-white font-bold font-sans text-xs shadow-3d-sm`}>
              {author.avatar_url ? (
                <img
                  src={author.avatar_url}
                  alt={author.username}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                author.username[0]
              )}
            </div>
            <div className="text-left">
              <span className="text-[8.5px] uppercase font-black text-stone-500 tracking-wider block">Athlete Log</span>
              <h4 className="text-xs font-black text-[#f7f5f4]">{author.username}</h4>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#2d2729] text-stone-400 hover:text-stone-200 cursor-pointer transition-colors"
            title="Close details"
          >
            <X className="w-4.5 h-4.5 stroke-[2.5px]" />
          </button>
        </div>

        {/* Scrollable contents */}
        <div className="flex-1 overflow-y-auto scrollbar-none px-5 py-4 space-y-5 relative z-10">
          
          {/* Main workout Title */}
          <div className="text-left">
            <div className="flex items-center gap-1.5 text-[9.5px] text-stone-500 font-mono font-bold uppercase tracking-wider mb-1">
              <Calendar className="w-3 h-3 text-[#6f6d6c]" />
              <span>{getFriendlyDate(workoutLog.end_time)}</span>
            </div>
            <h2 className="text-base font-black text-white leading-snug tracking-tight">{workoutLog.title}</h2>
          </div>

          {/* Quick Metrics Statistics Row */}
          <div className="grid grid-cols-3 gap-2 bg-[#1c181a] p-3 rounded-xl border border-[#2d2729] text-left">
            <div>
              <span className="text-[8px] uppercase font-black tracking-widest text-stone-500 block">Duration</span>
              <span className="font-mono text-xs font-black text-stone-105 inline-block mt-0.5">
                {formatDuration(workoutLog.duration_seconds)}
              </span>
            </div>
            <div>
              <span className="text-[8px] uppercase font-black tracking-widest text-stone-500 block">Total Volume</span>
              <span className="font-mono text-xs font-black text-stone-105 inline-block mt-0.5">
                {Number(workoutLog.total_volume).toLocaleString()} <span className="font-sans text-[8px] text-stone-450 uppercase font-black">kg</span>
              </span>
            </div>
            <div>
              <span className="text-[8px] uppercase font-black tracking-widest text-stone-500 block">Movements</span>
              <span className="font-mono text-xs font-black text-stone-105 inline-block mt-0.5">
                {workoutLog.exercises.length} Exercises
              </span>
            </div>
          </div>

          {/* Workout Notes */}
          {workoutLog.notes && (
            <div className="bg-[#121011] border border-[#2d2729] rounded-xl p-3.5 text-left border-l-3 border-l-[#6f6d6c]">
              <span className="text-[7.5px] uppercase font-black text-stone-450 tracking-widest block mb-1">Workout Notes</span>
              <p className="text-[10.5px] text-stone-300 italic leading-relaxed">
                "{workoutLog.notes}"
              </p>
            </div>
          )}

          {/* Detailed Lists of Exercises */}
          <div className="space-y-4 pt-1 text-left">
            <span className="block text-[8px] uppercase font-black text-stone-400 tracking-widest border-b border-[#2d2729] pb-1.5">
              Performed Movements & Sets
            </span>

            {workoutLog.exercises.map((le, idx) => {
              const ex = exerciseLibrary.find((e) => e.id === le.exercise_id);
              
              return (
                <div key={le.id || idx} className="bg-[#121011] rounded-2xl border border-[#2d2729] p-4.5 space-y-4">
                  
                  {/* Title & target badges */}
                  <div className="flex items-center gap-3">
                    <ExerciseImage exercise={ex} className="w-10 h-10 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-black text-stone-150 truncate">
                        {idx + 1}. {ex ? ex.name : "Exercise"}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-1 font-sans">
                        <span className="text-[8px] bg-[#1c181a] border border-[#2d2729] text-stone-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                          {ex?.body_part}
                        </span>
                        <span className="text-[8px] bg-[#1c181a] text-stone-450 px-1.5 py-0.5 rounded font-black tracking-wider border border-[#2d2729]">
                          {ex?.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sets - Two Column structure as requested */}
                  <div className="space-y-2 mt-2">
                    
                    {/* Columns headers */}
                    <div className="grid grid-cols-2 text-[8px] uppercase font-black text-stone-500 tracking-widest pb-1 border-b border-[#2d2729] font-sans">
                      <span>Set Number</span>
                      <span className="text-right">Weight x Reps</span>
                    </div>

                    {/* Set Entries */}
                    <div className="space-y-1.5">
                      {le.sets.map((set, sIdx) => {
                        const isWarmup = set.set_type === "Warmup";
                        const isDrop = set.set_type === "Drop";
                        const isFailure = set.set_type === "Failure";
                        
                        return (
                          <div key={set.id || sIdx} className="grid grid-cols-2 text-[11px] items-center py-1 border-b border-[#2d2729]/30 last:border-0 font-mono">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 flex items-center justify-center rounded bg-[#1c181a] border border-[#2d2729] text-[9.5px] font-black text-stone-300">
                                {set.set_number}
                              </span>
                              {!set.is_completed && (
                                <span className="text-[7px] text-stone-500 italic font-sans font-bold">Missed</span>
                              )}
                              {isWarmup && (
                                <span className="text-[7px] bg-[#6f6d6c]/15 text-stone-300 border border-[#6f6d6c]/20 px-1 rounded uppercase font-sans font-bold tracking-tight">W</span>
                              )}
                              {isDrop && (
                                <span className="text-[7px] bg-amber-500/10 text-amber-300 border border-amber-500/15 px-1 rounded uppercase font-sans font-bold tracking-tight">D</span>
                              )}
                              {isFailure && (
                                <span className="text-[7px] bg-red-500/10 text-red-350 border border-red-500/15 px-1 rounded uppercase font-sans font-bold tracking-tight">F</span>
                              )}
                            </div>
                            
                            <div className="text-right font-black text-stone-200">
                              <span className="text-white">{set.actual_weight}</span>
                              <span className="text-[8px] text-stone-500 font-sans font-medium uppercase ml-0.5 mr-2">kg</span>
                              <span className="text-stone-400">✕</span>
                              <span className="text-white ml-2">{set.actual_reps}</span>
                              <span className="text-[8px] text-stone-500 font-sans font-medium uppercase ml-0.5">reps</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>

        {/* Sticky footer close helper button for clean navigation */}
        <div className="p-4 border-t border-[#2d2729] bg-[#121011] relative z-20">
          <button
            onClick={onClose}
            className="w-full bg-[#6f6d6c] hover:bg-[#83807e] active:translate-y-0.5 text-white font-sans font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-widest transition shadow-3d-emerald cursor-pointer"
          >
            Done Viewing
          </button>
        </div>
        
      </div>
    </div>
  );
}
