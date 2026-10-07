"use client";

import React, { useState, useEffect, useMemo } from "react";
import { CheckCircle2 } from "lucide-react";
import { useSubjects } from "@/hooks/useSubjects";
import { useStudyPlans } from "@/hooks/useStudyPlans";
import { useGroups } from "@/hooks/useGroups";
import { useAttendance } from "@/hooks/useAttendance";
import { useNotifications } from "@/hooks/useNotifications";
import {
  ScheduleCalendar,
  toDateKey,
} from "@/components/dashboard/ScheduleCalendar";
import { DashboardTasksCard } from "@/components/dashboard/DashboardTasksCard";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Subject } from "@/lib/types";
import { calculateAttendedCount } from "@/lib/checkinUtils";

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
  const { profile } = useUserProfile();
  const [greeting, setGreeting] = useState<string>("Chào buổi sáng");

  // Quản lý Điểm danh & Thông báo
  const {
    records: attendanceRecords,
    checkinMultipleSubjectsForDate,
    cancelCheckinForDate,
  } = useAttendance(subjects);
  const { addNotification } = useNotifications();
  const [checkinToast, setCheckinToast] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => toDateKey(today), [today]);

  // Ngày đang được chọn để theo dõi lịch học trong ngày (mặc định hôm nay)
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    return toDateKey(today);
  });

  useEffect(() => {
    setGreeting(getTimeBasedGreeting());
  }, []);

  // Xử lý điểm danh / điểm danh bù thẳng từ Lịch học
  const handleCheckinDate = async (dateStr: string, subjectsToMark: Subject[]) => {
    if (dateStr > todayKey) {
      setCheckinToast("Chưa đến ngày học, không thể điểm danh trước!");
      setTimeout(() => setCheckinToast(null), 3000);
      return { success: false, message: "Chưa đến ngày học" };
    }

    const res = await checkinMultipleSubjectsForDate(dateStr, subjectsToMark);
    if (res.success) {
      const parts = dateStr.split("-");
      const dateVi = parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateStr;
      const codes = subjectsToMark.map((s) => s.code).join(", ");
      const isPast = dateStr < todayKey;

      const firstSub = subjectsToMark[0];
      const wasAlreadyChecked = attendanceRecords.some(
        (r) =>
          r.subjectId === firstSub.id &&
          r.date === dateStr &&
          (r.status === "present" || r.status === "late")
      );
      const subRecords = attendanceRecords.filter((r) => r.subjectId === firstSub.id);
      const currentAttended = calculateAttendedCount(subRecords);
      const attendedCount = wasAlreadyChecked ? currentAttended : currentAttended + 1;
      const totalWeeks = firstSub.totalWeeks || 15;

      const title = isPast
        ? `Điểm danh bù: [${codes}] ngày ${dateVi}`
        : `Điểm danh thành công: [${codes}] ngày ${dateVi}`;

      const message = `Đã ghi nhận điểm danh môn [${codes}] ngày ${dateVi} (Đã học ${attendedCount}/${totalWeeks} ngày).`;

      await addNotification({
        title,
        message,
        type: "success",
        category: "attendance",
        link: "/dashboard",
      });

      setCheckinToast(
        isPast
          ? `Đã điểm danh bù ngày ${dateVi} cho môn [${codes}] (Đã học ${attendedCount}/${totalWeeks} ngày)!`
          : `Đã điểm danh môn [${codes}] ngày ${dateVi} (Đã học ${attendedCount}/${totalWeeks} ngày)!`
      );
      setTimeout(() => setCheckinToast(null), 4000);
    }
    return res;
  };

  // Xử lý hủy điểm danh một ngày khi cần
  const handleCancelCheckinDate = async (dateStr: string, subjectsToCancel: Subject[]) => {
    const res = await cancelCheckinForDate(
      dateStr,
      subjectsToCancel.map((s) => s.id)
    );
    if (res.success) {
      const parts = dateStr.split("-");
      const dateVi = parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateStr;
      setCheckinToast(`Đã hủy điểm danh ngày ${dateVi}!`);
      setTimeout(() => setCheckinToast(null), 3000);
    }
    return res;
  };

  return (
    <div className="space-y-6 sm:space-y-7 animate-in fade-in-50 duration-300">
      {/* Toast thông báo điểm danh */}
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

      {/* 1. Lời chào theo thời gian */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
          <span>{greeting}, {profile.fullName || "Quang Duy"}</span>
          <span className="text-2xl">👋</span>
        </h2>
      </div>

      {/* 2. BỐ CỤC DASHBOARD: LỊCH HỌC BÊN TRÁI, NHIỆM VỤ BÊN PHẢI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Cột trái: Lịch học (tích hợp tính năng Điểm danh & Điểm danh bù) */}
        <ScheduleCalendar
          subjects={subjects}
          selectedDateStr={selectedDateStr}
          onSelectDate={setSelectedDateStr}
          tasks={planTasks}
          onAddTask={addPlanTask}
          onUpdateTask={updatePlanTask}
          onRefreshTasks={refreshPlanTasks}
          attendanceRecords={attendanceRecords}
          onCheckinDate={handleCheckinDate}
          onCancelCheckinDate={handleCancelCheckinDate}
        />

        {/* Cột phải: Nhiệm vụ (Lịch học, Nhiệm vụ cá nhân & Nhiệm vụ nhóm trong tuần) */}
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
