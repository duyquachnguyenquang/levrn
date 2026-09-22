import React from "react";
import { BarChart3 } from "lucide-react";

/**
 * Trang Thống kê (Placeholder)
 */
export default function StatsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4 animate-in fade-in-50">
      <div className="relative group">
        <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-lg border border-primary/20 transition-transform duration-300 group-hover:scale-110">
          <BarChart3 className="h-8 w-8" />
        </div>
        <span className="absolute -bottom-1 -right-1 text-xl animate-bounce">🚧</span>
      </div>

      <div className="max-w-md space-y-2">
        <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
          Thống Kê Tiến Độ
        </h2>
        <p className="text-sm text-muted-foreground font-medium">
          🚧 Tính năng đang được phát triển
        </p>
        <p className="text-xs text-muted-foreground/80">
          Biểu đồ phân tích hiệu suất học tập và so sánh tiến độ thực tế với mục tiêu đã đề ra.
        </p>
      </div>
    </div>
  );
}
