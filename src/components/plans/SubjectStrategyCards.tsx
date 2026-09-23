"use client";

import React from "react";
import {
  Compass,
  Clock,
  Target,
  Plus,
  Edit,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Sliders,
  Layers,
} from "lucide-react";
import {
  Subject,
  StudyTask,
  SubjectStudyStrategy,
  STUDY_CLASSIFICATIONS,
  StudyPlanClassification,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SubjectStrategyCardsProps {
  subjects: Subject[];
  tasks: StudyTask[];
  strategies: Record<string, SubjectStudyStrategy>;
  onAddTaskForSubject: (subjectId: string) => void;
  onEditStrategy: (subject: Subject) => void;
}

export function SubjectStrategyCards({
  subjects,
  tasks,
  strategies,
  onAddTaskForSubject,
  onEditStrategy,
}: SubjectStrategyCardsProps) {
  if (subjects.length === 0) {
    return (
      <div className="py-16 text-center space-y-3 bg-card rounded-xl border border-border/70 p-6">
        <Compass className="h-10 w-10 text-muted-foreground mx-auto" />
        <h3 className="text-base font-bold text-foreground">Chưa có môn học nào</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Vui lòng thêm môn học tại trang Quản lý Môn học trước khi thiết lập chiến lược.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-border/50">
        <div>
          <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
            <Compass className="h-4 w-4 text-[#7D39EB]" />
            <span>Chiến lược học tập theo từng môn học</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cá nhân hoá phương pháp tự học (lý thuyết, trắc nghiệm, flashcard, bài tập) và mục tiêu giờ học hàng tuần
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((sub) => {
          const strategy = strategies[sub.id] || {
            subjectId: sub.id,
            weeklyTargetHours: sub.targetHours || 6,
            focusTopics: ["Kiến thức nền tảng", "Ôn tập đề thi"],
            recommendedMethods: ["theory", "exercise"] as StudyPlanClassification[],
          };

          const subjectTasks = tasks.filter((t) => t.subjectId === sub.id);
          const completedTasks = subjectTasks.filter((t) => t.status === "completed");
          const totalHoursPlanned = (
            subjectTasks.reduce((acc, t) => acc + (t.durationMinutes || 0), 0) / 60
          ).toFixed(1);

          return (
            <div
              key={sub.id}
              className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs flex flex-col justify-between transition-all duration-200 hover:border-border/90 hover:shadow-md relative overflow-hidden group"
            >
              {/* Vạch màu môn học trên đỉnh card */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: sub.color }}
              />

              <div className="space-y-4">
                {/* Header: Mã môn, Tên môn, Nút chỉnh sửa chiến lược */}
                <div className="flex items-start justify-between gap-2 pt-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-black"
                        style={{
                          backgroundColor: `${sub.color}20`,
                          color: sub.color,
                        }}
                      >
                        {sub.code}
                      </span>
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        {sub.credits ? `${sub.credits} tín chỉ` : "Học phần"}
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-foreground mt-1 line-clamp-1">
                      {sub.name}
                    </h4>
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onEditStrategy(sub)}
                    className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground shrink-0"
                    title="Điều chỉnh mục tiêu & chiến lược"
                  >
                    <Sliders className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Chỉ số giờ học mục tiêu & Tiến độ nhiệm vụ */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/50 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-medium">Mục tiêu tuần</span>
                    <span className="font-extrabold text-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3 text-[#7D39EB]" />
                      {strategy.weeklyTargetHours} giờ/tuần
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-medium">Tiến độ nhiệm vụ</span>
                    <span className="font-extrabold text-foreground flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="h-3 w-3 text-[#C6FF33]" />
                      {completedTasks.length}/{subjectTasks.length} nhiệm vụ
                    </span>
                  </div>
                </div>

                {/* Phương pháp học tập trọng tâm */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Phương pháp trọng tâm:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {strategy.recommendedMethods.map((methodKey) => {
                      const meta = STUDY_CLASSIFICATIONS[methodKey];
                      if (!meta) return null;
                      return (
                        <span
                          key={methodKey}
                          className="px-2 py-0.5 rounded text-[10px] font-bold border"
                          style={{
                            backgroundColor: meta.bgColor,
                            borderColor: meta.borderColor,
                            color: meta.color,
                          }}
                        >
                          {meta.label}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Các chủ đề trọng tâm cần tập trung */}
                {strategy.focusTopics && strategy.focusTopics.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Trọng tâm ôn luyện:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {strategy.focusTopics.map((topic, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-muted/60 text-foreground/80 text-[10px] font-medium border border-border/50"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ghi chú chiến lược */}
                {strategy.notes && (
                  <p className="text-[11px] text-muted-foreground italic bg-muted/20 p-2 rounded border border-border/40">
                    "{strategy.notes}"
                  </p>
                )}
              </div>

              {/* Footer action: Thêm nhiệm vụ cho môn này */}
              <div className="pt-4 mt-4 border-t border-border/50 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground font-mono">
                  Đã xếp {totalHoursPlanned}h tự học
                </span>

                <Button
                  size="sm"
                  onClick={() => onAddTaskForSubject(sub.id)}
                  className="h-8 text-xs font-bold bg-[#C6FF33] hover:bg-[#B5F51B] text-black rounded-md gap-1"
                >
                  <Plus className="h-3.5 w-3.5 stroke-[3]" />
                  <span>Lên nhiệm vụ</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
