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

        if (!error && data !== null) {
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
            imageUrl: row.image_url || row.imageUrl || undefined,
            gradeComponentId: row.grade_component_id || undefined,
            gradeComponentName: row.grade_component_name || undefined,
            gradeWeight: row.grade_weight !== null && row.grade_weight !== undefined ? Number(row.grade_weight) : undefined,
            gradeScore: row.grade_score !== null && row.grade_score !== undefined ? Number(row.grade_score) : null,
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

    // 2. Đọc từ localStorage nếu Supabase không khả dụng
    if (!isSupabaseOk && typeof window !== "undefined") {
      try {
        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (local !== null) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed)) {
            loadedGroups = parsed;
          }
        }
      } catch (err) {
        console.error("Error reading groups from localStorage:", err);
      }
    }

    // 3. Dọn dẹp triệt để bất kỳ nhóm mẫu/ảo cũ nào (grp-demo-*, Logistics Warriors, AI Thinkers) còn sót lại trong cache
    loadedGroups = loadedGroups.filter(
      (g) =>
        !g.id.startsWith("grp-demo") &&
        !g.name.includes("Logistics Warriors") &&
        !g.name.includes("AI Thinkers")
    );

    // 4. Dọn dẹp triệt để bất kỳ nhiệm vụ giả nào (gt-initial)
    loadedGroups = loadedGroups.map((g) => ({
      ...g,
      tasks: (g.tasks || []).filter((t) => !t.id.startsWith("gt-initial")),
    }));

    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(loadedGroups));
    }

    setGroups(loadedGroups);
    setIsSupabaseActive(isSupabaseOk);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const handleSync = () => {
      loadData();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("levrn_groups_updated", handleSync);
      return () => {
        window.removeEventListener("levrn_groups_updated", handleSync);
      };
    }
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
          const rowsWithGrades = newGroups.map((g) => ({
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
            image_url: g.imageUrl || null,
            grade_component_id: g.gradeComponentId || null,
            grade_component_name: g.gradeComponentName || null,
            grade_weight: g.gradeWeight ?? null,
            grade_score: g.gradeScore ?? null,
            members: g.members,
            tasks: g.tasks,
            updated_at: new Date().toISOString(),
          }));

          const { error: upsertErr } = await supabase.from("group_projects").upsert(rowsWithGrades);
          if (upsertErr) {
            // Nếu bảng Supabase chưa chạy lệnh migration thêm cột điểm, fallback lưu các cột hiện có
            console.warn("Supabase upsert with grade columns failed, running fallback:", upsertErr.message);
            const rowsFallback = newGroups.map((g) => ({
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
              image_url: g.imageUrl || null,
              members: g.members,
              tasks: g.tasks,
              updated_at: new Date().toISOString(),
            }));
            await supabase.from("group_projects").upsert(rowsFallback);
          }
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
    updateGroupGradeScore: async (groupId: string, score: number | null) => {
      const target = groups.find((g) => g.id === groupId);
      if (!target) return;
      const updated = groups.map((g) =>
        g.id === groupId ? { ...g, gradeScore: score, updatedAt: new Date().toISOString() } : g
      );
      await saveGroups(updated);

      // Đồng bộ sang bảng điểm course_grades
      if (typeof window !== "undefined") {
        try {
          const rawGrades = localStorage.getItem("levrn_course_grades_data");
          if (rawGrades) {
            const list = JSON.parse(rawGrades);
            if (Array.isArray(list)) {
              let changed = false;
              const synced = list.map((cg: any) => {
                const isMatchSub = (target.subjectId && cg.subjectId === target.subjectId) ||
                  (target.subjectCode && cg.subjectCode === target.subjectCode);
                if (isMatchSub && Array.isArray(cg.components)) {
                  const newComps = cg.components.map((comp: any) => {
                    const isMatchComp = (target.gradeComponentId && comp.id === target.gradeComponentId) ||
                      (target.gradeComponentName && comp.name === target.gradeComponentName);
                    if (isMatchComp) {
                      changed = true;
                      return { ...comp, score };
                    }
                    return comp;
                  });
                  if (changed) {
                    return { ...cg, components: newComps, updatedAt: new Date().toISOString() };
                  }
                }
                return cg;
              });

              if (changed) {
                localStorage.setItem("levrn_course_grades_data", JSON.stringify(synced));
                window.dispatchEvent(new Event("levrn_grades_updated"));

                if (supabase && isSupabaseActive) {
                  const targetCourse = synced.find((cg: any) =>
                    (target.subjectId && cg.subjectId === target.subjectId) ||
                    (target.subjectCode && cg.subjectCode === target.subjectCode)
                  );
                  if (targetCourse) {
                    supabase.from("course_grades").update({
                      components: targetCourse.components,
                      updated_at: new Date().toISOString(),
                    }).eq("id", targetCourse.id).then();
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error("Lỗi đồng bộ sang course_grades:", e);
        }
      }
    },
    refreshGroups: loadData,
  };
}
