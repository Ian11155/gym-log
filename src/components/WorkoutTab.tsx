import { useState } from "react";
import { Routine, Exercise, SQUAD_USERS } from "../types";
import ExerciseImage from "./ExerciseImage";
import { sanitizeReps, sanitizeWeight } from "../utils/workoutValidation";
import { Play, Clipboard, Compass, Plus, X, Command, Trash2, Edit2, BadgeAlert, Sparkles, Sliders } from "lucide-react";

interface WorkoutTabProps {
  activeUserId: string;
  routines: Routine[];
  exerciseLibrary: Exercise[];
  onStartEmptyWorkout: () => void;
  onLaunchRoutine: (routine: Routine) => void;
  onSaveRoutine: (newRoutine: Routine) => void;
  onDeleteRoutine: (routineId: string) => void;
  onSwitchToLibrary: () => void;
}

export default function WorkoutTab({
  activeUserId,
  routines,
  exerciseLibrary,
  onStartEmptyWorkout,
  onLaunchRoutine,
  onSaveRoutine,
  onDeleteRoutine,
  onSwitchToLibrary,
}: WorkoutTabProps) {
  const [showBanner, setShowBanner] = useState(true);
  
  // Custom Routine Creator State
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newRoutineExs, setNewRoutineExs] = useState<{
    exercise_id: string;
    sets: {
      set_number: number;
      set_type: string;
      target_reps: number;
      target_weight: number;
    }[];
  }[]>([]);

  // Search filter for list of exercises to add to the new routine template
  const [exSearch, setExSearch] = useState("");
  const [showExPicker, setShowExPicker] = useState(false);
  const [selectedBodyPart, setSelectedBodyPart] = useState("All");

  // Filter exercises
  const filteredExercises = exerciseLibrary.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(exSearch.toLowerCase()) || 
                          ex.body_part.toLowerCase().includes(exSearch.toLowerCase());
    const matchesBodyPart = selectedBodyPart === "All" || ex.body_part === selectedBodyPart;
    return matchesSearch && matchesBodyPart;
  });

  // Helper inside creator: Add exercise
  const handleAddExToTemplate = (exId: string) => {
    if (newRoutineExs.some((routineExercise) => routineExercise.exercise_id === exId)) return;

    setNewRoutineExs(prev => [
      ...prev,
      {
        exercise_id: exId,
        sets: [
          { set_number: 1, set_type: "Normal", target_reps: 10, target_weight: 135 }
        ]
      }
    ]);
    setShowExPicker(false);
    setExSearch("");
    setSelectedBodyPart("All");
  };

  // Helper inside creator: Add set
  const handleAddSetToEx = (exIdx: number) => {
    const updated = [...newRoutineExs];
    const target = updated[exIdx];
    const prevSet = target.sets[target.sets.length - 1];
    
    target.sets.push({
      set_number: target.sets.length + 1,
      set_type: prevSet ? prevSet.set_type : "Normal",
      target_reps: prevSet ? prevSet.target_reps : 10,
      target_weight: prevSet ? prevSet.target_weight : 135,
    });
    setNewRoutineExs(updated);
  };

  const handleRemoveSetFromEx = (exIdx: number, setIdx: number) => {
    const updated = [...newRoutineExs];
    updated[exIdx].sets.splice(setIdx, 1);
    // Re-index
    updated[exIdx].sets = updated[exIdx].sets.map((s, idx) => ({ ...s, set_number: idx + 1 }));
    setNewRoutineExs(updated);
  };

  const handleUpdateTemplateSetField = (
    exIdx: number,
    setIdx: number,
    field: "set_type" | "target_reps" | "target_weight",
    value: any
  ) => {
    const updated = [...newRoutineExs];
    const targetSet = updated[exIdx].sets[setIdx];
    if (field === "set_type") {
      targetSet.set_type = value as string;
    } else if (field === "target_reps") {
      targetSet.target_reps = sanitizeReps(value);
    } else if (field === "target_weight") {
      targetSet.target_weight = sanitizeWeight(value);
    }
    setNewRoutineExs(updated);
  };

  const handleRemoveExFromTemplate = (exIdx: number) => {
    const updated = [...newRoutineExs];
    updated.splice(exIdx, 1);
    setNewRoutineExs(updated);
  };

  const handleSaveRoutineClick = () => {
    if (!newTitle.trim()) return;
    const cleanedExercises = newRoutineExs
      .map((exercise) => ({
        ...exercise,
        sets: exercise.sets
          .map((set, index) => ({
            ...set,
            set_number: index + 1,
            target_reps: sanitizeReps(set.target_reps),
            target_weight: sanitizeWeight(set.target_weight),
          }))
          .filter((set) => set.target_reps > 0 && set.target_weight >= 0),
      }))
      .filter((exercise) => exercise.sets.length > 0);

    if (cleanedExercises.length === 0) return;
    
    const createdObj: Routine = {
      id: `rt-user-created-${Date.now()}`,
      user_id: activeUserId,
      title: newTitle.trim(),
      notes: newNotes.trim() || "Custom Workout Routine",
      created_at: new Date().toISOString(),
      exercises: cleanedExercises,
    };

    onSaveRoutine(createdObj);

    // Reset State
    setNewTitle("");
    setNewNotes("");
    setNewRoutineExs([]);
    setIsCreatorOpen(false);
  };

  // Lookup Exercise Name
  const cleanExerciseName = (exId: string) => {
    const ex = exerciseLibrary.find(e => e.id === exId);
    return ex ? ex.name.split(" (")[0] : "Movement";
  };

  const getFullExerciseName = (exId: string) => {
    const ex = exerciseLibrary.find(e => e.id === exId);
    return ex ? ex.name : "Movement";
  };

  return (
    <div id="workout-dashboard-tab" className="px-5 py-4 space-y-5">
      
      {/* Header bar mimicking JPG 2: "Workout v" with yellow PRO badge */}
      <div className="flex items-center justify-between pt-1 pb-1">
        <div className="flex items-center gap-1.5">
          <h2 className="text-xl font-bold font-sans tracking-tight text-white">Workout</h2>
          <span className="text-[11px] bg-stone-900/40 p-1 text-stone-400 rounded-lg cursor-pointer">▼</span>
        </div>
        <span className="bg-yellow-500 text-black text-[10px] font-black uppercase px-2 py-1 rounded-md tracking-wider shadow-inner">
          PRO
        </span>
      </div>

      {/* Start Empty Workout Button */}
      <button
        onClick={onStartEmptyWorkout}
        className="w-full bg-[#141414] hover:bg-[#1f1f1f] active:translate-y-0.5 text-white font-sans font-bold text-[13px] py-4 px-4 rounded-xl border border-[#6f6d6c]/25 flex items-center justify-center gap-2 transition shadow-3d-sm cursor-pointer hover:border-[#6f6d6c]/40"
      >
        <span className="stroke-[3px] text-stone-300 font-black">+</span>
        <span>Start Empty Workout</span>
      </button>

      {/* Routines Label header with '+' button next to it */}
      <div className="flex items-center justify-between pt-1 border-b border-[#2d2729] pb-2">
        <h3 className="text-[13px] font-bold text-stone-300 tracking-wide uppercase font-mono">Routines</h3>
        <button
          onClick={() => {
            setIsCreatorOpen(true);
            setNewRoutineExs([]);
          }}
          className="p-1 px-1.5 bg-[#141414] border border-[#6f6d6c]/20 hover:border-[#6f6d6c]/45 rounded-lg text-stone-300 hover:text-white cursor-pointer transition"
          title="Create Custom Routine"
        >
          <Plus className="w-4 h-4 stroke-[2.5px]" />
        </button>
      </div>

      {/* Quick Launch & Explorer buttons block */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => {
            setIsCreatorOpen(true);
            setNewRoutineExs([]);
          }}
          className="bg-[#141414] hover:bg-[#1f1f1f] border border-[#6f6d6c]/15 p-3 rounded-xl flex items-center gap-2.5 transition cursor-pointer"
        >
          <div className="w-9 h-9 bg-stone-500/10 rounded-lg flex items-center justify-center text-[#6f6d6c]">
            <Clipboard className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="text-[11px] font-black uppercase text-stone-200 block">New Routine</span>
            <span className="text-[8.5px] text-stone-550 uppercase font-mono mt-0.5 tracking-wider block">PREPARATION</span>
          </div>
        </button>

        <button
          onClick={onSwitchToLibrary}
          className="bg-[#141414] hover:bg-[#1f1f1f] border border-[#6f6d6c]/15 p-3 rounded-xl flex items-center gap-2.5 transition cursor-pointer"
        >
          <div className="w-9 h-9 bg-stone-500/10 rounded-lg flex items-center justify-center text-stone-400">
            <Compass className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="text-[11px] font-black uppercase text-stone-200 block">Explore</span>
            <span className="text-[8.5px] text-stone-550 uppercase font-mono mt-0.5 tracking-wider block">GYM MOVEMENTS</span>
          </div>
        </button>
      </div>

      {/* Press and hold a routine to reorder: Gold Yellow Warning Bar from JPG */}
      {showBanner && (
        <div className="bg-[#fef8e2] border border-yellow-250/30 p-2.5 rounded-xl flex items-center justify-between text-left shadow-3d-sm relative">
          <div className="flex items-center gap-2 pr-4">
            <span className="text-lg">👇</span>
            <p className="text-[11px] font-bold text-yellow-800 leading-tight">
              Press and hold a routine template card to reorder list settings
            </p>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="text-yellow-750 hover:text-yellow-950 p-1 rounded-md transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Save Routines Accordion Menu */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-[#a3a3a6]">
          <span>▼ My Routines ({routines.length})</span>
        </div>

        {/* Dynamic Routines Loop cards */}
        <div className="space-y-4">
          {routines.map((routine) => {
            const exNamesLine = routine.exercises.map(re => cleanExerciseName(re.exercise_id)).join(", ");
            const totalSets = routine.exercises.reduce((acc, current) => acc + current.sets.length, 0);

            return (
              <div
                key={routine.id}
                className="bg-[#121011] border border-[#2d2729] rounded-2xl p-4.5 space-y-4 shadow-3d-sm text-left hover:border-[#6f6d6c]/15 transition duration-300"
              >
                {/* Routine Card Header */}
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-3">
                    <h4 className="text-[13px] font-black text-[#f7f5f4]">
                      {routine.title}
                    </h4>
                    {/* List of exercises comma-separated */}
                    <p className="text-[11.5px] text-stone-450 mt-1 lines-clamp-3 leading-relaxed">
                      {exNamesLine || "No exercises configured in template."}
                    </p>

                    {/* Tiny row of circular preview icons of the routine exercises */}
                    {routine.exercises.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-3">
                        {routine.exercises.map((re, rIdx) => {
                          const ex = exerciseLibrary.find(e => e.id === re.exercise_id);
                          return <ExerciseImage key={re.exercise_id + "-" + rIdx} exercise={ex} className="w-5.5 h-5.5 border-stone-850" />;
                        })}
                      </div>
                    )}

                    <span className="inline-block mt-3 bg-[#1c181a] border border-[#2d2729] text-[10px] font-mono text-stone-400 px-2 py-0.5 rounded font-black tracking-wider uppercase">
                      {routine.exercises.length} Exercises • {totalSets} Sets
                    </span>
                  </div>

                  {/* Delete Routine Trash Action Button if user created one */}
                  <button
                    onClick={() => onDeleteRoutine(routine.id)}
                    className="text-stone-605 hover:text-red-500 p-2 rounded-lg hover:bg-stone-900/40 transition cursor-pointer"
                    title="Delete Routine"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Big Blue Start Routine Button inside the card mirroring Hevy image! */}
                <button
                  onClick={() => onLaunchRoutine(routine)}
                  className="w-full bg-[#007aff] hover:bg-[#1a85fe] active:translate-y-0.5 text-white text-[11.5px] font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-[0_4px_12px_rgba(0,122,255,0.25)]"
                >
                  <Play className="w-3.5 h-3.5 fill-current stroke-none" />
                  <span>Start Routine</span>
                </button>
              </div>
            );
          })}

          {/* Dotted dashed add routine card mirroring outline in JPG */}
          <div
            onClick={() => {
              setIsCreatorOpen(true);
              setNewRoutineExs([]);
            }}
            className="border border-dashed border-[#6f6d6c]/25 rounded-2xl p-6 text-center text-stone-450 hover:text-white hover:border-[#6f6d6c]/45 bg-stone-900/10 cursor-pointer transition duration-300"
          >
            <span className="text-stone-400 stroke-[3px] font-black mr-1">+</span>
            <span className="text-[13px] font-bold leading-normal">Add new routine</span>
          </div>
        </div>
      </div>

       {/* FULLSCREEN CUSTOM ROUTINE CREATION DIALOG (Highly interactive Studio Builder) */}
      {isCreatorOpen && (
        <div className="fixed inset-0 z-55 bg-black/90 overflow-y-auto flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="w-full max-w-sm bg-[#171717] border border-[#6f6d6c]/30 rounded-3xl shadow-3d-md p-6 space-y-4.5 text-stone-100 text-left animate-slide-up scrollbar-thin max-h-[92vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#2d2729] pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4.5 h-4.5 text-[#6f6d6c]" />
                <h4 className="text-[15px] font-black uppercase tracking-widest text-[#f7f5f4]">New Routine Draft</h4>
              </div>
              <button
                onClick={() => setIsCreatorOpen(false)}
                className="text-stone-500 hover:text-white p-1 rounded-full hover:bg-[#242022] transition cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Inputs Block */}
            <div className="space-y-3.5 text-left">
              <div>
                <label className="block text-[9px] uppercase font-black text-stone-400 tracking-widest mb-1.5">
                  Routine Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chest Day B (Smith Focus)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#6f6d6c] border border-white/10 rounded-xl px-3.5 py-2.5 text-[13px] text-white placeholder-stone-250 font-bold focus:outline-none focus:border-white/30 shadow-inner"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase font-black text-stone-400 tracking-widest mb-1.5">
                  Routine Focus Memo
                </label>
                <textarea
                  placeholder="e.g. 5x5 compound strength, focus on explosive pull"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-[#6f6d6c] border border-white/10 rounded-xl px-3.5 py-2 text-[13px] text-white placeholder-stone-250 focus:outline-none focus:border-white/30 shadow-inner"
                />
              </div>
            </div>

            {/* Added exercises templates list */}
            <div className="space-y-4">
              <span className="block text-[9px] uppercase font-black text-stone-400 tracking-widest border-b border-[#2d2729] pb-1.5">
                Target Exercises ({newRoutineExs.length})
              </span>

              <div className="space-y-3 max-h-75 overflow-y-auto pr-1 scrollbar-thin">
                {newRoutineExs.map((rte, idx) => (
                  <div key={idx} className="bg-[#242022] p-3 rounded-xl border border-[#6f6d6c]/15 relative">
                    
                    <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                       <div className="flex items-center gap-2 min-w-0 pr-4">
                        <ExerciseImage exercise={exerciseLibrary.find(e => e.id === rte.exercise_id)} className="w-7 h-7 flex-shrink-0" />
                        <span className="text-[11px] font-black text-[#f7f5f4] truncate">
                          {idx + 1}. {getFullExerciseName(rte.exercise_id)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveExFromTemplate(idx)}
                        className="text-stone-500 hover:text-red-405 text-[13px] font-black p-0.5"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Sets Editor Table */}
                    <table className="w-full text-left text-[10px]">
                      <thead>
                        <tr className="text-[#8e8d8d] uppercase tracking-wider font-extrabold pb-1">
                          <th className="w-8">Set</th>
                          <th className="w-16">Type</th>
                          <th className="text-center w-14">target kg</th>
                          <th className="text-center w-14">target reps</th>
                          <th className="w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {rte.sets.map((set, sIdx) => (
                          <tr key={sIdx} className="border-t border-[#1c181a]/55">
                            <td className="py-1 font-mono font-bold text-stone-550">{sIdx + 1}</td>
                            <td className="py-1">
                              <select
                                value={set.set_type}
                                onChange={(e) => handleUpdateTemplateSetField(idx, sIdx, "set_type", e.target.value)}
                                className="bg-[#1c181a] text-[10px] text-stone-300 font-bold border border-white/5 rounded py-0.5 px-1 focus:outline-none"
                              >
                                <option value="Normal">N</option>
                                <option value="Warmup">W</option>
                                <option value="Drop">D</option>
                                <option value="Failure">F</option>
                              </select>
                            </td>
                            <td className="py-1 text-center font-mono">
                              <input
                                type="number"
                                value={set.target_weight}
                                onChange={(e) => handleUpdateTemplateSetField(idx, sIdx, "target_weight", e.target.value)}
                                className="w-12 bg-[#1c181a] text-center font-bold text-stone-200 border border-white/5 rounded py-0.5 text-[10px]"
                              />
                            </td>
                            <td className="py-1 text-center font-mono">
                              <input
                                type="number"
                                value={set.target_reps}
                                onChange={(e) => handleUpdateTemplateSetField(idx, sIdx, "target_reps", e.target.value)}
                                className="w-10 bg-[#1c181a] text-center font-bold text-stone-200 border border-white/5 rounded py-0.5 text-[10px]"
                              />
                            </td>
                            <td className="py-1 text-right">
                              <button
                                onClick={() => handleRemoveSetFromEx(idx, sIdx)}
                                className="text-stone-500 hover:text-red-405 font-bold px-1"
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <button
                      onClick={() => handleAddSetToEx(idx)}
                      className="w-full text-center text-[9px] uppercase tracking-widest text-stone-400 hover:text-stone-200 py-1 border border-dashed border-[#6f6d6c]/15 rounded-lg mt-2 font-black cursor-pointer bg-stone-900/5 hover:bg-stone-900/15"
                    >
                      + Add Set Row
                    </button>
                  </div>
                ))}

                {newRoutineExs.length === 0 && (
                  <div className="p-6 text-center text-stone-500 text-[11px] bg-stone-900/10 border border-dashed border-[#6f6d6c]/10 rounded-xl leading-normal">
                    No movements added. Tap "+ Add Movement to Template" below to customize your exercises!
                  </div>
                )}
              </div>
            </div>

            {/* Exercise Selector inline trigger inside Modal */}
            <div className="pt-1 select-none">
              {!showExPicker ? (
                <button
                  type="button"
                  onClick={() => setShowExPicker(true)}
                  className="w-full bg-[#6f6d6c] hover:bg-[#868382] text-white text-[11px] font-black uppercase tracking-widest py-3 px-4 rounded-xl border border-white/10 flex items-center justify-center gap-2 cursor-pointer shadow-inner hover:scale-[1.01] transition-all"
                >
                  <Plus className="w-4 h-4 text-white stroke-[2px]" />
                  <span>Add Movement to Template</span>
                </button>
              ) : (
                <div className="bg-black p-4 rounded-xl border border-[#6f6d6c]/25 space-y-3">
                  <div className="flex justify-between items-center text-[9px] uppercase font-black text-stone-400 tracking-wider">
                    <span>Select Movement to Append</span>
                    <button onClick={() => { setShowExPicker(false); setExSearch(""); setSelectedBodyPart("All"); }} className="text-stone-500 hover:text-white">✕</button>
                  </div>
                  <input
                    type="text"
                    placeholder="Search: Bench, squat, pull..."
                    value={exSearch}
                    onChange={(e) => setExSearch(e.target.value)}
                    className="w-full bg-[#1c181a] border border-[#6f6d6c]/15 rounded-lg px-2 py-1.5 text-[11px] text-stone-100 focus:outline-none focus:border-[#6f6d6c]/45 font-sans"
                  />

                  {/* Muscle group pills */}
                  <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar select-none">
                    {["All", "Chest", "Legs", "Back", "Shoulders", "Arms", "Core"].map((bp) => (
                      <button
                        key={bp}
                        type="button"
                        onClick={() => setSelectedBodyPart(bp)}
                        className={`text-[9px] font-bold px-2.5 py-1 rounded-full transition-all cursor-pointer flex-shrink-0 ${
                          selectedBodyPart === bp
                            ? "bg-[#6f6d6c] text-white border border-[#868382]/30"
                            : "bg-[#1c181a] text-stone-400 hover:text-stone-200 border border-[#6f6d6c]/15"
                        }`}
                      >
                        {bp}
                      </button>
                    ))}
                  </div>

                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                    {filteredExercises.map(ex => {
                      const isAlreadyAdded = newRoutineExs.some((routineExercise) => routineExercise.exercise_id === ex.id);

                      return (
                      <button
                        key={ex.id}
                        type="button"
                        disabled={isAlreadyAdded}
                        onClick={() => handleAddExToTemplate(ex.id)}
                        className="w-full text-left bg-[#1c181a] hover:bg-[#2d2729] px-2.5 py-2 rounded-lg text-[11px] border border-white/5 flex items-center justify-between gap-2.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <ExerciseImage exercise={ex} className="w-6 h-6 flex-shrink-0" />
                          <span className="font-extrabold text-stone-250 leading-tight truncate">{ex.name}</span>
                        </div>
                        <span className="text-[8.5px] bg-stone-900/60 p-0.5 px-1 rounded font-mono text-stone-500 uppercase">
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
            </div>

            {/* Global Actions footer */}
            <div className="flex gap-2.5 pt-3.5 border-t border-[#2d2729]">
              <button
                type="button"
                onClick={() => setIsCreatorOpen(false)}
                className="flex-1 bg-[#6f6d6c] hover:bg-[#868382] text-[11px] font-black uppercase tracking-widest py-3 px-3 rounded-xl text-white transition cursor-pointer border border-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRoutineClick}
                disabled={!newTitle.trim() || newRoutineExs.length === 0}
                className="flex-1 bg-[#007aff] hover:bg-[#1a85fe] disabled:opacity-20 text-white font-black text-[11px] uppercase tracking-widest py-3 px-3 rounded-xl transition cursor-pointer shadow-3d-emerald"
              >
                Create Routine
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
