"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
  Flame,
  Coffee,
  Brain,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Subject, PomodoroMode } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PomodoroTimerProps {
  subjects: Subject[];
  selectedSubjectId: string;
  onSelectSubjectId: (id: string) => void;
  onSessionComplete: (durationMinutes: number, mode: PomodoroMode, subjectId?: string, notes?: string) => void;
  // Shared state props with parent for the MiniPomodoroBar
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  currentMode: PomodoroMode;
  setCurrentMode: (mode: PomodoroMode) => void;
  totalDurationSeconds: number;
  setTotalDurationSeconds: (sec: number) => void;
  todayFocusMinutes: number;
  todaySessionsCount: number;
}

export function PomodoroTimer({
  subjects,
  selectedSubjectId,
  onSelectSubjectId,
  onSessionComplete,
  isRunning,
  setIsRunning,
  timeLeft,
  setTimeLeft,
  currentMode,
  setCurrentMode,
  totalDurationSeconds,
  setTotalDurationSeconds,
  todayFocusMinutes,
  todaySessionsCount,
}: PomodoroTimerProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sessionNote, setSessionNote] = useState("");
  const [customFocusMinutes, setCustomFocusMinutes] = useState(25);

  // Âm thanh chuông báo kết thúc phiên bằng Web Audio API
  const playChime = useCallback(() => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";

      // Chuông đôi nhẹ nhàng: nốt D5 -> A5
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);

      osc.start();
      osc.stop(ctx.currentTime + 0.9);
    } catch {}
  }, [soundEnabled]);

  // Bộ đếm thời gian
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      // Hết giờ
      playChime();
      setIsRunning(false);

      const durationMinutes = Math.round(totalDurationSeconds / 60);
      onSessionComplete(
        durationMinutes,
        currentMode,
        selectedSubjectId !== "ALL" ? selectedSubjectId : undefined,
        sessionNote.trim() || undefined
      );

      // Chuyển chế độ gợi ý
      if (currentMode === "focus") {
        switchMode("short_break", 5);
      } else {
        switchMode("focus", customFocusMinutes);
      }
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, timeLeft, totalDurationSeconds, currentMode, selectedSubjectId, sessionNote, onSessionComplete, playChime, customFocusMinutes]);

  // Chuyển chế độ (Tập trung, Nghỉ ngắn, Nghỉ dài)
  const switchMode = (mode: PomodoroMode, minutes: number) => {
    setIsRunning(false);
    setCurrentMode(mode);
    const secs = minutes * 60;
    setTotalDurationSeconds(secs);
    setTimeLeft(secs);
  };

  // Chọn thời gian tập trung
  const handleSelectFocusDuration = (mins: number) => {
    setCustomFocusMinutes(mins);
    if (currentMode === "focus") {
      switchMode("focus", mins);
    }
  };

  // Nút Play / Pause
  const handleTogglePlay = () => {
    setIsRunning(!isRunning);
  };

  // Nút Reset
  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(totalDurationSeconds);
  };

  // Nút Skip
  const handleSkip = () => {
    setIsRunning(false);
    if (currentMode === "focus") {
      switchMode("short_break", 5);
    } else {
      switchMode("focus", customFocusMinutes);
    }
  };

  // Tính % tiến độ
  const progressPercent = totalDurationSeconds > 0
    ? Math.max(0, Math.min(100, Math.round(((totalDurationSeconds - timeLeft) / totalDurationSeconds) * 100)))
    : 0;

  // Format mm:ss
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // SVG circular ring calculations (r=120, circumference = 2 * PI * 120 ≈ 754)
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * progressPercent) / 100;

  // Màu sắc chủ đạo theo chế độ
  const modeColor =
    currentMode === "focus"
      ? "#7D39EB" // Brand Violet
      : currentMode === "short_break"
      ? "#C6FF33" // Brand Lime
      : "#06B6D4"; // Cyan

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  return (
    <div className="space-y-6">
      {/* 1. Chọn chế độ Pomodoro (Tập trung / Nghỉ ngắn / Nghỉ dài) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/70 shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-lg border border-border/50 w-full sm:w-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => switchMode("focus", customFocusMinutes)}
            className={cn(
              "flex-1 sm:flex-none h-8 px-3 rounded-md text-xs font-bold gap-1.5 transition-all",
              currentMode === "focus"
                ? "bg-[#7D39EB] text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Brain className="h-3.5 w-3.5" />
            <span>Tập trung</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => switchMode("short_break", 5)}
            className={cn(
              "flex-1 sm:flex-none h-8 px-3 rounded-md text-xs font-bold gap-1.5 transition-all",
              currentMode === "short_break"
                ? "bg-[#C6FF33] text-black shadow-sm font-black"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Coffee className="h-3.5 w-3.5" />
            <span>Nghỉ ngắn (5p)</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => switchMode("long_break", 15)}
            className={cn(
              "flex-1 sm:flex-none h-8 px-3 rounded-md text-xs font-bold gap-1.5 transition-all",
              currentMode === "long_break"
                ? "bg-cyan-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Nghỉ dài (15p)</span>
          </Button>
        </div>

        {/* Nút bật/tắt âm thanh chuông */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={cn(
              "h-8 w-8 rounded-md border-border/80 transition-all",
              soundEnabled ? "text-[#7D39EB]" : "text-muted-foreground"
            )}
            title={soundEnabled ? "Đang bật chuông báo" : "Đã tắt âm thanh"}
          >
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* 2. Khối Đồng Hồ Vòng Tròn Lớn */}
      <Card className="relative overflow-hidden border border-border/80 bg-gradient-to-b from-card to-card/60 p-6 sm:p-10 flex flex-col items-center justify-center text-center shadow-lg">
        {/* Glow nền mờ */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-15 pointer-events-none transition-colors duration-700"
          style={{ backgroundColor: modeColor }}
        />

        {/* Môn học liên kết */}
        <div className="mb-4 flex items-center gap-2 z-10">
          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5 text-[#7D39EB]" />
            <span>Môn học:</span>
          </span>
          <select
            value={selectedSubjectId}
            onChange={(e) => onSelectSubjectId(e.target.value)}
            className="h-7 px-2.5 rounded-md border border-input bg-background/80 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#7D39EB] cursor-pointer"
          >
            <option value="ALL">🎯 Tự do / Học tổng hợp</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                [{s.code}] {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Vòng tròn đếm giờ SVG */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center my-2">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 280 280">
            {/* Vòng nền */}
            <circle
              cx="140"
              cy="140"
              r={radius}
              stroke="currentColor"
              strokeWidth="10"
              fill="transparent"
              className="text-muted/30"
            />
            {/* Vòng tiến độ động */}
            <circle
              cx="140"
              cy="140"
              r={radius}
              stroke={modeColor}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* Hiển thị số phút : giây ở tâm */}
          <div className="absolute flex flex-col items-center justify-center space-y-1">
            <span className="text-5xl sm:text-6xl font-black tracking-tight text-foreground font-mono">
              {timeFormatted}
            </span>
            <span
              className="text-xs font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full"
              style={{
                backgroundColor: `${modeColor}20`,
                color: modeColor,
              }}
            >
              {currentMode === "focus"
                ? "Tập trung cao độ"
                : currentMode === "short_break"
                ? "Nghỉ ngơi ngắn"
                : "Nghỉ ngơi dài"}
            </span>
            {selectedSubject && (
              <span className="text-[11px] font-bold text-muted-foreground mt-1 truncate max-w-[180px]">
                {selectedSubject.code} • {selectedSubject.name}
              </span>
            )}
          </div>
        </div>

        {/* Cụm nút điều khiển: Start / Pause, Reset, Skip */}
        <div className="flex items-center gap-3 mt-6 z-10">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleReset}
            className="h-10 w-10 rounded-full border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-95"
            title="Đặt lại đồng hồ"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            onClick={handleTogglePlay}
            className={cn(
              "h-14 px-8 rounded-full text-base font-black gap-2 shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-95",
              isRunning
                ? "bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/25"
                : "bg-[#C6FF33] hover:bg-[#B5F51B] text-black shadow-[#C6FF33]/25"
            )}
          >
            {isRunning ? (
              <>
                <Pause className="h-5 w-5 fill-current" />
                <span>Tạm dừng</span>
              </>
            ) : (
              <>
                <Play className="h-5 w-5 fill-current ml-0.5" />
                <span>Bắt đầu phiên</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleSkip}
            className="h-10 w-10 rounded-full border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-95"
            title="Bỏ qua phiên hiện tại"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Tùy chọn nhanh thời lượng tập trung khi ở chế độ Focus */}
        {currentMode === "focus" && (
          <div className="flex items-center gap-2 mt-6 text-xs text-muted-foreground z-10">
            <span>Thời lượng:</span>
            {[15, 25, 45, 50, 60].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => handleSelectFocusDuration(mins)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer border",
                  customFocusMinutes === mins
                    ? "bg-[#7D39EB] text-white border-[#7D39EB] shadow-xs"
                    : "border-border/60 bg-background/60 hover:border-border text-foreground/80"
                )}
              >
                {mins}p
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* 3. Thẻ thống kê nhanh hôm nay & ghi chú */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-3.5 rounded-xl border border-border/70 bg-card flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#7D39EB]/15 flex items-center justify-center text-[#7D39EB] shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-muted-foreground">Tập trung hôm nay</p>
            <h4 className="text-xl font-black text-foreground font-mono">
              {todayFocusMinutes} <span className="text-xs font-bold text-muted-foreground">phút</span>
            </h4>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-border/70 bg-card flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#C6FF33]/15 flex items-center justify-center text-[#9ED811] dark:text-[#C6FF33] shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-muted-foreground">Phiên hoàn thành</p>
            <h4 className="text-xl font-black text-foreground font-mono">
              {todaySessionsCount} <span className="text-xs font-bold text-muted-foreground">phiên</span>
            </h4>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-border/70 bg-card flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-500 shrink-0">
            <Flame className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-muted-foreground">Chuỗi học tập</p>
            <h4 className="text-xl font-black text-foreground font-mono">
              {todaySessionsCount > 0 ? "Đang cháy 🔥" : "Khởi động ✨"}
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
}
