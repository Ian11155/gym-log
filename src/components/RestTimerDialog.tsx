import { useEffect } from "react";
import { Plus, Minus, X, Volume2, VolumeX, Timer } from "lucide-react";

interface RestTimerDialogProps {
  secondsRemaining: number;
  totalSeconds: number;
  onClose: () => void;
  onAdjustTime: (deltaSeconds: number) => void;
  isMuted: boolean;
  onToggleMuted: () => void;
}

export default function RestTimerDialog({
  secondsRemaining,
  totalSeconds,
  onClose,
  onAdjustTime,
  isMuted,
  onToggleMuted,
}: RestTimerDialogProps) {
  const percentage = Math.max(0, Math.min(100, (secondsRemaining / totalSeconds) * 100));
  const strokeDashoffset = 220 - (220 * percentage) / 100;

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div id="rest-timer-dialog" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in font-sans">
      <div className="relative w-full max-w-sm overflow-hidden bg-[#1c181a] border border-[#6f6d6c]/20 rounded-3xl shadow-3d-lg p-7 text-center text-stone-100 animate-slide-up text-left">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white hover:bg-stone-900/40 rounded-full transition cursor-pointer"
        >
          <X className="w-5 h-5 animate-pulse-subtle" />
        </button>

        {/* Header Indicator */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <Timer className="w-4.5 h-4.5 text-[#6f6d6c] animate-pulse" />
          <span className="text-[10px] font-black tracking-widest text-stone-300 uppercase font-mono">Rest Interval Active</span>
        </div>

        {/* Circular Countdown Progress */}
        <div className="relative flex items-center justify-center my-6">
          <svg className="w-40 h-40 transform -rotate-90">
            {/* Background Circle */}
            <circle
              cx="80"
              cy="80"
              r="70"
              className="stroke-stone-900"
              strokeWidth="9"
              fill="transparent"
            />
            {/* Active Progress Circle with glorious stone glow */}
            <circle
              cx="80"
              cy="80"
              r="70"
              className="stroke-[#6f6d6c] transition-all duration-1000 ease-linear"
              strokeWidth="9"
              fill="transparent"
              strokeDasharray="440"
              strokeDashoffset={(strokeDashoffset * 440) / 220}
              strokeLinecap="round"
            />
          </svg>

          {/* Time text centered */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-3xl font-black tracking-tighter text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {formatTime(secondsRemaining)}
            </span>
            <span className="text-[8px] font-black uppercase text-stone-400 tracking-widest mt-1.5 font-sans">Recover reps</span>
          </div>
        </div>

        {/* Adjust Buttons Row */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={() => onAdjustTime(-10)}
            disabled={secondsRemaining <= 10}
            className="flex items-center justify-center w-14 h-11 rounded-xl bg-[#242022] hover:bg-[#2d282a] active:translate-y-0.5 disabled:opacity-30 disabled:pointer-events-none text-stone-200 border border-white/5 shadow-3d-sm transition-all cursor-pointer font-bold"
          >
            <Minus className="w-4 h-4 text-stone-400 mr-1" />
            <span className="text-[10px] font-mono font-bold">-10s</span>
          </button>

          <button
            onClick={() => onAdjustTime(10)}
            className="flex items-center justify-center w-14 h-11 rounded-xl bg-[#242022] hover:bg-[#2d282a] active:translate-y-0.5 text-stone-200 border border-white/5 shadow-3d-sm transition-all cursor-pointer font-bold"
          >
            <Plus className="w-4 h-4 text-[#6f6d6c] mr-1 animate-pulse-subtle" />
            <span className="text-[10px] font-mono font-bold">+10s</span>
          </button>
        </div>

        {/* Action button bar */}
        <div className="flex items-center justify-between mt-4 p-1.5 bg-[#242022] rounded-2xl border border-white/5 shadow-inner">
          <button
            onClick={onToggleMuted}
            className="flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-white transition cursor-pointer"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-rose-505" />
                <span>Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-[#6f6d6c] animate-bounce" />
                <span>Audio cues</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="bg-[#6f6d6c] hover:bg-[#868382] active:translate-y-0.5 text-[#f7f5f4] font-black text-[9px] uppercase tracking-widest px-4 py-2 rounded-xl transition cursor-pointer"
          >
            Skip Rest
          </button>
        </div>

      </div>
    </div>
  );
}
