"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  GroupProject,
  GroupProjectFormData,
  GroupMember,
  GroupTask,
  GroupTaskStatus,
} from "@/lib/types";
import { supabase } from "@/lib/supabase";

const LOCAL_STORAGE_KEY = "levrn_group_projects_data";

// Dữ liệu nhóm đồ án mẫu ban đầu
const INITIAL_DEMO_GROUPS: GroupProject[] = [
  {
    id: "grp-demo-1",
    name: "Nhóm 04 - Logistics Warriors",
    subjectCode: "SCM",
    subjectName: "Quản trị chuỗi cung ứng",
    topic: "Tối ưu hoá mạng lưới kho bãi và trung tâm phân phối miền Nam",
    description: "Đồ án kết thúc học phần phân tích chuỗi cung ứng thực tế tại Shopee Xpress.",
    semester: "HK1 2024-2025",
    status: "in_progress",
    deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 ngày nữa
    driveUrl: "https://drive.google.com/drive/folders/demo-scm-project",
    repoUrl: "https://github.com/example/scm-distribution-analysis",
    meetingUrl: "https://meet.google.com/abc-defg-hij",
    chatUrl: "https://zalo.me/g/example-scm-group",
    members: [
      {
        id: "mem-1",
        name: "Quang Duy (Bạn)",
        studentId: "2251010045",
        role: "leader",
        email: "duy.qn@levrn.edu.vn",
        contributionScore: 100,
        avatarColor: "#7D39EB",
      },
      {
        id: "mem-2",
        name: "Nguyễn Minh Khang",
        studentId: "2251010088",
        role: "member",
        email: "khang.nm@levrn.edu.vn",
        contributionScore: 95,
        avatarColor: "#3B82F6",
      },
      {
        id: "mem-3",
        name: "Trần Bảo Ngọc",
        studentId: "2251010112",
        role: "secretary",
        email: "ngoc.tb@levrn.edu.vn",
        contributionScore: 90,
        avatarColor: "#EC4899",
      },
      {
        id: "mem-4",
        name: "Lê Hoàng Nam",
        studentId: "2251010072",
        role: "member",
        email: "nam.lh@levrn.edu.vn",
        contributionScore: 85,
        avatarColor: "#10B981",
      },
    ],
    tasks: [
      {
        id: "gt-1",
        groupId: "grp-demo-1",
        title: "Thu thập số liệu lưu chuyển hàng hoá tại Hub Củ Chi",
        assigneeMemberId: "mem-2",
        assigneeName: "Nguyễn Minh Khang",
        status: "done",
        priority: "high",
        dueDate: "2024-10-15",
        createdAt: new Date().toISOString(),
      },
      {
        id: "gt-2",
        groupId: "grp-demo-1",
        title: "Xây dựng mô hình toán tối ưu chi phí vận chuyển đường bộ",
        assigneeMemberId: "mem-1",
        assigneeName: "Quang Duy (Bạn)",
        status: "in_progress",
        priority: "urgent",
        dueDate: "2024-10-22",
        createdAt: new Date().toISOString(),
      },
      {
        id: "gt-3",
        groupId: "grp-demo-1",
        title: "Tổng hợp báo cáo Word 30 trang và định dạng bảng biểu",
        assigneeMemberId: "mem-3",
        assigneeName: "Trần Bảo Ngọc",
        status: "todo",
        priority: "medium",
        dueDate: "2024-10-28",
        createdAt: new Date().toISOString(),
      },
      {
        id: "gt-4",
        groupId: "grp-demo-1",
        title: "Thiết kế Slide thuyết trình Canva chuẩn thương hiệu",
        assigneeMemberId: "mem-4",
        assigneeName: "Lê Hoàng Nam",
        status: "todo",
        priority: "medium",
        dueDate: "2024-11-02",
        createdAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: "grp-demo-2",
    name: "AI Thinkers - Đồ án Trí tuệ Nhân tạo",
    subjectCode: "AIA",
    subjectName: "Ứng dụng trí tuệ nhân tạo",
    topic: "Nhận diện bệnh cây trồng qua ảnh lá với Convolutional Neural Network (CNN)",
    description: "Huấn luyện mô hình ResNet-50 trên tập dữ liệu PlantVillage đạt độ chính xác > 92%.",
    semester: "HK1 2024-2025",
    status: "in_progress",
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    driveUrl: "https://drive.google.com/drive/folders/demo-ai-dataset",
    repoUrl: "https://github.com/example/plant-disease-cnn",
    meetingUrl: "https://meet.google.com/xyz-uvwx-rst",
    members: [
      {
        id: "mem-201",
        name: "Quang Duy (Bạn)",
        studentId: "2251010045",
        role: "leader",
        email: "duy.qn@levrn.edu.vn",
        contributionScore: 100,
        avatarColor: "#7D39EB",
      },
      {
        id: "mem-202",
        name: "Phạm Hải Đăng",
        studentId: "2251010033",
        role: "member",
        email: "dang.ph@levrn.edu.vn",
        contributionScore: 90,
        avatarColor: "#F59E0B",
      },
      {
        id: "mem-203",
        name: "Vũ Phương Linh",
        studentId: "2251010156",
        role: "member",
        email: "linh.vp@levrn.edu.vn",
        contributionScore: 90,
        avatarColor: "#06B6D4",
      },
    ],
    tasks: [
      {
        id: "gt-201",
        groupId: "grp-demo-2",
        title: "Thu thập và làm sạch 10.000 ảnh từ Kaggle Dataset",
        assigneeMemberId: "mem-202",
        assigneeName: "Phạm Hải Đăng",
        status: "done",
        priority: "high",
        dueDate: "2024-10-10",
        createdAt: new Date().toISOString(),
      },
      {
        id: "gt-202",
        groupId: "grp-demo-2",
        title: "Huấn luyện mô hình Transfer Learning ResNet50 trên GPU Colab",
        assigneeMemberId: "mem-201",
        assigneeName: "Quang Duy (Bạn)",
        status: "done",
        priority: "urgent",
        dueDate: "2024-10-18",
        createdAt: new Date().toISOString(),
      },
      {
        id: "gt-203",
        groupId: "grp-demo-2",
        title: "Viết API FastApi và dựng giao diện Demo bằng Next.js",
        assigneeMemberId: "mem-203",
        assigneeName: "Vũ Phương Linh",
        status: "in_progress",
        priority: "high",
        dueDate: "2024-10-25",
        createdAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
  },
];

export function useGroups() {
  const [groups, setGroups] = useState<GroupProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseActive, setIsSupabaseActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tải dữ liệu nhóm
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    let loadedGroups: GroupProject[] = [];
    let isSupabaseOk = false;

    // 1. Thử tải từ Supabase
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("group_projects")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          loadedGroups = data.map((row: any) => ({
            id: row.id,
            name: row.name,
            subjectId: row.subject_id,
            subjectCode: row.subject_code,
            subjectName: row.subject_name,
            topic: row.topic,
            description: row.description,
            semester: row.semester,
            status: row.status,
            deadline: row.deadline,
            driveUrl: row.drive_url,
            repoUrl: row.repo_url,
            meetingUrl: row.meeting_url,
            chatUrl: row.chat_url,
            members: row.members || [],
            tasks: row.tasks || [],
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }));
          isSupabaseOk = true;
        }
      } catch (err) {
        console.warn("Supabase group_projects fetch skipped, fallback to localStorage:", err);
      }
    }

    // 2. Đọc từ localStorage nếu Supabase trống
    if (loadedGroups.length === 0 && typeof window !== "undefined") {
      try {
        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (local) {
          loadedGroups = JSON.parse(local);
        }
      } catch (err) {
        console.error("Error reading groups from localStorage:", err);
      }
    }

    // 3. Fallback dữ liệu mẫu ban đầu
    if (loadedGroups.length === 0) {
      loadedGroups = INITIAL_DEMO_GROUPS;
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_GROUPS));
      }
    }

    setGroups(loadedGroups);
    setIsSupabaseActive(isSupabaseOk);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Lưu dữ liệu vào localStorage và Supabase
  const saveGroups = useCallback(
    async (newGroups: GroupProject[]) => {
      setGroups(newGroups);
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newGroups));
      }

      if (supabase && isSupabaseActive) {
        try {
          const rows = newGroups.map((g) => ({
            id: g.id,
            name: g.name,
            subject_id: g.subjectId,
            subject_code: g.subjectCode,
            subject_name: g.subjectName,
            topic: g.topic,
            description: g.description,
            semester: g.semester,
            status: g.status,
            deadline: g.deadline,
            drive_url: g.driveUrl,
            repo_url: g.repoUrl,
            meeting_url: g.meetingUrl,
            chat_url: g.chatUrl,
            members: g.members,
            tasks: g.tasks,
            updated_at: new Date().toISOString(),
          }));
          await supabase.from("group_projects").upsert(rows);
        } catch (err) {
          console.error("Supabase upsert group_projects error:", err);
        }
      }
    },
    [isSupabaseActive]
  );

  // Thêm mới nhóm đồ án
  const addGroup = useCallback(
    async (formData: GroupProjectFormData) => {
      const newGroup: GroupProject = {
        ...formData,
        id: `grp-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      const updated = [newGroup, ...groups];
      await saveGroups(updated);
      return newGroup;
    },
    [groups, saveGroups]
  );

  // Cập nhật thông tin nhóm đồ án
  const updateGroup = useCallback(
    async (id: string, updates: Partial<GroupProject>) => {
      const updated = groups.map((g) =>
        g.id === id ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g
      );
      await saveGroups(updated);
    },
    [groups, saveGroups]
  );

  // Xoá nhóm đồ án
  const deleteGroup = useCallback(
    async (id: string) => {
      const updated = groups.filter((g) => g.id !== id);
      await saveGroups(updated);

      if (supabase && isSupabaseActive) {
        try {
          await supabase.from("group_projects").delete().eq("id", id);
        } catch (err) {
          console.error("Supabase delete group error:", err);
        }
      }
    },
    [groups, isSupabaseActive, saveGroups]
  );

  // Thêm thành viên vào nhóm
  const addMember = useCallback(
    async (groupId: string, memberData: Omit<GroupMember, "id">) => {
      const newMember: GroupMember = {
        ...memberData,
        id: `mem-${Date.now()}`,
      };
      const updated = groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              members: [...g.members, newMember],
              updatedAt: new Date().toISOString(),
            }
          : g
      );
      await saveGroups(updated);
    },
    [groups, saveGroups]
  );

  // Cập nhật hoặc xoá thành viên
  const removeMember = useCallback(
    async (groupId: string, memberId: string) => {
      const updated = groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              members: g.members.filter((m) => m.id !== memberId),
              updatedAt: new Date().toISOString(),
            }
          : g
      );
      await saveGroups(updated);
    },
    [groups, saveGroups]
  );

  // Thêm nhiệm vụ nhóm
  const addTask = useCallback(
    async (groupId: string, taskData: Omit<GroupTask, "id" | "groupId" | "createdAt">) => {
      const group = groups.find((g) => g.id === groupId);
      const assignee = group?.members.find((m) => m.id === taskData.assigneeMemberId);

      const newTask: GroupTask = {
        ...taskData,
        id: `gt-${Date.now()}`,
        groupId,
        assigneeName: assignee?.name || taskData.assigneeName,
        createdAt: new Date().toISOString(),
      };

      const updated = groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              tasks: [...g.tasks, newTask],
              updatedAt: new Date().toISOString(),
            }
          : g
      );
      await saveGroups(updated);
    },
    [groups, saveGroups]
  );

  // Cập nhật trạng thái nhiệm vụ (todo, in_progress, review, done)
  const updateTaskStatus = useCallback(
    async (groupId: string, taskId: string, newStatus: GroupTaskStatus) => {
      const updated = groups.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          tasks: g.tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
          updatedAt: new Date().toISOString(),
        };
      });
      await saveGroups(updated);
    },
    [groups, saveGroups]
  );

  // Xoá nhiệm vụ
  const deleteTask = useCallback(
    async (groupId: string, taskId: string) => {
      const updated = groups.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          tasks: g.tasks.filter((t) => t.id !== taskId),
          updatedAt: new Date().toISOString(),
        };
      });
      await saveGroups(updated);
    },
    [groups, saveGroups]
  );

  // Thống kê tổng hợp các nhóm
  const stats = useMemo(() => {
    const totalGroups = groups.length;
    let totalMembers = 0;
    let totalTasks = 0;
    let completedTasks = 0;
    let upcomingDeadlines = 0;

    const now = Date.now();
    const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;

    groups.forEach((g) => {
      totalMembers += g.members.length;
      totalTasks += g.tasks.length;
      completedTasks += g.tasks.filter((t) => t.status === "done").length;

      if (g.deadline) {
        const d = new Date(g.deadline).getTime();
        if (d >= now && d <= sevenDaysFromNow) {
          upcomingDeadlines++;
        }
      }
    });

    const overallProgress =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalGroups,
      totalMembers,
      totalTasks,
      completedTasks,
      overallProgress,
      upcomingDeadlines,
    };
  }, [groups]);

  return {
    groups,
    stats,
    isLoading,
    isSupabaseActive,
    errorMessage,
    addGroup,
    updateGroup,
    deleteGroup,
    addMember,
    removeMember,
    addTask,
    updateTaskStatus,
    deleteTask,
    refreshGroups: loadData,
  };
}
