"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AppNotification, AppNotificationFormData } from "@/lib/types";
import { supabase } from "@/lib/supabase";

const LOCAL_STORAGE_KEY = "levrn_notifications_data";

// Dữ liệu thông báo khởi tạo ban đầu
const INITIAL_DEMO_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-1",
    title: "Cảnh báo chuyên cần: Môn Quản trị chuỗi cung ứng",
    message: "Bạn đã vắng 2 buổi môn Quản trị chuỗi cung ứng (SCM). Môn học này chỉ cho phép nghỉ tối đa 3 buổi trước khi bị cấm thi.",
    type: "warning",
    category: "attendance",
    read: false,
    link: "/subjects",
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(), // 35 phút trước
  },
  {
    id: "notif-2",
    title: "Hạn chót đồ án nhóm: Nhóm 04 - Logistics Warriors",
    message: "Đồ án kết thúc học phần SCM còn 6 ngày nữa đến hạn nộp (23:59 Chủ Nhật tuần này). Hiện nhóm đã hoàn thành 2/4 nhiệm vụ.",
    type: "deadline",
    category: "groups",
    read: false,
    link: "/groups",
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), // 3 giờ trước
  },
  {
    id: "notif-3",
    title: "Lịch học hôm nay: Ca sáng lúc 08:00",
    message: "Hôm nay bạn có tiết học môn Giải Tích & Đại Số Tuyến Tính tại phòng B.304 - Cơ sở 1.",
    type: "info",
    category: "schedule",
    read: false,
    link: "/subjects",
    createdAt: new Date(Date.now() - 7 * 3600 * 1000).toISOString(), // 7 giờ trước
  },
  {
    id: "notif-4",
    title: "Nhiệm vụ nhóm mới được giao",
    message: "Bạn vừa được phân công nhiệm vụ: 'Xây dựng mô hình toán tối ưu chi phí vận chuyển đường bộ' trong đồ án SCM.",
    type: "info",
    category: "groups",
    read: true,
    link: "/groups",
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), // Hôm qua
  },
  {
    id: "notif-5",
    title: "Chào mừng bạn đến với LEVRN Study Suite",
    message: "Hệ thống quản lý học tập Eduplex thế hệ mới đã kích hoạt đầy đủ các phân hệ: Môn học, Điểm số GPA, Kế hoạch, Điểm danh & Quản lý nhóm đồ án.",
    type: "success",
    category: "system",
    read: true,
    link: "/dashboard",
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
  },
];

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseActive, setIsSupabaseActive] = useState(false);

  // Tải danh sách thông báo
  const loadData = useCallback(async () => {
    setIsLoading(true);

    let loaded: AppNotification[] = [];
    let isSupabaseOk = false;

    // 1. Thử tải từ Supabase
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("app_notifications")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          loaded = data.map((row: any) => ({
            id: row.id,
            title: row.title,
            message: row.message,
            type: row.type,
            category: row.category,
            read: row.read,
            link: row.link,
            createdAt: row.created_at,
          }));
          isSupabaseOk = true;
        }
      } catch (err) {
        console.warn("Supabase notifications fetch skipped, fallback to localStorage:", err);
      }
    }

    // 2. Đọc từ localStorage nếu Supabase trống
    if (loaded.length === 0 && typeof window !== "undefined") {
      try {
        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (local) {
          loaded = JSON.parse(local);
        }
      } catch (err) {
        console.error("Error reading notifications from localStorage:", err);
      }
    }

    // 3. Fallback demo data
    if (loaded.length === 0) {
      loaded = INITIAL_DEMO_NOTIFICATIONS;
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_NOTIFICATIONS));
      }
    }

    setNotifications(loaded);
    setIsSupabaseActive(isSupabaseOk);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Lưu thông báo vào localStorage và Supabase
  const saveNotifications = useCallback(
    async (newNotifications: AppNotification[]) => {
      setNotifications(newNotifications);
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newNotifications));
      }

      if (supabase && isSupabaseActive) {
        try {
          const rows = newNotifications.map((n) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type,
            category: n.category,
            read: n.read,
            link: n.link,
            created_at: n.createdAt,
          }));
          await supabase.from("app_notifications").upsert(rows);
        } catch (err) {
          console.error("Supabase upsert notifications error:", err);
        }
      }
    },
    [isSupabaseActive]
  );

  // Thêm thông báo mới
  const addNotification = useCallback(
    async (formData: AppNotificationFormData) => {
      const newNotif: AppNotification = {
        ...formData,
        id: `notif-${Date.now()}`,
        read: false,
        createdAt: new Date().toISOString(),
      };
      const updated = [newNotif, ...notifications];
      await saveNotifications(updated);
      return newNotif;
    },
    [notifications, saveNotifications]
  );

  // Đánh dấu 1 thông báo là đã đọc
  const markAsRead = useCallback(
    async (id: string) => {
      const updated = notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      await saveNotifications(updated);
    },
    [notifications, saveNotifications]
  );

  // Đánh dấu tất cả thông báo là đã đọc
  const markAllAsRead = useCallback(async () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    await saveNotifications(updated);
  }, [notifications, saveNotifications]);

  // Xoá 1 thông báo
  const deleteNotification = useCallback(
    async (id: string) => {
      const updated = notifications.filter((n) => n.id !== id);
      await saveNotifications(updated);

      if (supabase && isSupabaseActive) {
        try {
          await supabase.from("app_notifications").delete().eq("id", id);
        } catch (err) {
          console.error("Supabase delete notification error:", err);
        }
      }
    },
    [notifications, isSupabaseActive, saveNotifications]
  );

  // Xoá toàn bộ thông báo đã đọc
  const clearReadNotifications = useCallback(async () => {
    const updated = notifications.filter((n) => !n.read);
    await saveNotifications(updated);
  }, [notifications, saveNotifications]);

  // Số lượng thông báo chưa đọc
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    isSupabaseActive,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
    refreshNotifications: loadData,
  };
}
