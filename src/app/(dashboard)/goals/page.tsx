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
        <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
          Mục Tiêu Học Tập
        </h2>
        <p className="text-sm text-muted-foreground font-medium">
          🚧 Tính năng đang được phát triển
        </p>
        <p className="text-xs text-muted-foreground/80">
          Thiết lập các mốc điểm số GPA và số giờ tự học cho từng môn học.
        </p>
      </div>
    </div>
  );
}
