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
import { Subject, FlashcardFormData } from "@/lib/types";
import { Sparkles, BookOpen, Layers, FileText, CheckCircle2 } from "lucide-react";

interface FlashcardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FlashcardFormData) => Promise<any>;
  subjects: Subject[];
  defaultSubjectId?: string;
}

export function FlashcardModal({
  open,
  onOpenChange,
  onSubmit,
  subjects,
  defaultSubjectId,
}: FlashcardModalProps) {
  const [subjectId, setSubjectId] = useState(defaultSubjectId || subjects[0]?.id || "");
  const [deckName, setDeckName] = useState("Chung");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [hint, setHint] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) {
      setErrorMsg("Vui lòng nhập cả mặt trước (khái niệm) và mặt sau (định nghĩa).");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    await onSubmit({
      subjectId: subjectId || (subjects[0]?.id ?? ""),
      deckName: deckName.trim() || "Chung",
      front: front.trim(),
      back: back.trim(),
      hint: hint.trim() || undefined,
      difficulty: "medium",
    });

    setIsSubmitting(false);
    setFront("");
    setBack("");
    setHint("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-5 sm:p-6 rounded-lg border border-border/80 bg-card shadow-2xl">
        <DialogHeader className="pb-3 border-b border-border/60">
          <DialogTitle className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#C6FF33]" />
            <span>Thêm Flashcard Ôn Tập Mới</span>
          </DialogTitle>
        </DialogHeader>

        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Môn học & Tên bộ thẻ */}
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
              <Label className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                <Layers className="h-3.5 w-3.5 text-[#7D39EB]" />
                <span>Bộ thẻ (Deck)</span>
              </Label>
              <Input
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                placeholder="VD: Chương 1, Thuật ngữ..."
                className="h-9 text-xs rounded-md bg-background/80"
              />
            </div>
          </div>

          {/* Mặt trước: Khái niệm / Câu hỏi */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-[#7D39EB]" />
              <span>Mặt trước (Khái niệm, Câu hỏi, Thuật ngữ)</span>
              <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="VD: Định lý Fermat về cực trị của hàm số là gì?"
              rows={3}
              className="text-xs sm:text-sm rounded-lg bg-background/80 resize-none"
              required
            />
          </div>

          {/* Mặt sau: Định nghĩa / Đáp án */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#7D39EB]" />
              <span>Mặt sau (Định nghĩa, Câu trả lời, Công thức)</span>
              <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="VD: Nếu f(x) đạt cực trị tại x0 và có đạo hàm tại đó thì f'(x0) = 0."
              rows={4}
              className="text-xs sm:text-sm rounded-lg bg-background/80 resize-none"
              required
            />
          </div>

          {/* Gợi ý (tuỳ chọn) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#7D39EB]" />
              <span>Gợi ý bổ trợ (Tuỳ chọn)</span>
            </Label>
            <Input
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="Gợi ý nhỏ nếu bạn quên..."
              className="h-9 text-xs rounded-md bg-background/80"
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
              {isSubmitting ? "Đang lưu..." : "Thêm Flashcard"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
