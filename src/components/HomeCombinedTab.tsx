import { useState } from "react";
import { SQUAD_USERS, WorkoutLog, Exercise, Comment, Reaction } from "../types";
import ExerciseImage from "./ExerciseImage";
import { Flame, Dumbbell, Award, Clock, Heart, MessageSquare, Share2, Sparkles, Zap, Search, Bell } from "lucide-react";

interface HomeCombinedTabProps {
  activeUserId: string;
  allWorkoutLogs: WorkoutLog[];
  exerciseLibrary: Exercise[];
  comments: Comment[];
  reactions: Reaction[];
  onToggleReaction: (workoutLogId: string) => void;
  onAddComment: (workoutLogId: string, text: string) => void;
  onSimulateFeedUpdate: (friendIndex: number) => void;
  onViewProfile?: (userId: string) => void;
  onViewWorkoutDetail?: (log: WorkoutLog) => void;
  showSimulatorControls?: boolean;
}

export default function HomeCombinedTab({
  activeUserId,
  allWorkoutLogs,
  exerciseLibrary,
  comments,
  reactions,
  onToggleReaction,
  onAddComment,
  onSimulateFeedUpdate,
  onViewProfile,
  onViewWorkoutDetail,
  showSimulatorControls = true,
}: HomeCombinedTabProps) {
  // Sorted list of all completed workouts (entire squad timeline)
  const sortedLogs = [...allWorkoutLogs].sort(
    (a, b) => new Date(b.end_time).getTime() - new Date(a.end_time).getTime()
  );

  // Expanded exercises in posts state so users can "See more exercises"
  const [expandedLogs, setExpandedLogs] = useState<{ [key: string]: boolean }>({});

  // Comments state to manage typing text for each post
  const [typingComment, setTypingComment] = useState<{ [key: string]: string }>({});

  const toggleExpand = (logId: string) => {
    setExpandedLogs((prev) => ({ ...prev, [logId]: !prev[logId] }));
  };

  const getUserInfo = (userId: string) => {
    return SQUAD_USERS.find((u) => u.id === userId) || SQUAD_USERS[0];
  };

  const getExerciseName = (exId: string) => {
    return exerciseLibrary.find((e) => e.id === exId)?.name || "Exercise";
  };

  // Human-friendly short timing
  const getFriendlyTime = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs} hours ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  const formatDuration = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins}min`;
    }
    return `${mins}min`;
  };

  // Generate simple letter avatar background color based on name
  const getAvatarBg = (username: string) => {
    const code = username.charCodeAt(0);
    const colors = ["bg-orange-600", "bg-rose-600", "bg-[#6f6d6c]", "bg-zinc-700", "bg-stone-600"];
    return colors[code % colors.length];
  };

  return (
    <div id="home-combined-feed" className="px-5 py-4 space-y-5">
      
      {/* Header bar mimicking JPG: "Home v" with icons */}
      <div className="flex items-center justify-between pt-1 pb-1">
        <div className="flex items-center gap-1.5">
          <h2 className="text-xl font-bold font-sans tracking-tight text-white">Home</h2>
          <span className="text-[10px] bg-stone-900/40 p-1 text-stone-400 rounded-lg cursor-pointer">▼</span>
        </div>
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-stone-300 cursor-pointer hover:text-white" />
          <div className="relative">
            <Bell className="w-5 h-5 text-stone-300 cursor-pointer hover:text-white" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#6f6d6c] rounded-full animate-pulse" />
          </div>
        </div>
      </div>





      {showSimulatorControls && (
        <div className="bg-[#121011] p-3 rounded-xl border border-[#6f6d6c]/10 text-left">
          <span className="text-[8px] text-stone-450 uppercase font-black tracking-widest block mb-2 flex items-center gap-1">
            <Zap className="w-3 h-3 text-[#6f6d6c]" /> Simulated Friend Hotkeys (Trigger Local Logs)
          </span>
          <div className="grid grid-cols-3 gap-1.5 font-sans">
            <button
              onClick={() => onSimulateFeedUpdate(1)} // Marcus
              className="text-[9px] font-bold bg-[#141414] hover:bg-[#1f1f1f] border border-[#6f6d6c]/10 py-1.5 rounded-lg text-stone-300 transition cursor-pointer"
            >
              Marcus
            </button>
            <button
              onClick={() => onSimulateFeedUpdate(2)} // Leo
              className="text-[9px] font-bold bg-[#141414] hover:bg-[#1f1f1f] border border-[#6f6d6c]/10 py-1.5 rounded-lg text-stone-300 transition cursor-pointer"
            >
              Leo
            </button>
            <button
              onClick={() => onSimulateFeedUpdate(3)} // Sarah
              className="text-[9px] font-bold bg-[#141414] hover:bg-[#1f1f1f] border border-[#6f6d6c]/10 py-1.5 rounded-lg text-stone-300 transition cursor-pointer"
            >
              Sarah
            </button>
          </div>
        </div>
      )}

      {/* Workout Logs timeline feed, styled EXACTLY like Hevy/Strong screen */}
      <div className="space-y-4">
        {sortedLogs.map((log) => {
          const author = getUserInfo(log.user_id);
          const isCurrentUser = log.user_id === activeUserId;
          const userReaction = reactions.filter(
            (r) => r.workout_log_id === log.id && r.user_id === activeUserId
          );
          const hasReacted = userReaction.length > 0;
          const postReactions = reactions.filter((r) => r.workout_log_id === log.id);
          const postComments = comments.filter((c) => c.workout_log_id === log.id);

          // Exercises lists
          const exercisesToShow = expandedLogs[log.id]
            ? log.exercises
            : log.exercises.slice(0, 3);
          const hasMore = log.exercises.length > 3;

          return (
            <div
              key={log.id}
              onClick={() => onViewWorkoutDetail?.(log)}
              className="bg-[#121011] border border-[#2d2729] rounded-2xl p-4.5 space-y-4.5 text-left shadow-3d-sm hover:border-[#6f6d6c]/25 hover:bg-[#181516] transition-all duration-300 cursor-pointer"
            >
              {/* User Avatar, Name & Days Ago / Top Metadata */}
              <div className="flex items-center justify-between">
                <div 
                  className="flex items-center gap-3 cursor-pointer group/author"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewProfile?.(log.user_id);
                  }}
                >
                  <div className={`w-10 h-10 rounded-full overflow-hidden border border-stone-800 flex items-center justify-center ${getAvatarBg(author.username)} text-white font-bold font-sans text-sm shadow-3d-sm group-hover/author:border-[#6f6d6c]/60 transition-all`}>
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
                  <div>
                    <h4 className="text-xs font-black text-stone-150 group-hover/author:text-white transition duration-200">
                      {author.username.split(" ")[0].toLowerCase()}
                    </h4>
                    <p className="text-[9px] text-stone-500 font-mono tracking-wide font-bold">
                      {getFriendlyTime(log.end_time)}
                    </p>
                  </div>
                </div>

                {/* More options dots button */}
                <button className="text-stone-605 text-sm hover:text-white">•••</button>
              </div>

              {/* Workout Title heading */}
              <div>
                <h3 className="text-[13.5px] font-black text-[#f7f5f4]">{log.title}</h3>
                
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-2.5 mt-3 border-t border-b border-stone-900/65 py-2">
                  <div>
                    <span className="text-[8px] uppercase font-black tracking-widest text-stone-550 block">Time</span>
                    <span className="font-mono text-xs font-black text-stone-105 mt-0.5">
                      {formatDuration(log.duration_seconds)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase font-black tracking-widest text-stone-550 block">Volume</span>
                    <span className="font-mono text-xs font-black text-stone-105 mt-0.5">
                      {Number(log.total_volume).toLocaleString()} <span className="font-sans text-[8px] text-stone-450 uppercase font-black">kg</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase font-black tracking-widest text-stone-550 block">Records</span>
                    <span className="font-mono text-xs font-black text-stone-105 mt-0.5 flex items-center gap-1">
                      👑 {log.exercises.length + 1}
                    </span>
                  </div>
                </div>
              </div>

              {/* List of exercises mimicking Hevy layout (Thumb, reps description) */}
              <div className="space-y-3 pt-1">
                {exercisesToShow.map((le, exIdx) => {
                  const ex = exerciseLibrary.find((e) => e.id === le.exercise_id);
                  const completedSets = le.sets.filter((s) => s.is_completed);
                  const displaySetsCount = completedSets.length > 0 ? completedSets.length : le.sets.length;

                  // Get initials for exercise icon placeholder
                  const getInitials = (nameStr: string) => {
                    return nameStr.split(" ").map(w => w[0]).join("").substring(0, 2);
                  };

                  return (
                    <div key={le.id} className="flex items-center gap-3">
                      {/* Round exercise preview icon representing Hevy line art thumb */}
                      <ExerciseImage exercise={ex} className="w-10 h-10 hover:scale-105 transition-all duration-350" />

                      {/* Sets description */}
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-stone-200 truncate">
                          <span className="font-mono text-stone-400 text-[10px] font-black tracking-tighter mr-1.5">
                            {displaySetsCount} sets
                          </span>
                          {ex?.name}
                        </p>
                        <p className="text-[8.5px] font-mono text-stone-500 font-semibold uppercase tracking-wider mt-0.5">
                          {ex?.body_part} target • {ex?.category}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* Show toggle button if there are more than 3 movements */}
                {hasMore && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(log.id);
                    }}
                    className="text-[9.5px] font-black uppercase text-stone-400 hover:text-white transition tracking-widest pl-1 cursor-pointer flex items-center gap-1.5 pt-1"
                  >
                    <span>{expandedLogs[log.id] ? "See less exercises" : `See ${log.exercises.length - 3} more exercises`}</span>
                    <span>{expandedLogs[log.id] ? "▲" : "▼"}</span>
                  </button>
                )}
              </div>



            </div>
          );
        })}

        {sortedLogs.length === 0 && (
          <div className="p-12 text-center text-stone-500 bg-[#1c181a] rounded-2xl border border-dashed border-[#6f6d6c]/25">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-[#6f6d6c]" />
            <p className="text-xs font-semibold">Timeline feed empty.</p>
            <p className="text-[10px] mt-1 text-[#6f6d6c] font-mono">Use simulating hotkeys above to instantly stream mock logs!</p>
          </div>
        )}
      </div>
    </div>
  );
}
