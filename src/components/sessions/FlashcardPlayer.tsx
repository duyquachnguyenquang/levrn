"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Shuffle,
  Plus,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  Trash2,
  BookOpen,
  Layers,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Flashcard, Subject } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FlashcardPlayerProps {
  flashcards: Flashcard[];
  subjects: Subject[];
  selectedSubjectId: string;
  onSelectSubjectId: (id: string) => void;
  onReviewCard: (cardId: string, rating: "easy" | "medium" | "hard") => void;
  onDeleteCard: (cardId: string) => void;
  onOpenAddModal: () => void;
}

export function FlashcardPlayer({
  flashcards,
  subjects,
  selectedSubjectId,
  onSelectSubjectId,
  onReviewCard,
  onDeleteCard,
  onOpenAddModal,
}: FlashcardPlayerProps) {
  // Lọc thẻ theo môn học được chọn
  const filteredCards = useMemo(() => {
    if (selectedSubjectId === "ALL") return flashcards;
    return flashcards.filter((c) => c.subjectId === selectedSubjectId);
  }, [flashcards, selectedSubjectId]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [deckList, setDeckList] = useState<Flashcard[]>(filteredCards);

  // Cập nhật danh sách khi bộ lọc thay đổi
  useEffect(() => {
    setDeckList(filteredCards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  }, [filteredCards]);

  const currentCard = deckList[currentIndex];

  // Lật thẻ
  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  // Chuyển thẻ tiếp theo
  const handleNext = useCallback(() => {
    if (currentIndex < deckList.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  }, [currentIndex, deckList.length]);

  // Quay lại thẻ trước
  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  }, [currentIndex]);

  // Xáo trộn bộ thẻ (Shuffle)
  const handleShuffle = () => {
    const shuffled = [...deckList].sort(() => Math.random() - 0.5);
    setDeckList(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  };

  // Đánh giá ôn tập (Spaced Repetition)
  const handleRating = (rating: "easy" | "medium" | "hard") => {
    if (currentCard) {
      onReviewCard(currentCard.id, rating);
    }
    handleNext();
  };

  // Phím tắt bàn phím (Space = lật, Mũi tên trái/phải = chuyển thẻ)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Chỉ kích hoạt nếu không focus vào input/textarea
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        handleFlip();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleFlip, handleNext, handlePrev]);

  // Môn học của thẻ hiện tại
  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject>();
    subjects.forEach((s) => map.set(s.id, s));
    return map;
  }, [subjects]);

  const currentSub = currentCard ? subjectMap.get(currentCard.subjectId) : null;
  const currentSubColor = currentSub?.color || "#7D39EB";

  // Thống kê bộ thẻ
  const masteredCount = deckList.filter((c) => c.isMastered).length;
  const totalCount = deckList.length;
  const masteredPercent = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;

  if (deckList.length === 0) {
    return (
      <div className="py-16 text-center space-y-4 bg-card rounded-lg border border-dashed border-border/80 p-8">
        <Sparkles className="h-12 w-12 text-muted-foreground/60 mx-auto" />
        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground">Chưa có Flashcard nào</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {selectedSubjectId !== "ALL"
              ? "Môn học này chưa có thẻ ghi nhớ nào. Bấm nút bên dưới để tạo thẻ mới!"
              : "Bắt đầu tạo bộ flashcard ôn tập đầu tiên để rèn luyện trí nhớ dài hạn."}
          </p>
        </div>
        <Button
          type="button"
          onClick={onOpenAddModal}
          className="h-9 px-4 text-xs font-bold bg-[#C6FF33] hover:bg-[#B5F51B] text-black shadow-xs gap-1.5 rounded-lg"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm Flashcard mới</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 1. Thanh công cụ & Bộ lọc bộ thẻ */}
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
            <option value="ALL">Tất cả môn học ({flashcards.length} thẻ)</option>
            {subjects.map((s) => {
              const count = flashcards.filter((c) => c.subjectId === s.id).length;
              return (
                <option key={s.id} value={s.id}>
                  [{s.code}] {s.name} ({count} thẻ)
                </option>
              );
            })}
          </select>
        </div>

        {/* Nút hành động: Xáo trộn & Thêm thẻ mới */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleShuffle}
            className="h-8 px-2.5 rounded-md text-xs font-semibold gap-1.5 border-border/80"
            title="Xáo trộn thứ tự thẻ"
          >
            <Shuffle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Xáo trộn</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onOpenAddModal}
            className="h-8 px-3 rounded-md text-xs font-bold bg-[#C6FF33] hover:bg-[#B5F51B] text-black shadow-xs gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Thêm thẻ</span>
          </Button>
        </div>
      </div>

      {/* 2. Thanh tiến độ ôn tập */}
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground px-1">
        <span className="font-mono font-bold text-foreground">
          Thẻ {currentIndex + 1} / {totalCount}
        </span>

        {/* Thanh bar % đã thuộc */}
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden border border-border/50">
            <div
              className="bg-[#C6FF33] h-full transition-all duration-300 rounded-full"
              style={{ width: `${masteredPercent}%` }}
            />
          </div>
          <span className="font-mono text-[11px] font-bold text-foreground shrink-0">
            {masteredPercent}% đã thuộc
          </span>
        </div>
      </div>

      {/* 3. Thẻ 3D Flip Card */}
      <div
        className="w-full min-h-[300px] sm:min-h-[340px] perspective-[1200px] cursor-pointer select-none"
        onClick={handleFlip}
      >
        <div
          className={cn(
            "relative w-full h-full min-h-[300px] sm:min-h-[340px] rounded-lg transition-transform duration-500 transform-style-3d shadow-xl border border-border/80",
            isFlipped ? "rotate-y-180" : ""
          )}
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* ==========================================
              MẶT TRƯỚC (FRONT): Khái niệm / Câu hỏi
          ========================================== */}
          <div
            className="absolute inset-0 w-full h-full p-6 sm:p-8 rounded-lg bg-card flex flex-col justify-between backface-hidden overflow-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            {/* Vạch màu môn học ở đỉnh */}
            <div
              className="absolute top-0 left-0 right-0 h-2"
              style={{ backgroundColor: currentSubColor }}
            />

            {/* Header mặt trước */}
            <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
              <div className="flex items-center gap-2">
                <span
                  className="font-black px-2 py-0.5 rounded text-[11px]"
                  style={{
                    backgroundColor: `${currentSubColor}20`,
                    color: currentSubColor,
                  }}
                >
                  {currentSub?.code || "MÔN"}
                </span>
                <span className="font-semibold text-muted-foreground flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  <span>{currentCard.deckName}</span>
                </span>
              </div>

              {currentCard.isMastered && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#10B981] dark:text-[#C6FF33] bg-[#C6FF33]/15 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Đã thuộc</span>
                </span>
              )}
            </div>

            {/* Nội dung câu hỏi mặt trước */}
            <div className="my-auto py-6 text-center space-y-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#7D39EB] dark:text-[#a87ffb]">
                Khái niệm / Thuật ngữ
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-foreground leading-snug tracking-tight max-w-xl mx-auto">
                {currentCard.front}
              </h2>

              {/* Gợi ý nếu có */}
              {currentCard.hint && (
                <div className="pt-2">
                  {showHint ? (
                    <p className="text-xs text-amber-500 dark:text-amber-400 italic bg-amber-500/10 border border-amber-500/25 p-2 rounded-lg max-w-md mx-auto">
                      💡 Gợi ý: {currentCard.hint}
                    </p>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowHint(true);
                      }}
                      className="h-7 text-[11px] font-semibold text-muted-foreground hover:text-amber-500 gap-1"
                    >
                      <HelpCircle className="h-3 w-3" />
                      <span>Xem gợi ý</span>
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Footer mặt trước: Nhắc nhở bấm lật */}
            <div className="flex items-center justify-between text-xs text-muted-foreground/70 pt-2 border-t border-border/40">
              <span className="font-mono text-[10px]">Phím Space để lật</span>
              <span className="text-[11px] font-bold text-[#7D39EB] dark:text-[#a87ffb] flex items-center gap-1">
                <span>Nhấn để xem đáp án</span>
                <RotateCw className="h-3 w-3" />
              </span>
            </div>
          </div>

          {/* ==========================================
              MẶT SAU (BACK): Định nghĩa / Câu trả lời
          ========================================== */}
          <div
            className="absolute inset-0 w-full h-full p-6 sm:p-8 rounded-lg bg-card border-2 border-[#7D39EB]/40 flex flex-col justify-between backface-hidden overflow-hidden rotate-y-180"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            {/* Header mặt sau */}
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#10B981] dark:text-[#C6FF33]">
                Đáp án / Định nghĩa
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteCard(currentCard.id);
                }}
                className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                title="Xoá thẻ này"
                aria-label="Xoá thẻ này"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Nội dung câu trả lời mặt sau */}
            <div className="my-auto py-4 text-center space-y-3">
              <p className="text-sm sm:text-base font-bold text-foreground leading-relaxed whitespace-pre-wrap max-w-xl mx-auto">
                {currentCard.back}
              </p>
            </div>

            {/* Footer mặt sau: Đánh giá độ nhớ (Spaced Repetition) */}
            <div className="pt-3 border-t border-border/50 space-y-2">
              <p className="text-[10px] text-center font-bold text-muted-foreground uppercase tracking-wider">
                Bạn nhớ kiến thức này thế nào?
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRating("hard");
                  }}
                  className="h-8 px-4 text-xs font-bold bg-destructive/15 text-destructive hover:bg-destructive/25 border border-destructive/30 rounded-md"
                >
                  🔴 Khó
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRating("medium");
                  }}
                  className="h-8 px-4 text-xs font-bold bg-amber-500/15 text-amber-500 hover:bg-amber-500/25 border border-amber-500/30 rounded-md"
                >
                  🟡 Vừa
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRating("easy");
                  }}
                  className="h-8 px-4 text-xs font-black bg-[#C6FF33] hover:bg-[#B5F51B] text-black shadow-xs rounded-md"
                >
                  🟢 Đã thuộc!
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Cụm điều khiển chuyển thẻ: Previous / Flip / Next */}
      <div className="flex items-center justify-center gap-4 pt-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="h-9 w-9 rounded-lg border-border/80 text-foreground transition-all disabled:opacity-40"
          title="Thẻ trước"
          aria-label="Thẻ trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={handleFlip}
          className="h-9 px-4 rounded-lg text-xs font-bold gap-1.5 shadow-xs"
        >
          <RotateCw className="h-3.5 w-3.5" />
          <span>Lật thẻ (Space)</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleNext}
          disabled={currentIndex === deckList.length - 1}
          className="h-9 w-9 rounded-lg border-border/80 text-foreground transition-all disabled:opacity-40"
          title="Thẻ tiếp theo"
          aria-label="Thẻ tiếp theo"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
