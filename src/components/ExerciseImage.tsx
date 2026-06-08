import { Exercise } from "../types";

export interface ExerciseImageProps {
  exercise?: Exercise;
  className?: string;
  key?: string | number;
}

export default function ExerciseImage({ exercise, className = "w-11 h-11" }: ExerciseImageProps) {
  const imageUrl = exercise?.image_url;

  if (imageUrl && imageUrl.trim().length > 0) {
    return (
      <div className={`aspect-square overflow-hidden rounded-full border border-stone-700 bg-white flex-shrink-0 flex items-center justify-center ${className}`}>
        <img
          src={imageUrl}
          alt={exercise?.name || "Exercise illustration"}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // fallback if URL is broken
            e.currentTarget.style.display = "none";
          }}
        />
      </div>
    );
  }

  // Pure SVG Line-art illustrations for body parts matching Hevy private client app specs
  const bodyPart = exercise?.body_part?.toLowerCase() || "general";

  let svgContent = null;

  if (bodyPart.includes("chest")) {
    // Chest Bench-Press SVG Line-art
    svgContent = (
      <svg viewBox="0 0 100 100" className="w-[85%] h-[85%] text-stone-900 fill-none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {/* Bench support */}
        <line x1="20" y1="65" x2="80" y2="65" strokeWidth="4.5" />
        <line x1="30" y1="65" x2="30" y2="85" strokeWidth="3" />
        <line x1="70" y1="65" x2="70" y2="85" strokeWidth="3" />
        {/* Lifter arms holding bar */}
        <polyline points="38,55 50,42 62,55" strokeWidth="3.5" />
        {/* Bench Barbell */}
        <line x1="12" y1="36" x2="88" y2="36" strokeWidth="4.5" />
        {/* Barbell weights */}
        <rect x="12" y="26" width="6" height="20" rx="1" fill="currentColor" stroke="none" />
        <rect x="5" y="29" width="5" height="14" rx="0.5" fill="currentColor" stroke="none" />
        <rect x="82" y="26" width="6" height="20" rx="1" fill="currentColor" stroke="none" />
        <rect x="90" y="29" width="5" height="14" rx="0.5" fill="currentColor" stroke="none" />
        {/* Head */}
        <circle cx="50" cy="54" r="5" fill="currentColor" stroke="none" />
      </svg>
    );
  } else if (bodyPart.includes("leg")) {
    // Legs Squat Barbell SVG
    svgContent = (
      <svg viewBox="0 0 100 100" className="w-[85%] h-[85%] text-stone-900 fill-none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {/* Squat rack lines */}
        <line x1="25" y1="20" x2="25" y2="85" strokeWidth="2" strokeDasharray="2,3" />
        <line x1="75" y1="20" x2="75" y2="85" strokeWidth="2" strokeDasharray="2,3" stroke="#d6d3d1" />
        {/* Squatter figure */}
        <circle cx="50" cy="35" r="5" fill="currentColor" stroke="none" /> {/* head */}
        <polyline points="50,40 50,56 42,66 38,82" strokeWidth="3.5" /> {/* spine and lower leg */}
        <polyline points="50,56 58,66 62,82" strokeWidth="3.5" /> {/* secondary leg */}
        <polyline points="40,46 50,44 60,46" strokeWidth="3" /> {/* arms holding bar */}
        {/* Barbell resting on shoulders */}
        <line x1="14" y1="41" x2="86" y2="41" strokeWidth="4.5" />
        {/* Weights */}
        <rect x="14" y="31" width="6" height="20" rx="1" fill="currentColor" stroke="none" />
        <rect x="7" y="34" width="5" height="14" rx="0.5" fill="currentColor" stroke="none" />
        <rect x="80" y="31" width="6" height="20" rx="1" fill="currentColor" stroke="none" />
        <rect x="88" y="34" width="5" height="14" rx="0.5" fill="currentColor" stroke="none" />
      </svg>
    );
  } else if (bodyPart.includes("back")) {
    // Back Pull-up bar and lifter SVG
    svgContent = (
      <svg viewBox="0 0 100 100" className="w-[85%] h-[85%] text-stone-900 fill-none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {/* Pull-up rig */}
        <line x1="10" y1="22" x2="90" y2="22" strokeWidth="4.5" />
        <line x1="22" y1="22" x2="22" y2="85" strokeWidth="1" strokeDasharray="3,3" />
        <line x1="78" y1="22" x2="78" y2="85" strokeWidth="1" strokeDasharray="3,3" />
        {/* Pull up lifter */}
        <circle cx="50" cy="35" r="5" fill="currentColor" stroke="none" /> {/* head */}
        <polyline points="50,40 50,62 44,78 46,88" strokeWidth="3.5" /> {/* back / leg 1 */}
        <polyline points="50,62 56,78 54,88" strokeWidth="3.5" /> {/* leg 2 */}
        <polyline points="32,22 41,38 50,38" strokeWidth="3" /> {/* arm left */}
        <polyline points="68,22 59,38 50,38" strokeWidth="3" /> {/* arm right */}
      </svg>
    );
  } else if (bodyPart.includes("shoulder")) {
    // Overhead Press Barbell SVG
    svgContent = (
      <svg viewBox="0 0 100 100" className="w-[85%] h-[85%] text-stone-900 fill-none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {/* Overhead press lifter standing */}
        <circle cx="50" cy="46" r="5" fill="currentColor" stroke="none" /> {/* head */}
        <line x1="50" y1="51" x2="50" y2="72" strokeWidth="3.5" /> {/* torso */}
        <polyline points="44,72 46,90" strokeWidth="3.5" /> {/* leg left */}
        <polyline points="56,72 54,90" strokeWidth="3.5" /> {/* leg right */}
        {/* Overhead lock arms */}
        <polyline points="34,22 42,34 50,48" strokeWidth="3.2" />
        <polyline points="66,22 58,34 50,48" strokeWidth="3.2" />
        {/* Overhead Barbell held high */}
        <line x1="15" y1="20" x2="85" y2="20" strokeWidth="4.5" />
        <rect x="15" y="11" width="5" height="18" rx="0.5" fill="currentColor" stroke="none" />
        <rect x="80" y="11" width="5" height="18" rx="0.5" fill="currentColor" stroke="none" />
      </svg>
    );
  } else if (bodyPart.includes("arm") || bodyPart.includes("bicep") || bodyPart.includes("tricep") || bodyPart.includes("curl")) {
    // Arms Curl dumbbell SVG
    svgContent = (
      <svg viewBox="0 0 100 100" className="w-[85%] h-[85%] text-stone-900 fill-none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {/* Body stem */}
        <circle cx="50" cy="34" r="5" fill="currentColor" stroke="none" />
        <line x1="50" y1="39" x2="50" y2="65" strokeWidth="3.5" />
        <polyline points="44,65 46,88" strokeWidth="3" />
        <polyline points="56,65 54,88" strokeWidth="3" />
        {/* Arm doing bicep curl */}
        <path d="M50,44 C34,42 28,58 38,68" strokeWidth="3.5" />
        {/* Big Dumbbell in curl position */}
        <line x1="28" y1="68" x2="48" y2="68" strokeWidth="5" />
        <rect x="25" y="60" width="4" height="16" rx="0.5" fill="currentColor" stroke="none" />
        <rect x="47" y="60" width="4" height="16" rx="0.5" fill="currentColor" stroke="none" />
      </svg>
    );
  } else {
    // General Dynamic Dumbbells Graphic
    svgContent = (
      <svg viewBox="0 0 100 100" className="w-[75%] h-[75%] text-stone-900 fill-none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="15" y1="50" x2="85" y2="50" strokeWidth="7" />
        <rect x="15" y="30" width="12" height="40" rx="1.5" fill="currentColor" stroke="none" />
        <rect x="5" y="35" width="8" height="30" rx="1" fill="currentColor" stroke="none" />
        <rect x="73" y="30" width="12" height="40" rx="1.5" fill="currentColor" stroke="none" />
        <rect x="87" y="35" width="8" height="30" rx="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  return (
    <div className={`aspect-square overflow-hidden rounded-full border border-stone-200 bg-white flex-shrink-0 flex items-center justify-center p-1 shadow-[0_2px_6px_rgba(0,0,0,0.12)] text-[#121011] ${className}`}>
      {svgContent}
    </div>
  );
}
