"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Subject, QuizQuestionFormData } from "@/lib/types";
import { BookOpen, CheckCircle2, HelpCircle, Tag, FileText } from "lucide-react";

interface QuizModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: QuizQuestionFormData) => Promise<any>;
  subjects: Subject[];
  defaultSubjectId?: string;
}

export function QuizModal({
  open,
  onOpenChange,
  onSubmit,
  subjects,
  defaultSubjectId,
}: QuizModalProps) {
  const [subjectId, setSubjectId] = useState(defaultSubjectId || subjects[0]?.id || "");
  const [topic, setTopic] = useState("");
  const [question, setQuestion] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctIndex, setCorrectIndex] = useState(0);
  const [explanation, setExplanation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      setErrorMsg("Vui lòng nhập nội dung câu hỏi.");
      return;
    }
    if (!optionA.trim() || !optionB.trim()) {
      setErrorMsg("Vui lòng nhập ít nhất 2 đáp án A và B.");
      return;
    }

    const options = [optionA.trim(), optionB.trim()];
    if (optionC.trim()) options.push(optionC.trim());
    if (optionD.trim()) options.push(optionD.trim());

    if (correctIndex >= options.length) {
      setErrorMsg("Đáp án đúng không hợp lệ.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    await onSubmit({
      subjectId: subjectId || (subjects[0]?.id ?? ""),
      topic: topic.trim() || undefined,
      question: question.trim(),
      options,
      correctIndex,
      explanation: explanation.trim() || undefined,
    });

    setIsSubmitting(false);
    setQuestion("");
    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");
    setExplanation("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto p-5 sm:p-6 rounded-lg border border-border/80 bg-card shadow-2xl">
        <DialogHeader className="pb-3 border-b border-border/60">
          <DialogTitle className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#C6FF33]" />
            <span>Thêm Câu Hỏi Trắc Nghiệm Mới</span>
          </DialogTitle>
        </DialogHeader>

        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Môn học & Chủ đề */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                <BookOpen className="h-3.5 w-3.5 text-[#7D39EB]" />
                <span>Môn học</span>
              </Label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background/80 px-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#7D39EB] cursor-pointer"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.code}] {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-[#7D39EB]" />
                <span>Chủ đề bài học</span>
              </Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="VD: Chương 2, Đồ thị..."
                className="h-9 text-xs rounded-md bg-background/80"
              />
            </div>
          </div>

          {/* Câu hỏi */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-[#7D39EB]" />
              <span>Nội dung câu hỏi</span>
              <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="VD: Ma trận đơn vị cấp n có định thức bằng bao nhiêu?"
              rows={3}
              className="text-xs sm:text-sm rounded-lg bg-background/80 resize-none"
              required
            />
          </div>

          {/* 4 Đáp án A, B, C, D */}
          <div className="space-y-2 pt-1 border-t border-border/40">
            <Label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#7D39EB]" />
                <span>Các lựa chọn trả lời</span>
              </span>
              <span className="text-[11px] text-muted-foreground font-normal">
                Bấm nút tròn để chọn đáp án đúng
              </span>
            </Label>

            <div className="space-y-2">
              {/* Đáp án A */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCorrectIndex(0)}
                  className={`h-7 w-7 rounded-full border-2 flex items-center justify-center font-bold text-xs shrink-0 cursor-pointer transition-all ${
                    correctIndex === 0
                      ? "bg-[#C6FF33] border-[#C6FF33] text-black shadow-xs font-black"
                      : "border-border text-muted-foreground hover:border-[#7D39EB]"
                  }`}
                  title="Chọn A là đáp án đúng"
                >
                  A
                </button>
                <Input
                  value={optionA}
                  onChange={(e) => setOptionA(e.target.value)}
                  placeholder="Nội dung đáp án A..."
                  className="h-9 text-xs rounded-md bg-background/80 flex-1"
                  required
                />
              </div>

              {/* Đáp án B */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCorrectIndex(1)}
                  className={`h-7 w-7 rounded-full border-2 flex items-center justify-center font-bold text-xs shrink-0 cursor-pointer transition-all ${
                    correctIndex === 1
                      ? "bg-[#C6FF33] border-[#C6FF33] text-black shadow-xs font-black"
                      : "border-border text-muted-foreground hover:border-[#7D39EB]"
                  }`}
                  title="Chọn B là đáp án đúng"
                >
                  B
                </button>
                <Input
                  value={optionB}
                  onChange={(e) => setOptionB(e.target.value)}
                  placeholder="Nội dung đáp án B..."
                  className="h-9 text-xs rounded-md bg-background/80 flex-1"
                  required
                />
              </div>

              {/* Đáp án C */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCorrectIndex(2)}
                  className={`h-7 w-7 rounded-full border-2 flex items-center justify-center font-bold text-xs shrink-0 cursor-pointer transition-all ${
                    correctIndex === 2
                      ? "bg-[#C6FF33] border-[#C6FF33] text-black shadow-xs font-black"
                      : "border-border text-muted-foreground hover:border-[#7D39EB]"
                  }`}
                  title="Chọn C là đáp án đúng"
                >
                  C
                </button>
                <Input
                  value={optionC}
                  onChange={(e) => setOptionC(e.target.value)}
                  placeholder="Nội dung đáp án C (tuỳ chọn)..."
                  className="h-9 text-xs rounded-md bg-background/80 flex-1"
                />
              </div>

              {/* Đáp án D */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCorrectIndex(3)}
                  className={`h-7 w-7 rounded-full border-2 flex items-center justify-center font-bold text-xs shrink-0 cursor-pointer transition-all ${
                    correctIndex === 3
                      ? "bg-[#C6FF33] border-[#C6FF33] text-black shadow-xs font-black"
                      : "border-border text-muted-foreground hover:border-[#7D39EB]"
                  }`}
                  title="Chọn D là đáp án đúng"
                >
                  D
                </button>
                <Input
                  value={optionD}
                  onChange={(e) => setOptionD(e.target.value)}
                  placeholder="Nội dung đáp án D (tuỳ chọn)..."
                  className="h-9 text-xs rounded-md bg-background/80 flex-1"
                />
              </div>
            </div>
          </div>

          {/* Giải thích chi tiết */}
          <div className="space-y-1.5 pt-1 border-t border-border/40">
            <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-[#7D39EB]" />
              <span>Giải thích đáp án (Hiển thị sau khi làm bài)</span>
            </Label>
            <Textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Giải thích vì sao đáp án này đúng, công thức áp dụng..."
              rows={3}
              className="text-xs rounded-lg bg-background/80 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs font-semibold"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-8 px-4 text-xs font-bold bg-[#C6FF33] hover:bg-[#B5F51B] text-black shadow-xs"
            >
              {isSubmitting ? "Đang lưu..." : "Thêm câu hỏi"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
