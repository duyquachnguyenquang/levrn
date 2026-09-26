"use client";

import React from "react";
import {
  CalendarClock,
  Plus,
  RefreshCw,
  Calendar,
  Layers,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LedTicker } from "@/components/ui/led-ticker";

interface PlanHeaderProps {
  stats: {
    todayCount: number;
    todayCompletedCount: number;
    weekCount: number;
    weekCompletedCount: number;
    totalCompleted: number;
    totalCount: number;
    weekProgressPercent: number;
  };
  isRefreshing: boolean;
  onRefresh: () => void;
  onAddNew: () => void;
  isSupabaseActive?: boolean;
  errorMessage?: string | null;
}

export function PlanHeader({
  stats,
  isRefreshing,
  onRefresh,
  onAddNew,
  isSupabaseActive = true,
  errorMessage,
}: PlanHeaderProps) {
  return (
    <div className="space-y-4 animate-in fade-in-50 duration-300">
      {/* 1. Header Trang: Tiêu đề + Nút Làm mới & Thêm mới luôn cùng hàng */}
      <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-md bg-[#7D39EB]/15 flex items-center justify-center text-[#7D39EB] shrink-0">
            <CalendarClock className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-foreground tracking-tight truncate">
            Kế hoạch học tập
          </h2>
        </div>

        {/* Cụm 2 nút thao tác bên phải: Làm mới + Thêm (+) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="rounded-md h-8 w-8 sm:h-10 sm:w-10 border-border/70 text-muted-foreground hover:text-foreground transition-all active:scale-95 shrink-0"
            title="Tải lại dữ liệu"
            aria-label="Tải lại dữ liệu"
          >
            <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>

          <Button
            size="icon"
            onClick={onAddNew}
            className="h-8 w-8 sm:h-10 sm:w-10 bg-[#C6FF33] hover:bg-[#B5F51B] text-black font-black rounded-md shadow-md transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shrink-0"
            title="Thêm nhiệm vụ"
            aria-label="Thêm nhiệm vụ"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 stroke-[3]" />
          </Button>
        </div>
      </div>

      {/* Thông báo hướng dẫn nếu chưa tạo bảng study_tasks trên Supabase */}
      {errorMessage && !isSupabaseActive && (
        <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Đã kết nối Supabase, cần khởi tạo bảng 'study_tasks':</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Vào <strong>Supabase Dashboard → SQL Editor</strong> và chạy mục 4 trong file{" "}
                <code className="px-1.5 py-0.5 rounded bg-muted font-mono">supabase_schema.sql</code>.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={onRefresh}
            className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-md text-xs h-7 active:scale-95"
          >
            Kiểm tra lại
          </Button>
        </div>
      )}

      {/* 2. 4 Box chỉ số tối giản: Hạn chế tối đa chữ, tập trung vào số liệu & biểu đồ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        {/* Box 1: Số nhiệm vụ trong ngày */}
        <Card className="rounded-lg border border-border/80 bg-card p-3 sm:p-4 shadow-xs flex items-center justify-between transition-all hover:border-border/90">
          <div className="flex-1 min-w-0 pr-2 sm:pr-3">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block truncate">
              Trong ngày
            </span>
            <LedTicker className="mt-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-3xl font-black text-foreground">
                  {stats.todayCount}
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground">
                  ({stats.todayCompletedCount} xong)
                </span>
              </div>
            </LedTicker>
          </div>
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0">
            <Calendar className="h-4 w-4" />
          </div>
        </Card>

        {/* Box 2: Số nhiệm vụ trong tuần */}
        <Card className="rounded-lg border border-border/80 bg-card p-3 sm:p-4 shadow-xs flex items-center justify-between transition-all hover:border-border/90">
          <div className="flex-1 min-w-0 pr-2 sm:pr-3">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block truncate">
              Trong tuần
            </span>
            <LedTicker className="mt-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-3xl font-black text-foreground">
                  {stats.weekCount}
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground">nhiệm vụ</span>
              </div>
            </LedTicker>
          </div>
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-[#7D39EB]/15 text-[#7D39EB] flex items-center justify-center shrink-0">
            <Layers className="h-4 w-4" />
          </div>
        </Card>

        {/* Box 3: Số nhiệm vụ đã hoàn thành */}
        <Card className="rounded-lg border border-border/80 bg-card p-3 sm:p-4 shadow-xs flex items-center justify-between transition-all hover:border-border/90">
          <div className="flex-1 min-w-0 pr-2 sm:pr-3">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block truncate">
              Đã hoàn thành
            </span>
            <LedTicker className="mt-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-3xl font-black text-[#10B981] dark:text-[#C6FF33]">
                  {stats.totalCompleted}
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground">
                  /{stats.totalCount}
                </span>
              </div>
            </LedTicker>
          </div>
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-[#C6FF33]/20 text-[#1F3E00] dark:text-[#C6FF33] flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </Card>

        {/* Box 4: Tiến độ theo tuần (Biểu đồ mini progress bar) */}
        <Card className="rounded-lg border border-border/80 bg-card p-3 sm:p-4 shadow-xs flex flex-col justify-between transition-all hover:border-border/90">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Tiến độ tuần
            </span>
            <span className="text-xs font-black text-foreground">
              {stats.weekProgressPercent}%
            </span>
          </div>

          <div className="mt-2.5">
            {/* Visual Progress Bar */}
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#C6FF33] h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.weekProgressPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1.5 font-medium">
              <span>{stats.weekCompletedCount} đã xong</span>
              <span>{stats.weekCount - stats.weekCompletedCount} còn lại</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
