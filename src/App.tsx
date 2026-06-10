import { useState, useEffect, useRef } from "react";
import {
  Exercise,
  Routine,
  WorkoutLog,
  Comment,
  Reaction,
  ActiveWorkout,
  SQUAD_USERS,
} from "./types";
import { APP_BUILD_LABEL, squadDataService } from "./services/squadDataService";
import {
  getSupabaseSession,
  isSupabaseConfigured,
  signInToSupabase,
  signOutOfSupabase,
  verifySupabaseConnection,
} from "./services/supabaseClient";
import {
  CloudPreview,
  previewSupabaseData,
  restoreLocalDataFromSupabase,
  uploadLocalDataToSupabase,
} from "./services/supabaseSquadDataService";
import {
  clearCloudSyncRetryQueue,
  enqueueCloudSyncRetry,
  loadCloudSyncRetryQueue,
  markLatestCloudSyncRetryAttempt,
} from "./services/cloudSyncRetryQueue";
import HomeCombinedTab from "./components/HomeCombinedTab";
import WorkoutTab from "./components/WorkoutTab";
import ProfileTab from "./components/ProfileTab";
import ActiveWorkoutOverlay from "./components/ActiveWorkoutOverlay";
import RestTimerDialog from "./components/RestTimerDialog";
import SupabaseCodeViewer from "./components/SupabaseCodeViewer";
import WorkoutDetailModal from "./components/WorkoutDetailModal";
import {
  getCompletedWorkoutSets,
  getInvalidCompletedSetCount,
  hasExerciseName,
  isCompletedSetValid,
} from "./utils/workoutValidation";

import {
  Dumbbell,
  Database,
  Users,
  X,
  Menu,
  ShieldCheck,
  Sparkles,
  Home,
  User as ProfileIcon,
  Download,
  Upload,
  RotateCcw
} from "lucide-react";

export default function App() {
  // ----------------------------------------------------
  // PERSISTED LOCAL STATES (Local-first data service)
  // ----------------------------------------------------
  const [initialDataLoad] = useState(() => squadDataService.load());

  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>(() => initialDataLoad.data.workoutLogs);

  const [comments, setComments] = useState<Comment[]>(() => initialDataLoad.data.comments);

  const [reactions, setReactions] = useState<Reaction[]>(() => initialDataLoad.data.reactions);

  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>(() => initialDataLoad.data.exerciseLibrary);

  const [routines, setRoutines] = useState<Routine[]>(() => initialDataLoad.data.routines);

  const [userStreaks, setUserStreaks] = useState<{ [key: string]: number }>(() => initialDataLoad.data.userStreaks);

  // Current active logged in friend
  const [activeUserId, setActiveUserId] = useState<string>(() => initialDataLoad.data.activeUserId);

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
  const [cloudCheckStatus, setCloudCheckStatus] = useState<string>(
    isSupabaseConfigured() ? "Configured, not checked" : "Not configured"
  );
  const [isCheckingCloud, setIsCheckingCloud] = useState<boolean>(false);
  const [cloudAuthEmail, setCloudAuthEmail] = useState<string>("");
  const [cloudAuthPassword, setCloudAuthPassword] = useState<string>("");
  const [cloudSignedInEmail, setCloudSignedInEmail] = useState<string>("");
  const [cloudMappedLocalUserId, setCloudMappedLocalUserId] = useState<string>("");
  const [isCloudSessionChecked, setIsCloudSessionChecked] = useState<boolean>(() => !isSupabaseConfigured());
  const [isCloudSignInDismissed, setIsCloudSignInDismissed] = useState<boolean>(false);
  const [cloudAuthStatus, setCloudAuthStatus] = useState<string>(
    isSupabaseConfigured() ? "Checking session..." : "Not configured"
  );
  const [isCloudAuthBusy, setIsCloudAuthBusy] = useState<boolean>(false);
  const [cloudUploadStatus, setCloudUploadStatus] = useState<string>("Not uploaded");
  const [isCloudUploading, setIsCloudUploading] = useState<boolean>(false);
  const [cloudPreview, setCloudPreview] = useState<CloudPreview | null>(null);
  const [cloudPreviewStatus, setCloudPreviewStatus] = useState<string>("Not previewed");
  const [isCloudPreviewing, setIsCloudPreviewing] = useState<boolean>(false);
  const [cloudRestoreStatus, setCloudRestoreStatus] = useState<string>("Not restored");
  const [isCloudRestoring, setIsCloudRestoring] = useState<boolean>(false);
  const [isCloudAutoPulling, setIsCloudAutoPulling] = useState<boolean>(false);
  const [pendingCloudSyncCount, setPendingCloudSyncCount] = useState<number>(() => loadCloudSyncRetryQueue().length);
  const [cloudRetryStatus, setCloudRetryStatus] = useState<string>(() => {
    const pendingCount = loadCloudSyncRetryQueue().length;
    return pendingCount > 0 ? `${pendingCount} pending` : "No pending sync";
  });
  const [isCloudRetrying, setIsCloudRetrying] = useState<boolean>(false);
  const startupRetryItemIdRef = useRef<string>("");
  const startupPullEmailRef = useRef<string>("");

  useEffect(() => {
    squadDataService.save({
      workoutLogs,
      comments,
      reactions,
      exerciseLibrary,
      routines,
      activeUserId,
      userStreaks,
    });
  }, [activeUserId, comments, exerciseLibrary, reactions, routines, userStreaks, workoutLogs]);

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

  useEffect(() => {
    if (initialDataLoad.warning) {
      triggerToast(initialDataLoad.warning);
    }
  }, [initialDataLoad.warning]);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsCloudSessionChecked(true);
      return;
    }

    let isMounted = true;

    void getSupabaseSession()
      .then((session) => {
        if (!isMounted) return;
        const email = session?.user.email || "";
        setCloudSignedInEmail(email);
        setCloudAuthStatus(email ? `Signed in as ${email}` : "Not signed in");
        setIsCloudSessionChecked(true);
      })
      .catch((error) => {
        if (!isMounted) return;
        setCloudAuthStatus(error instanceof Error ? error.message : "Could not read cloud session.");
        setIsCloudSessionChecked(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const getActiveUserObj = () => {
    return SQUAD_USERS.find((u) => u.id === activeUserId) || SQUAD_USERS[0];
  };

  const getCurrentLocalData = () => ({
    workoutLogs,
    comments,
    reactions,
    exerciseLibrary,
    routines,
    activeUserId,
    userStreaks,
  });

  const getLocalDataWithOverrides = (overrides: Partial<ReturnType<typeof getCurrentLocalData>>) => ({
    ...getCurrentLocalData(),
    ...overrides,
  });

  const isCloudSignedInAsActiveUser = () => {
    const activeUser = SQUAD_USERS.find((user) => user.id === activeUserId);
    return Boolean(
      cloudSignedInEmail && (
        (activeUser?.email && activeUser.email.toLowerCase() === cloudSignedInEmail.toLowerCase())
        || (cloudMappedLocalUserId && cloudMappedLocalUserId === activeUserId)
      )
    );
  };

  const refreshPendingCloudSyncStatus = (status?: string) => {
    const pendingCount = loadCloudSyncRetryQueue().length;
    setPendingCloudSyncCount(pendingCount);
    setCloudRetryStatus(status || (pendingCount > 0 ? `${pendingCount} pending` : "No pending sync"));
  };

  const autoPushLocalDataToCloud = (data: ReturnType<typeof getCurrentLocalData>, reason: string) => {
    if (!cloudSignedInEmail) return;

    if (!isCloudSignedInAsActiveUser()) {
      setCloudUploadStatus("Auto-push skipped: signed-in cloud user does not match active local user.");
      return;
    }

    setCloudUploadStatus(`Auto-pushing ${reason}...`);

    void uploadLocalDataToSupabase(data)
      .then((result) => {
        clearCloudSyncRetryQueue();
        refreshPendingCloudSyncStatus("No pending sync");
        setCloudUploadStatus(
          `Auto-pushed ${result.exerciseCount} exercises, ${result.routineCount} routines, ${result.workoutCount} workouts.`
        );
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "Cloud auto-push failed.";
        enqueueCloudSyncRetry(data, reason, message);
        refreshPendingCloudSyncStatus("Queued for retry");
        setCloudUploadStatus(`Saved locally. Cloud auto-push failed: ${message}`);
        triggerToast("Saved locally. Cloud sync failed.");
      });
  };

  const applyLocalData = (data: ReturnType<typeof getCurrentLocalData>) => {
    setWorkoutLogs(data.workoutLogs);
    setComments(data.comments);
    setReactions(data.reactions);
    setExerciseLibrary(data.exerciseLibrary);
    setRoutines(data.routines);
    setUserStreaks(data.userStreaks);
    setActiveUserId(data.activeUserId);
    setViewedProfileUserId(data.activeUserId);
  };

  const handleExportLocalData = () => {
    const blob = new Blob([squadDataService.exportBackup(getCurrentLocalData())], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `squadlift-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    triggerToast("Local backup exported.");
  };

  const handleImportLocalData = async (file?: File) => {
    if (!file) return;

    try {
      const importedData = squadDataService.importBackup(await file.text());
      applyLocalData(importedData);
      triggerToast("Local backup imported.");
    } catch {
      triggerToast("Backup import failed. Check that the JSON came from SquadLift.");
    }
  };

  const handleResetLocalData = () => {
    const defaultData = squadDataService.createDefaultData();
    squadDataService.resetLocalData();
    applyLocalData(defaultData);
    triggerToast("Local demo data reset.");
  };

  const handleVerifyCloudConnection = async () => {
    setIsCheckingCloud(true);
    setCloudCheckStatus("Checking...");

    const result = await verifySupabaseConnection();
    setCloudCheckStatus(result.message);
    setIsCheckingCloud(false);
    triggerToast(result.message);
  };

  const handleCloudSignIn = async () => {
    if (!cloudAuthEmail.trim() || !cloudAuthPassword) {
      triggerToast("Enter email and password first.");
      return;
    }

    setIsCloudAuthBusy(true);
    setCloudAuthStatus("Signing in...");

    try {
      const session = await signInToSupabase(cloudAuthEmail.trim(), cloudAuthPassword);
      const email = session.user.email || cloudAuthEmail.trim();
      setCloudSignedInEmail(email);
      setIsCloudSignInDismissed(false);
      setCloudAuthPassword("");
      setCloudAuthStatus(`Signed in as ${email}`);
      triggerToast("Cloud sign-in active.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Cloud sign-in failed.";
      setCloudAuthStatus(message);
      triggerToast(message);
    } finally {
      setIsCloudAuthBusy(false);
    }
  };

  const handleCloudSignOut = async () => {
    setIsCloudAuthBusy(true);
    setCloudAuthStatus("Signing out...");

    try {
      await signOutOfSupabase();
      startupPullEmailRef.current = "";
      setCloudSignedInEmail("");
      setCloudMappedLocalUserId("");
      setIsCloudSignInDismissed(false);
      setCloudAuthEmail("");
      setCloudAuthPassword("");
      setCloudAuthStatus("Not signed in");
      triggerToast("Cloud signed out.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Cloud sign-out failed.";
      setCloudAuthStatus(message);
      triggerToast(message);
    } finally {
      setIsCloudAuthBusy(false);
    }
  };

  const handleUploadLocalDataToCloud = async () => {
    if (!cloudSignedInEmail) {
      triggerToast("Sign in before uploading local data.");
      return;
    }

    setIsCloudUploading(true);
    setCloudUploadStatus("Uploading...");

    try {
      const result = await uploadLocalDataToSupabase(getCurrentLocalData());
      const message = `Uploaded ${result.exerciseCount} exercises, ${result.routineCount} routines, ${result.workoutCount} workouts, ${result.setCount} sets.`;
      clearCloudSyncRetryQueue();
      refreshPendingCloudSyncStatus("No pending sync");
      setCloudUploadStatus(message);
      triggerToast("Local data uploaded to cloud.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Cloud upload failed.";
      setCloudUploadStatus(message);
      triggerToast(message);
    } finally {
      setIsCloudUploading(false);
    }
  };

  const handlePreviewCloudData = async () => {
    if (!cloudSignedInEmail) {
      triggerToast("Sign in before previewing cloud data.");
      return;
    }

    setIsCloudPreviewing(true);
    setCloudPreviewStatus("Previewing...");

    try {
      const preview = await previewSupabaseData();
      setCloudPreview(preview);
      setCloudPreviewStatus(
        `${preview.squadName}: ${preview.exerciseCount} exercises, ${preview.routineCount} routines, ${preview.workoutCount} workouts.`
      );
      triggerToast("Cloud preview loaded.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Cloud preview failed.";
      setCloudPreview(null);
      setCloudPreviewStatus(message);
      triggerToast(message);
    } finally {
      setIsCloudPreviewing(false);
    }
  };

  const pullCloudDataIntoLocalState = async (options: { isAutomatic?: boolean } = {}) => {
    const isAutomatic = Boolean(options.isAutomatic);

    if (!cloudSignedInEmail) {
      if (!isAutomatic) {
        triggerToast("Sign in before restoring cloud data.");
      }
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setCloudRestoreStatus(isAutomatic ? "Auto pull waiting for connection" : "Waiting for connection");
      if (!isAutomatic) {
        triggerToast("Device is offline. Restore when internet is back.");
      }
      return;
    }

    const pendingCount = loadCloudSyncRetryQueue().length;
    if (pendingCount > 0) {
      setCloudRestoreStatus(`Auto pull paused: ${pendingCount} pending local sync`);
      return;
    }

    if (isAutomatic) {
      setIsCloudAutoPulling(true);
      setCloudRestoreStatus("Auto pulling cloud data...");
    } else {
      setIsCloudRestoring(true);
      setCloudRestoreStatus("Restoring...");
    }

    try {
      const restoredData = await restoreLocalDataFromSupabase(getCurrentLocalData());
      applyLocalData(restoredData);
      setCloudMappedLocalUserId(restoredData.activeUserId);
      const message = `${isAutomatic ? "Auto pulled" : "Restored"} ${restoredData.exerciseLibrary.length} exercises, ${restoredData.routines.length} routines, ${restoredData.workoutLogs.length} workouts.`;
      setCloudRestoreStatus(message);
      triggerToast(isAutomatic ? "Cloud data auto-pulled." : "Cloud data restored locally.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Cloud restore failed.";
      setCloudRestoreStatus(isAutomatic ? `Auto pull failed: ${message}` : message);
      if (!isAutomatic) {
        triggerToast(message);
      }
    } finally {
      if (isAutomatic) {
        setIsCloudAutoPulling(false);
      } else {
        setIsCloudRestoring(false);
      }
    }
  };

  const handleRestoreLocalDataFromCloud = async () => {
    const confirmed = window.confirm(
      "Restore from Supabase? This replaces local exercises, routines, and workout history on this device. Export a local backup first if you want a rollback file."
    );

    if (!confirmed) return;

    await pullCloudDataIntoLocalState();
  };

  const handleRetryPendingCloudSync = async (options: { isAutomatic?: boolean } = {}) => {
    if (isCloudRetrying) return;

    const queue = loadCloudSyncRetryQueue();
    const latestItem = queue.at(-1);
    const isAutomatic = Boolean(options.isAutomatic);

    if (!latestItem) {
      refreshPendingCloudSyncStatus("No pending sync");
      return;
    }

    if (!cloudSignedInEmail) {
      if (!isAutomatic) {
        triggerToast("Sign in before retrying cloud sync.");
      }
      refreshPendingCloudSyncStatus("Waiting for cloud sign-in");
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      refreshPendingCloudSyncStatus("Waiting for connection");
      if (!isAutomatic) {
        triggerToast("Device is offline. Retry when internet is back.");
      }
      return;
    }

    const queuedUser = SQUAD_USERS.find((user) => user.id === latestItem.data.activeUserId);
    if (queuedUser?.email.toLowerCase() !== cloudSignedInEmail.toLowerCase()) {
      setCloudRetryStatus("Retry blocked: signed-in cloud user does not match queued local user.");
      return;
    }

    setIsCloudRetrying(true);
    setCloudRetryStatus(
      `${isAutomatic ? "Auto-retrying" : "Retrying"} ${queue.length} pending item${queue.length === 1 ? "" : "s"}...`
    );

    try {
      const result = await uploadLocalDataToSupabase(latestItem.data);
      clearCloudSyncRetryQueue();
      refreshPendingCloudSyncStatus(isAutomatic ? "Auto retry complete" : "Retry complete");
      setCloudUploadStatus(
        `Retry pushed ${result.exerciseCount} exercises, ${result.routineCount} routines, ${result.workoutCount} workouts.`
      );
      triggerToast(isAutomatic ? "Pending cloud sync auto-retried." : "Pending cloud sync retried.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Cloud retry failed.";
      markLatestCloudSyncRetryAttempt(message);
      refreshPendingCloudSyncStatus(`${isAutomatic ? "Auto retry failed" : "Retry failed"}: ${message}`);
      if (!isAutomatic) {
        triggerToast("Cloud retry failed.");
      }
    } finally {
      setIsCloudRetrying(false);
    }
  };

  useEffect(() => {
    const latestItem = loadCloudSyncRetryQueue().at(-1);
    if (!cloudSignedInEmail || !latestItem || isCloudRetrying || startupRetryItemIdRef.current === latestItem.id) {
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      refreshPendingCloudSyncStatus("Waiting for connection");
      return;
    }

    startupRetryItemIdRef.current = latestItem.id;
    const retryDelay = window.setTimeout(() => {
      void handleRetryPendingCloudSync({ isAutomatic: true });
    }, 600);

    return () => window.clearTimeout(retryDelay);
  }, [cloudSignedInEmail, isCloudRetrying, pendingCloudSyncCount]);

  useEffect(() => {
    const pendingCount = loadCloudSyncRetryQueue().length;
    if (
      !cloudSignedInEmail ||
      isCloudAutoPulling ||
      isCloudRestoring ||
      activeWorkout ||
      startupPullEmailRef.current === cloudSignedInEmail
    ) {
      return;
    }

    if (pendingCount > 0) {
      setCloudRestoreStatus(`Auto pull paused: ${pendingCount} pending local sync`);
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setCloudRestoreStatus("Auto pull waiting for connection");
      return;
    }

    startupPullEmailRef.current = cloudSignedInEmail;
    const pullDelay = window.setTimeout(() => {
      void pullCloudDataIntoLocalState({ isAutomatic: true });
    }, 900);

    return () => window.clearTimeout(pullDelay);
  }, [activeWorkout, cloudSignedInEmail, isCloudAutoPulling, isCloudRestoring, pendingCloudSyncCount]);

  useEffect(() => {
    const handleOnline = () => {
      const pendingCount = loadCloudSyncRetryQueue().length;
      if (pendingCount === 0) {
        refreshPendingCloudSyncStatus("No pending sync");
        if (cloudSignedInEmail && !activeWorkout) {
          void pullCloudDataIntoLocalState({ isAutomatic: true });
        }
        return;
      }

      refreshPendingCloudSyncStatus(`${pendingCount} pending`);
      void handleRetryPendingCloudSync({ isAutomatic: true });
    };

    const handleOffline = () => {
      if (loadCloudSyncRetryQueue().length > 0) {
        refreshPendingCloudSyncStatus("Waiting for connection");
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [activeWorkout, cloudSignedInEmail, isCloudRetrying]);

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

    const defaultExercise = exerciseLibrary.find((exercise) => exercise.name.toLowerCase() === "bench press")
      || exerciseLibrary[0];

    if (!defaultExercise) {
      triggerToast("Add an exercise before starting a workout.");
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
          exercise_id: defaultExercise.id,
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
    const allCompletedSets = getCompletedWorkoutSets(activeWorkout);

    if (allCompletedSets.length === 0) {
      triggerToast("Mark at least 1 valid completed set before finishing.");
      return;
    }

    if (getInvalidCompletedSetCount(activeWorkout) > 0) {
      triggerToast("Completed sets need reps above 0 and weight at least 0.");
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
        sets: ex.sets.filter(isCompletedSetValid)
      })).filter((ex) => ex.sets.length > 0) // only include exercises that have subsets completed
    };

    const nextWorkoutLogs = [finalLog, ...workoutLogs];
    const nextUserStreaks = {
      ...userStreaks,
      [activeUserId]: (userStreaks[activeUserId] || 1) + 1,
    };

    // Prepend to workout tracking logs
    setWorkoutLogs(nextWorkoutLogs);

    // Update active user's streak for simulator feeling
    setUserStreaks(nextUserStreaks);

    // Reset active workout machine
    setActiveWorkout(null);
    setIsActiveMaximized(false);
    setIsRestActive(false);

    // Swap views to home automatically to preview the entry!
    setCurrentTab(1);
    triggerToast("Workout logged.");
    autoPushLocalDataToCloud(
      getLocalDataWithOverrides({ workoutLogs: nextWorkoutLogs, userStreaks: nextUserStreaks }),
      "workout"
    );
  };

  const handleSaveRoutine = (newRoutine: Routine) => {
    const nextRoutines = [newRoutine, ...routines];
    setRoutines(nextRoutines);
    triggerToast(`✨ Routine template "${newRoutine.title}" created successfully!`);
    autoPushLocalDataToCloud(getLocalDataWithOverrides({ routines: nextRoutines }), "routine");
  };

  const handleDeleteRoutine = (routineId: string) => {
    const routine = routines.find((item) => item.id === routineId);
    const routineName = routine?.title || "this routine";
    if (!window.confirm(`Delete "${routineName}"? This only removes the routine template.`)) return;

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
  const handleSetChecked = (loggedExerciseId: string, setIndex: number, isChecked: boolean) => {
    if (!activeWorkout) return;

    // Deep update isChecked state
    const updatedExs = activeWorkout.exercises.map((ex) => {
      if (ex.id === loggedExerciseId) {
        const updatedSets = ex.sets.map((set, idx) => {
          if (idx === setIndex) {
            if (isChecked && !isCompletedSetValid({ ...set, is_completed: true })) {
              triggerToast("Enter reps above 0 and weight at least 0 before ticking the set.");
              return set;
            }
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
    if (hasExerciseName(exerciseLibrary, name)) {
      triggerToast(`"${name.trim()}" already exists in the exercise library.`);
      return false;
    }

    const newEx: Exercise = {
      id: `ex-${Date.now()}`,
      name: name.trim(),
      body_part: bodyPart,
      category,
      created_by: activeUserId, // Flag active user as creator
      is_custom: true,
      image_url: imageUrl,
    };
    const nextExerciseLibrary = [...exerciseLibrary, newEx];
    setExerciseLibrary(nextExerciseLibrary);
    triggerToast(`Created "${name.trim()}" in the exercise library.`);
    autoPushLocalDataToCloud(getLocalDataWithOverrides({ exerciseLibrary: nextExerciseLibrary }), "exercise");
    return true;
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

  const cloudStatusLabel = !isSupabaseConfigured()
    ? "Local"
    : cloudSignedInEmail
      ? "Cloud"
      : isCloudSessionChecked
        ? "Sign In"
        : "Checking";
  const cloudStatusClass = cloudSignedInEmail
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
    : isSupabaseConfigured()
      ? "border-amber-500/20 bg-amber-500/10 text-amber-200"
      : "border-[#6f6d6c]/15 bg-[#6f6d6c]/10 text-stone-350";
  const shouldShowCloudSignIn =
    isSupabaseConfigured() && isCloudSessionChecked && !cloudSignedInEmail && !isCloudSignInDismissed;

  return (
    <div className="h-dvh overflow-hidden bg-black text-[#e0dfd5] font-sans select-none antialiased">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[calc(env(safe-area-inset-top)+1px)] bg-black" />
      <div className="mx-auto flex h-dvh w-full max-w-[480px] flex-col overflow-hidden bg-[#181818] shadow-[0_0_24px_rgba(0,0,0,0.5)] md:border-x md:border-[#2d2729]">
        <header className="sticky top-0 z-50 border-b border-[#2d2729] bg-black px-5 pb-4 pt-[calc(1rem+env(safe-area-inset-top))]">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${cloudSignedInEmail ? "bg-emerald-400" : "bg-[#6f6d6c]"}`} />
                <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                  {cloudSignedInEmail ? "Cloud Sync Active" : "Local First"}
                </span>
              </div>
              <h1 className="mt-1 truncate text-lg font-black tracking-tight text-white">
                SquadLift
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!cloudSignedInEmail && isSupabaseConfigured()) {
                    setIsCloudSignInDismissed(false);
                  } else {
                    setIsDevPanelOpen(true);
                  }
                }}
                className={`flex h-9 items-center justify-center rounded-xl border px-3 text-[9px] font-black uppercase tracking-widest shadow-3d-sm transition ${cloudStatusClass}`}
                title={cloudSignedInEmail ? cloudSignedInEmail : "Cloud sign-in status"}
              >
                {cloudStatusLabel}
              </button>

              <button
                type="button"
                onClick={() => setIsDevPanelOpen(true)}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#6f6d6c]/20 bg-black text-stone-300 shadow-3d-sm transition hover:border-[#6f6d6c]/45 hover:text-white"
                title="Open developer tools"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
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

          <div className="relative z-10 h-full overflow-y-auto overscroll-contain pb-[59px] text-left scrollbar-none">
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

          <nav className="fixed bottom-0 left-1/2 z-[60] flex h-[51px] w-full max-w-[480px] -translate-x-1/2 items-center justify-around border-t border-[#6f6d6c]/15 bg-black px-2 shadow-[0_-6px_18px_rgba(0,0,0,0.45)]">
            <button
              type="button"
              onClick={() => {
                setCurrentTab(1);
                setIsActiveMaximized(false);
              }}
              className={`flex h-10 w-16 flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer ${
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
              className={`flex h-10 w-16 flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer ${
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
              className={`flex h-10 w-16 flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer ${
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
                  Local controls for switching squad roles, backups, and checking the planned Supabase sync path.
                </p>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-stone-500">
                  {APP_BUILD_LABEL} | Data: {initialDataLoad.source}
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
                <div className="flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-[#f7f5f4]">
                    <Database className="h-4 w-4 text-emerald-400" />
                    <span>Cloud Sync</span>
                  </h3>
                  <span className="rounded-full border border-emerald-500/10 bg-emerald-500/10 px-3 py-1 text-[9px] font-black tracking-widest text-emerald-300">
                    AUTO
                  </span>
                </div>

                <p className="mt-2 text-xs leading-relaxed text-stone-400">
                  Sign-in persists on this device. Local saves stay primary; cloud upload and pull run automatically when safe.
                </p>

                <div className="mt-4 grid gap-3">
                  <div className="min-w-0 rounded-xl border border-white/5 bg-black px-3 py-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-stone-500">
                      Auth
                    </p>
                    <p className="mt-1 break-words text-xs font-bold text-stone-250">
                      {cloudAuthStatus}
                    </p>
                  </div>

                  {cloudSignedInEmail ? (
                    <button
                      type="button"
                      onClick={() => void handleCloudSignOut()}
                      disabled={isCloudAuthBusy}
                      className="flex min-h-11 items-center justify-center rounded-xl border border-red-500/20 bg-black px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-200 transition hover:border-red-400/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isCloudAuthBusy ? "Signing Out" : "Sign Out"}
                    </button>
                  ) : (
                    <div className="grid gap-2">
                      <input
                        type="email"
                        value={cloudAuthEmail}
                        onChange={(event) => setCloudAuthEmail(event.target.value)}
                        autoComplete="email"
                        placeholder="Email"
                        className="min-h-11 rounded-xl border border-white/5 bg-black px-3 text-sm font-bold text-stone-100 outline-none transition placeholder:text-stone-600 focus:border-emerald-500/40"
                      />
                      <input
                        type="password"
                        value={cloudAuthPassword}
                        onChange={(event) => setCloudAuthPassword(event.target.value)}
                        autoComplete="current-password"
                        placeholder="Password"
                        className="min-h-11 rounded-xl border border-white/5 bg-black px-3 text-sm font-bold text-stone-100 outline-none transition placeholder:text-stone-600 focus:border-emerald-500/40"
                      />
                      <button
                        type="button"
                        onClick={() => void handleCloudSignIn()}
                        disabled={isCloudAuthBusy || !isSupabaseConfigured()}
                        className="flex min-h-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-black px-4 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-200 transition hover:border-emerald-400/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isCloudAuthBusy ? "Signing In" : "Sign In"}
                      </button>
                    </div>
                  )}

                  <div className="min-w-0 rounded-xl border border-white/5 bg-black px-3 py-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-stone-500">
                      RLS Check
                    </p>
                    <p className="mt-1 break-words text-xs font-bold text-stone-250">
                      {cloudCheckStatus}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleVerifyCloudConnection()}
                    disabled={isCheckingCloud}
                    className="flex min-h-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-black px-4 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-200 transition hover:border-emerald-400/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCheckingCloud ? "Checking" : "Test Cloud"}
                  </button>

                  <div className="min-w-0 rounded-xl border border-white/5 bg-black px-3 py-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-stone-500">
                      Upload
                    </p>
                    <p className="mt-1 break-words text-xs font-bold text-stone-250">
                      {cloudUploadStatus}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleUploadLocalDataToCloud()}
                    disabled={isCloudUploading || !cloudSignedInEmail}
                    className="flex min-h-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-black px-4 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-200 transition hover:border-emerald-400/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCloudUploading ? "Uploading" : "Upload Local"}
                  </button>

                  <div className="min-w-0 rounded-xl border border-white/5 bg-black px-3 py-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-stone-500">
                      Retry Queue
                    </p>
                    <p className="mt-1 break-words text-xs font-bold text-stone-250">
                      {pendingCloudSyncCount} pending | {cloudRetryStatus}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleRetryPendingCloudSync()}
                    disabled={isCloudRetrying || !cloudSignedInEmail || pendingCloudSyncCount === 0}
                    className="flex min-h-11 items-center justify-center rounded-xl border border-amber-500/20 bg-black px-4 py-3 text-[10px] font-black uppercase tracking-widest text-amber-200 transition hover:border-amber-400/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCloudRetrying ? "Retrying" : "Retry Pending"}
                  </button>

                  <div className="min-w-0 rounded-xl border border-white/5 bg-black px-3 py-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-stone-500">
                      Preview
                    </p>
                    <p className="mt-1 break-words text-xs font-bold text-stone-250">
                      {cloudPreviewStatus}
                    </p>
                    {cloudPreview && (
                      <div className="mt-3 grid gap-1.5 text-[10px] font-bold text-stone-400">
                        <span>Latest routine: {cloudPreview.latestRoutineTitle}</span>
                        <span>Latest workout: {cloudPreview.latestWorkoutTitle}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => void handlePreviewCloudData()}
                    disabled={isCloudPreviewing || !cloudSignedInEmail}
                    className="flex min-h-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-black px-4 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-200 transition hover:border-emerald-400/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCloudPreviewing ? "Previewing" : "Preview Cloud"}
                  </button>

                  <div className="min-w-0 rounded-xl border border-white/5 bg-black px-3 py-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-stone-500">
                      Restore
                    </p>
                    <p className="mt-1 break-words text-xs font-bold text-stone-250">
                      {cloudRestoreStatus}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleRestoreLocalDataFromCloud()}
                    disabled={isCloudRestoring || isCloudAutoPulling || !cloudSignedInEmail}
                    className="flex min-h-11 items-center justify-center rounded-xl border border-amber-500/20 bg-black px-4 py-3 text-[10px] font-black uppercase tracking-widest text-amber-200 transition hover:border-amber-400/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCloudRestoring || isCloudAutoPulling ? "Pulling" : "Restore Cloud"}
                  </button>
                </div>
              </section>

              <section className="rounded-2xl border border-[#2d2729] bg-[#121011] p-4 shadow-3d-sm">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-[#f7f5f4]">
                    <Database className="h-4 w-4 text-stone-400" />
                    <span>Local Data Backup</span>
                  </h3>
                  <span className="rounded-full border border-[#6f6d6c]/10 bg-[#6f6d6c]/10 px-3 py-1 text-[9px] font-black tracking-widest text-stone-350">
                    DEVICE ONLY
                  </span>
                </div>

                <p className="mt-2 text-xs leading-relaxed text-stone-400">
                  Export, import, or reset the local demo data stored on this device.
                </p>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handleExportLocalData}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-[#6f6d6c]/15 bg-black px-3 py-3 text-[10px] font-black uppercase tracking-widest text-stone-300 transition hover:border-[#6f6d6c]/40 hover:text-white"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export
                  </button>

                  <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#6f6d6c]/15 bg-black px-3 py-3 text-[10px] font-black uppercase tracking-widest text-stone-300 transition hover:border-[#6f6d6c]/40 hover:text-white">
                    <Upload className="h-3.5 w-3.5" />
                    Import
                    <input
                      type="file"
                      accept="application/json"
                      className="hidden"
                      onChange={(event) => {
                        void handleImportLocalData(event.currentTarget.files?.[0]);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleResetLocalData}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-black px-3 py-3 text-[10px] font-black uppercase tracking-widest text-red-200 transition hover:border-red-400/40 hover:text-white"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset
                  </button>
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

      {shouldShowCloudSignIn && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/88 px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-[calc(env(safe-area-inset-top)+1.25rem)] animate-fade-in">
          <section className="w-full max-w-[430px] rounded-2xl border border-[#2d2729] bg-[#121011] p-5 shadow-3d-md">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-emerald-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                    Cloud Sync
                  </span>
                </div>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
                  Sign in to SquadLift
                </h2>
              </div>
              <span className="rounded-full border border-emerald-500/10 bg-emerald-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-300">
                Auto
              </span>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-stone-350">
              Your workouts save on this device first, then sync with Supabase when your account is signed in.
            </p>

            <div className="mt-5 grid gap-3">
              <input
                type="email"
                value={cloudAuthEmail}
                onChange={(event) => setCloudAuthEmail(event.target.value)}
                autoComplete="email"
                placeholder="Email"
                className="min-h-12 rounded-xl border border-white/5 bg-black px-4 text-base font-bold text-stone-100 outline-none transition placeholder:text-stone-600 focus:border-emerald-500/40"
              />
              <input
                type="password"
                value={cloudAuthPassword}
                onChange={(event) => setCloudAuthPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="Password"
                className="min-h-12 rounded-xl border border-white/5 bg-black px-4 text-base font-bold text-stone-100 outline-none transition placeholder:text-stone-600 focus:border-emerald-500/40"
              />

              <button
                type="button"
                onClick={() => void handleCloudSignIn()}
                disabled={isCloudAuthBusy || !cloudAuthEmail.trim() || !cloudAuthPassword}
                className="flex min-h-12 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-emerald-100 transition hover:border-emerald-400/50 hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {isCloudAuthBusy ? "Signing In" : "Sign In"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsCloudSignInDismissed(true);
                  triggerToast("Continuing in local mode.");
                }}
                className="flex min-h-11 items-center justify-center rounded-xl border border-white/5 bg-black px-4 py-3 text-[10px] font-black uppercase tracking-widest text-stone-400 transition hover:border-white/10 hover:text-white"
              >
                Continue Local
              </button>
            </div>

            <p className="mt-4 break-words text-xs font-bold leading-relaxed text-stone-500">
              {cloudAuthStatus}
            </p>
          </section>
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
