"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  GraduationCap,
  CheckCircle2,
} from "lucide-react";
import { useSubjects } from "@/hooks/useSubjects";
import { useStudyPlans } from "@/hooks/useStudyPlans";
import { useGroups } from "@/hooks/useGroups";
import { useCourseGrades } from "@/hooks/useCourseGrades";
import { useAttendance } from "@/hooks/useAttendance";
import { useNotifications } from "@/hooks/useNotifications";
import { getSubjectCheckinStatus } from "@/lib/checkinUtils";
import {
  ScheduleCalendar,
  toDateKey,
} from "@/components/dashboard/ScheduleCalendar";
import { DashboardAttendanceCard } from "@/components/dashboard/DashboardAttendanceCard";
import { DashboardTasksCard } from "@/components/dashboard/DashboardTasksCard";
import { AttendanceStatus } from "@/lib/types";

// Tính câu chào dựa theo thời điểm trong ngày
function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) {
    return "Chào buổi sáng";
  } else if (hour >= 11 && hour < 13.5) {
    return "Chào buổi trưa";
  } else if (hour >= 13.5 && hour < 18) {
    return "Chào buổi chiều";
  } else {
    return "Chào buổi tối";
  }
}

export default function DashboardPage() {
  const { subjects } = useSubjects();
  const {
    tasks: planTasks,
    addTask: addPlanTask,
    updateTask: updatePlanTask,
    toggleTaskComplete,
    refreshTasks: refreshPlanTasks,
  } = useStudyPlans();
  const { groups, updateTaskStatus: updateGroupTaskStatus } = useGroups();
  const { cumulativeGPA } = useCourseGrades();
  const [greeting, setGreeting] = useState<string>("Chào buổi sáng");

  // Điểm danh & Thông báo
  const {
    records: attendanceRecords,
    checkinSubjectToday,
    editOrAddAttendanceRecord,
    deleteAttendanceRecord,
  } = useAttendance(subjects);
  const { addNotification } = useNotifications();
  const [checkinToast, setCheckinToast] = useState<string | null>(null);

  // Xử lý điểm danh trực tiếp 1-chạm
  const handleCheckin = async (subject: any) => {
    const res = await checkinSubjectToday(subject);
    if (res.success) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const dateStr = now.toLocaleDateString("vi-VN");
      const status = getSubjectCheckinStatus(subject, attendanceRecords);

      await addNotification({
        title: `Điểm danh thành công: [${subject.code}] ${subject.name}`,
        message: `Bạn đã điểm danh lúc ${timeStr} ngày ${dateStr} (Buổi ${status.sessionNumber}/${status.totalWeeks}). Dữ liệu thời gian điểm danh đã được cập nhật trực tiếp vào Dashboard.`,
        type: "success",
        category: "attendance",
        link: "/dashboard",
      });

      setCheckinToast(
        `Đã điểm danh môn [${subject.code}] ${subject.name} lúc ${timeStr}!`
      );
      setTimeout(() => setCheckinToast(null), 4500);
    }
  };

  // Xử lý chỉnh sửa thời gian điểm danh (áp dụng cho ngày quên điểm danh)
  const handleEditCheckin = async (params: {
    subject: any;
    date: string;
    time?: string;
    status: AttendanceStatus;
    notes?: string;
    recordId?: string;
  }) => {
    const res = await editOrAddAttendanceRecord(params);
    if (res.success) {
      const parts = params.date.split("-");
      const dateVi =
        parts.length === 3
          ? `${parts[2]}/${parts[1]}/${parts[0]}`
          : params.date;
      const timeDisplay = params.time ? `lúc ${params.time}` : "";

      await addNotification({
        title: `Cập nhật điểm danh: [${params.subject.code}] ${params.subject.name}`,
        message: `Đã chỉnh sửa thời gian điểm danh ngày ${dateVi} ${timeDisplay} cho môn [${params.subject.code}] ${params.subject.name}.`,
        type: "info",
        category: "attendance",
        link: "/dashboard",
      });

      setCheckinToast(
        `Đã cập nhật thời gian điểm danh ngày ${dateVi} cho môn [${params.subject.code}]!`
      );
      setTimeout(() => setCheckinToast(null), 4500);
    }
    return res;
  };

  const today = useMemo(() => new Date(), []);

  // Ngày đang được chọn để theo dõi lịch học trong ngày (mặc định hôm nay)
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    return toDateKey(today);
  });

  useEffect(() => {
    setGreeting(getTimeBasedGreeting());
  }, []);

  return (
    <div className="space-y-6 sm:space-y-7 animate-in fade-in-50 duration-300">
      {/* Toast thông báo điểm danh thành công */}
      {checkinToast && (
        <div className="p-3.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between gap-3 shadow-md animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>{checkinToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setCheckinToast(null)}
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer font-bold"
          >
            Đóng
          </button>
        </div>
      )}

      {/* 1. Lời chào theo thời gian & Badge GPA tích lũy nhanh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
          <span>{greeting}, Taylor</span>
          <span className="text-2xl">👋</span>
        </h2>

        {cumulativeGPA.cumulativeGPA4 > 0 && (
          <Link
            href="/grades"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-border/80 bg-card hover:border-[#7D39EB]/50 hover:bg-muted/30 transition-all text-xs font-semibold shadow-xs group w-fit"
            title="Xem chi tiết bảng điểm và GPA"
          >
            <div className="h-6 w-6 rounded-lg bg-[#7D39EB]/15 text-[#7D39EB] flex items-center justify-center">
              <GraduationCap className="h-3.5 w-3.5" />
            </div>
            <span>
              GPA Tích lũy:{" "}
              <strong className="font-mono text-sm font-black text-[#7D39EB]">
                {cumulativeGPA.cumulativeGPA4.toFixed(2)}
              </strong>
              /4.0 ({cumulativeGPA.academicStanding})
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>

      {/* 2. LỊCH HỌC ĐƯA LÊN TRÊN (Toàn chiều rộng) */}
      <ScheduleCalendar
        subjects={subjects}
        selectedDateStr={selectedDateStr}
        onSelectDate={setSelectedDateStr}
        tasks={planTasks}
        onAddTask={addPlanTask}
        onUpdateTask={updatePlanTask}
        onRefreshTasks={refreshPlanTasks}
      />

      {/* 3. ĐIỂM DANH VÀ NHIỆM VỤ ĐƯA XUỐNG DƯỚI - CÂN BẰNG KÍCH THƯỚC (50% - 50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Box 1: Điểm danh (Trái - Đang học / Đã học, Search, Sort, 1 dòng mỗi môn, Pop-up xem chi tiết) */}
        <DashboardAttendanceCard
          subjects={subjects}
          attendanceRecords={attendanceRecords}
          onCheckin={handleCheckin}
          onEditCheckin={handleEditCheckin}
          onDeleteRecord={deleteAttendanceRecord}
        />

        {/* Box 2: Nhiệm vụ (Phải - Lịch học, Nhiệm vụ cá nhân & Nhiệm vụ nhóm trong tuần, Search, Filter, Sort) */}
        <DashboardTasksCard
          subjects={subjects}
          personalTasks={planTasks}
          groups={groups}
          onTogglePersonalTask={async (taskId) => {
            await toggleTaskComplete(taskId);
          }}
          onToggleGroupTask={async (groupId, taskId, completed) => {
            await updateGroupTaskStatus(groupId, taskId, completed ? "done" : "in_progress");
          }}
        />
      </div>
    </div>
  );
}
