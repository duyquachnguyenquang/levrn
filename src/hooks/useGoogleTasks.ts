"use client";

import { useState, useEffect, useCallback } from "react";
import { StudyTask, GroupProject, Subject } from "@/lib/types";

export interface GoogleTasksStatus {
  connected: boolean;
  email?: string | null;
}

export function useGoogleTasks() {
  const [status, setStatus] = useState<GoogleTasksStatus>({
    connected: false,
    email: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Kiểm tra trạng thái kết nối tài khoản Google
  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/tasks/google/sync");
      if (res.ok) {
        const data = await res.json();
        setStatus({
          connected: Boolean(data.connected),
          email: data.email || null,
        });
      } else {
        setStatus({ connected: false, email: null });
      }
    } catch {
      setStatus({ connected: false, email: null });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Điều hướng người dùng tới Google OAuth consent screen
  const connect = useCallback((returnUrl?: string) => {
    const currentPath =
      returnUrl || (typeof window !== "undefined" ? window.location.pathname : "/dashboard");
    window.location.href = `/api/auth/google?returnUrl=${encodeURIComponent(currentPath)}`;
  }, []);

  // Đồng bộ toàn bộ nhiệm vụ (Cá nhân vào My Tasks, Nhóm vào Groupworks)
  const syncAll = useCallback(
    async (params?: {
      personalTasks?: StudyTask[];
      groups?: GroupProject[];
      subjects?: Subject[];
    }): Promise<{
      success: boolean;
      total?: number;
      personalSynced?: number;
      groupSynced?: number;
      error?: string;
      needsReauth?: boolean;
      isApiDisabled?: boolean;
      enableApiUrl?: string;
    }> => {
      try {
        setIsSyncing(true);
        const res = await fetch("/api/tasks/google/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "sync-all",
            personalTasks: params?.personalTasks,
            groups: params?.groups,
            subjects: params?.subjects,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          return {
            success: true,
            total: data.total,
            personalSynced: data.personal?.synced,
            groupSynced: data.group?.synced,
          };
        }
        return {
          success: false,
          error: data.error || "Đồng bộ Google Tasks thất bại",
          needsReauth: Boolean(data.needsReauth),
          isApiDisabled: Boolean(data.isApiDisabled),
          enableApiUrl: data.enableApiUrl,
        };
      } catch (err: any) {
        return { success: false, error: err.message || "Lỗi mạng khi đồng bộ Google Tasks" };
      } finally {
        setIsSyncing(false);
      }
    },
    []
  );

  // Đồng bộ riêng Nhiệm vụ cá nhân (vào My Tasks)
  const syncPersonal = useCallback(
    async (params?: {
      personalTasks?: StudyTask[];
      subjects?: Subject[];
    }): Promise<{
      success: boolean;
      synced?: number;
      error?: string;
      needsReauth?: boolean;
      isApiDisabled?: boolean;
      enableApiUrl?: string;
    }> => {
      try {
        setIsSyncing(true);
        const res = await fetch("/api/tasks/google/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "sync-personal",
            personalTasks: params?.personalTasks,
            subjects: params?.subjects,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          return { success: true, synced: data.synced };
        }
        return {
          success: false,
          error: data.error || "Đồng bộ thất bại",
          needsReauth: Boolean(data.needsReauth),
          isApiDisabled: Boolean(data.isApiDisabled),
          enableApiUrl: data.enableApiUrl,
        };
      } catch (err: any) {
        return { success: false, error: err.message || "Lỗi mạng khi đồng bộ" };
      } finally {
        setIsSyncing(false);
      }
    },
    []
  );

  // Đồng bộ riêng Nhiệm vụ nhóm (vào Groupworks)
  const syncGroup = useCallback(
    async (params?: {
      groups?: GroupProject[];
      subjects?: Subject[];
    }): Promise<{
      success: boolean;
      synced?: number;
      error?: string;
      needsReauth?: boolean;
      isApiDisabled?: boolean;
      enableApiUrl?: string;
    }> => {
      try {
        setIsSyncing(true);
        const res = await fetch("/api/tasks/google/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "sync-group",
            groups: params?.groups,
            subjects: params?.subjects,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          return { success: true, synced: data.synced };
        }
        return {
          success: false,
          error: data.error || "Đồng bộ thất bại",
          needsReauth: Boolean(data.needsReauth),
          isApiDisabled: Boolean(data.isApiDisabled),
          enableApiUrl: data.enableApiUrl,
        };
      } catch (err: any) {
        return { success: false, error: err.message || "Lỗi mạng khi đồng bộ" };
      } finally {
        setIsSyncing(false);
      }
    },
    []
  );

  return {
    ...status,
    isLoading,
    isSyncing,
    connect,
    syncAll,
    syncPersonal,
    syncGroup,
    refreshStatus: fetchStatus,
  };
}
