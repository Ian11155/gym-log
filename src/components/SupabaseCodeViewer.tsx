import { useState } from "react";
import { Copy, Check, FileCode, CheckCircle, Database } from "lucide-react";
import { SUPABASE_MIGRATION_SQL, SUPABASE_TYPES_TS } from "../types";

export default function SupabaseCodeViewer() {
  const [activeSubTab, setActiveSubTab] = useState<"sql" | "types">("sql");
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const codeToShow = activeSubTab === "sql" ? SUPABASE_MIGRATION_SQL : SUPABASE_TYPES_TS;

  return (
    <div id="supabase-code-hub" className="bg-[#121111] border border-white/5 rounded-2xl overflow-hidden shadow-3d-md">
      {/* Header */}
      <div className="bg-[#0c0c0d] px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-emerald-400 animate-pulse-subtle" />
          <div className="text-left">
            <h3 className="font-bold text-stone-100 flex items-center gap-2">
              Future Supabase Backend
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                PostgreSQL
              </span>
            </h3>
            <p className="text-xs text-stone-400">Planned database migration and TypeScript model reference</p>
          </div>
        </div>
        <button
          onClick={() => handleCopy(codeToShow)}
          className="flex items-center gap-2 px-3.5 py-2 bg-[#1c1b1b] hover:bg-[#252424] active:scale-95 text-[10px] font-black uppercase tracking-widest text-stone-200 rounded-xl transition-all border border-white/5 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-stone-400" />
              <span>Copy Schema</span>
            </>
          )}
        </button>
      </div>

      {/* Selector Tabs */}
      <div className="bg-[#0c0c0d]/80 px-4 py-2 border-b border-white/5 flex gap-2">
        <button
          onClick={() => setActiveSubTab("sql")}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition cursor-pointer ${
            activeSubTab === "sql"
              ? "bg-[#181819] text-emerald-400 border border-emerald-500/10"
              : "text-stone-400 hover:text-stone-200"
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          SQL Migration Code
        </button>
        <button
          onClick={() => setActiveSubTab("types")}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition cursor-pointer ${
            activeSubTab === "types"
              ? "bg-[#181819] text-[#5063ff] border border-[#5063ff]/15"
              : "text-stone-400 hover:text-stone-200"
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          TypeScript Models
        </button>
      </div>

      {/* Code Container */}
      <div className="p-4 bg-[#080809] overflow-x-auto max-h-[380px] text-xs font-mono text-stone-300 leading-relaxed scrollbar-thin text-left border-b border-white/5">
        <pre className="whitespace-pre">{codeToShow}</pre>
      </div>

      {/* Helpful Instructions footer */}
      <div className="bg-[#121111]/90 p-5 text-xs text-stone-400 text-left">
        <h4 className="font-bold text-stone-300 mb-2.5 flex items-center gap-1.5 uppercase tracking-wide text-[11px]">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          Future Synchronization Guide
        </h4>
        <ol className="list-decimal list-inside space-y-2 pl-1.5 text-stone-400 leading-relaxed font-sans font-medium">
          <li>Use this schema as a starting point when the real Supabase integration begins.</li>
          <li>Review the migration before applying it to a Supabase project's <strong className="text-white">SQL Editor</strong>.</li>
          <li>The current app is localStorage-only; realtime feeds will require a later Supabase client and replication setup.</li>
        </ol>
      </div>
    </div>
  );
}
