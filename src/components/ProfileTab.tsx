import { useMemo, useState, useEffect } from "react";
import { SQUAD_USERS, WorkoutLog, Exercise, Comment, Reaction } from "../types";
import ExerciseImage from "./ExerciseImage";
import ExercisesTab from "./ExercisesTab";
import { Flame, Dumbbell, Award, Clock, Heart, MessageSquare, Share2, Sparkles, BookOpen, ChevronRight } from "lucide-react";
import TransparentImage from "./TransparentImage";
// @ts-ignore
import machokeArmsUp from "../machoke_arms_up.png";
// @ts-ignore
import machokeArmsDown from "../machoke-arms-down.png";

interface ProfileTabProps {
  activeUserId: string;
  profileUserId: string;
  allWorkoutLogs: WorkoutLog[];
  exerciseLibrary: Exercise[];
  comments: Comment[];
  reactions: Reaction[];
  onToggleReaction: (workoutLogId: string) => void;
  onAddComment: (workoutLogId: string, text: string) => void;
  onAddCustomExercise: (name: string, bodyPart: string, category: string, imageUrl?: string) => void;
  onBackToOwnProfile?: () => void;
  onViewWorkoutDetail?: (log: WorkoutLog) => void;
}

export default function ProfileTab({
  activeUserId,
  profileUserId,
  allWorkoutLogs,
  exerciseLibrary,
  comments,
  reactions,
  onToggleReaction,
  onAddComment,
  onAddCustomExercise,
  onBackToOwnProfile,
  onViewWorkoutDetail,
}: ProfileTabProps) {
  const currentUser = SQUAD_USERS.find((u) => u.id === profileUserId) || SQUAD_USERS[0];
  const isOwnProfile = activeUserId === profileUserId;

  // Machoke arms-up / arms-down animation state
  const [armsUp, setArmsUp] = useState(true);
  useEffect(() => {
    const upImage = new Image();
    upImage.src = machokeArmsUp;
    const downImage = new Image();
    downImage.src = machokeArmsDown;

    const interval = setInterval(() => {
      setArmsUp((prev) => !prev);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const [activeSubTab, setActiveSubTab] = useState<"workouts" | "exercises" >("workouts");

  // User logs for personal stats
  const currentUserLogs = useMemo(
    () =>
      allWorkoutLogs
        .filter((log) => log.user_id === profileUserId)
        .sort((a, b) => new Date(b.end_time).getTime() - new Date(a.end_time).getTime()),
    [allWorkoutLogs, profileUserId]
  );
  const exerciseById = useMemo(
    () => new Map(exerciseLibrary.map((exercise) => [exercise.id, exercise])),
    [exerciseLibrary]
  );
  const reactionsByWorkoutId = useMemo(() => {
    const grouped = new Map<string, Reaction[]>();
    for (const reaction of reactions) {
      const existing = grouped.get(reaction.workout_log_id) || [];
      existing.push(reaction);
      grouped.set(reaction.workout_log_id, existing);
    }
    return grouped;
  }, [reactions]);
  const commentsByWorkoutId = useMemo(() => {
    const grouped = new Map<string, Comment[]>();
    for (const comment of comments) {
      const existing = grouped.get(comment.workout_log_id) || [];
      existing.push(comment);
      grouped.set(comment.workout_log_id, existing);
    }
    return grouped;
  }, [comments]);

  const totalWorkouts = currentUserLogs.length;
  const totalVolume = currentUserLogs.reduce((sum, log) => sum + Number(log.total_volume), 0);

  // Comments & text states for inline comment box
  const [expandedLogs, setExpandedLogs] = useState<{ [key: string]: boolean }>({});
  const [typingComment, setTypingComment] = useState<{ [key: string]: string }>({});

  const toggleExpand = (logId: string) => {
    setExpandedLogs((prev) => ({ ...prev, [logId]: !prev[logId] }));
  };

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

  const getAvatarBg = (username: string) => {
    const code = username.charCodeAt(0);
    const colors = ["bg-orange-600", "bg-rose-600", "bg-[#6f6d6c]", "bg-zinc-700", "bg-stone-600"];
    return colors[code % colors.length];
  };

  const getUserInfo = (userId: string) => {
    return SQUAD_USERS.find((u) => u.id === userId) || SQUAD_USERS[0];
  };

  return (
    <div id="profile-tab" className="px-5 py-4 space-y-5">
      {/* Profile Header bar */}
      <div className="flex items-center justify-between pt-1 pb-1">
        <div className="flex items-center gap-2">
          {!isOwnProfile && (
            <button
              onClick={onBackToOwnProfile}
              className="mr-1 py-1 px-2.5 rounded-lg bg-[#242022] border border-[#6f6d6c]/25 hover:bg-[#2f2a2c] text-stone-300 hover:text-white transition duration-200 cursor-pointer text-[10px] font-black uppercase tracking-wider flex items-center font-sans"
            >
              ← Back
            </button>
          )}
          <h2 className="text-xl font-bold font-sans tracking-tight text-white">
            {isOwnProfile ? "Athlete Profile" : `${currentUser.username.split(" ")[0]}'s Stats`}
          </h2>
        </div>
        <span className="text-[9px] bg-stone-900 border border-[#6f6d6c]/20 px-2.5 py-1 text-stone-400 rounded-lg font-mono">
          {currentUser.username.toLowerCase()}
        </span>
      </div>

      {/* Profile Info Header Bar (Exact match of the requested UI) */}
      <div className="flex items-center justify-between bg-[#141414] p-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000000] animate-fade-in font-sans">
        <div className="flex items-center gap-3">
          <div className="relative font-sans">
            <img
              src={currentUser.avatar_url}
              alt={currentUser.username}
              className="w-12 h-12 rounded-full object-cover border-2 border-black shadow-[2px_2px_0px_0px_#000000]"
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-stone-555 border-2 border-[#141414] rounded-full font-sans" />
          </div>
          <div className="text-left">
            <h2 className="text-sm font-black text-[#f7f5f4]">{currentUser.username}</h2>
            <div className="text-[8px] text-[#6f6d6c] font-bold uppercase tracking-wider font-mono mt-0.5">SQUAD MEMBER</div>
          </div>
        </div>

        {/* Week Streak widget with premium glow */}
        <div className="flex items-center gap-2 bg-[#141414] border-2 border-black px-3 py-1.5 rounded-lg shadow-[3px_3px_0px_0px_#000000]">
          <Flame className="w-4.5 h-4.5 text-[#6f6d6c] fill-[#6f6d6c]" />
          <div className="text-left">
            <div className="text-[7px] uppercase font-black text-stone-400 tracking-widest font-sans">Streak</div>
            <div className="font-mono text-xs font-semibold text-stone-200">{currentUser.streak} Weeks</div>
          </div>
        </div>
      </div>

      {/* Mini Active Grid of 3D Stats (Workouts & Total Volume side-by-side) */}
      <div className="grid grid-cols-2 gap-3 animate-fade-in">
        <div className="bg-[#141414] p-3 rounded-xl border-2 border-black flex items-center gap-2.5 shadow-[4px_4px_0px_0px_#000000]">
          <div className="w-8 h-8 rounded-lg bg-black border border-stone-800 flex items-center justify-center text-[#6f6d6c]">
            <Dumbbell className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-[8px] text-stone-400 font-bold uppercase tracking-wider font-sans">Workouts</div>
            <div className="font-mono text-base font-black text-white">{totalWorkouts}</div>
          </div>
        </div>

        <div className="bg-[#141414] p-3 rounded-xl border-2 border-black flex items-center gap-2.5 shadow-[4px_4px_0px_0px_#000000]">
          <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
            <TransparentImage 
              src={armsUp ? machokeArmsUp : machokeArmsDown} 
              alt="Lifting Machamp Badge" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className="text-[8px] text-stone-400 font-bold uppercase tracking-wider font-sans">Total Volume</div>
            <div className="font-mono text-base font-black text-white truncate max-w-[100px]">
              {totalVolume.toLocaleString()} <span className="text-[8px] text-stone-400 font-normal">kg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Control Switcher for Completed Workouts vs Exercise Library */}
      <div className="bg-[#121011] p-1.5 rounded-xl border border-[#2d2729] grid grid-cols-2 gap-1 font-sans">
        <button
          type="button"
          onClick={() => setActiveSubTab("workouts")}
          className={`py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2 transition duration-200 cursor-pointer ${
            activeSubTab === "workouts"
              ? "bg-[#6f6d6c] text-[#f7f5f4] shadow-3d-sm"
              : "text-stone-450 hover:text-stone-200"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>My Workouts ({totalWorkouts})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("exercises")}
          className={`py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2 transition duration-200 cursor-pointer ${
            activeSubTab === "exercises"
              ? "bg-[#6f6d6c] text-[#f7f5f4] shadow-3d-sm"
              : "text-stone-450 hover:text-stone-200"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Exercise Library ({exerciseLibrary.length})</span>
        </button>
      </div>

      {/* Dynamic Content Views */}
      <div className="space-y-4">
        {activeSubTab === "workouts" && (
          <div className="space-y-4">
            {currentUserLogs.map((log) => {
              const author = getUserInfo(log.user_id);
              const postReactions = reactionsByWorkoutId.get(log.id) || [];
              const userReaction = postReactions.filter((r) => r.user_id === activeUserId);
              const hasReacted = userReaction.length > 0;
              const postComments = commentsByWorkoutId.get(log.id) || [];

              // Exercises list
              const exercisesToShow = expandedLogs[log.id]
                ? log.exercises
                : log.exercises.slice(0, 3);
              const hasMore = log.exercises.length > 3;

              return (
                <div
                  key={log.id}
                  onClick={() => onViewWorkoutDetail?.(log)}
                  className="content-card bg-[#121011] border border-[#2d2729] rounded-2xl p-4.5 space-y-4.5 text-left shadow-3d-sm hover:border-[#6f6d6c]/25 hover:bg-[#181516] transition-all duration-300 font-sans cursor-pointer"
                >
                  <div className="flex items-center justify-between font-sans">
                     <div className="font-sans">
                      <h3 className="text-[13px] font-black text-[#f7f5f4]">{log.title}</h3>
                      <p className="text-[8.5px] text-stone-500 font-mono font-bold mt-0.5 tracking-wide uppercase">
                        ✓ Logged {getFriendlyTime(log.end_time)}
                      </p>
                    </div>
                    <span className="text-[8.5px] bg-[#6f6d6c]/10 text-stone-300 border border-[#6f6d6c]/15 px-2 py-0.5 rounded font-mono font-black uppercase">
                      Alex
                    </span>
                  </div>

                  {/* Workout Statistics Grid */}
                  <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-stone-900/65">
                    <div>
                      <span className="text-[8px] uppercase font-black tracking-widest text-stone-550 block">Duration</span>
                      <span className="font-mono text-xs font-black text-stone-105">
                        {formatDuration(log.duration_seconds)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase font-black tracking-widest text-stone-550 block">Volume</span>
                      <span className="font-mono text-xs font-black text-stone-105">
                        {Number(log.total_volume).toLocaleString()} <span className="font-sans text-[8px] text-stone-450 uppercase font-bold">kg</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase font-black tracking-widest text-stone-550 block">Gold PRs</span>
                      <span className="font-mono text-xs font-black text-stone-105 flex items-center gap-1">
                        🏆 {log.exercises.length}
                      </span>
                    </div>
                  </div>

                  {log.notes && (
                    <p className="text-[10px] text-stone-400 italic bg-stone-900/10 px-3 py-2 rounded-xl border border-white/5">
                      "{log.notes}"
                    </p>
                  )}

                  {/* Complete List of Exercises */}
                  <div className="space-y-3">
                    {exercisesToShow.map((le) => {
                      const ex = exerciseById.get(le.exercise_id);
                      const completedSets = le.sets.filter((s) => s.is_completed);
                      const displaySetsCount = completedSets.length > 0 ? completedSets.length : le.sets.length;

                      return (
                        <div key={le.id} className="flex items-center gap-3">
                          <ExerciseImage exercise={ex} className="w-9 h-9" />
                          <div className="text-left flex-1 min-w-0">
                            <p className="text-[10.5px] font-bold text-stone-250 truncate">
                              <span className="font-mono text-stone-450 text-[9.5px] font-black tracking-tight mr-1.5">
                                {displaySetsCount} sets
                              </span>
                              {ex?.name}
                            </p>
                            <span className="text-[8px] bg-[#1c181a] border border-[#2d2729] text-stone-500 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider mt-0.5 inline-block">
                              {ex?.body_part} target
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {hasMore && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(log.id);
                        }}
                        className="text-[9px] font-black uppercase text-stone-450 hover:text-stone-300 transition tracking-widest flex items-center gap-1 pt-1 cursor-pointer"
                      >
                        <span>{expandedLogs[log.id] ? "Collapse Exercises" : `Show ${log.exercises.length - 3} more`}</span>
                        <span>{expandedLogs[log.id] ? "▲" : "▼"}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {currentUserLogs.length === 0 && (
              <div className="p-12 text-center text-stone-500 bg-[#1c181a] rounded-2xl border border-dashed border-[#6f6d6c]/25 mt-2 font-sans">
                <Dumbbell className="w-8 h-8 mx-auto mb-2 text-[#6f6d6c]" />
                <p className="text-xs font-bold text-stone-400">No workout logs found.</p>
                <p className="text-[9.5px] mt-1 text-[#6f6d6c] font-mono">Unlock by finishing a template workout inside the "Workout" tab!</p>
              </div>
            )}
          </div>
        )}

        {activeSubTab === "exercises" && (
          <div className="animate-fade-in">
            <ExercisesTab
              activeUserId={activeUserId}
              profileUserId={profileUserId}
              allWorkoutLogs={allWorkoutLogs}
              exerciseLibrary={exerciseLibrary}
              onAddCustomExercise={onAddCustomExercise}
            />
          </div>
        )}
      </div>
    </div>
  );
}
