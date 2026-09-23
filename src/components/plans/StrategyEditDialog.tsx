"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Subject,
  SubjectStudyStrategy,
  StudyPlanClassification,
  STUDY_CLASSIFICATIONS,
} from "@/lib/types";
import { Plus, Trash2, Clock, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

interface StrategyEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: Subject | null;
  strategy?: SubjectStudyStrategy;
  onSaveStrategy: (
    subjectId: string,
    strategy: Partial<SubjectStudyStrategy>
  ) => Promise<{ success: boolean }>;
}

export function StrategyEditDialog({
  open,
  onOpenChange,
  subject,
  strategy,
  onSaveStrategy,
}: StrategyEditDialogProps) {
  const [targetHours, setTargetHours] = useState(6);
  const [methods, setMethods] = useState<StudyPlanClassification[]>(["theory", "exercise"]);
  const [focusTopics, setFocusTopics] = useState<string[]>([]);
  const [newTopicText, setNewTopicText] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open || !subject) return;

    if (strategy) {
      setTargetHours(strategy.weeklyTargetHours || 6);
      setMethods(strategy.recommendedMethods || ["theory", "exercise"]);
      setFocusTopics(strategy.focusTopics || []);
      setNotes(strategy.notes || "");
    } else {
      setTargetHours(subject.targetHours || 6);
      setMethods(["theory", "exercise"]);
      setFocusTopics(["Kiến thức nền tảng", "Luyện đề thi"]);
      setNotes("");
    }
  }, [open, subject, strategy]);

  const toggleMethod = (key: StudyPlanClassification) => {
    if (methods.includes(key)) {
      if (methods.length > 1) {
        setMethods(methods.filter((m) => m !== key));
      }
    } else {
      setMethods([...methods, key]);
    }
  };

  const handleAddTopic = () => {
    if (!newTopicText.trim()) return;
    if (!focusTopics.includes(newTopicText.trim())) {
      setFocusTopics([...focusTopics, newTopicText.trim()]);
    }
    setNewTopicText("");
  };

  const handleRemoveTopic = (topic: string) => {
    setFocusTopics(focusTopics.filter((t) => t !== topic));
  };

  const handleSave = async () => {
    if (!subject) return;
    setIsSaving(true);

    await onSaveStrategy(subject.id, {
      weeklyTargetHours: targetHours,
      recommendedMethods: methods,
      focusTopics,
      notes: notes.trim() || undefined,
    });

    setIsSaving(false);
    onOpenChange(false);
  };

  if (!subject) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-5 sm:p-6 rounded-xl">
        <DialogHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <span
              className="px-2 py-0.5 rounded text-xs font-black"
              style={{
                backgroundColor: `${subject.color}20`,
                color: subject.color,
              }}
            >
              {subject.code}
            </span>
            <DialogTitle className="text-base sm:text-lg font-black text-foreground">
              Điều chỉnh chiến lược: {subject.name}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Mục tiêu số giờ tự học mỗi tuần */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold flex items-center justify-between">
              <span>Mục tiêu tự học hàng tuần</span>
              <span className="font-extrabold text-[#7D39EB] dark:text-[#A78BFA]">
                {targetHours} giờ / tuần
              </span>
            </Label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={1}
                max={40}
                value={targetHours}
                onChange={(e) => setTargetHours(Number(e.target.value))}
                className="text-xs h-9 bg-card w-28 font-bold"
              />
              <span className="text-xs text-muted-foreground">
                Tương đương ~{(targetHours / 7).toFixed(1)} giờ mỗi ngày
              </span>
            </div>
          </div>

          {/* Phương pháp học tập trọng tâm */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">
              Phương pháp học tập trọng tâm (Chọn nhiều)
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(STUDY_CLASSIFICATIONS) as StudyPlanClassification[]).map((key) => {
                const meta = STUDY_CLASSIFICATIONS[key];
                const isSelected = methods.includes(key);

                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => toggleMethod(key)}
                    className={cn(
                      "p-2 rounded-lg border text-left transition-all cursor-pointer text-xs font-bold flex items-center justify-between",
                      isSelected
                        ? "font-black shadow-xs"
                        : "bg-muted/30 border-border/60 text-muted-foreground"
                    )}
                    style={
                      isSelected
                        ? {
                            backgroundColor: meta.bgColor,
                            borderColor: meta.color,
                            color: meta.color,
                          }
                        : {}
                    }
                  >
                    <span>{meta.label}</span>
                    {isSelected && <span className="text-xs">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Trọng tâm ôn luyện / Chủ đề quan trọng */}
          <div className="space-y-2">
            <Label className="text-xs font-bold">
              Chủ đề trọng tâm cần ôn luyện
            </Label>

            {focusTopics.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-muted/30 rounded-lg border border-border/50">
                {focusTopics.map((topic, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded bg-card text-foreground text-xs font-medium border border-border/60 flex items-center gap-1.5"
                  >
                    <span>{topic}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(topic)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <Input
                value={newTopicText}
                onChange={(e) => setNewTopicText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTopic();
                  }
                }}
                placeholder="Nhập chủ đề (VD: Thuật toán đồ thị, Định thức ma trận)..."
                className="text-xs h-8 bg-card"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddTopic}
                className="h-8 text-xs shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Ghi chú chiến lược cá nhân */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Ghi chú chiến lược riêng</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Môn này cần làm nhiều trắc nghiệm tốc độ cao, ôn lý thuyết 15 phút mỗi sáng..."
              className="text-xs bg-card min-h-[60px]"
            />
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-border/60 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs h-9 rounded-md"
          >
            Huỷ
          </Button>
          <Button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="bg-[#C6FF33] hover:bg-[#B5F51B] text-black font-extrabold text-xs h-9 rounded-md px-4 shadow-md"
          >
            {isSaving ? "Đang lưu..." : "Lưu chiến lược"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
