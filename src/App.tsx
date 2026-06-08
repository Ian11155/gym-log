import { useState, useEffect } from "react";
import {
  User,
  Exercise,
  Routine,
  WorkoutLog,
  Comment,
  Reaction,
  ActiveWorkout,
  SQUAD_USERS,
  INITIAL_EXERCISES,
  INITIAL_ROUTINES,
  INITIAL_WORKOUT_LOGS,
  INITIAL_COMMENTS,
  INITIAL_REACTIONS,
} from "./types";
import HomeCombinedTab from "./components/HomeCombinedTab";
import WorkoutTab from "./components/WorkoutTab";
import ProfileTab from "./components/ProfileTab";
import ActiveWorkoutOverlay from "./components/ActiveWorkoutOverlay";
import RestTimerDialog from "./components/RestTimerDialog";
import SupabaseCodeViewer from "./components/SupabaseCodeViewer";
import WorkoutDetailModal from "./components/WorkoutDetailModal";

import {
  Dumbbell,
  Database,
  Users,
  X,
  Menu,
  ShieldCheck,
  Sparkles,
  Home,
  User as ProfileIcon
} from "lucide-react";

export default function App() {
  // ----------------------------------------------------
  // PERSISTED LOCAL STATES (Simulating database tables)
  // ----------------------------------------------------
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>(() => {
    const saved = localStorage.getItem("squad_workout_logs");
    return saved ? JSON.parse(saved) : INITIAL_WORKOUT_LOGS;
  });

  const [comments, setComments] = useState<Comment[]>(() => {
    const saved = localStorage.getItem("squad_comments");
    return saved ? JSON.parse(saved) : INITIAL_COMMENTS;
  });

  const [reactions, setReactions] = useState<Reaction[]>(() => {
    const saved = localStorage.getItem("squad_reactions");
    return saved ? JSON.parse(saved) : INITIAL_REACTIONS;
  });

  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>(() => {
    const saved = localStorage.getItem("squad_exercises");
    return saved ? JSON.parse(saved) : INITIAL_EXERCISES;
  });

  const [routines, setRoutines] = useState<Routine[]>(() => {
    const saved = localStorage.getItem("squad_routines");
    return saved ? JSON.parse(saved) : INITIAL_ROUTINES;
  });

  // Streaks count simulator state
  const [userStreaks, setUserStreaks] = useState<{ [key: string]: number }>({
    "user-1": 4, // Alex
    "user-2": 6, // Marcus
    "user-3": 5, // Leo
    "user-4": 3, // Sarah
  });

  // Current active logged in friend
  const [activeUserId, setActiveUserId] = useState<string>("user-1"); // Alex initially

  // Specific user profile currently being viewed in the Profile Tab
  const [viewedProfileUserId, setViewedProfileUserId] = useState<string>("user-1");

  // Navigation tab bar (1: Personal, 2: Group Feed, 3: Active Tracker, 4: Exercises)
  const [currentTab, setCurrentTab] = useState<number>(1);

  // Active workout state machine
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
  const [isActiveMaximized, setIsActiveMaximized] = useState<boolean>(false);

  // Selected workout log in feed or profile to view metrics details
  const [selectedWorkoutDetail, setSelectedWorkoutDetail] = useState<WorkoutLog | null>(null);

  // Post-set Rest Timer State
  const [isRestActive, setIsRestActive] = useState(false);
  const [restSecondsRemaining, setRestSecondsRemaining] = useState(90);
  const [restTotalSeconds, setRestTotalSeconds] = useState(90);
  const [isRestMuted, setIsRestMuted] = useState(false);

  // General Notification feedback
  const [toastNotification, setToastNotification] = useState<string>("");
  const [isDevPanelOpen, setIsDevPanelOpen] = useState<boolean>(false);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem("squad_workout_logs", JSON.stringify(workoutLogs));
  }, [workoutLogs]);

  useEffect(() => {
    localStorage.setItem("squad_comments", JSON.stringify(comments));
  }, [comments]);

  useEffect(() => {
    localStorage.setItem("squad_reactions", JSON.stringify(reactions));
  }, [reactions]);

  useEffect(() => {
    localStorage.setItem("squad_exercises", JSON.stringify(exerciseLibrary));
  }, [exerciseLibrary]);

  useEffect(() => {
    localStorage.setItem("squad_routines", JSON.stringify(routines));
  }, [routines]);

  // Rest timer tick effect
  useEffect(() => {
    if (!isRestActive) return;
    if (restSecondsRemaining <= 0) {
      setIsRestActive(false);
      triggerToast("Rest completed! Squeeze those rep sets! 💪");
      return;
    }

    const timer = setInterval(() => {
      setRestSecondsRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isRestActive, restSecondsRemaining]);

  // Utility to fire temporary toast notifications
  const triggerToast = (msg: string) => {
    setToastNotification(msg);
    setTimeout(() => {
      setToastNotification("");
    }, 3500);
  };

  const getActiveUserObj = () => {
    return SQUAD_USERS.find((u) => u.id === activeUserId) || SQUAD_USERS[0];
  };

  // ----------------------------------------------------
  // WORKOUT METHODS
  // ----------------------------------------------------
  
  // Start an Empty Workout (State initialization)
  const handleStartEmptyWorkout = () => {
    if (activeWorkout) {
      // Prompt maximizing current instead
      setIsActiveMaximized(true);
      triggerToast("An active workout is already in progress!");
      return;
    }

    const defaultTitle = `Workout with ${getActiveUserObj().username.split(" ")[0]}`;
    const newSession: ActiveWorkout = {
      title: defaultTitle,
      start_time: new Date().toISOString(),
      notes: "",
      exercises: [
        {
          id: `le-${Date.now()}-initial`,
          exercise_id: "ex-1", // default Bench Press for testing
          order_index: 0,
          sets: [
            { id: `ls-${Date.now()}-s1`, set_number: 1, set_type: "Normal", actual_reps: 10, actual_weight: 135, is_completed: false }
          ]
        }
      ]
    };

    setActiveWorkout(newSession);
    setIsActiveMaximized(true);
    triggerToast("Empty workout session started!");
  };

  // Launch a saved/pinned Routine template
  const handleLaunchRoutine = (routine: Routine) => {
    if (activeWorkout) {
      setIsActiveMaximized(true);
      triggerToast("Finish your current active workout first!");
      return;
    }

    // Map template exercises and sets into active layout
    const activeExercises = routine.exercises.map((re, exIdx) => ({
      id: `le-${Date.now()}-${exIdx}`,
      exercise_id: re.exercise_id,
      order_index: exIdx,
      sets: re.sets.map((set, setIdx) => ({
        id: `ls-${Date.now()}-${exIdx}-${setIdx}`,
        set_number: set.set_number,
        set_type: set.set_type,
        actual_reps: set.target_reps,
        actual_weight: set.target_weight,
        is_completed: false,
      }))
    }));

    const launchedSession: ActiveWorkout = {
      title: `${routine.title} Session`,
      start_time: new Date().toISOString(),
      notes: routine.notes,
      exercises: activeExercises,
    };

    setActiveWorkout(launchedSession);
    setIsActiveMaximized(true);
    triggerToast(`Launched: "${routine.title}"`);
  };

  // Finish Workout (Save, calculate final stats, add to feed log database)
  const handleFinishWorkout = () => {
    if (!activeWorkout) return;

    // Must check if user registered at least one completed set
    const allCompletedSets = activeWorkout.exercises.flatMap((ex) =>
      ex.sets.filter((s) => s.is_completed)
    );

    if (allCompletedSets.length === 0) {
      triggerToast("⚠️ Mark at least 1 completed set before finishing!");
      return;
    }

    // Calculate total session volume (Weight * Reps) of completed sets
    const totalVolume = activeWorkout.exercises.reduce((exVol, ex) => {
      const completedSetsInEx = ex.sets.filter((s) => s.is_completed);
      const exVolSum = completedSetsInEx.reduce((setVol, s) => {
        return setVol + (Number(s.actual_weight) * Number(s.actual_reps));
      }, 0);
      return exVol + exVolSum;
    }, 0);

    const endTime = new Date().toISOString();
    const durationSeconds = Math.max(
      60,
      Math.floor((new Date(endTime).getTime() - new Date(activeWorkout.start_time).getTime()) / 1000)
    );

    // Save workout log entry
    const finalLog: WorkoutLog = {
      id: `wl-${Date.now()}`,
      user_id: activeUserId,
      title: activeWorkout.title || "Custom Workout Session",
      start_time: activeWorkout.start_time,
      end_time: endTime,
      total_volume: totalVolume,
      duration_seconds: durationSeconds,
      notes: activeWorkout.notes,
      exercises: activeWorkout.exercises.map((ex) => ({
        ...ex,
        // keep only completed sets to matching logs specs
        sets: ex.sets.filter((s) => s.is_completed)
      })).filter((ex) => ex.sets.length > 0) // only include exercises that have subsets completed
    };

    // Prepend to workout tracking logs
    setWorkoutLogs((prev) => [finalLog, ...prev]);

    // Update active user's streak for simulator feeling
    setUserStreaks((prev) => ({
      ...prev,
      [activeUserId]: (prev[activeUserId] || 1) + 1,
    }));

    // Reset active workout machine
    setActiveWorkout(null);
    setIsActiveMaximized(false);
    setIsRestActive(false);

    // Swap views to home automatically to preview the entry!
    setCurrentTab(1);
    triggerToast(`🎉 Workout logged! Streamed instantly in Group Feed.`);
  };

  const handleSaveRoutine = (newRoutine: Routine) => {
    setRoutines((prev) => [newRoutine, ...prev]);
    triggerToast(`✨ Routine template "${newRoutine.title}" created successfully!`);
  };

  const handleDeleteRoutine = (routineId: string) => {
    setRoutines((prev) => prev.filter((r) => r.id !== routineId));
    triggerToast("Routine template deleted.");
  };

  // Cancel Session Workout
  const handleCancelWorkout = () => {
    setActiveWorkout(null);
    setIsActiveMaximized(false);
    setIsRestActive(false);
    triggerToast("Workout session discarded.");
  };

  // Check Set: calculates volume and fires the post-set Rest timer
  const handleSetChecked = (exerciseId: string, setIndex: number, isChecked: boolean) => {
    if (!activeWorkout) return;

    // Deep update isChecked state
    const updatedExs = activeWorkout.exercises.map((ex) => {
      if (ex.exercise_id === exerciseId) {
        const updatedSets = ex.sets.map((set, idx) => {
          if (idx === setIndex) {
            return { ...set, is_completed: isChecked };
          }
          return set;
        });
        return { ...ex, sets: updatedSets };
      }
      return ex;
    });

    setActiveWorkout({
      ...activeWorkout,
      exercises: updatedExs,
    });

    // Code logic: If completing set, trigger the in-app 90s Rest Timer
    if (isChecked) {
      setRestSecondsRemaining(90);
      setRestTotalSeconds(90);
      setIsRestActive(true);
      triggerToast("⏱️ Set complete! 90-second rest countdown started.");
    }
  };

  // ----------------------------------------------------
  // SOCIAL FEED INTERACTIVITY
  // ----------------------------------------------------
  
  // Toggle Fist Bump Reaction (Exclusive for squad members, max 1 reaction per log)
  const handleToggleReaction = (workoutLogId: string) => {
    const existingIdx = reactions.findIndex(
      (r) => r.workout_log_id === workoutLogId && r.user_id === activeUserId
    );

    if (existingIdx > -1) {
      // Remove reaction
      const filtered = reactions.filter((_, idx) => idx !== existingIdx);
      setReactions(filtered);
    } else {
      // Add reaction
      const newReaction: Reaction = {
        id: `r-${Date.now()}-${Math.random()}`,
        workout_log_id: workoutLogId,
        user_id: activeUserId,
        reaction_type: "fist_bump",
      };
      setReactions((prev) => [...prev, newReaction]);
    }
  };

  // Add Comment on workout feed card
  const handleAddComment = (workoutLogId: string, text: string) => {
    const newComment: Comment = {
      id: `c-${Date.now()}-${Math.random()}`,
      workout_log_id: workoutLogId,
      user_id: activeUserId,
      comment_text: text,
      created_at: new Date().toISOString(),
    };
    setComments((prev) => [...prev, newComment]);
    triggerToast("Comment posted!");
  };

  // ----------------------------------------------------
  // COLLABORATIVE SHARED LIBRARY
  // ----------------------------------------------------
  const handleAddCustomExercise = (name: string, bodyPart: string, category: string, imageUrl?: string) => {
    const newEx: Exercise = {
      id: `ex-${Date.now()}`,
      name,
      body_part: bodyPart,
      category,
      created_by: activeUserId, // Flag active user as creator
      is_custom: true,
      image_url: imageUrl,
    };
    setExerciseLibrary((prev) => [...prev, newEx]);
  };

  // ----------------------------------------------------
  // REAL-TIME DEV SIMULATOR HANDLERS
  // ----------------------------------------------------
  const handleSimulateFriendWorkout = (friendIndex: number) => {
    // SQUAD USERS are Alex, Marcus, Leo, Sarah
    // Choose selected friend based on index (1=Marcus, 2=Leo, 3=Sarah)
    const simulatedFriend = SQUAD_USERS[friendIndex];
    if (!simulatedFriend) return;

    // Generate random workout categories
    const workoutTitles = [
      "⚡ Heavy Squats & Calves Rampage",
      "🔥 Midnight Shoulder Arnold Press Burn",
      "📐 Aesthetic Full Upper Body Pull",
      "🚀 Sunrise CrossFit HIIT Circuits",
      "🏋️ Heavy Deadlifts & Row Extravaganza"
    ];
    const notesArr = [
      "Felt fantastic energy today! Progressive overload moving in optimal paths.",
      "Strict form only. Focused on full squeeze and 2-second isometric holds.",
      "Quick intense routine before breakfast. High heart rate throughout.",
      "Accountability is key! Kept resting strictly to 90 seconds. Beast mode activated!"
    ];

    const randomTitle = workoutTitles[Math.floor(Math.random() * workoutTitles.length)];
    const randomNotes = notesArr[Math.floor(Math.random() * notesArr.length)];

    // Fetch random exercises
    const randomEx1 = exerciseLibrary[Math.floor(Math.random() * exerciseLibrary.length)];
    const randomEx2 = exerciseLibrary[Math.floor(Math.random() * exerciseLibrary.length)];

    const seedSets1 = [
      { id: `ls-${Date.now()}-s1`, set_number: 1, set_type: "Normal", actual_reps: 8, actual_weight: 185, is_completed: true },
      { id: `ls-${Date.now()}-s2`, set_number: 2, set_type: "Normal", actual_reps: 8, actual_weight: 205, is_completed: true }
    ];
    const seedSets2 = [
      { id: `ls-${Date.now()}-s3`, set_number: 1, set_type: "Normal", actual_reps: 10, actual_weight: 135, is_completed: true },
      { id: `ls-${Date.now()}-s4`, set_number: 2, set_type: "Drop", actual_reps: 12, actual_weight: 95, is_completed: true }
    ];

    const finalVolume = (185*8 + 205*8) + (135*10 + 95*12);

    const mockLog: WorkoutLog = {
      id: `wl-${Date.now()}`,
      user_id: simulatedFriend.id,
      title: randomTitle,
      start_time: new Date(Date.now() - 4000 * 1000).toISOString(),
      end_time: new Date().toISOString(),
      duration_seconds: 4000,
      total_volume: finalVolume,
      notes: randomNotes,
      exercises: [
        { id: `le-${Date.now()}-e1`, exercise_id: randomEx1.id, order_index: 0, sets: seedSets1 },
        { id: `le-${Date.now()}-e2`, exercise_id: randomEx2.id, order_index: 1, sets: seedSets2 }
      ]
    };

    // Insert to timeline logs
    setWorkoutLogs((prev) => [mockLog, ...prev]);

    // Update friend streak weeks
    setUserStreaks((prev) => ({
      ...prev,
      [simulatedFriend.id]: (prev[simulatedFriend.id] || 3) + 1,
    }));

    // Alert with a gorgeous Real-time simulated toast
    triggerToast(`⚡ Real-Time Listener: ${simulatedFriend.username.split(" ")[0]} finished a new workout! Check the feed.`);
    
    // Automatically swap tab view to feed to witness the live entry
    setCurrentTab(2);
  };

  return (
    <div className="h-dvh overflow-hidden bg-black text-[#e0dfd5] font-sans select-none antialiased">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[calc(env(safe-area-inset-top)+1px)] bg-black" />
      <div className="mx-auto flex h-dvh w-full max-w-[480px] flex-col overflow-hidden bg-[#181818] shadow-[0_0_24px_rgba(0,0,0,0.5)] md:border-x md:border-[#2d2729]">
        <header className="sticky top-0 z-50 border-b border-[#2d2729] bg-black px-5 pb-4 pt-[calc(1rem+env(safe-area-inset-top))]">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#6f6d6c]" />
                <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                  Local Demo Mode
                </span>
              </div>
              <h1 className="mt-1 truncate text-lg font-black tracking-tight text-white">
                SquadLift
              </h1>
            </div>

            <button
              type="button"
              onClick={() => setIsDevPanelOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#6f6d6c]/20 bg-black text-stone-300 shadow-3d-sm transition hover:border-[#6f6d6c]/45 hover:text-white"
              title="Open developer tools"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="relative min-h-0 flex-1 overflow-hidden selection:bg-[#6f6d6c] selection:text-white">
          <div className="absolute inset-x-0 top-0 h-72 bg-radial-[circle_at_20%_20%] from-[#6f6d6c]/10 via-transparent to-transparent pointer-events-none" />
          <div className="absolute left-8 top-16 h-96 w-[1px] bg-gradient-to-b from-[#6f6d6c]/15 via-transparent to-transparent pointer-events-none" />

          {toastNotification && (
            <div className="absolute left-4 right-4 top-4 z-45 flex items-center justify-center gap-2 rounded-2xl border border-[#6f6d6c]/20 bg-[#1c181a] p-3 text-center text-[11px] font-bold text-white shadow-3d-sm animate-fade-in">
              <span className="h-1.5 w-1.5 rounded-full bg-[#6f6d6c]" />
              <span className="tracking-wide text-stone-250">{toastNotification}</span>
            </div>
          )}

          <div className="relative z-10 h-full overflow-y-auto overscroll-contain pb-20 text-left scrollbar-none">
            {currentTab === 1 && (
              <HomeCombinedTab
                activeUserId={activeUserId}
                allWorkoutLogs={workoutLogs}
                exerciseLibrary={exerciseLibrary}
                comments={comments}
                reactions={reactions}
                onToggleReaction={handleToggleReaction}
                onAddComment={handleAddComment}
                onSimulateFeedUpdate={handleSimulateFriendWorkout}
                onViewProfile={(userId) => {
                  setViewedProfileUserId(userId);
                  setCurrentTab(3);
                }}
                onViewWorkoutDetail={setSelectedWorkoutDetail}
                showSimulatorControls={false}
              />
            )}

            {currentTab === 2 && (
              <WorkoutTab
                activeUserId={activeUserId}
                routines={routines}
                exerciseLibrary={exerciseLibrary}
                onStartEmptyWorkout={handleStartEmptyWorkout}
                onLaunchRoutine={handleLaunchRoutine}
                onSaveRoutine={handleSaveRoutine}
                onDeleteRoutine={handleDeleteRoutine}
                onSwitchToLibrary={() => setCurrentTab(3)}
              />
            )}

            {currentTab === 3 && (
              <ProfileTab
                activeUserId={activeUserId}
                profileUserId={viewedProfileUserId}
                allWorkoutLogs={workoutLogs}
                exerciseLibrary={exerciseLibrary}
                comments={comments}
                reactions={reactions}
                onToggleReaction={handleToggleReaction}
                onAddComment={handleAddComment}
                onAddCustomExercise={handleAddCustomExercise}
                onBackToOwnProfile={() => setViewedProfileUserId(activeUserId)}
                onViewWorkoutDetail={setSelectedWorkoutDetail}
              />
            )}
          </div>

          {activeWorkout && (
            <ActiveWorkoutOverlay
              activeWorkout={activeWorkout}
              isActiveMaximized={isActiveMaximized}
              exerciseLibrary={exerciseLibrary}
              onSetMaximize={setIsActiveMaximized}
              onUpdateWorkout={setActiveWorkout}
              onFinishWorkout={handleFinishWorkout}
              onCancelWorkout={handleCancelWorkout}
              onSetChecked={handleSetChecked}
            />
          )}

          {selectedWorkoutDetail && (
            <WorkoutDetailModal
              workoutLog={selectedWorkoutDetail}
              exerciseLibrary={exerciseLibrary}
              onClose={() => setSelectedWorkoutDetail(null)}
            />
          )}

          <nav className="fixed bottom-0 left-1/2 z-[60] flex h-16 w-full max-w-[480px] -translate-x-1/2 items-center justify-around border-t border-[#6f6d6c]/15 bg-black px-2 shadow-[0_-6px_18px_rgba(0,0,0,0.45)]">
            <button
              type="button"
              onClick={() => {
                setCurrentTab(1);
                setIsActiveMaximized(false);
              }}
              className={`flex h-12 w-16 flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer ${
                currentTab === 1 && !isActiveMaximized
                  ? "text-stone-150 scale-105 font-bold"
                  : "text-stone-500 hover:text-stone-350"
              }`}
            >
              <Home className="h-[19px] w-[19px] pointer-events-none" />
              <span className="mt-1 text-[8px] font-black uppercase tracking-widest">Home</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentTab(2);
                setIsActiveMaximized(false);
              }}
              className={`flex h-12 w-16 flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer ${
                currentTab === 2 && !isActiveMaximized
                  ? "text-stone-150 scale-105 font-bold"
                  : "text-stone-500 hover:text-stone-350"
              }`}
            >
              <Dumbbell className="h-[19px] w-[19px] pointer-events-none" />
              <span className="mt-1 text-[8px] font-black uppercase tracking-widest">Workout</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentTab(3);
                setViewedProfileUserId(activeUserId);
                setIsActiveMaximized(false);
              }}
              className={`flex h-12 w-16 flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer ${
                currentTab === 3 && !isActiveMaximized
                  ? "text-stone-150 scale-105 font-bold"
                  : "text-stone-500 hover:text-stone-350"
              }`}
            >
              <ProfileIcon className="h-[19px] w-[19px] pointer-events-none" />
              <span className="mt-1 text-[8px] font-black uppercase tracking-widest">Profile</span>
            </button>
          </nav>
        </main>
      </div>

      {isDevPanelOpen && (
        <div className="fixed inset-0 z-80 bg-black/80 animate-fade-in">
          <aside className="ml-auto flex h-full w-full max-w-2xl flex-col overflow-y-auto border-l border-[#2d2729] bg-[#0f0f0f] p-5 shadow-3d-md">
            <div className="flex items-start justify-between gap-4 border-b border-[#2d2729] pb-4">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-serif text-[#f7f5f4]">
                  <ShieldCheck className="h-5 w-5 text-[#6f6d6c]" />
                  <span>Developer Tools</span>
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-stone-400">
                  Local-only controls for switching squad roles, simulating friend activity, and reviewing the planned Supabase schema.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDevPanelOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#6f6d6c]/20 bg-black text-stone-400 transition hover:text-white"
                title="Close developer tools"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-6">
              <section className="rounded-2xl border border-[#2d2729] bg-[#121011] p-4 shadow-3d-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-stone-300">
                    <Sparkles className="h-3.5 w-3.5 text-stone-400" />
                    Switch Active Friend
                  </span>
                  <span className="rounded-full border border-[#6f6d6c]/10 bg-[#6f6d6c]/10 px-3 py-1 text-[9px] font-black tracking-widest text-stone-350">
                    LOCAL ROLEPLAY
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {SQUAD_USERS.map((user) => {
                    const isActive = user.id === activeUserId;
                    const personalWorkouts = workoutLogs.filter((log) => log.user_id === user.id);
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          setActiveUserId(user.id);
                          setViewedProfileUserId(user.id);
                          triggerToast(`Switched active user to ${user.username.split(" ")[0]}!`);
                        }}
                        className={`flex items-center justify-between rounded-2xl border p-4 text-left transition-all duration-300 cursor-pointer ${
                          isActive
                            ? "bg-[#333333] border-[#6f6d6c]/40 shadow-3d-emerald ring-1 ring-[#6f6d6c]/20"
                            : "bg-[#1c181a] border-white/5 hover:bg-[#282828] hover:border-white/10 shadow-3d-sm"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar_url}
                            alt={user.username}
                            className="h-11 w-11 rounded-full border border-white/5 object-cover shadow-3d-sm"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="text-xs font-bold text-stone-200">{user.username}</div>
                            <p className="mt-1 text-[9px] font-mono uppercase tracking-wide text-stone-400">
                              {personalWorkouts.length} Workouts | Streak: {userStreaks[user.id] || user.streak} Weeks
                            </p>
                          </div>
                        </div>

                        <span className={`text-[9px] font-black tracking-wider ${
                          isActive ? "rounded bg-[#6f6d6c] px-2 py-1 text-[#e0dfd5]" : "text-stone-500"
                        }`}>
                          {isActive ? "YOU" : "SET"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl border border-[#2d2729] bg-[#121011] p-4 shadow-3d-sm">
                <h3 className="flex items-center gap-2 text-sm font-bold text-[#f7f5f4]">
                  <Users className="h-4 w-4 text-stone-400" />
                  <span>Simulate Friend Workout</span>
                </h3>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { label: "Marcus", index: 1 },
                    { label: "Leo", index: 2 },
                    { label: "Sarah", index: 3 },
                  ].map((friend) => (
                    <button
                      key={friend.label}
                      type="button"
                      onClick={() => {
                        handleSimulateFriendWorkout(friend.index);
                        setIsDevPanelOpen(false);
                      }}
                      className="rounded-xl border border-[#6f6d6c]/15 bg-black px-3 py-3 text-[10px] font-black uppercase tracking-widest text-stone-300 transition hover:border-[#6f6d6c]/40 hover:text-white"
                    >
                      {friend.label}
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-[#2d2729] bg-[#121011] p-4 shadow-3d-sm">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#f7f5f4]">
                  <Database className="h-4 w-4 text-stone-400" />
                  <span>Future Backend Reference</span>
                </h3>
                <SupabaseCodeViewer />
              </section>
            </div>
          </aside>
        </div>
      )}

      {/* Global In-App Rest Timer Dialog Popup */}
      {isRestActive && (
        <RestTimerDialog
          secondsRemaining={restSecondsRemaining}
          totalSeconds={restTotalSeconds}
          onClose={() => {
            setIsRestActive(false);
            triggerToast("Rest skip logged. Get back to work!");
          }}
          onAdjustTime={(delta) => {
            setRestSecondsRemaining((prev) => Math.max(5, prev + delta));
            setRestTotalSeconds((prev) => Math.max(5, prev + delta));
          }}
          isMuted={isRestMuted}
          onToggleMuted={() => setIsRestMuted(!isRestMuted)}
        />
      )}

    </div>
  );
}
