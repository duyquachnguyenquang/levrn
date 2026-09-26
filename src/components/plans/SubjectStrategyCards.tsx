"use client";

import React from "react";
import {
  Compass,
  Clock,
  Target,
  Plus,
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
import { getSubjectCoverImage } from "@/lib/imagePresets";

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
            Cá nhân hoá phương pháp tự học và mục tiêu giờ học hàng tuần theo từng môn.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
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

          const coverUrl = getSubjectCoverImage(sub);

          return (
            <div
              key={sub.id}
              className="group relative rounded-xl border border-border/70 dark:border-border/60 bg-card overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
            >
              {/* 1. Ảnh bìa môn học (Visual Banner) */}
              <div className="relative h-40 sm:h-44 w-full overflow-hidden bg-muted/40 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverUrl}
                  alt={sub.name}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* Badge mã môn học nổi trên ảnh góc trái */}
                <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-1.5 flex-wrap">
                  <span
                    className="font-mono font-black text-[11px] px-2.5 py-1 rounded-md text-white backdrop-blur-md border border-white/20 shadow-sm"
                    style={{ backgroundColor: `${sub.color || "#7D39EB"}cc` }}
                  >
                    {sub.code}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-md text-white/90 border border-white/10 shadow-2xs">
                    {sub.credits ? `${sub.credits} Tín chỉ` : "Học phần"}
                  </span>
                </div>

                {/* Gradient tối nhẹ ở đáy ảnh */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />

                {/* Đường viền chuyển tiếp cứng cáp (Structured shelf notch) */}
                <div className="absolute -bottom-[1px] left-0 right-0 z-10 pointer-events-none">
                  <svg
                    className="w-full h-5 fill-card text-card block"
                    viewBox="0 0 400 20"
                    preserveAspectRatio="none"
                  >
                    <path d="M 0,20 L 0,8 L 300,8 C 312,8 316,0 326,0 L 374,0 C 384,0 388,8 400,8 L 400,20 Z" />
                  </svg>
                </div>

                {/* Nút chỉnh sửa chiến lược nằm trong khía notch */}
                <div className="absolute bottom-1 right-3.5 z-20">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onEditStrategy(sub)}
                    className="h-7 w-7 rounded-md bg-card shadow-xs border border-border/70 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-transform hover:scale-105"
                    title="Điều chỉnh mục tiêu & chiến lược"
                  >
                    <Sliders className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* 2. Thân nội dung Card - Thoáng đãng, có khoảng thở đầy đủ */}
              <div className="px-5 pt-3.5 pb-4 space-y-3 flex-1 flex flex-col justify-between bg-card">
                <div className="space-y-2">
                  {/* Hàng meta: Giờ mục tiêu • Số task (pr-9 để chừa khoảng cho notch) */}
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground/85 pr-9 pt-0.5">
                    <span className="font-semibold text-foreground/90 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-[#7D39EB]" />
                      Mục tiêu: {strategy.weeklyTargetHours}h/tuần
                    </span>
                    <span className="text-muted-foreground/40">•</span>
                    <span className="text-muted-foreground/90">
                      {completedTasks.length}/{subjectTasks.length} việc xong
                    </span>
                  </div>

                  {/* Tên môn học */}
                  <h4
                    className="text-base sm:text-lg font-bold text-foreground line-clamp-1 leading-snug group-hover:text-[#7D39EB] transition-colors pt-0.5"
                    title={sub.name}
                  >
                    {sub.name}
                  </h4>

                  {/* Phương pháp học tập trọng tâm */}
                  <div className="space-y-1.5 pt-1">
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
                            className="px-2.5 py-0.5 rounded-md text-[11px] font-bold border shadow-2xs"
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

                  {/* Các chủ đề trọng tâm */}
                  {strategy.focusTopics && strategy.focusTopics.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Trọng tâm ôn luyện:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {strategy.focusTopics.map((topic, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-0.5 rounded-md bg-muted/60 text-foreground/80 text-[10.5px] font-medium border border-border/50"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Footer */}
                <div className="pt-3 border-t border-border/40 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-mono font-medium">
                    Đã xếp: <strong className="text-foreground">{totalHoursPlanned}h</strong> tự học
                  </span>

                  <Button
                    size="sm"
                    onClick={() => onAddTaskForSubject(sub.id)}
                    className="h-8 text-xs font-bold bg-[#C6FF33] hover:bg-[#B5F51B] text-black rounded-md gap-1 shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5 stroke-[3]" />
                    <span>Lên nhiệm vụ</span>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
