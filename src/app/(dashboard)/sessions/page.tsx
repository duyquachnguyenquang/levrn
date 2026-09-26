"use client";

import React, { useState } from "react";
import {
  Timer,
  Layers,
  HelpCircle,
  RefreshCw,
  Plus,
  Flame,
  Brain,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSubjects } from "@/hooks/useSubjects";
import { useSessionsData } from "@/hooks/useSessionsData";
import { PomodoroTimer } from "@/components/sessions/PomodoroTimer";
import { MiniPomodoroBar } from "@/components/sessions/MiniPomodoroBar";
import { FlashcardPlayer } from "@/components/sessions/FlashcardPlayer";
import { FlashcardModal } from "@/components/sessions/FlashcardModal";
import { QuizPlayer } from "@/components/sessions/QuizPlayer";
import { QuizModal } from "@/components/sessions/QuizModal";
import { PomodoroMode } from "@/lib/types";
import { cn } from "@/lib/utils";

type SessionTab = "pomodoro" | "flashcard" | "quiz";

export default function SessionsPage() {
  const { subjects } = useSubjects();
  const {
    sessions,
    flashcards,
    quizzes,
    stats,
    isLoading,
    isSupabaseActive,
    logSession,
    addFlashcard,
    reviewFlashcard,
    deleteFlashcard,
    addQuizQuestion,
    deleteQuizQuestion,
    refreshData,
  } = useSessionsData();

  // Tab hiện tại: "pomodoro" | "flashcard" | "quiz"
  const [activeTab, setActiveTab] = useState<SessionTab>("pomodoro");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // State đếm giờ Pomodoro chia sẻ chung để Mini-Pomodoro dock hoạt động xuyên suốt
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalDurationSeconds, setTotalDurationSeconds] = useState(25 * 60);
  const [currentMode, setCurrentMode] = useState<PomodoroMode>("focus");

  // State Modals
  const [flashcardModalOpen, setFlashcardModalOpen] = useState(false);
  const [quizModalOpen, setQuizModalOpen] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
  };

  const handleSessionComplete = async (
    durationMinutes: number,
    mode: PomodoroMode,
    subjectId?: string,
    notes?: string
  ) => {
    await logSession({
      durationMinutes,
      mode,
      subjectId,
      notes,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300 pb-20">
      {/* 1. Header Trang: Đồng bộ với Môn học của tôi & Quản lý điểm số */}
      <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-md bg-[#7D39EB]/15 flex items-center justify-center text-[#7D39EB] shrink-0">
            <Timer className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-foreground tracking-tight truncate">
              Phiên học tập
            </h2>
          </div>
        </div>

        {/* Nút thao tác: Làm mới + Thêm mới */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="rounded-md h-8 w-8 sm:h-10 sm:w-10 border-border/70 text-muted-foreground hover:text-foreground transition-all active:scale-95 shrink-0"
            title="Tải lại dữ liệu"
            aria-label="Tải lại dữ liệu"
          >
            <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>

          {activeTab === "flashcard" && (
            <Button
              size="icon"
              onClick={() => setFlashcardModalOpen(true)}
              className="h-8 w-8 sm:h-10 sm:w-10 bg-[#C6FF33] hover:bg-[#B5F51B] text-black font-black rounded-md shadow-md transition-all active:scale-95 shrink-0"
              title="Thêm Flashcard"
              aria-label="Thêm Flashcard"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 stroke-[3]" />
            </Button>
          )}

          {activeTab === "quiz" && (
            <Button
              size="icon"
              onClick={() => setQuizModalOpen(true)}
              className="h-8 w-8 sm:h-10 sm:w-10 bg-[#C6FF33] hover:bg-[#B5F51B] text-black font-black rounded-md shadow-md transition-all active:scale-95 shrink-0"
              title="Thêm câu hỏi"
              aria-label="Thêm câu hỏi"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 stroke-[3]" />
            </Button>
          )}
        </div>
      </div>

      {/* 2. Thanh Tabs chuyển đổi 3 công cụ chính */}
      <div className="flex items-center bg-card p-1 rounded-lg border border-border/70 shadow-xs max-w-md mx-auto sm:mx-0">
        <button
          type="button"
          onClick={() => setActiveTab("pomodoro")}
          className={cn(
            "flex-1 h-9 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
            activeTab === "pomodoro"
              ? "bg-[#7D39EB] text-white shadow-xs font-black"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Timer className="h-4 w-4" />
          <span>Pomodoro</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("flashcard")}
          className={cn(
            "flex-1 h-9 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
            activeTab === "flashcard"
              ? "bg-[#7D39EB] text-white shadow-xs font-black"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Layers className="h-4 w-4" />
          <span>Flashcard</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-background/40">
            {stats.totalFlashcards}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("quiz")}
          className={cn(
            "flex-1 h-9 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
            activeTab === "quiz"
              ? "bg-[#7D39EB] text-white shadow-xs font-black"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <HelpCircle className="h-4 w-4" />
          <span>Trắc nghiệm</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-background/40">
            {stats.totalQuizzes}
          </span>
        </button>
      </div>

      {/* 3. Nội dung Tab hiển thị */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7D39EB] border-t-transparent" />
          <p className="text-xs text-muted-foreground font-medium">Đang tải phiên học tập...</p>
        </div>
      ) : (
        <div>
          {/* Tab 1: Đồng hồ Pomodoro */}
          {activeTab === "pomodoro" && (
            <PomodoroTimer
              subjects={subjects}
              selectedSubjectId={selectedSubjectId}
              onSelectSubjectId={setSelectedSubjectId}
              onSessionComplete={handleSessionComplete}
              isRunning={isRunning}
              setIsRunning={setIsRunning}
              timeLeft={timeLeft}
              setTimeLeft={setTimeLeft}
              currentMode={currentMode}
              setCurrentMode={setCurrentMode}
              totalDurationSeconds={totalDurationSeconds}
              setTotalDurationSeconds={setTotalDurationSeconds}
              todayFocusMinutes={stats.todayFocusMinutes}
              todaySessionsCount={stats.todaySessionsCount}
            />
          )}

          {/* Tab 2: Flashcard ôn tập */}
          {activeTab === "flashcard" && (
            <FlashcardPlayer
              flashcards={flashcards}
              subjects={subjects}
              selectedSubjectId={selectedSubjectId}
              onSelectSubjectId={setSelectedSubjectId}
              onReviewCard={reviewFlashcard}
              onDeleteCard={deleteFlashcard}
              onOpenAddModal={() => setFlashcardModalOpen(true)}
            />
          )}

          {/* Tab 3: Luyện trắc nghiệm */}
          {activeTab === "quiz" && (
            <QuizPlayer
              quizzes={quizzes}
              subjects={subjects}
              selectedSubjectId={selectedSubjectId}
              onSelectSubjectId={setSelectedSubjectId}
              onDeleteQuestion={deleteQuizQuestion}
              onOpenAddModal={() => setQuizModalOpen(true)}
            />
          )}
        </div>
      )}

      {/* 4. Mini-Pomodoro Bar nổi: Xuất hiện khi chuyển sang Tab Flashcard hoặc Trắc nghiệm */}
      {activeTab !== "pomodoro" && (
        <MiniPomodoroBar
          isRunning={isRunning}
          onTogglePlay={() => setIsRunning(!isRunning)}
          onReset={() => {
            setIsRunning(false);
            setTimeLeft(totalDurationSeconds);
          }}
          onSkip={() => {
            setIsRunning(false);
            if (currentMode === "focus") {
              setCurrentMode("short_break");
              setTotalDurationSeconds(5 * 60);
              setTimeLeft(5 * 60);
            } else {
              setCurrentMode("focus");
              setTotalDurationSeconds(25 * 60);
              setTimeLeft(25 * 60);
            }
          }}
          timeLeft={timeLeft}
          totalDurationSeconds={totalDurationSeconds}
          currentMode={currentMode}
          subjects={subjects}
          selectedSubjectId={selectedSubjectId}
          onOpenFullPomodoro={() => setActiveTab("pomodoro")}
        />
      )}

      {/* 5. Modals tạo dữ liệu */}
      <FlashcardModal
        open={flashcardModalOpen}
        onOpenChange={setFlashcardModalOpen}
        onSubmit={addFlashcard}
        subjects={subjects}
        defaultSubjectId={selectedSubjectId !== "ALL" ? selectedSubjectId : undefined}
      />

      <QuizModal
        open={quizModalOpen}
        onOpenChange={setQuizModalOpen}
        onSubmit={addQuizQuestion}
        subjects={subjects}
        defaultSubjectId={selectedSubjectId !== "ALL" ? selectedSubjectId : undefined}
      />
    </div>
  );
}
