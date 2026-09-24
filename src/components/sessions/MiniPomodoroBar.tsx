"use client";

import React from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Maximize2,
  Brain,
  Coffee,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Subject, PomodoroMode } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MiniPomodoroBarProps {
  isRunning: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onSkip: () => void;
  timeLeft: number;
  totalDurationSeconds: number;
  currentMode: PomodoroMode;
  subjects: Subject[];
  selectedSubjectId: string;
  onOpenFullPomodoro: () => void;
}

export function MiniPomodoroBar({
  isRunning,
  onTogglePlay,
  onReset,
  onSkip,
  timeLeft,
  totalDurationSeconds,
  currentMode,
  subjects,
  selectedSubjectId,
  onOpenFullPomodoro,
}: MiniPomodoroBarProps) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  const progressPercent = totalDurationSeconds > 0
    ? Math.max(0, Math.min(100, Math.round(((totalDurationSeconds - timeLeft) / totalDurationSeconds) * 100)))
    : 0;

  const modeColor =
    currentMode === "focus"
      ? "#7D39EB"
      : currentMode === "short_break"
      ? "#C6FF33"
      : "#06B6D4";

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[92%] sm:w-auto min-w-[320px] sm:min-w-[420px] max-w-xl animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-full bg-card/95 backdrop-blur-md border border-border/80 shadow-2xl">
        {/* Cụm Trái: Trạng thái & Đồng hồ */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mini progress ring */}
          <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
            <svg className="w-8 h-8 -rotate-90 transform" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="14"
                stroke="currentColor"
                strokeWidth="3.5"
                fill="transparent"
                className="text-muted/40"
              />
              <circle
                cx="18"
                cy="18"
                r="14"
                stroke={modeColor}
                strokeWidth="3.5"
                strokeDasharray="88"
                strokeDashoffset={88 - (88 * progressPercent) / 100}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-700 ease-linear"
              />
            </svg>
            <div className="absolute text-[9px] font-black text-foreground">
              {currentMode === "focus" ? (
                <Brain className="h-3 w-3 text-[#7D39EB]" />
              ) : (
                <Coffee className="h-3 w-3 text-[#C6FF33]" />
              )}
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-sm sm:text-base font-black text-foreground">
                {timeFormatted}
              </span>
              <span
                className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded"
                style={{
                  backgroundColor: `${modeColor}20`,
                  color: modeColor,
                }}
              >
                {currentMode === "focus" ? "Tập trung" : "Nghỉ"}
              </span>
            </div>
            {selectedSubject && (
              <p className="text-[10px] text-muted-foreground truncate max-w-[130px] font-medium">
                [{selectedSubject.code}] {selectedSubject.name}
              </p>
            )}
          </div>
        </div>

        {/* Cụm Phải: Thao tác Play/Pause, Reset, Mở Pomodoro lớn */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            type="button"
            size="icon"
            onClick={onTogglePlay}
            className={cn(
              "h-8 w-8 rounded-full text-black shadow-xs transition-all active:scale-90",
              isRunning
                ? "bg-amber-400 hover:bg-amber-500"
                : "bg-[#C6FF33] hover:bg-[#B5F51B]"
            )}
            title={isRunning ? "Tạm dừng" : "Bắt đầu"}
          >
            {isRunning ? (
              <Pause className="h-3.5 w-3.5 fill-current" />
            ) : (
              <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onReset}
            className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
            title="Đặt lại đồng hồ"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenFullPomodoro}
            className="h-7 px-2.5 rounded-full text-[11px] font-bold border-border/70 hover:bg-[#7D39EB]/15 hover:text-[#7D39EB] gap-1 ml-1"
            title="Mở giao diện Pomodoro lớn"
          >
            <Maximize2 className="h-3 w-3" />
            <span className="hidden sm:inline">Phóng to</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
