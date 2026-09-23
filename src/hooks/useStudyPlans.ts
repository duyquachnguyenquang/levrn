"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  StudyTask,
  StudyTaskFormData,
  StudyTaskStatus,
  SubjectStudyStrategy,
} from "@/lib/types";
import { supabase } from "@/lib/supabase";

const LOCAL_STORAGE_TASKS_KEY = "levrn_study_tasks_data";
const LOCAL_STORAGE_STRATEGIES_KEY = "levrn_study_strategies_data";

// Chuyển đối tượng Date thành định dạng YYYY-MM-DD
function getFormattedDate(offsetDays: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Chuyển đổi dữ liệu Supabase row (snake_case) sang StudyTask (camelCase)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToTask(row: any): StudyTask {
  const subtasks = Array.isArray(row.subtasks)
    ? row.subtasks
    : Array.isArray(row.checklist)
    ? row.checklist
    : undefined;

  return {
    id: String(row.id),
    subjectId: row.subject_id || row.subjectId || "",
    semester: row.semester || undefined,
    title: row.title || "",
    description: row.description || undefined,
    classification: row.classification || "theory",
    priority: row.priority || "medium",
    status: (row.status as StudyTaskStatus) || "todo",
    date: row.date || getFormattedDate(0),
    timeblock: row.timeblock || undefined,
    durationMinutes: Number(row.duration_minutes ?? row.durationMinutes ?? 60),
    notes: row.notes || undefined,
    checklist: subtasks,
    subtasks,
    materials: Array.isArray(row.materials) ? row.materials : undefined,
    submissionUrl: row.submission_url || row.submissionUrl || undefined,
    deadline: row.deadline || undefined,
    completedAt: row.completed_at || row.completedAt || undefined,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  };
}

// Chuyển đổi StudyTaskFormData sang dữ liệu lưu Supabase row
function mapTaskToRow(data: Partial<StudyTaskFormData & { id?: string; status?: StudyTaskStatus }>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row: Record<string, any> = {};
  if (data.id !== undefined) row.id = data.id;
  if (data.subjectId !== undefined) row.subject_id = data.subjectId;
  if (data.semester !== undefined) row.semester = data.semester || null;
  if (data.title !== undefined) row.title = data.title;
  if (data.description !== undefined) row.description = data.description || null;
  if (data.classification !== undefined) row.classification = data.classification;
  if (data.priority !== undefined) row.priority = data.priority;
  if (data.status !== undefined) row.status = data.status;
  if (data.date !== undefined) row.date = data.date;
  if (data.timeblock !== undefined) row.timeblock = data.timeblock || null;
  if (data.durationMinutes !== undefined) row.duration_minutes = data.durationMinutes;
  if (data.subtasks !== undefined) row.subtasks = data.subtasks || null;
  if (data.materials !== undefined) row.materials = data.materials || null;
  if (data.submissionUrl !== undefined) row.submission_url = data.submissionUrl || null;
  if (data.deadline !== undefined) row.deadline = data.deadline || null;
  if (data.notes !== undefined) row.notes = data.notes || null;
  if (data.checklist !== undefined) row.checklist = data.checklist || null;
  return row;
}

// Khởi tạo các nhiệm vụ mẫu ban đầu
export function createInitialDemoTasks(): StudyTask[] {
  const todayStr = getFormattedDate(0);
  const tomorrowStr = getFormattedDate(1);
  const dayAfterStr = getFormattedDate(2);

  return [
    {
      id: "task-demo-1",
      subjectId: "sub-demo-1", // MAT
      title: "Tự học lý thuyết Ma trận nghịch đảo & Định thức",
      description: "Xem lại slide chương 3, ghi chép lại công thức khai triển Laplace và tính chất ma trận vuông.",
      classification: "theory",
      priority: "high",
      status: "completed",
      date: todayStr,
      timeblock: {
        startTime: "08:30",
        endTime: "09:45",
        durationMinutes: 75,
      },
      durationMinutes: 75,
      completedAt: new Date().toISOString(),
      notes: "Đã làm xong tóm tắt các tính chất quan trọng của định thức.",
      checklist: [
        { id: "c1", text: "Đọc giáo trình trang 45-62", done: true },
        { id: "c2", text: "Vẽ sơ đồ tư duy phương pháp biến đổi sơ cấp hàng", done: true },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: "task-demo-2",
      subjectId: "sub-demo-3", // PRG
      title: "Flashcard ôn tập 30 thuật ngữ Cấu trúc dữ liệu",
      description: "Ôn tập Spaced Repetition các thuật ngữ: Binary Heap, Balance Tree, AVL, Hash Collision.",
      classification: "flashcard",
      priority: "medium",
      status: "in_progress",
      date: todayStr,
      timeblock: {
        startTime: "10:15",
        endTime: "11:00",
        durationMinutes: 45,
      },
      durationMinutes: 45,
      createdAt: new Date().toISOString(),
    },
    {
      id: "task-demo-3",
      subjectId: "sub-demo-1", // MAT
      title: "Luyện 25 câu trắc nghiệm Vi tích phân 1",
      description: "Luyện đề trắc nghiệm trên hệ thống LMS trường, tập trung vào tích phân từng phần.",
      classification: "quiz",
      priority: "urgent",
      status: "todo",
      date: todayStr,
      timeblock: {
        startTime: "14:00",
        endTime: "15:30",
        durationMinutes: 90,
      },
      durationMinutes: 90,
      notes: "Hạn chót nộp bài trắc nghiệm LMS lúc 23h59 tối nay!",
      createdAt: new Date().toISOString(),
    },
    {
      id: "task-demo-4",
      subjectId: "sub-demo-3", // PRG
      title: "Thực hành LeetCode: Binary Tree Traversal & DFS",
      description: "Cài đặt thuật toán duyệt cây tiền tự, trung tự và hậu tự bằng cả đệ quy và stack lặp.",
      classification: "exercise",
      priority: "high",
      status: "todo",
      date: todayStr,
      timeblock: {
        startTime: "16:00",
        endTime: "17:30",
        durationMinutes: 90,
      },
      durationMinutes: 90,
      createdAt: new Date().toISOString(),
    },
    {
      id: "task-demo-5",
      subjectId: "sub-demo-2", // ENG
      title: "Đọc tài liệu IEEE về Cloud Computing & Ghi chú từ vựng",
      description: "Đọc 5 trang bài báo về Containerization, trích xuất 20 từ vựng kỹ thuật mới vào sổ tay.",
      classification: "reading",
      priority: "medium",
      status: "todo",
      date: tomorrowStr,
      timeblock: {
        startTime: "09:00",
        endTime: "10:30",
        durationMinutes: 90,
      },
      durationMinutes: 90,
      createdAt: new Date().toISOString(),
    },
    {
      id: "task-demo-6",
      subjectId: "sub-demo-2", // ENG
      title: "Luyện phát âm Flashcard 30 từ vựng CNTT",
      description: "Nghe audio phát âm IPA và ghi âm giọng đọc so sánh.",
      classification: "flashcard",
      priority: "low",
      status: "todo",
      date: tomorrowStr,
      timeblock: {
        startTime: "19:30",
        endTime: "20:15",
        durationMinutes: 45,
      },
      durationMinutes: 45,
      createdAt: new Date().toISOString(),
    },
    {
      id: "task-demo-7",
      subjectId: "sub-demo-1", // MAT
      title: "Ôn tập tổng hợp giữa kỳ: Hệ phương trình Cramer & Gauss",
      description: "Giải lại đề kiểm tra giữa kỳ 3 năm gần nhất, chuẩn bị cho bài kiểm tra tuần 8.",
      classification: "review",
      priority: "high",
      status: "todo",
      date: dayAfterStr,
      timeblock: {
        startTime: "14:00",
        endTime: "16:00",
        durationMinutes: 120,
      },
      durationMinutes: 120,
      createdAt: new Date().toISOString(),
    },
  ];
}

export function useStudyPlans() {
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseActive, setIsSupabaseActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Lưu bản sao dự phòng vào localStorage
  const backupToLocalStorage = (list: StudyTask[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_TASKS_KEY, JSON.stringify(list));
    } catch (err) {
      console.error("Lỗi khi lưu backup study tasks vào localStorage:", err);
    }
  };

  // Tải danh sách nhiệm vụ từ Supabase (hoặc localStorage dự phòng)
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    // 1. Thử lấy từ Supabase
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("study_tasks")
          .select("*")
          .order("date", { ascending: true })
          .order("created_at", { ascending: false });

        if (!error && data) {
          const mapped = data.map(mapRowToTask);
          setTasks(mapped);
          backupToLocalStorage(mapped);
          setIsSupabaseActive(true);
          setIsLoading(false);
          return;
        }

        if (error) {
          if (error.code === "PGRST205") {
            setErrorMessage(
              "Chưa tìm thấy bảng 'study_tasks' trong Supabase Database. Vui lòng chạy file supabase_schema.sql trong SQL Editor."
            );
          } else {
            setErrorMessage(`Lỗi Supabase: ${error.message}`);
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Không thể kết nối Supabase";
        console.error("Lỗi khi kết nối Supabase study_tasks:", err);
        setErrorMessage(message);
      }
    }

    // 2. Fallback localStorage nếu chưa có bảng
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_TASKS_KEY);
      if (stored) {
        setTasks(JSON.parse(stored));
      } else {
        const initial = createInitialDemoTasks();
        setTasks(initial);
        backupToLocalStorage(initial);
      }
    } catch {
      const initial = createInitialDemoTasks();
      setTasks(initial);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Thêm nhiệm vụ mới
  const addTask = async (
    formData: StudyTaskFormData
  ): Promise<{ success: boolean; id: string; error?: string }> => {
    if (!formData.title.trim()) {
      return { success: false, id: "", error: "Vui lòng nhập tiêu đề nhiệm vụ." };
    }

    const newId = "task-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const newTask: StudyTask = {
      ...formData,
      id: newId,
      title: formData.title.trim(),
      createdAt: new Date().toISOString(),
    };

    // Lưu vào Supabase trước nếu có kết nối
    if (supabase && isSupabaseActive) {
      try {
        const row = mapTaskToRow({ ...newTask, id: newId });
        const { data, error } = await supabase
          .from("study_tasks")
          .insert([row])
          .select()
          .single();

        if (!error && data) {
          const inserted = mapRowToTask(data);
          const updated = [inserted, ...tasks];
          setTasks(updated);
          backupToLocalStorage(updated);
          return { success: true, id: inserted.id };
        }
      } catch (err) {
        console.error("Lỗi khi insert study task vào Supabase:", err);
      }
    }

    // Fallback cục bộ
    const updated = [newTask, ...tasks];
    setTasks(updated);
    backupToLocalStorage(updated);
    return { success: true, id: newTask.id };
  };

  // Cập nhật nhiệm vụ
  const updateTask = async (
    id: string,
    updates: Partial<StudyTaskFormData>
  ): Promise<{ success: boolean; error?: string }> => {
    if (supabase && isSupabaseActive) {
      try {
        const row = mapTaskToRow(updates);
        if (updates.status === "completed") {
          row.completed_at = new Date().toISOString();
        } else if (updates.status) {
          row.completed_at = null;
        }

        const { data, error } = await supabase
          .from("study_tasks")
          .update(row)
          .eq("id", id)
          .select()
          .single();

        if (!error && data) {
          const updatedTask = mapRowToTask(data);
          const updatedList = tasks.map((t) => (t.id === id ? updatedTask : t));
          setTasks(updatedList);
          backupToLocalStorage(updatedList);
          return { success: true };
        }
      } catch (err) {
        console.error("Lỗi cập nhật task trên Supabase:", err);
      }
    }

    // Fallback cục bộ
    const updatedList = tasks.map((task) => {
      if (task.id === id) {
        const updatedTask = { ...task, ...updates };
        if (updates.status === "completed") {
          updatedTask.completedAt = new Date().toISOString();
        } else if (updates.status) {
          updatedTask.completedAt = undefined;
        }
        return updatedTask;
      }
      return task;
    });

    setTasks(updatedList);
    backupToLocalStorage(updatedList);
    return { success: true };
  };

  // Cập nhật trạng thái nhiệm vụ (dành cho Kéo - Thả Kanban và Checkbox)
  const updateTaskStatus = async (id: string, newStatus: StudyTaskStatus): Promise<boolean> => {
    const isCompleted = newStatus === "completed";
    const completedAt = isCompleted ? new Date().toISOString() : undefined;

    // Cập nhật Supabase
    if (supabase && isSupabaseActive) {
      try {
        await supabase
          .from("study_tasks")
          .update({
            status: newStatus,
            completed_at: isCompleted ? completedAt : null,
          })
          .eq("id", id);
      } catch (err) {
        console.error("Lỗi khi update status trên Supabase:", err);
      }
    }

    // Cập nhật local
    const updatedList = tasks.map((t) =>
      t.id === id ? { ...t, status: newStatus, completedAt } : t
    );
    setTasks(updatedList);
    backupToLocalStorage(updatedList);
    return true;
  };

  // Toggle hoàn thành
  const toggleTaskComplete = async (id: string): Promise<boolean> => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return false;
    const nextStatus: StudyTaskStatus = task.status === "completed" ? "todo" : "completed";
    return await updateTaskStatus(id, nextStatus);
  };

  // Xoá nhiệm vụ
  const deleteTask = async (id: string): Promise<{ success: boolean }> => {
    if (supabase && isSupabaseActive) {
      try {
        await supabase.from("study_tasks").delete().eq("id", id);
      } catch (err) {
        console.error("Lỗi khi xoá task trên Supabase:", err);
      }
    }

    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    backupToLocalStorage(updated);
    return { success: true };
  };

  // Dời lịch sang ngày mới (Reschedule)
  const rescheduleTask = async (
    id: string,
    newDate: string
  ): Promise<{ success: boolean }> => {
    return await updateTask(id, { date: newDate });
  };

  // Tính toán nhanh 4 chỉ số mà người dùng yêu cầu:
  // 1. Số nhiệm vụ trong ngày
  // 2. Số nhiệm vụ trong tuần
  // 3. Số nhiệm vụ đã hoàn thành
  // 4. Tiến độ theo tuần (%)
  const stats = useMemo(() => {
    const todayStr = getFormattedDate(0);

    // Tính khoảng thời gian tuần hiện tại (Thứ 2 -> Chủ Nhật)
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = (day + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const format = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dateVal = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${dateVal}`;
    };

    const weekStart = format(monday);
    const weekEnd = format(sunday);

    // 1. Nhiệm vụ trong ngày
    const todayTasks = tasks.filter((t) => t.date === todayStr);
    const todayCount = todayTasks.length;
    const todayCompletedCount = todayTasks.filter((t) => t.status === "completed").length;

    // 2. Nhiệm vụ trong tuần
    const weekTasks = tasks.filter((t) => t.date >= weekStart && t.date <= weekEnd);
    const weekCount = weekTasks.length;
    const weekCompletedCount = weekTasks.filter((t) => t.status === "completed").length;

    // 3. Số nhiệm vụ đã hoàn thành (tổng)
    const totalCompleted = tasks.filter((t) => t.status === "completed").length;
    const totalCount = tasks.length;

    // 4. Tiến độ theo tuần (%)
    const weekProgressPercent =
      weekCount > 0 ? Math.round((weekCompletedCount / weekCount) * 100) : 0;

    return {
      todayCount,
      todayCompletedCount,
      weekCount,
      weekCompletedCount,
      totalCompleted,
      totalCount,
      weekProgressPercent,
    };
  }, [tasks]);

  return {
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
    refreshTasks: fetchTasks,
  };
}
