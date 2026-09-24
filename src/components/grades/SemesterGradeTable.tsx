"use client";

import React, { useState } from "react";
import {
  Zap,
  Layers,
  Edit2,
  Trash2,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  GraduationCap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CourseGrade, SemesterGPASummary } from "@/lib/types";
import {
  score10ToScore4,
  score10ToLetter,
  getLetterGradeStyle,
  calculateComponentsScore,
  simulateRequiredExamScores,
} from "@/lib/gradeUtils";
import { cn } from "@/lib/utils";

interface SemesterGradeTableProps {
  semesterSummaries: SemesterGPASummary[];
  onEditCourse: (course: CourseGrade) => void;
  onDeleteCourse: (id: string) => void;
  filterSemester?: string;
  searchQuery?: string;
}

export function SemesterGradeTable({
  semesterSummaries,
  onEditCourse,
  onDeleteCourse,
  filterSemester,
  searchQuery = "",
}: SemesterGradeTableProps) {
  // Trạng thái thu gọn/mở rộng từng bảng học kỳ
  const [collapsedSemesters, setCollapsedSemesters] = useState<Record<string, boolean>>({});

  const toggleSemester = (sem: string) => {
    setCollapsedSemesters((prev) => ({
      ...prev,
      [sem]: !prev[sem],
    }));
  };

  // Lọc theo học kỳ nếu có
  const filteredSummaries = semesterSummaries.filter((s) => {
    if (filterSemester && s.semester !== filterSemester) return false;
    return true;
  });

  if (filteredSummaries.length === 0) {
    return (
      <div className="p-12 text-center border border-dashed border-border/80 rounded-2xl bg-card/50 space-y-3">
        <HelpCircle className="h-10 w-10 text-muted-foreground mx-auto" />
        <h4 className="font-bold text-base text-foreground">Không tìm thấy môn học nào</h4>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Chưa có môn học nào phù hợp với bộ lọc. Bạn có thể thêm môn mới hoặc chọn học kỳ khác.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {filteredSummaries.map((summary) => {
        const isCollapsed = collapsedSemesters[summary.semester] || false;

        // Lọc môn học trong kỳ theo từ khóa tìm kiếm
        const courses = summary.courses.filter((c) => {
          if (!searchQuery) return true;
          const q = searchQuery.toLowerCase();
          return (
            c.subjectName.toLowerCase().includes(q) ||
            c.subjectCode.toLowerCase().includes(q)
          );
        });

        if (courses.length === 0 && searchQuery) {
          return null;
        }

        return (
          <Card
            key={summary.semester}
            className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs transition-all hover:border-border/90"
          >
            {/* Header học kỳ */}
            <div className="p-4 sm:p-5 bg-muted/20 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div
                onClick={() => toggleSemester(summary.semester)}
                className="flex items-center gap-3 cursor-pointer select-none group"
              >
                <button
                  type="button"
                  aria-label="Thu gọn/mở rộng học kỳ"
                  className="h-7 w-7 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight flex items-center gap-2">
                    <span>{summary.semester}</span>
                    <Badge variant="outline" className="text-xs font-semibold px-2 py-0">
                      {courses.length} môn
                    </Badge>
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Đã tích lũy {summary.earnedCredits}/{summary.totalCredits} tín chỉ
                  </span>
                </div>
              </div>

              {/* Chỉ số GPA của học kỳ */}
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    GPA Học Kỳ
                  </span>
                  <div className="flex items-baseline gap-1.5 justify-end">
                    <span className="font-mono font-black text-lg text-[#7D39EB]">
                      {summary.gpa4 > 0 ? summary.gpa4.toFixed(2) : "--"}
                    </span>
                    <span className="text-xs text-muted-foreground">/ 4.0</span>
                    {summary.gpa10 > 0 && (
                      <span className="text-xs text-muted-foreground font-mono">
                        ({summary.gpa10.toFixed(1)}/10)
                      </span>
                    )}
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-bold px-2.5 py-1",
                    getLetterGradeStyle(summary.letterGrade).badgeClass
                  )}
                >
                  {summary.academicStanding}
                </Badge>
              </div>
            </div>

            {/* Nội dung danh sách môn */}
            {!isCollapsed && (
              <>
                {/* 1. Giao diện Mobile: Card tinh gọn chỉ hiển thị điểm final, tên môn, mã môn và số tín chỉ */}
                <div className="md:hidden p-3 space-y-2">
                  {courses.map((course) => {
                    let displayScore10: number | null = null;
                    if (course.gradingMethod === "final_only") {
                      displayScore10 = course.finalScore;
                    } else {
                      const compCalc = calculateComponentsScore(course.components);
                      displayScore10 = course.finalScore ?? compCalc.finalScore;
                    }

                    return (
                      <div
                        key={course.id}
                        onClick={() => onEditCourse(course)}
                        className="w-full text-left p-3.5 rounded-xl border border-border/70 bg-card hover:border-[#7D39EB]/50 hover:bg-muted/20 transition-all active:scale-[0.99] cursor-pointer flex items-center justify-between gap-3 shadow-2xs group"
                      >
                        {/* Cụm bên trái: Mã môn + Số tín chỉ (hàng trên) & Tên môn (hàng dưới) */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded-md bg-[#7D39EB]/15 text-[#7D39EB] border border-[#7D39EB]/25 shrink-0">
                              {course.subjectCode}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1 shrink-0">
                              <GraduationCap className="h-3 w-3" />
                              <span>{course.credits} TC</span>
                            </span>
                          </div>
                          <h4 className="font-bold text-xs sm:text-sm text-foreground line-clamp-1 group-hover:text-[#7D39EB] transition-colors">
                            {course.subjectName}
                          </h4>
                        </div>

                        {/* Cụm bên phải: Điểm Final & Mũi tên chỉ thị mở pop-up */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <span className="text-[9px] uppercase font-bold text-muted-foreground block">
                              Final
                            </span>
                            <span className="font-mono font-black text-base text-foreground">
                              {displayScore10 !== null ? displayScore10.toFixed(2) : "--"}
                            </span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground transition-colors shrink-0" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 2. Giao diện Desktop: Bảng tính chi tiết đầy đủ cột */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/10 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                      <th className="py-3 px-4 w-28">Mã môn</th>
                      <th className="py-3 px-4 min-w-[180px]">Tên môn học</th>
                      <th className="py-3 px-3 text-center w-16">Tín chỉ</th>
                      <th className="py-3 px-4 min-w-[200px]">Cơ chế & Điểm thành phần</th>
                      <th className="py-3 px-3 text-center w-24">Điểm Final</th>
                      <th className="py-3 px-3 text-center w-20">Hệ 4</th>
                      <th className="py-3 px-3 text-center w-16">Chữ</th>
                      <th className="py-3 px-3 text-center w-24">Kết quả</th>
                      <th className="py-3 px-4 text-right w-24">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {courses.map((course) => {
                      // Tính toán điểm
                      let displayScore10: number | null = null;
                      let isComplete = true;

                      if (course.gradingMethod === "final_only") {
                        displayScore10 = course.finalScore;
                        isComplete = displayScore10 !== null;
                      } else {
                        const compCalc = calculateComponentsScore(course.components);
                        displayScore10 = course.finalScore ?? compCalc.finalScore;
                        isComplete = compCalc.isComplete;
                      }

                      const finalScore4 = score10ToScore4(displayScore10);
                      const letter = score10ToLetter(displayScore10);
                      const letterStyle = getLetterGradeStyle(letter);
                      const isPassed = finalScore4 >= 1.0;

                      return (
                        <tr
                          key={course.id}
                          className="hover:bg-muted/30 transition-colors group"
                        >
                          {/* 1. Mã môn */}
                          <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                            {course.subjectCode}
                          </td>

                          {/* 2. Tên môn */}
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-foreground block text-sm">
                              {course.subjectName}
                            </span>
                            {course.notes && (
                              <span className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                                {course.notes}
                              </span>
                            )}
                          </td>

                          {/* 3. Tín chỉ */}
                          <td className="py-3.5 px-3 text-center font-mono font-semibold text-foreground">
                            {course.credits}
                          </td>

                          {/* 4. Cơ chế & Chi tiết thành phần */}
                          <td className="py-3.5 px-4">
                            {course.gradingMethod === "final_only" ? (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-semibold bg-[#7D39EB]/10 text-[#7D39EB] border-[#7D39EB]/25"
                                >
                                  <Zap className="h-3 w-3 mr-1" />
                                  Điểm Final trực tiếp
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">
                                  (Môn cũ)
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center gap-1">
                                  {course.components.map((comp) => {
                                    const hasScore =
                                      comp.score !== null &&
                                      comp.score !== undefined &&
                                      !isNaN(Number(comp.score));
                                    return (
                                      <span
                                        key={comp.id}
                                        className={cn(
                                          "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono border",
                                          hasScore
                                            ? "bg-muted/70 text-foreground border-border/80"
                                            : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                                        )}
                                        title={`${comp.name} (${comp.weight}%): ${
                                          hasScore ? comp.score + "đ" : "Chưa có điểm"
                                        }`}
                                      >
                                        <span className="font-sans mr-1">{comp.name}</span>
                                        <strong>{comp.weight}%</strong>:{" "}
                                        {hasScore ? (
                                          <strong className="text-foreground ml-0.5">
                                            {comp.score}
                                          </strong>
                                        ) : (
                                          <span className="text-amber-500 ml-0.5">--</span>
                                        )}
                                      </span>
                                    );
                                  })}
                                </div>

                                {/* Simulator popover nếu môn đang học dở */}
                                {!isComplete && (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <button className="inline-flex items-center gap-1 text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline font-semibold cursor-pointer">
                                        <Sparkles className="h-3 w-3" />
                                        <span>Xem điểm thi cần đạt</span>
                                      </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-72 p-3 text-xs border-border bg-card shadow-xl" align="start">
                                      <h5 className="font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                                        <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
                                        <span>Mô phỏng điểm thi cuối kỳ</span>
                                      </h5>
                                      <p className="text-[11px] text-muted-foreground mb-2">
                                        Cần đạt tối thiểu ở cột điểm cuối kỳ để:
                                      </p>
                                      <div className="space-y-1.5">
                                        {simulateRequiredExamScores(course.components).slice(0, 3).map((sim, i) => (
                                          <div key={i} className="flex items-center justify-between p-1.5 rounded bg-muted/40">
                                            <span className="font-medium text-foreground text-[11px]">{sim.targetLabel}</span>
                                            <strong className={cn(
                                              "font-mono text-xs",
                                              sim.isAlreadyAchieved ? "text-emerald-500" : sim.isFeasible ? "text-cyan-500" : "text-red-500"
                                            )}>
                                              {sim.isAlreadyAchieved ? "✓ Đã đạt" : `${sim.requiredScore}đ`}
                                            </strong>
                                          </div>
                                        ))}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                )}
                              </div>
                            )}
                          </td>

                          {/* 5. Điểm Final (Hệ 10) */}
                          <td className="py-3.5 px-3 text-center">
                            {displayScore10 !== null ? (
                              <span className="font-mono font-black text-sm text-foreground">
                                {displayScore10.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground font-mono text-xs">
                                --
                              </span>
                            )}
                          </td>

                          {/* 6. Quy đổi hệ 4 */}
                          <td className="py-3.5 px-3 text-center font-mono font-bold text-foreground text-sm">
                            {displayScore10 !== null ? finalScore4.toFixed(1) : "--"}
                          </td>

                          {/* 7. Điểm chữ */}
                          <td className="py-3.5 px-3 text-center">
                            {displayScore10 !== null ? (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "font-bold text-xs px-2 py-0",
                                  letterStyle.badgeClass
                                )}
                              >
                                {letter}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground font-mono text-xs">
                                --
                              </span>
                            )}
                          </td>

                          {/* 8. Kết quả */}
                          <td className="py-3.5 px-3 text-center">
                            {displayScore10 === null ? (
                              <Badge
                                variant="outline"
                                className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-[10px] font-semibold"
                              >
                                Đang học
                              </Badge>
                            ) : isPassed ? (
                              <Badge
                                variant="outline"
                                className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-[10px] font-semibold"
                              >
                                ✓ Đạt
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-red-500/10 text-red-500 border-red-500/30 text-[10px] font-semibold"
                              >
                                Học lại
                              </Badge>
                            )}
                          </td>

                          {/* 9. Thao tác */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onEditCourse(course)}
                                className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                                title="Chỉnh sửa điểm"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm(`Bạn có chắc chắn muốn xóa môn ${course.subjectName}?`)) {
                                    onDeleteCourse(course.id);
                                  }
                                }}
                                className="h-8 w-8 text-muted-foreground hover:text-red-500 rounded-lg"
                                title="Xóa môn"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
          </Card>
        );
      })}
    </div>
  );
}
