"use client";

import React from "react";
import {
  GraduationCap,
  Award,
  BookOpenCheck,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { LedTicker } from "@/components/ui/led-ticker";
import { CumulativeGPASummary } from "@/lib/types";

interface GPASummaryCardProps {
  summary: CumulativeGPASummary;
  selectedSemester?: string;
  onSelectSemester?: (sem: string) => void;
}

export function GPASummaryCard({ summary }: GPASummaryCardProps) {
  const completionRate =
    summary.totalCredits > 0
      ? Math.round((summary.earnedCredits / summary.totalCredits) * 100)
      : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
      {/* Box 1: GPA Hệ 4 */}
      <Card className="rounded-xl border border-border/80 bg-card p-3 sm:p-4 shadow-xs flex items-center justify-between transition-all hover:border-border/90">
        <div className="flex-1 min-w-0 pr-2 sm:pr-3">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block truncate">
            GPA (Hệ 4)
          </span>
          <LedTicker className="mt-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-3xl font-black text-foreground">
                {summary.cumulativeGPA4 > 0 ? summary.cumulativeGPA4.toFixed(2) : "--"}
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground">
                / 4.00{summary.cumulativeGPA4 > 0 && summary.letterGrade && summary.letterGrade !== "--" ? ` (${summary.letterGrade})` : ""}
              </span>
            </div>
          </LedTicker>
        </div>
        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-[#7D39EB]/15 text-[#7D39EB] flex items-center justify-center shrink-0">
          <GraduationCap className="h-4 w-4" />
        </div>
      </Card>

      {/* Box 2: Điểm Hệ 10 */}
      <Card className="rounded-xl border border-border/80 bg-card p-3 sm:p-4 shadow-xs flex items-center justify-between transition-all hover:border-border/90">
        <div className="flex-1 min-w-0 pr-2 sm:pr-3">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block truncate">
            Điểm (Hệ 10)
          </span>
          <LedTicker className="mt-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-3xl font-black text-foreground">
                {summary.cumulativeGPA10 > 0 ? summary.cumulativeGPA10.toFixed(2) : "--"}
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground">
                / 10.0
              </span>
            </div>
          </LedTicker>
        </div>
        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0">
          <TrendingUp className="h-4 w-4" />
        </div>
      </Card>

      {/* Box 3: Xếp Loại Học Lực */}
      <Card className="rounded-xl border border-border/80 bg-card p-3 sm:p-4 shadow-xs flex items-center justify-between transition-all hover:border-border/90">
        <div className="flex-1 min-w-0 pr-2 sm:pr-3">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block truncate">
            Xếp loại
          </span>
          <LedTicker className="mt-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-2xl font-black text-foreground">
                {summary.academicStanding || "Chưa xếp loại"}
              </span>
            </div>
          </LedTicker>
        </div>
        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
          <Award className="h-4 w-4" />
        </div>
      </Card>

      {/* Box 4: Tín Chỉ Tích Lũy */}
      <Card className="rounded-xl border border-border/80 bg-card p-3 sm:p-4 shadow-xs flex items-center justify-between transition-all hover:border-border/90">
        <div className="flex-1 min-w-0 pr-2 sm:pr-3">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block truncate">
            Tín chỉ tích lũy
          </span>
          <LedTicker className="mt-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-3xl font-black text-[#10B981] dark:text-[#C6FF33]">
                {summary.earnedCredits}
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground">
                /{summary.totalCredits} TC ({completionRate}%)
              </span>
            </div>
          </LedTicker>
        </div>
        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-[#C6FF33]/20 text-[#1F3E00] dark:text-[#C6FF33] flex items-center justify-center shrink-0">
          <BookOpenCheck className="h-4 w-4" />
        </div>
      </Card>
    </div>
  );
}
