"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useSubjects } from "@/hooks/useSubjects";
import { useStudyPlans } from "@/hooks/useStudyPlans";
import { PlanHeader } from "@/components/plans/PlanHeader";
import { PlanToolbar, PlanDisplayMode } from "@/components/plans/PlanToolbar";
import { TaskGrid } from "@/components/plans/TaskGrid";
import { TaskListView } from "@/components/plans/TaskListView";
import { TaskFormDialog } from "@/components/plans/TaskFormDialog";
import {
  StudyTask,
  StudyTaskFormData,
  StudyTaskStatus,
} from "@/lib/types";

// Helper lấy ngày YYYY-MM-DD
function getTodayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getTomorrowString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function PlansPage() {
  const { subjects } = useSubjects();
  const {
    tasks,
    isLoading,
    isSupabaseActive,
    errorMessage,
    stats,
    addTask,
    updateTask,
    updateTaskStatus,
    toggleTaskComplete,
    deleteTask,
    rescheduleTask,
    refreshTasks,
  } = useStudyPlans();

  // Dạng hiển thị: "grid" (Thẻ) | "list" (Danh sách)
  const [displayMode, setDisplayMode] = useState<PlanDisplayMode>("grid");

  // Bộ lọc
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("ALL");
  const [selectedClassification, setSelectedClassification] = useState("ALL");
  const [selectedTimeFilter, setSelectedTimeFilter] = useState("ALL");
  const [selectedPriority, setSelectedPriority] = useState("ALL");

  // State Dialog Thêm / Sửa
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<StudyTask | null>(null);
  const [dialogStatus, setDialogStatus] = useState<StudyTaskStatus>("todo");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Đặt lại toàn bộ bộ lọc
  const handleResetFilters = useCallback(() => {
    setSelectedSubjectId("ALL");
    setSelectedClassification("ALL");
    setSelectedTimeFilter("ALL");
    setSelectedPriority("ALL");
    setSearchQuery("");
  }, []);

  // Tính khoảng ngày tuần hiện tại (Thứ 2 -> Chủ Nhật)
  const weekRange = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - diffToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const format = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    return {
      start: format(monday),
      end: format(sunday),
    };
  }, []);

  // Lọc nhiệm vụ
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // 1. Tìm kiếm theo từ khoá
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchDesc = task.description?.toLowerCase().includes(q);
        const matchNotes = task.notes?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchNotes) return false;
      }

      // 2. Lọc theo Môn học
      if (selectedSubjectId !== "ALL" && task.subjectId !== selectedSubjectId) {
        return false;
      }

      // 3. Lọc theo Phân loại chiến lược
      if (selectedClassification !== "ALL" && task.classification !== selectedClassification) {
        return false;
      }

      // 4. Lọc theo Độ ưu tiên
      if (selectedPriority !== "ALL" && task.priority !== selectedPriority) {
        return false;
      }

      // 5. Lọc theo Thời gian
      if (selectedTimeFilter === "today" && task.date !== getTodayString()) {
        return false;
      }
      if (selectedTimeFilter === "tomorrow" && task.date !== getTomorrowString()) {
        return false;
      }
      if (selectedTimeFilter === "week") {
        if (task.date < weekRange.start || task.date > weekRange.end) {
          return false;
        }
      }

      return true;
    });
  }, [
    tasks,
    searchQuery,
    selectedSubjectId,
    selectedClassification,
    selectedPriority,
    selectedTimeFilter,
    weekRange,
  ]);

  // Làm mới dữ liệu
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshTasks();
    setIsRefreshing(false);
  };

  // Mở Dialog thêm mới
  const handleAddNew = () => {
    setEditingTask(null);
    setDialogStatus("todo");
    setTaskDialogOpen(true);
  };

  // Mở Dialog thêm mới với trạng thái chỉ định từ cột Kanban
  const handleAddNewWithStatus = (status: StudyTaskStatus) => {
    setEditingTask(null);
    setDialogStatus(status);
    setTaskDialogOpen(true);
  };

  // Mở Dialog chỉnh sửa nhiệm vụ
  const handleEditTask = (task: StudyTask) => {
    setEditingTask(task);
    setDialogStatus(task.status);
    setTaskDialogOpen(true);
  };

  // Dời sang ngày mai
  const handleRescheduleTomorrow = async (id: string) => {
    await rescheduleTask(id, getTomorrowString());
  };

  // Lưu nhiệm vụ từ Form Dialog
  const handleTaskSubmit = async (formData: StudyTaskFormData) => {
    if (editingTask) {
      return await updateTask(editingTask.id, formData);
    } else {
      return await addTask(formData);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in-50 duration-300 pb-12">
      {/* 1. Header Trang: Tiêu đề + 2 nút thao tác chuẩn (Tải lại & Thêm) + 4 Box chỉ số tối giản */}
      <PlanHeader
        stats={stats}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        onAddNew={handleAddNew}
        isSupabaseActive={isSupabaseActive}
        errorMessage={errorMessage}
      />

      {/* 2. Thanh công cụ tinh gọn: Tìm kiếm + Nút 'Bộ lọc' duy nhất + Chuyển đổi hiển thị (Cột / Thẻ / List / Giờ) */}
      <PlanToolbar
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        displayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
        selectedSubjectId={selectedSubjectId}
        onSelectSubjectId={setSelectedSubjectId}
        selectedClassification={selectedClassification}
        onSelectClassification={setSelectedClassification}
        selectedTimeFilter={selectedTimeFilter}
        onSelectTimeFilter={setSelectedTimeFilter}
        selectedPriority={selectedPriority}
        onSelectPriority={setSelectedPriority}
        onResetFilters={handleResetFilters}
        subjects={subjects}
      />

      {/* 3. Khu vực hiển thị danh sách nhiệm vụ */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7D39EB] border-t-transparent" />
          <p className="text-xs text-muted-foreground font-medium">Đang tải kế hoạch học tập...</p>
        </div>
      ) : (
        <div>
          {/* Chế độ 1: Dạng Thẻ (Grid) */}
          {displayMode === "grid" && (
            <TaskGrid
              tasks={filteredTasks}
              subjects={subjects}
              onToggleComplete={toggleTaskComplete}
              onEditTask={handleEditTask}
              onDeleteTask={deleteTask}
              onRescheduleTomorrow={handleRescheduleTomorrow}
            />
          )}

          {/* Chế độ 3: Dạng Danh sách (List) */}
          {displayMode === "list" && (
            <TaskListView
              tasks={filteredTasks}
              subjects={subjects}
              onToggleComplete={toggleTaskComplete}
              onEditTask={handleEditTask}
              onDeleteTask={deleteTask}
              onRescheduleTomorrow={handleRescheduleTomorrow}
            />
          )}
        </div>
      )}

      {/* 4. Dialog Thêm / Sửa Nhiệm vụ */}
      <TaskFormDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        onSubmit={handleTaskSubmit}
        initialData={editingTask}
        defaultDate={getTodayString()}
        defaultStatus={dialogStatus}
        subjects={subjects}
      />
    </div>
  );
}
