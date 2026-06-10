import { useState, useEffect } from "react";
import { ActiveWorkout, Exercise, LoggedExercise, LoggedSet } from "../types";
import ExerciseImage from "./ExerciseImage";
import { sanitizeReps, sanitizeWeight } from "../utils/workoutValidation";
import {
  Clock,
  Minimize2,
  Maximize2,
  Check,
  Plus,
  Trash2,
  AlertTriangle,
  Dumbbell,
  ChevronUp
} from "lucide-react";

interface ActiveWorkoutOverlayProps {
  activeWorkout: ActiveWorkout;
  exerciseLibrary: Exercise[];
  onCancelWorkout: () => void;
  onFinishWorkout: () => void;
  onSetChecked: (loggedExerciseId: string, setIndex: number, isChecked: boolean) => void;
  onUpdateWorkout: (workout: ActiveWorkout) => void;
  isActiveMaximized: boolean;
  onSetMaximize: (maximize: boolean) => void;
}

export default function ActiveWorkoutOverlay({
  activeWorkout,
  exerciseLibrary,
  onCancelWorkout,
  onFinishWorkout,
  onSetChecked,
  onUpdateWorkout,
  isActiveMaximized,
  onSetMaximize,
}: ActiveWorkoutOverlayProps) {
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [exSearch, setExSearch] = useState("");
  const [selectedBodyPart, setSelectedBodyPart] = useState("All");

  const filteredExercises = exerciseLibrary.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(exSearch.toLowerCase()) ||
                          ex.body_part.toLowerCase().includes(exSearch.toLowerCase());
    const matchesBodyPart = selectedBodyPart === "All" || ex.body_part === selectedBodyPart;
    return matchesSearch && matchesBodyPart;
  });

  // Self-contained running timer representing seconds since activeWorkout.start_time
  useEffect(() => {
    if (!activeWorkout) return;
    const calculateElapsed = () => {
      const startMs = new Date(activeWorkout.start_time).getTime();
      const diffSecs = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      setElapsed(diffSecs);
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeWorkout.start_time]);

  // Helper: Format elapsed duration MM:SS or HH:MM:SS
  const formatTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const ss = secs % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
  };

  const handleTitleChange = (val: string) => {
    onUpdateWorkout({ ...activeWorkout, title: val });
  };

  const handleNotesChange = (val: string) => {
    onUpdateWorkout({ ...activeWorkout, notes: val });
  };

  // Append new exercise movement inline to keep App.tsx clean
  const handleAddNewExercise = (ex: Exercise) => {
    const alreadyAdded = activeWorkout.exercises.some((loggedExercise) => loggedExercise.exercise_id === ex.id);
    if (alreadyAdded) return;

    const newEx: LoggedExercise = {
      id: `le-live-${Date.now()}-${Math.random()}`,
      exercise_id: ex.id,
      order_index: activeWorkout.exercises.length,
      sets: [
        {
          id: `ls-live-${Date.now()}-initial`,
          set_number: 1,
          set_type: "Normal",
          actual_reps: 10,
          actual_weight: 135,
          is_completed: false,
        }
      ]
    };

    onUpdateWorkout({
      ...activeWorkout,
      exercises: [...activeWorkout.exercises, newEx],
    });
    setIsAddingExercise(false);
    setExSearch("");
    setSelectedBodyPart("All");
  };

  const handleRemoveExercise = (idx: number) => {
    if (!window.confirm("Remove this exercise and its sets from the active workout?")) return;

    const updated = [...activeWorkout.exercises];
    updated.splice(idx, 1);
    onUpdateWorkout({
      ...activeWorkout,
      exercises: updated.map((exercise, orderIndex) => ({ ...exercise, order_index: orderIndex })),
    });
  };

  const handleAddSetRow = (exIdx: number) => {
    const targetEx = activeWorkout.exercises[exIdx];
    const prevSet = targetEx.sets[targetEx.sets.length - 1];

    const newSet: LoggedSet = {
      id: `live-set-${Date.now()}-${Math.random()}`,
      set_number: targetEx.sets.length + 1,
      set_type: prevSet ? prevSet.set_type : "Normal",
      actual_weight: prevSet ? prevSet.actual_weight : 135,
      actual_reps: prevSet ? prevSet.actual_reps : 10,
      is_completed: false,
    };

    const updated = [...activeWorkout.exercises];
    updated[exIdx] = {
      ...targetEx,
      sets: [...targetEx.sets, newSet],
    };

    onUpdateWorkout({ ...activeWorkout, exercises: updated });
  };

  const handleRemoveSetRow = (exIdx: number, sIdx: number) => {
    const targetEx = activeWorkout.exercises[exIdx];
    const updatedSets = [...targetEx.sets];
    updatedSets.splice(sIdx, 1);

    // Re-index set numbers
    const finalSets = updatedSets.map((s, idx) => ({ ...s, set_number: idx + 1 }));

    const updated = [...activeWorkout.exercises];
    updated[exIdx] = {
      ...targetEx,
      sets: finalSets,
    };

    onUpdateWorkout({ ...activeWorkout, exercises: updated });
  };

  const handleSetFieldChange = (
    exIdx: number,
    sIdx: number,
    field: "set_type" | "actual_weight" | "actual_reps",
    value: any
  ) => {
    const targetEx = activeWorkout.exercises[exIdx];
    const targetSets = [...targetEx.sets];
    const targetSet = { ...targetSets[sIdx] };

    if (field === "set_type") {
      targetSet.set_type = value as string;
    } else if (field === "actual_weight") {
      targetSet.actual_weight = sanitizeWeight(value);
    } else if (field === "actual_reps") {
      targetSet.actual_reps = sanitizeReps(value);
    }

    targetSets[sIdx] = targetSet;

    const updatedExercises = [...activeWorkout.exercises];
    updatedExercises[exIdx] = {
      ...targetEx,
      sets: targetSets,
    };

    onUpdateWorkout({ ...activeWorkout, exercises: updatedExercises });
  };

  // Calculate current volume representing checked-off sets
  const calculatedLiveVolume = activeWorkout.exercises.reduce((vSum, ex) => {
    return (
      vSum +
      ex.sets.reduce((sSum, s) => {
        return s.is_completed ? sSum + Number(s.actual_weight) * Number(s.actual_reps) : sSum;
      }, 0)
    );
  }, 0);

  // Lookup exercise detail
  const lookupExDetail = (exId: string): Exercise => {
    return exerciseLibrary.find((e) => e.id === exId) || { id: "unknown", name: "Unknown Movement", body_part: "Chest", category: "Other", is_custom: false };
  };

  // Render minimized ribbon
  if (!isActiveMaximized) {
    const firstEx = activeWorkout.exercises[0];
    const activeExerciseName = firstEx ? lookupExDetail(firstEx.exercise_id).name : "Empty Workout";

    return (
      <>
        <div 
          id="active-minimized-ribbon"
          className="absolute bottom-[80px] left-1/2 transform -translate-x-1/2 w-[calc(100%-1.25rem)] max-w-sm z-40 bg-[#121011] border border-[#2d2729] text-stone-100 px-3.5 py-3.5 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.55)] hover:border-[#6f6d6c]/30 hover:shadow-3d-lg transition-all duration-300 hover:-translate-y-0.5 cursor-pointer flex items-center justify-between font-sans"
          onClick={() => onSetMaximize(true)}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Left ChevronUp to maximize */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSetMaximize(true);
              }}
              className="p-1 text-stone-400 hover:text-white transition cursor-pointer"
              title="Maximize Workout"
            >
              <ChevronUp className="w-5 h-5 stroke-[2.5px]" />
            </button>

            {/* Glowing signal and text info */}
            <div className="flex items-center gap-1.5 min-w-0 text-left">
              <span className="relative flex h-2 w-2 min-w-[8px]">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 font-extrabold"></span>
              </span>
              <p className="text-[11.5px] font-bold text-stone-250 truncate">
                Workout {formatTime(elapsed)}, <span className="text-stone-450 font-medium">{activeExerciseName}</span>
              </p>
            </div>
          </div>

          {/* Right discard trashcan icon */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowConfirmCancel(true);
            }}
            className="p-2 text-stone-400 hover:text-red-500 transition cursor-pointer"
            title="Discard session"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Cancel Discard Confirmation Modal */}
        {showConfirmCancel && (
          <div className="absolute inset-0 z-55 flex items-center justify-center p-4 bg-black/85 animate-fade-in text-left font-sans">
            <div className="w-full max-w-sm bg-[#222222] border border-red-500/20 rounded-3xl p-6.5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-4.5">
              <div className="w-11 h-11 bg-rose-500/15 rounded-full flex items-center justify-center mx-auto text-[#ef4444]">
                <AlertTriangle className="w-5 h-5 opacity-75" />
              </div>
              <div className="space-y-1.5 text-center">
                <h4 className="text-[15px] font-bold text-stone-100">Discard Current Session?</h4>
                <p className="text-[13px] text-stone-300 leading-relaxed">
                  Are you sure you want to stop? All typed set records and calculated volume stats in this workout session will be lost forever.
                </p>
              </div>
              <div className="flex gap-2.5 pt-1.5">
                <button
                  type="button"
                  onClick={() => setShowConfirmCancel(false)}
                  className="flex-1 bg-black/40 hover:bg-black/70 text-[11px] font-black uppercase tracking-widest py-2.5 rounded-xl text-stone-400 transition cursor-pointer border border-[#6f6d6c]/20"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmCancel(false);
                    onCancelWorkout();
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black text-[11px] uppercase tracking-widest py-2.5 rounded-xl transition cursor-pointer shadow-3d-sm"
                >
                  Discard Workout
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Render maxed full sheet
  return (
    <div id="active-maximized-sheet" className="absolute inset-0 z-50 bg-[#181818] overflow-y-auto flex flex-col justify-start animate-fade-in scrollbar-thin font-sans">
      <div className="w-full bg-[#181818] pb-24 flex flex-col relative text-stone-100">
        
        {/* Absolute Top header bar */}
        <div className="sticky top-0 bg-black/95 px-4 py-4.5 border-b border-[#6f6d6c]/15 flex items-center justify-between z-10">
          <button
            onClick={() => onSetMaximize(false)}
            className="flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-stone-400 hover:text-white transition cursor-pointer"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Minimize</span>
          </button>

          <div className="text-center">
            <div className="text-[9px] uppercase font-black text-stone-405 tracking-widest">Active Tracker</div>
            <div className="text-[13px] font-mono font-black text-stone-300 flex items-center gap-1 justify-center mt-0.5">
              <Clock className="w-3.5 h-3.5 text-[#6f6d6c] animate-pulse" />
              <span>{formatTime(elapsed)}</span>
            </div>
          </div>

          <button
            onClick={onFinishWorkout}
            className="bg-[#6f6d6c] hover:bg-[#868382] text-white font-black text-[11px] tracking-widest uppercase px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition shadow-3d-sm cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 stroke-[3px]" />
            <span>Finish</span>
          </button>
        </div>

        {/* Content body wrapper */}
        <div className="px-5 py-5 space-y-6 flex-1 text-left">
          
          {/* Quick Active info header card */}
          <div className="bg-black border border-[#6f6d6c]/15 p-4 rounded-2xl space-y-4.5 shadow-3d-sm">
            <div>
              <label className="block text-[9px] uppercase font-black text-stone-400 tracking-widest mb-1.5">
                Session Title
              </label>
              <input
                type="text"
                placeholder="Morning Workout Title..."
                value={activeWorkout.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full bg-black border border-[#6f6d6c]/15 rounded-xl px-3.5 py-3 text-[13px] font-bold text-stone-100 focus:outline-none focus:border-[#6f6d6c]/50 shadow-inner"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase font-black text-stone-400 tracking-widest mb-1.5">
                Private Shared Comments
              </label>
              <textarea
                placeholder="Add session comments, goals, or motivation..."
                value={activeWorkout.notes || ""}
                onChange={(e) => handleNotesChange(e.target.value)}
                rows={2}
                className="w-full bg-black border border-[#6f6d6c]/15 rounded-xl px-3.5 py-2.5 text-[13px] text-stone-300 placeholder-stone-605 focus:outline-none focus:border-[#6f6d6c]/50 shadow-inner"
              />
            </div>

            {/* Live Stats indicator row */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-black px-3 py-2 rounded-xl text-center border border-[#6f6d6c]/15">
                <span className="text-[9px] text-stone-450 uppercase tracking-widest font-black">Group Volume</span>
                <p className="font-mono text-[15px] font-black text-stone-200 mt-1">
                  {calculatedLiveVolume.toLocaleString()} <span className="text-[10px] text-stone-400 font-normal font-sans uppercase">kg</span>
                </p>
              </div>
              <div className="bg-black px-3 py-2 rounded-xl text-center border border-[#6f6d6c]/15">
                <span className="text-[9px] text-stone-450 uppercase tracking-widest font-black">Efficiency</span>
                <p className="font-mono text-[13px] font-bold text-stone-300 mt-1">
                  {Math.round(calculatedLiveVolume / 50 || 0)} kg/m
                </p>
              </div>
            </div>
          </div>

          {/* Render Exercises lists */}
          <div className="space-y-6">
            {activeWorkout.exercises.map((le, exIdx) => {
              const info = lookupExDetail(le.exercise_id);
              return (
                <div key={le.id} className="bg-black border border-[#6f6d6c]/15 rounded-2xl p-4.5 space-y-4.5 shadow-3d-sm">
                  
                  {/* Workout Header */}
                  <div className="flex items-center justify-between border-b border-[#6f6d6c]/10 pb-3">
                    <div className="flex items-center gap-3">
                      <ExerciseImage exercise={info} className="w-10 h-10" />
                      <div className="text-left">
                        <span className="text-[9px] text-stone-300 font-bold uppercase tracking-widest bg-[#6f6d6c]/15 px-2 py-0.5 rounded border border-[#6f6d6c]/20">
                          Movement {exIdx + 1}
                        </span>
                        <h4 className="text-[13px] font-black text-stone-100 mt-1">{info.name}</h4>
                        <p className="text-[10px] text-[#8e8d8d] font-mono mt-0.5 tracking-wide font-black uppercase">{info.body_part}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveExercise(exIdx)}
                      className="text-stone-500 hover:text-rose-455 p-2.5 rounded-xl hover:bg-black transition-all cursor-pointer"
                      title="Remove exercise movement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Sets Table Layout */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#6f6d6c]/10 text-[9px] text-[#8e8d8d] uppercase tracking-widest font-black">
                          <th className="py-2 pl-1 w-10">Set</th>
                          <th className="py-2 w-14">Type</th>
                          <th className="py-2 text-center w-18">kg</th>
                          <th className="py-2 text-center w-18">reps</th>
                          <th className="py-2 pr-1 text-center w-12">Tick</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#6f6d6c]/10">
                        {le.sets.map((set, sIdx) => (
                          <tr
                            key={set.id}
                            className={`transition-all duration-155 ${
                              set.is_completed
                                ? "bg-emerald-500/12 shadow-[inset_3px_0_0_rgba(52,211,153,0.75)]"
                                : ""
                            }`}
                          >
                            {/* Set Number tag */}
                            <td className={`py-2.5 pl-1 font-mono text-[13px] font-black ${
                              set.is_completed ? "text-emerald-200" : "text-stone-550"
                            }`}>
                              {sIdx + 1}
                            </td>

                            {/* Set Type Dropdown Selector */}
                            <td className="py-1">
                              <select
                                value={set.set_type}
                                onChange={(e) =>
                                  handleSetFieldChange(exIdx, sIdx, "set_type", e.target.value)
                                }
                                className={`text-[10px] font-bold uppercase border rounded-lg py-1 px-1 focus:outline-none font-sans ${
                                  set.is_completed
                                    ? "bg-emerald-950/40 text-emerald-100 border-emerald-500/25 focus:border-emerald-400/50"
                                    : "bg-black text-stone-300 border-[#6f6d6c]/15 focus:border-[#6f6d6c]/40"
                                }`}
                              >
                                <option value="Normal">N</option>
                                <option value="Warmup">W</option>
                                <option value="Drop">D</option>
                                <option value="Failure">F</option>
                              </select>
                            </td>

                            {/* Weight entry field */}
                            <td className="py-1 text-center font-mono">
                              <input
                                type="number"
                                value={set.actual_weight}
                                onChange={(e) =>
                                  handleSetFieldChange(
                                    exIdx,
                                    sIdx,
                                    "actual_weight",
                                    Number(e.target.value)
                                  )
                                }
                                className={`w-13 font-mono text-[13px] text-center font-black border rounded-lg py-1 px-0.5 focus:outline-none ${
                                  set.is_completed
                                    ? "bg-emerald-950/40 text-emerald-50 border-emerald-500/25 focus:border-emerald-400/50"
                                    : "bg-black text-stone-200 border-[#6f6d6c]/15 focus:border-[#6f6d6c]/50"
                                }`}
                              />
                            </td>

                            {/* Reps input field */}
                            <td className="py-1 text-center">
                              <input
                                type="number"
                                value={set.actual_reps}
                                onChange={(e) =>
                                  handleSetFieldChange(
                                    exIdx,
                                    sIdx,
                                    "actual_reps",
                                    Number(e.target.value)
                                  )
                                }
                                className={`w-11 font-mono text-[13px] text-center font-black border rounded-lg py-1 px-0.5 focus:outline-none ${
                                  set.is_completed
                                    ? "bg-emerald-950/40 text-emerald-50 border-emerald-500/25 focus:border-emerald-400/50"
                                    : "bg-black text-stone-200 border-[#6f6d6c]/15 focus:border-[#6f6d6c]/50"
                                }`}
                              />
                            </td>

                            {/* Completion Checkmark trigger */}
                            <td className="py-1 text-center font-sans">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => onSetChecked(le.id, sIdx, !set.is_completed)}
                                  className={`w-5.5 h-5.5 rounded-lg flex items-center justify-center transition-all border cursor-pointer ${
                                    set.is_completed
                                      ? "bg-emerald-500/85 border-emerald-300/70 text-black font-black shadow-[0_0_14px_rgba(16,185,129,0.35)] hover:scale-105"
                                      : "bg-black border-[#6f6d6c]/20 hover:border-[#6f6d6c]/40 text-stone-500"
                                  }`}
                                >
                                  <Check className="w-3 h-3 stroke-[3.5px]" />
                                </button>

                                {/* Delete single set row button */}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSetRow(exIdx, sIdx)}
                                  className="text-stone-500 hover:text-rose-455 text-[11px] font-black w-4 h-4 flex items-center justify-center rounded hover:bg-black cursor-pointer"
                                  title="Delete set row"
                                >
                                  ×
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Set button */}
                  <button
                    onClick={() => handleAddSetRow(exIdx)}
                    className="w-full bg-black hover:bg-stone-900 text-[10px] font-black uppercase tracking-widest text-[#a3a3a6] hover:text-white py-2.5 rounded-xl border border-white/5 flex items-center justify-center gap-1 transition-all cursor-pointer shadow-3d-sm"
                  >
                    <Plus className="w-3.5 h-3.5 text-stone-500" />
                    <span>Add Set Row</span>
                  </button>
                </div>
              );
            })}

            {activeWorkout.exercises.length === 0 && (
              <div className="p-8 text-center bg-black rounded-2xl border border-dashed border-[#6f6d6c]/20 text-stone-500">
                <Dumbbell className="w-8 h-8 text-[#6f6d6c] mx-auto mb-2" />
                <p className="text-[13px] font-semibold">No movements added in this session yet.</p>
                <p className="text-[11px] text-stone-550 mt-1 font-mono">Tap Add Exercise below to fetch your gym pool!</p>
              </div>
            )}
          </div>

          {/* Dialog list overlay trigger to Add movements */}
          <div className="pt-2 flex flex-col gap-3">
            <button
              onClick={() => setIsAddingExercise(!isAddingExercise)}
              className="w-full bg-black hover:bg-stone-900 border border-[#6f6d6c]/20 text-stone-200 text-[11px] font-black uppercase tracking-widest py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-inner"
            >
              <Plus className="w-4 h-4 stroke-[2.5px] text-[#6f6d6c]" />
              <span>Add Exercise Movement</span>
            </button>

            {isAddingExercise && (
              <div className="bg-black border border-[#6f6d6c]/15 rounded-2xl p-4.5 space-y-3.5 animate-fade-in shadow-3d-md">
                <div className="text-[10px] text-[#8e8d8d] font-black uppercase tracking-widest flex items-center justify-between font-sans">
                  <span>Squad Shared Pool library</span>
                  <button onClick={() => { setIsAddingExercise(false); setExSearch(""); setSelectedBodyPart("All"); }} className="text-stone-500 hover:text-white p-1">✕</button>
                </div>
                
                {/* Search Input field */}
                <input
                  type="text"
                  placeholder="Search by name or muscle..."
                  value={exSearch}
                  onChange={(e) => setExSearch(e.target.value)}
                  className="w-full bg-black border border-[#6f6d6c]/25 rounded-xl px-3 py-2 text-[13px] text-stone-100 placeholder-stone-600 focus:outline-none focus:border-[#6f6d6c]/50 font-sans shadow-inner"
                />

                {/* Muscle pills */}
                <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar select-none">
                  {["All", "Chest", "Legs", "Back", "Shoulders", "Arms", "Core"].map((bp) => (
                    <button
                      key={bp}
                      type="button"
                      onClick={() => setSelectedBodyPart(bp)}
                      className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full transition-all cursor-pointer flex-shrink-0 ${
                        selectedBodyPart === bp
                          ? "bg-[#6f6d6c] text-white border border-[#868382]/30"
                          : "bg-black text-stone-400 hover:text-stone-200 border border-[#6f6d6c]/15"
                      }`}
                    >
                      {bp}
                    </button>
                  ))}
                </div>

                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                  {filteredExercises.map((ex) => {
                    const isAlreadyAdded = activeWorkout.exercises.some((loggedExercise) => loggedExercise.exercise_id === ex.id);

                    return (
                    <button
                      key={ex.id}
                      type="button"
                      disabled={isAlreadyAdded}
                      onClick={() => {
                        handleAddNewExercise(ex);
                      }}
                      className="w-full text-left bg-black px-3.5 py-3 rounded-xl text-[13px] text-stone-200 hover:bg-stone-900 hover:border-[#6f6d6c]/30 hover:text-stone-100 transition border border-white/5 flex items-center justify-between cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span className="font-bold text-[12px]">{ex.name}</span>
                      <span className="text-[9px] bg-black text-stone-400 px-2 py-0.5 rounded font-mono font-black uppercase">
                        {isAlreadyAdded ? "Added" : ex.body_part}
                      </span>
                    </button>
                    );
                  })}
                  {filteredExercises.length === 0 && (
                    <div className="p-4 text-center text-stone-500 text-[11px]">
                      No exercises found
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cancel Discard button */}
            <button
              onClick={() => {
                if (activeWorkout.exercises.length > 0) {
                  setShowConfirmCancel(true);
                } else {
                  onCancelWorkout();
                }
              }}
              className="w-full bg-rose-505/5 hover:bg-rose-500/10 border border-rose-505/10 text-rose-500 text-[11px] font-black uppercase tracking-widest py-3.5 rounded-xl transition-all cursor-pointer shadow-3d-sm"
            >
              Discard Session
            </button>
          </div>
        </div>

        {/* Cancel Discard Confirmation Modal */}
        {showConfirmCancel && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/85 animate-fade-in text-left font-sans">
            <div className="w-full max-w-sm bg-[#222222] border border-red-500/20 rounded-3xl p-6.5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-4.5">
              <div className="w-11 h-11 bg-rose-500/15 rounded-full flex items-center justify-center mx-auto text-rose-500">
                <AlertTriangle className="w-5 h-5 opacity-75" />
              </div>
              <div className="space-y-1.5 text-center">
                <h4 className="text-[15px] font-bold text-stone-100">Discard Current Session?</h4>
                <p className="text-[13px] text-stone-300 leading-relaxed">
                  Are you sure you want to stop? All typed set records and calculated volume stats in this workout session will be lost forever.
                </p>
              </div>
              <div className="flex gap-2.5 pt-1.5">
                <button
                  type="button"
                  onClick={() => setShowConfirmCancel(false)}
                  className="flex-1 bg-black/40 hover:bg-black/70 text-[11px] font-black uppercase tracking-widest py-2.5 rounded-xl text-stone-400 transition cursor-pointer border border-[#6f6d6c]/20"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmCancel(false);
                    onCancelWorkout();
                  }}
                  className="flex-1 bg-red-650 hover:bg-red-500 text-white font-black text-[11px] uppercase tracking-widest py-2.5 rounded-xl transition cursor-pointer shadow-3d-sm"
                >
                  Discard Workout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
