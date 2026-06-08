import { useState } from "react";
import { Exercise, SQUAD_USERS, WorkoutLog } from "../types";
import ExerciseImage from "./ExerciseImage";
import { Search, Plus, Globe, Dumbbell, Sparkles, X, TrendingUp, Info } from "lucide-react";

interface ExercisesTabProps {
  activeUserId: string;
  profileUserId: string;
  allWorkoutLogs: WorkoutLog[];
  exerciseLibrary: Exercise[];
  onAddCustomExercise: (name: string, bodyPart: string, category: string, imageUrl?: string) => void;
}

export default function ExercisesTab({
  activeUserId,
  profileUserId,
  allWorkoutLogs,
  exerciseLibrary,
  onAddCustomExercise,
}: ExercisesTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDetailExercise, setSelectedDetailExercise] = useState<Exercise | null>(null);
  const [detailTab, setDetailTab] = useState<"summary" | "history">("summary");
  
  const [newName, setNewName] = useState("");
  const [newBodyPart, setNewBodyPart] = useState("Chest");
  const [newCategory, setNewCategory] = useState("Barbell");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const bodyParts = ["All", "Chest", "Legs", "Back", "Shoulders", "Arms", "Core"];

  // Mapping for Primary and Secondary muscle groups
  const getExerciseMuscles = (ex: Exercise) => {
    const primary = ex.body_part;
    let secondary = "Core & Stabilizers";
    const bp = primary.toLowerCase();
    
    if (bp.includes("chest")) {
      secondary = "Triceps, Front Delts, Serratus";
    } else if (bp.includes("leg")) {
      secondary = "Hamstrings, Glutes, Calves, Quads";
    } else if (bp.includes("back")) {
      secondary = "Biceps, Rear Delts, Latissimus, Traps";
    } else if (bp.includes("shoulder")) {
      secondary = "Triceps, Lateral Delts, Upper Traps";
    } else if (bp.includes("arm")) {
      secondary = "Forearms, Brachialis, Wrists";
    } else if (bp.includes("core")) {
      secondary = "Lower Back, Obliques, Abs";
    }
    return { primary, secondary };
  };

  // Calculate Personal Records for the viewed User/Athlete
  const getExerciseRecords = (exerciseId: string) => {
    let heaviestWeight = 0;
    let bestSetVolume = 0;
    let bestVolumeSetDetails = { reps: 0, weight: 0 };
    let totalSetsPerformed = 0;
    let highestReps = 0;

    // Filter logs for this specific athlete
    const userLogs = allWorkoutLogs.filter((log) => log.user_id === profileUserId);

    userLogs.forEach((log) => {
      log.exercises.forEach((le) => {
        if (le.exercise_id === exerciseId) {
          le.sets.forEach((set) => {
            if (set.is_completed) {
              totalSetsPerformed++;
              
              // Personal Record: Heaviest weight ever lifted
              if (set.actual_weight > heaviestWeight) {
                heaviestWeight = set.actual_weight;
              }

              // Best Set Volume: Set with highest weight * reps value
              const volume = set.actual_weight * set.actual_reps;
              if (volume > bestSetVolume) {
                bestSetVolume = volume;
                bestVolumeSetDetails = { reps: set.actual_reps, weight: set.actual_weight };
              }

              if (set.actual_reps > highestReps) {
                highestReps = set.actual_reps;
              }
            }
          });
        }
      });
    });

    return {
      heaviestWeight,
      bestSetVolume,
      bestVolumeSetDetails,
      totalSetsPerformed,
      highestReps,
    };
  };

  // Search & Filter logic
  const filteredExercises = exerciseLibrary.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBodyPart = selectedBodyPart === "All" || ex.body_part === selectedBodyPart;
    return matchesSearch && matchesBodyPart;
  });

  const handleCreateExercise = () => {
    if (!newName.trim()) return;
    onAddCustomExercise(newName.trim(), newBodyPart, newCategory, newImageUrl.trim());
    
    // Simulate real-time success alert
    setToastMessage(`Created "${newName.trim()}" successfully!`);
    setNewName("");
    setNewImageUrl("");
    setIsAddModalOpen(false);

    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

  const getCreatorName = (userId?: string) => {
    if (!userId) return "System Global";
    const matched = SQUAD_USERS.find((u) => u.id === userId);
    return matched ? matched.username.split(" ")[0] : "Squad Friend";
  };

  const getAthleteName = () => {
    const matched = SQUAD_USERS.find((u) => u.id === profileUserId);
    return matched ? matched.username.split(" ")[0] : "Athlete";
  };

  return (
    <div id="exercises-tab" className="px-5 py-5 space-y-5">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-12 left-1/2 transform -translate-x-1/2 z-50 bg-[#1c181a] text-white border border-[#6f6d6c]/25 px-4 py-3 rounded-2xl font-black text-xs shadow-3d-sm flex items-center gap-2.5 font-sans">
          <Sparkles className="w-4 h-4 text-stone-400 fill-current" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Collaborative Info Header */}
      <div className="bg-black p-4.5 rounded-2xl border border-[#6f6d6c]/15 shadow-3d-sm text-left font-sans">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-stone-400 font-sans" />
          <h4 className="text-[10px] font-black text-[#f7f5f4] uppercase tracking-widest font-mono">Synchronized Squad Hub</h4>
        </div>
        <p className="text-[11px] text-stone-400 mt-2 leading-relaxed">
          This exercise pool is fully collaborative. Press any movement to check detailed stats, primary/secondary muscles and personal best records.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="relative font-sans">
        <span className="absolute inset-y-0 left-3.5 flex items-center text-stone-550 pointer-events-none">
          <Search className="w-4 h-4 text-stone-500" />
        </span>
        <input
          type="text"
          placeholder="Search global pool (Bench, Leg Press)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-black border border-[#6f6d6c]/15 rounded-xl pl-10 pr-4 py-3.5 text-xs text-stone-250 placeholder-stone-605 focus:outline-none focus:border-[#6f6d6c]/50 shadow-inner"
        />
      </div>

      {/* Body Part horizontal filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none font-sans">
        {bodyParts.map((bp) => (
          <button
            key={bp}
            onClick={() => setSelectedBodyPart(bp)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-305 transform cursor-pointer ${
              selectedBodyPart === bp
                ? "bg-[#6f6d6c] text-[#f7f5f4] font-black shadow-3d-emerald"
                : "bg-black text-stone-400 hover:text-stone-200 border border-[#6f6d6c]/10 shadow-3d-sm"
            }`}
          >
            {bp}
          </button>
        ))}
      </div>

      {/* Exercise list */}
      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin font-sans">
        {filteredExercises.map((ex) => (
          <div
            key={ex.id}
            onClick={() => {
              setSelectedDetailExercise(ex);
              setDetailTab("summary");
            }}
            className="bg-black px-4.5 py-3.5 rounded-2xl border border-[#6f6d6c]/15 hover:border-[#6f6d6c]/30 hover:bg-[#121011] shadow-3d-sm transition-all duration-300 flex items-center justify-between gap-3 cursor-pointer group"
          >
            <div className="flex items-center gap-3 text-left">
              <ExerciseImage exercise={ex} className="w-10 h-10 flex-shrink-0 group-hover:scale-105 transition duration-200" />
              <div>
                <h5 className="text-[11.5px] font-black text-[#f7f5f4] group-hover:text-white transition duration-200">{ex.name}</h5>
                <div className="flex items-center gap-1.5 mt-1.5 font-sans">
                  <span className="text-[8px] bg-black border border-[#6f6d6c]/10 text-stone-400 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                    {ex.body_part}
                  </span>
                  <span className="text-[8px] bg-black text-stone-300 px-2 py-0.5 rounded uppercase font-black tracking-wider border border-[#6f6d6c]/20">
                    {ex.category}
                  </span>
                </div>
              </div>
            </div>

            {/* Custom Exercise authorship badge */}
            <div className="text-right flex items-center gap-2">
              {ex.is_custom ? (
                <span className="text-[9px] bg-[#6f6d6c]/15 text-[#f7f5f4] px-2.5 py-1 rounded-lg border border-[#6f6d6c]/20 font-bold font-mono">
                  by {getCreatorName(ex.created_by)}
                </span>
              ) : (
                <span className="text-[9px] text-stone-600 font-mono tracking-wide uppercase font-bold">
                  Global
                </span>
              )}
              <ChevronRightIcon className="w-3.5 h-3.5 text-stone-600 group-hover:text-stone-300 transition duration-200" />
            </div>
          </div>
        ))}

        {filteredExercises.length === 0 && (
          <div className="p-8 text-center bg-stone-900/10 text-stone-500 text-xs rounded-xl border border-dashed border-[#6f6d6c]/20 font-sans">
            No matching exercises found. Write a new custom one below!
          </div>
        )}
      </div>

      {/* Add Custom Exercise FAB Button with 3D shadow lift */}
      <div className="pt-2">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full bg-black hover:bg-stone-900 active:translate-y-0.5 text-[#f7f5f4] border border-[#6f6d6c]/25 font-black uppercase tracking-widest py-3.5 px-4 rounded-xl flex items-center justify-center gap-2.5 transition-all duration-200 shadow-3d-sm cursor-pointer"
        >
          <Plus className="w-4 h-4 text-stone-300 stroke-[3px]" />
          <span className="text-[10px]">Add Custom Movement</span>
        </button>
      </div>

      {/* ----------------- EXERCISE DETAIL MODAL ----------------- */}
      {selectedDetailExercise && (() => {
        const muscles = getExerciseMuscles(selectedDetailExercise);
        const records = getExerciseRecords(selectedDetailExercise.id);
        const athleteName = getAthleteName();

        // Get history for selected exercise sorted newest first
        const historyLogs = (() => {
          const history: {
            workout_title: string;
            start_time: string;
            sets: { actual_weight: number; actual_reps: number }[];
          }[] = [];

          const userLogs = allWorkoutLogs.filter((log) => log.user_id === profileUserId);

          userLogs.forEach((log) => {
            const matchedEx = log.exercises.find((le) => le.exercise_id === selectedDetailExercise.id);
            if (matchedEx && matchedEx.sets.some((s) => s.is_completed)) {
              history.push({
                workout_title: log.title || "Workout Log",
                start_time: log.start_time,
                sets: matchedEx.sets
                  .filter((s) => s.is_completed)
                  .map((s) => ({
                    actual_weight: s.actual_weight,
                    actual_reps: s.actual_reps,
                  })),
              });
            }
          });

          return history.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
        })();

        const formatLogDate = (dateTimeStr: string) => {
          try {
            const d = new Date(dateTimeStr);
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const day = d.getDate();
            const month = months[d.getMonth()];
            const year = d.getFullYear();
            const hours = String(d.getHours()).padStart(2, '0');
            const mins = String(d.getMinutes()).padStart(2, '0');
            return `${day} ${month} ${year}, ${hours}:${mins}`;
          } catch (e) {
            return dateTimeStr;
          }
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-fade-in text-left font-sans">
            <div className="w-full max-w-sm bg-black border border-[#2d2729] rounded-3xl shadow-3d-md p-6 space-y-4 text-stone-100 animate-slide-up relative overflow-hidden">
              
              {/* Highlight background glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#6f6d6c]/5 rounded-full pointer-events-none" />

              {/* Close Icon Header trigger */}
              <button
                onClick={() => setSelectedDetailExercise(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition duration-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-2 pt-2">
                <ExerciseImage exercise={selectedDetailExercise} className="w-16 h-16 mx-auto" />
                <div>
                  <h3 className="text-base font-black text-stone-100 uppercase tracking-tight">{selectedDetailExercise.name}</h3>
                  <p className="text-[9px] text-[#6f6d6c] font-black tracking-widest uppercase mt-0.5 font-mono">
                    {selectedDetailExercise.category} MOVEMENT
                  </p>
                </div>
              </div>

              {/* Summary / History Sub-tabs styled beautifully like the image */}
              <div className="flex border-b border-[#6f6d6c]/15 font-sans">
                <button
                  onClick={() => setDetailTab("summary")}
                  className={`flex-1 pb-2.5 text-[10px] font-black uppercase tracking-wider text-center border-b-2 transition duration-200 cursor-pointer ${
                    detailTab === "summary"
                      ? "border-[#6f6d6c] text-[#f7f5f4]"
                      : "border-transparent text-stone-500 hover:text-stone-300"
                  }`}
                >
                  Summary
                </button>
                <button
                  onClick={() => setDetailTab("history")}
                  className={`flex-1 pb-2.5 text-[10px] font-black uppercase tracking-wider text-center border-b-2 transition duration-200 cursor-pointer ${
                    detailTab === "history"
                      ? "border-[#6f6d6c] text-[#f7f5f4]"
                      : "border-transparent text-stone-500 hover:text-stone-300"
                  }`}
                >
                  History
                </button>
              </div>

              {detailTab === "summary" ? (
                <div className="space-y-4 animate-fade-in">
                  {/* Primary & Secondary muscle groups */}
                  <div className="bg-black p-3.5 rounded-2xl border border-[#6f6d6c]/10 space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-md bg-stone-800 flex items-center justify-center text-stone-405 mt-0.5">
                        <Info className="w-3 h-3 text-stone-400" />
                      </div>
                      <div>
                        <span className="text-[8px] uppercase font-bold text-stone-500 tracking-wider block">Primary Muscle</span>
                        <span className="text-[11px] font-bold text-stone-200">{muscles.primary}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 border-t border-stone-900/60 pt-2.5">
                      <div className="w-5 h-5 rounded-md bg-stone-850 flex items-center justify-center text-stone-500 mt-0.5">
                        <Dumbbell className="w-3 h-3 text-stone-400" />
                      </div>
                      <div>
                        <span className="text-[8px] uppercase font-bold text-stone-500 tracking-wider block">Secondary Muscles</span>
                        <span className="text-[11px] text-stone-400 font-semibold">{muscles.secondary}</span>
                      </div>
                    </div>
                  </div>

                  {/* Personal Records panel */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-black text-stone-450 tracking-widest font-mono">
                        🏅 {athleteName}'s Personal Best Records
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Heaviest Weight Record */}
                      <div className="bg-black p-3 rounded-2xl border border-white/5 text-left relative overflow-hidden">
                        <div className="absolute top-1.5 right-2 opacity-5">
                          <TrendingUp className="w-10 h-10 text-[#6f6d6c]" />
                        </div>
                        <span className="text-[7.5px] uppercase font-bold text-stone-500 tracking-widest block font-sans">
                          Heaviest Lift
                        </span>
                        <span className="font-mono text-xs font-black text-[#f7f5f4] block mt-1">
                          {records.heaviestWeight > 0 ? (
                            <>
                              {records.heaviestWeight} <span className="text-[8px] font-sans font-bold text-stone-450 uppercase">kg</span>
                            </>
                          ) : (
                            "None yet"
                          )}
                        </span>
                        <span className="text-[7px] text-[#6f6d6c] font-mono font-bold block mt-1 truncate">
                          {records.heaviestWeight > 0 ? "Highest weight single set" : "Log to track"}
                        </span>
                      </div>

                      {/* Best Set Volume Record */}
                      <div className="bg-black p-3 rounded-2xl border border-white/5 text-left relative overflow-hidden">
                        <span className="text-[7.5px] uppercase font-bold text-stone-500 tracking-widest block font-sans">
                          Best Set Volume
                        </span>
                        <span className="font-mono text-xs font-black text-[#f7f5f4] block mt-1 truncate">
                          {records.bestSetVolume > 0 ? (
                            `${records.bestVolumeSetDetails.weight} kg x ${records.bestVolumeSetDetails.reps}`
                          ) : (
                            "None yet"
                          )}
                        </span>
                        <span className="text-[7px] text-[#6f6d6c] font-mono font-bold block mt-1 truncate">
                          {records.bestSetVolume > 0 ? (
                            `Total: ${records.bestSetVolume.toLocaleString()} kg`
                          ) : (
                            "weight × reps formula"
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Additional mini stats */}
                    {records.totalSetsPerformed > 0 && (
                      <div className="flex items-center justify-between px-2 text-[9px] text-stone-400 font-mono">
                        <span>Total logged reps:</span>
                        <span className="text-stone-300 font-bold">{records.totalSetsPerformed} sets performed</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* ----------------- CUSTOM HISTORY VIEW ----------------- */
                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin animate-fade-in">
                  {historyLogs.length === 0 ? (
                    <div className="py-12 text-center text-stone-500 text-xs font-sans">
                      No workout history recorded for this exercise yet.
                    </div>
                  ) : (
                    historyLogs.map((item, idx) => (
                      <div key={idx} className="border-b border-stone-800/80 pb-3 last:border-b-0">
                        {/* Workout header block */}
                        <div className="mb-2">
                          <h4 className="text-xs font-black text-[#f7f5f4] hover:text-[#6f6d6c] transition duration-150 flex items-center justify-between">
                            <span>{item.workout_title}</span>
                          </h4>
                          <span className="text-[8.5px] text-stone-500 font-bold block mt-0.5">
                            {formatLogDate(item.start_time)}
                          </span>
                        </div>

                        {/* Exercise Name inside log header (optional layout alignment matching the image) */}
                        <div className="bg-black p-3 rounded-2xl border border-[#6f6d6c]/10 space-y-2.5">
                          <div className="flex items-center gap-2.5 pb-2 border-b border-stone-900/60 font-sans">
                            <ExerciseImage exercise={selectedDetailExercise} className="w-5 h-5 flex-shrink-0" />
                            <span className="text-xs font-bold text-stone-205">{selectedDetailExercise.name}</span>
                          </div>

                          {/* Set & Weights Column Headers */}
                          <div className="flex justify-between text-[8px] font-black tracking-widest text-[#6f6d6c] uppercase font-mono pb-1">
                            <span>SET</span>
                            <span>WEIGHT & REPS</span>
                          </div>

                          {/* Rows matching exact structure in provided image */}
                          <div className="space-y-1">
                            {item.sets.map((set, setIdx) => (
                              <div
                                key={setIdx}
                                className={`flex justify-between items-center px-3 py-2 rounded-xl text-xs font-sans font-semibold ${
                                  setIdx % 2 === 0 ? "bg-[#1c1c1c]/40" : "bg-transparent"
                                }`}
                              >
                                <span className="text-stone-450 font-bold font-mono">{setIdx + 1}</span>
                                <span className="text-[#f7f5f4] font-bold font-mono">
                                  {set.actual_weight} kg x {set.actual_reps}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Dismiss Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDetailExercise(null)}
                  className="w-full bg-[#6f6d6c] hover:bg-[#868382] text-white font-black text-[10px] uppercase tracking-widest py-3 px-4 rounded-xl transition duration-200 shadow-3d-emerald text-center cursor-pointer"
                >
                  Close Stats View
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Add Custom Exercise Dialog/Modal (Luxury 3D layer Overlay) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in text-left font-sans">
          <div className="w-full max-w-sm bg-black border border-[#2d2729] rounded-3xl shadow-3d-md p-6 space-y-4 text-stone-100 animate-slide-up">
            <h3 className="text-base font-bold text-[#f7f5f4] flex items-center gap-2">
              <Dumbbell className="w-4.5 h-4.5 text-[#6f6d6c]" />
              <span>Create Team Movement</span>
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Define a custom exercise. In this local demo, it is saved to this browser's shared exercise library.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[8px] uppercase font-black text-stone-400 tracking-widest mb-1.5 font-sans">
                  Exercise Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hex Press (Dumbbell)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-black border border-[#6f6d6c]/15 rounded-xl px-3 py-2.5 text-xs text-stone-200 placeholder-stone-605 focus:outline-none focus:border-[#6f6d6c]/50 shadow-inner font-sans"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[8px] uppercase font-black text-stone-400 tracking-widest mb-1.5 font-sans">
                    Target Body Part
                  </label>
                  <select
                    value={newBodyPart}
                    onChange={(e) => setNewBodyPart(e.target.value)}
                    className="w-full bg-black border border-[#6f6d6c]/15 rounded-xl px-2 py-2.5 text-xs text-stone-300 focus:outline-none focus:border-[#6f6d6c]/50 shadow-3d-sm font-sans"
                  >
                    <option value="Chest">Chest</option>
                    <option value="Legs">Legs</option>
                    <option value="Back">Back</option>
                    <option value="Shoulders">Shoulders</option>
                    <option value="Arms">Arms</option>
                    <option value="Core">Core</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[8px] uppercase font-black text-stone-400 tracking-widest mb-1.5 font-sans">
                    Equipment Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-black border border-[#6f6d6c]/15 rounded-xl px-2 py-2.5 text-xs text-stone-300 focus:outline-none focus:border-[#6f6d6c]/50 shadow-3d-sm font-sans"
                  >
                    <option value="Barbell">Barbell</option>
                    <option value="Dumbbell">Dumbbell</option>
                    <option value="Machine">Machine</option>
                    <option value="Bodyweight">Bodyweight</option>
                    <option value="Cable">Cable</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[8px] uppercase font-black text-stone-400 tracking-widest mb-1.5 font-sans">
                  Exercise Image URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. https://images.unsplash.com/... or keep blank"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="w-full bg-black border border-[#6f6d6c]/15 rounded-xl px-3 py-2.5 text-xs text-stone-200 placeholder-stone-605 focus:outline-none focus:border-[#6f6d6c]/50 shadow-inner font-sans"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 bg-black hover:bg-stone-900 text-[10px] font-black uppercase tracking-widest py-2.5 px-3 rounded-xl text-stone-400 transition cursor-pointer font-bold font-sans"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateExercise}
                  disabled={!newName.trim()}
                  className="flex-1 bg-[#6f6d6c] hover:bg-[#868382] disabled:opacity-30 text-white font-black text-[10px] uppercase tracking-widest py-2.5 px-3 rounded-xl transition cursor-pointer shadow-3d-emerald font-sans"
                >
                  Sync & Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
