import React from "react";
import { Target } from "lucide-react";

/**
 * Trang Mục tiêu (Placeholder)
 */
export default function GoalsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4 animate-in fade-in-50">
      <div className="relative group">
        <div className="h-16 w-16 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-lg border border-amber-500/20 transition-transform duration-300 group-hover:scale-110">
          <Target className="h-8 w-8" />
        </div>
        <span className="absolute -bottom-1 -right-1 text-xl animate-bounce">🚧</span>
      </div>

      <div className="max-w-md space-y-2">
        <h2 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center justify-center gap-2">
          <span>Mục Tiêu Học Tập</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/30">
            Đang phát triển
          </span>
        </h2>
      </div>
    </div>
  );
}
