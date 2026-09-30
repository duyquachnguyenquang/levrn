"use client";

import { useState, useEffect, useCallback } from "react";

export interface GoogleCalendarStatus {
  connected: boolean;
  email?: string;
  calendarId?: string;
  isSyncEnabled: boolean;
  updatedAt?: string;
}

export function useGoogleCalendar() {
  const [status, setStatus] = useState<GoogleCalendarStatus>({
    connected: false,
    isSyncEnabled: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Kiểm tra trạng thái kết nối
  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/calendar/google/sync");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      } else {
        setStatus({ connected: false, isSyncEnabled: false });
      }
    } catch {
      setStatus({ connected: false, isSyncEnabled: false });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Điều hướng người dùng tới Google OAuth consent screen
  const connect = useCallback((returnUrl?: string) => {
    const currentPath = returnUrl || (typeof window !== "undefined" ? window.location.pathname : "/dashboard");
    window.location.href = `/api/auth/google?returnUrl=${encodeURIComponent(currentPath)}`;
  }, []);

  // Hủy kết nối Google Calendar
  const disconnect = useCallback(async () => {
    try {
      setIsDisconnecting(true);
      const res = await fetch("/api/calendar/google/sync", {
        method: "DELETE",
      });
      if (res.ok) {
        setStatus({ connected: false, isSyncEnabled: false });
        return true;
      }
      return false;
    } catch (err) {
      console.error("Lỗi khi hủy kết nối:", err);
      return false;
    } finally {
      setIsDisconnecting(false);
    }
  }, []);

  // Kích hoạt đồng bộ lại toàn bộ môn học
  const syncAll = useCallback(async (): Promise<{ success: boolean; count?: number; error?: string }> => {
    try {
      setIsSyncing(true);
      const res = await fetch("/api/calendar/google/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync-all" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, count: data.count };
      }
      return { success: false, error: data.error || "Đồng bộ thất bại" };
    } catch (err: any) {
      return { success: false, error: err.message || "Lỗi mạng khi đồng bộ" };
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return {
    ...status,
    isLoading,
    isSyncing,
    isDisconnecting,
    connect,
    disconnect,
    syncAll,
    refreshStatus: fetchStatus,
  };
}
