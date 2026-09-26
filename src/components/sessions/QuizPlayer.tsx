"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Plus,
  BookOpen,
  Sparkles,
  Award,
  ArrowRight,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QuizQuestion, Subject } from "@/lib/types";
import { cn } from "@/lib/utils";

interface QuizPlayerProps {
  quizzes: QuizQuestion[];
  subjects: Subject[];
  selectedSubjectId: string;
  onSelectSubjectId: (id: string) => void;
  onDeleteQuestion: (id: string) => void;
  onOpenAddModal: () => void;
}

export function QuizPlayer({
  quizzes,
  subjects,
  selectedSubjectId,
  onSelectSubjectId,
  onDeleteQuestion,
  onOpenAddModal,
}: QuizPlayerProps) {
  // Lọc theo môn học
  const filteredQuizzes = useMemo(() => {
    if (selectedSubjectId === "ALL") return quizzes;
    return quizzes.filter((q) => q.subjectId === selectedSubjectId);
  }, [quizzes, selectedSubjectId]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Reset quiz khi đổi môn hoặc danh sách câu hỏi
  useEffect(() => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setCorrectAnswersCount(0);
    setIsFinished(false);
  }, [filteredQuizzes]);

  const currentQuestion = filteredQuizzes[currentIndex];

  // Chọn đáp án
  const handleSelectOption = (idx: number) => {
    if (isAnswered || !currentQuestion) return;

    setSelectedOption(idx);
    setIsAnswered(true);

    if (idx === currentQuestion.correctIndex) {
      setCorrectAnswersCount((prev) => prev + 1);
    }
  };

  // Sang câu hỏi tiếp theo
  const handleNextQuestion = () => {
    if (currentIndex < filteredQuizzes.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
    }
  };

  // Làm lại bài quiz
  const handleRestartQuiz = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setCorrectAnswersCount(0);
    setIsFinished(false);
  };

  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject>();
    subjects.forEach((s) => map.set(s.id, s));
    return map;
  }, [subjects]);

  const currentSub = currentQuestion ? subjectMap.get(currentQuestion.subjectId) : null;
  const currentSubColor = currentSub?.color || "#7D39EB";

  // Thống kê % hoàn thành
  const totalQuestions = filteredQuizzes.length;
  const scorePercent = totalQuestions > 0 ? Math.round((correctAnswersCount / totalQuestions) * 100) : 0;

  if (filteredQuizzes.length === 0) {
    return (
      <div className="py-16 text-center space-y-4 bg-card rounded-lg border border-dashed border-border/80 p-8">
        <HelpCircle className="h-12 w-12 text-muted-foreground/60 mx-auto" />
        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground">Chưa có câu hỏi trắc nghiệm nào</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {selectedSubjectId !== "ALL"
              ? "Môn học này chưa có câu hỏi trắc nghiệm nào trong ngân hàng đề. Hãy tạo câu hỏi đầu tiên!"
              : "Thêm câu hỏi trắc nghiệm để bắt đầu luyện tập phản xạ và kiểm tra kiến thức."}
          </p>
        </div>
        <Button
          type="button"
          onClick={onOpenAddModal}
          className="h-9 px-4 text-xs font-bold bg-[#C6FF33] hover:bg-[#B5F51B] text-black shadow-xs gap-1.5 rounded-lg"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm câu hỏi trắc nghiệm</span>
        </Button>
      </div>
    );
  }

  // Màn hình Kết quả khi hoàn thành bài thi
  if (isFinished) {
    return (
      <div className="space-y-6 animate-in zoom-in-95 duration-300 max-w-lg mx-auto py-6">
        <Card className="p-8 text-center space-y-6 border border-border/80 bg-card shadow-2xl relative overflow-hidden rounded-lg">
          <div
            className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: scorePercent >= 70 ? "#C6FF33" : "#7D39EB" }}
          />

          <div className="h-16 w-16 mx-auto rounded-lg bg-[#C6FF33]/15 flex items-center justify-center text-[#9ED811] dark:text-[#C6FF33]">
            <Award className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-foreground tracking-tight">
              Hoàn Thành Bài Luyện Tập!
            </h2>
            <p className="text-xs text-muted-foreground">
              {scorePercent >= 80
                ? "Xuất sắc! Bạn đã nắm rất vững kiến thức phần này. 🔥"
                : scorePercent >= 50
                ? "Khá tốt! Bạn có thể xem lại một vài câu chưa chính xác. ✨"
                : "Cần ôn tập thêm! Hãy ôn lại qua Flashcard trước khi làm lại nhé. 📖"}
            </p>
          </div>

          {/* Vòng điểm số */}
          <div className="p-5 rounded-lg bg-muted/40 border border-border/50 max-w-xs mx-auto space-y-1">
            <span className="text-4xl font-black text-foreground font-mono">
              {correctAnswersCount} / {totalQuestions}
            </span>
            <p className="text-xs font-bold text-[#7D39EB] dark:text-[#C6FF33]">
              Độ chính xác: {scorePercent}%
            </p>
          </div>

          {/* Cụm nút hành động */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRestartQuiz}
              className="h-9 px-4 text-xs font-bold gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Làm lại bài này</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={onOpenAddModal}
              className="h-9 px-4 text-xs font-bold bg-[#C6FF33] hover:bg-[#B5F51B] text-black shadow-xs gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Thêm câu hỏi mới</span>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const optionLetters = ["A", "B", "C", "D"];

  return (
    <div className="space-y-5">
      {/* 1. Thanh công cụ & Bộ lọc câu hỏi */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-lg border border-border/70 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1 shrink-0">
            <BookOpen className="h-3.5 w-3.5 text-[#7D39EB]" />
            <span>Môn:</span>
          </span>
          <select
            value={selectedSubjectId}
            onChange={(e) => onSelectSubjectId(e.target.value)}
            className="h-8 px-2.5 rounded-md border border-input bg-background/80 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#7D39EB] cursor-pointer w-full sm:w-auto"
          >
            <option value="ALL">Tất cả môn ({quizzes.length} câu hỏi)</option>
            {subjects.map((s) => {
              const count = quizzes.filter((q) => q.subjectId === s.id).length;
              return (
                <option key={s.id} value={s.id}>
                  [{s.code}] {s.name} ({count} câu)
                </option>
              );
            })}
          </select>
        </div>

        {/* Nút hành động */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRestartQuiz}
            className="h-8 px-2.5 rounded-md text-xs font-semibold gap-1.5 border-border/80"
            title="Bắt đầu lại từ câu đầu tiên"
            aria-label="Bắt đầu lại từ câu đầu tiên"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Làm lại</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onOpenAddModal}
            className="h-8 px-3 rounded-md text-xs font-bold bg-[#C6FF33] hover:bg-[#B5F51B] text-black shadow-xs gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Thêm câu hỏi</span>
          </Button>
        </div>
      </div>

      {/* 2. Thanh tiến độ câu hỏi */}
      <div className="space-y-1.5 px-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
          <span className="font-bold text-foreground">
            Câu {currentIndex + 1} / {totalQuestions}
          </span>
          <span className="text-[#7D39EB] dark:text-[#C6FF33] font-bold">
            Đúng {correctAnswersCount} câu
          </span>
        </div>
        <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden border border-border/50">
          <div
            className="bg-[#7D39EB] h-full transition-all duration-300 rounded-full"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* 3. Thẻ câu hỏi trắc nghiệm */}
      <Card className="relative overflow-hidden border border-border/80 bg-card p-6 sm:p-8 space-y-6 shadow-xl rounded-lg">
        {/* Vạch màu môn học ở đỉnh */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ backgroundColor: currentSubColor }}
        />

        {/* Header câu hỏi */}
        <div className="flex items-center justify-between gap-2 text-[11px] pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="font-black px-2 py-0.5 rounded text-[11px]"
              style={{
                backgroundColor: `${currentSubColor}20`,
                color: currentSubColor,
              }}
            >
              {currentSub?.code || "MÔN"}
            </span>
            {currentQuestion.topic && (
              <span className="font-bold text-muted-foreground">
                • {currentQuestion.topic}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onDeleteQuestion(currentQuestion.id)}
            className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
            title="Xoá câu hỏi này"
            aria-label="Xoá câu hỏi này"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Nội dung câu hỏi */}
        <h3 className="text-base sm:text-lg font-black text-foreground leading-relaxed">
          {currentQuestion.question}
        </h3>

        {/* Danh sách 4 Đáp án A, B, C, D */}
        <div className="space-y-2.5 pt-1">
          {currentQuestion.options.map((opt, idx) => {
            const letter = optionLetters[idx] || String(idx + 1);
            const isSelected = selectedOption === idx;
            const isCorrect = idx === currentQuestion.correctIndex;

            // Xác định kiểu hiển thị sau khi đã chọn
            let btnClasses = "border-border/70 bg-background/60 hover:border-[#7D39EB]/60 hover:bg-card text-foreground";
            let badgeClasses = "bg-muted text-muted-foreground border-border";

            if (isAnswered) {
              if (isCorrect) {
                // Đáp án đúng luôn tô màu xanh lá / neon
                btnClasses = "border-[#10B981] dark:border-[#C6FF33] bg-[#C6FF33]/15 text-foreground shadow-xs font-bold";
                badgeClasses = "bg-[#C6FF33] border-[#C6FF33] text-black font-black";
              } else if (isSelected && !isCorrect) {
                // Người dùng chọn sai -> tô màu đỏ
                btnClasses = "border-destructive bg-destructive/15 text-destructive font-bold";
                badgeClasses = "bg-destructive border-destructive text-white font-black";
              } else {
                // Các đáp án khác mờ đi
                btnClasses = "border-border/40 opacity-40 text-muted-foreground";
              }
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectOption(idx)}
                disabled={isAnswered}
                className={cn(
                  "w-full p-3.5 rounded-lg border text-left flex items-center justify-between gap-3 transition-all cursor-pointer disabled:cursor-default",
                  btnClasses
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={cn(
                      "h-7 w-7 rounded-md border flex items-center justify-center font-bold text-xs shrink-0 transition-colors",
                      badgeClasses
                    )}
                  >
                    {letter}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold leading-normal">
                    {opt}
                  </span>
                </div>

                {isAnswered && (
                  <div className="shrink-0 ml-2">
                    {isCorrect && (
                      <CheckCircle2 className="h-5 w-5 text-[#10B981] dark:text-[#C6FF33]" />
                    )}
                    {isSelected && !isCorrect && (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Hộp giải thích chi tiết sau khi đã trả lời */}
        {isAnswered && (
          <div className="p-4 rounded-lg bg-muted/40 border border-border/60 space-y-2 animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-[#C6FF33]" />
                <span>Giải thích đáp án</span>
              </span>
              <span className="text-xs font-bold text-muted-foreground">
                Đáp án đúng:{" "}
                <strong className="text-[#10B981] dark:text-[#C6FF33]">
                  {optionLetters[currentQuestion.correctIndex]}
                </strong>
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {currentQuestion.explanation || "Không có giải thích chi tiết cho câu hỏi này."}
            </p>
          </div>
        )}

        {/* Nút sang câu tiếp theo */}
        {isAnswered && (
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={handleNextQuestion}
              className="h-10 px-5 rounded-lg text-xs font-black bg-[#C6FF33] hover:bg-[#B5F51B] text-black shadow-md gap-1.5"
            >
              <span>{currentIndex === totalQuestions - 1 ? "Xem kết quả bài thi" : "Câu tiếp theo"}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
