"use client";

import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AttendanceSummaryCardsProps {
  overallRate: number;
  totalPresent: number;
  totalLate: number;
  totalExcused: number;
  totalAbsent: number;
  atRiskCount: number;
  barredCount: number;
  totalSubjects: number;
}

export function AttendanceSummaryCards({
  overallRate,
  totalPresent,
  totalLate,
  totalExcused,
  totalAbsent,
  atRiskCount,
  barredCount,
  totalSubjects,
}: AttendanceSummaryCardsProps) {
  const isHealthy = overallRate >= 80 && barredCount === 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {/* 1. Tỷ lệ chuyên cần chung */}
      <Card className="border border-border/80 bg-card hover:border-[#7D39EB]/50 transition-all rounded-lg shadow-xs">
        <CardContent className="p-4 sm:p-4.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tỷ lệ chuyên cần
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-foreground">
                {overallRate}%
              </span>
              <span
                className={cn(
                  "text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5",
                  isHealthy
                    ? "bg-emerald-500/15 text-emerald-500"
                    : "bg-amber-500/15 text-amber-500"
                )}
              >
                <TrendingUp className="h-3 w-3" />
                {isHealthy ? "Đạt chuẩn" : "Cần chú ý"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Trung bình trên {totalSubjects} môn học
            </p>
          </div>
          <div className="h-11 w-11 rounded-lg bg-[#7D39EB]/10 border border-[#7D39EB]/20 flex items-center justify-center text-[#7D39EB] shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      {/* 2. Số buổi có mặt & đi trễ */}
      <Card className="border border-border/80 bg-card hover:border-emerald-500/50 transition-all rounded-lg shadow-xs">
        <CardContent className="p-4 sm:p-4.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Đã tham dự
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-emerald-500">
                {totalPresent}
              </span>
              {totalLate > 0 && (
                <span className="text-[11px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                  +{totalLate} trễ
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Buổi học có mặt đầy đủ
            </p>
          </div>
          <div className="h-11 w-11 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      {/* 3. Tổng số buổi vắng */}
      <Card className="border border-border/80 bg-card hover:border-amber-500/50 transition-all rounded-lg shadow-xs">
        <CardContent className="p-4 sm:p-4.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tổng số buổi vắng
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-red-500">
                {totalAbsent}
              </span>
              {totalExcused > 0 && (
                <span className="text-[11px] font-bold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded-md">
                  {totalExcused} có phép
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {totalAbsent + totalExcused} buổi nghỉ tích lũy
            </p>
          </div>
          <div className="h-11 w-11 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
            <Clock className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      {/* 4. Cảnh báo nguy cơ cấm thi */}
      <Card
        className={cn(
          "border transition-all rounded-lg shadow-xs",
          barredCount > 0
            ? "border-red-500/80 bg-red-500/5"
            : atRiskCount > 0
            ? "border-amber-500/80 bg-amber-500/5"
            : "border-border/80 bg-card hover:border-[#C6FF33]/50"
        )}
      >
        <CardContent className="p-4 sm:p-4.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Cảnh báo cấm thi
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={cn(
                  "text-2xl sm:text-3xl font-extrabold font-mono tracking-tight",
                  barredCount > 0
                    ? "text-red-500"
                    : atRiskCount > 0
                    ? "text-amber-500"
                    : "text-emerald-500"
                )}
              >
                {barredCount > 0 ? barredCount : atRiskCount}
              </span>
              <span
                className={cn(
                  "text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-md",
                  barredCount > 0
                    ? "bg-red-500/20 text-red-400 animate-pulse"
                    : atRiskCount > 0
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-emerald-500/15 text-emerald-500"
                )}
              >
                {barredCount > 0
                  ? "Bị cấm thi!"
                  : atRiskCount > 0
                  ? "Cận kề nguy cơ"
                  : "An toàn 100%"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Quy chế vắng tối đa 20%
            </p>
          </div>
          <div
            className={cn(
              "h-11 w-11 rounded-lg border flex items-center justify-center shrink-0",
              barredCount > 0
                ? "bg-red-500/15 border-red-500/30 text-red-500"
                : atRiskCount > 0
                ? "bg-amber-500/15 border-amber-500/30 text-amber-500"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
            )}
          >
            {barredCount > 0 || atRiskCount > 0 ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <ShieldCheck className="h-5 w-5" />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
