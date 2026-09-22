import React from "react";
import { Timer } from "lucide-react";

/**
 * Trang Phiên học (Placeholder)
 */
export default function SessionsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4 animate-in fade-in-50">
      <div className="relative group">
        <div className="h-16 w-16 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary shadow-lg border border-secondary/20 transition-transform duration-300 group-hover:scale-110">
          <Timer className="h-8 w-8" />
        </div>
        <span className="absolute -bottom-1 -right-1 text-xl animate-bounce">🚧</span>
      </div>

      <div className="max-w-md space-y-2">
        <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
          Phiên Học Tập
        </h2>
        <p className="text-sm text-muted-foreground font-medium">
          🚧 Tính năng đang được phát triển
        </p>
        <p className="text-xs text-muted-foreground/80">
          Công cụ bấm giờ Pomodoro và ghi chép nhật ký từng buổi học tập sẽ sớm ra mắt.
        </p>
      </div>
    </div>
  );
}
