"use client";

import React, { useState, useMemo } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationCard } from "@/components/notifications/NotificationCard";
import { CreateNotificationModal } from "@/components/notifications/CreateNotificationModal";
import { AppNotificationFormData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bell,
  CheckCheck,
  Trash2,
  Plus,
  Search,
  AlertCircle,
  Inbox,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
  } = useNotifications();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<
    "all" | "unread" | "alerts" | "attendance" | "groups" | "system"
  >("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Lọc thông báo
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        notif.title.toLowerCase().includes(q) ||
        notif.message.toLowerCase().includes(q);

      let matchTab = true;
      if (activeTab === "unread") {
        matchTab = !notif.read;
      } else if (activeTab === "alerts") {
        matchTab = notif.type === "warning" || notif.type === "deadline";
      } else if (activeTab === "attendance") {
        matchTab = notif.category === "attendance";
      } else if (activeTab === "groups") {
        matchTab = notif.category === "groups";
      } else if (activeTab === "system") {
        matchTab = notif.category === "system" || notif.category === "schedule";
      }

      return matchQuery && matchTab;
    });
  }, [notifications, searchQuery, activeTab]);

  const handleCreateNotification = (data: AppNotificationFormData) => {
    addNotification(data);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header trang: Đồng bộ chuẩn Môn học & Kế hoạch, luôn nằm cùng hàng trên mọi thiết bị */}
      <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-md bg-[#7D39EB]/15 flex items-center justify-center text-[#7D39EB] shrink-0">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-foreground tracking-tight truncate flex items-center gap-2">
            <span>Trung tâm thông báo</span>
            {unreadCount > 0 && (
              <span className="text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#C6FF33] text-black shrink-0">
                {unreadCount} mới
              </span>
            )}
          </h1>
        </div>

        {/* Nút thao tác nhanh: luôn cùng 1 hàng, căn trái, ưu tiên icon trên mobile */}
        <div className="flex flex-row items-center justify-start gap-1.5 sm:gap-2 shrink-0 flex-nowrap">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="icon"
              onClick={markAllAsRead}
              className="min-h-[40px] min-w-[40px] h-10 w-10 sm:h-9 sm:w-9 rounded-lg border-border/80 text-muted-foreground hover:text-foreground shrink-0 transition-all active:scale-95"
              title="Đánh dấu tất cả đã đọc"
              aria-label="Đánh dấu tất cả đã đọc"
            >
              <CheckCheck className="h-4 w-4 text-emerald-500" />
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={clearReadNotifications}
            className="min-h-[40px] min-w-[40px] h-10 w-10 sm:h-9 sm:w-9 rounded-lg border-border/80 text-muted-foreground hover:text-destructive shrink-0 transition-all active:scale-95"
            title="Dọn dẹp các thông báo đã đọc"
            aria-label="Dọn dẹp các thông báo đã đọc"
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          <Button
            onClick={() => setCreateModalOpen(true)}
            className="min-h-[40px] min-w-[40px] h-10 sm:h-9 px-3 sm:px-3.5 text-xs font-bold rounded-lg bg-[#7D39EB] hover:bg-[#6D28D9] text-white shadow-xs gap-1.5 shrink-0 flex items-center justify-center transition-all active:scale-95"
            title="Tạo nhắc nhở"
            aria-label="Tạo nhắc nhở"
          >
            <Plus className="h-4.5 w-4.5" />
            <span className="hidden sm:inline">Tạo nhắc nhở</span>
          </Button>
        </div>
      </div>

      {/* Tabs phân loại & Search Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
        {/* Tab pills: luôn cùng hàng, không rớt dòng, căn trái */}
        <div className="flex flex-row items-center justify-start gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar flex-nowrap shrink-0">
          {[
            { key: "all", label: `Tất cả (${notifications.length})` },
            { key: "unread", label: `Chưa đọc (${unreadCount})` },
            { key: "alerts", label: "Cảnh báo & Hạn nộp" },
            { key: "attendance", label: "Điểm danh" },
            { key: "groups", label: "Đồ án nhóm" },
            { key: "system", label: "Hệ thống" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={cn(
                "min-h-[40px] px-3.5 sm:px-3 sm:py-1.5 sm:min-h-0 rounded-lg text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer",
                activeTab === tab.key
                  ? "bg-[#7D39EB] text-white shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Thanh tìm kiếm */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Tìm thông báo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9 pr-4 text-xs rounded-lg bg-card border-border/80"
          />
        </div>
      </div>

      {/* Danh sách thông báo */}
      {isLoading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          Đang tải thông báo...
        </div>
      ) : filteredNotifications.length > 0 ? (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => (
            <NotificationCard
              key={notif.id}
              notification={notif}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-border/80 rounded-lg p-8">
          <Inbox className="h-9 w-9 mx-auto text-muted-foreground/60 mb-2" />
          <h3 className="text-sm font-bold text-foreground">Không có thông báo nào</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {searchQuery || activeTab !== "all"
              ? "Không có thông báo nào phù hợp với bộ lọc hiện tại."
              : "Hộp thư thông báo của bạn đang trống. Mọi thông báo điểm danh và đồ án mới sẽ hiển thị tại đây."}
          </p>
        </div>
      )}

      {/* Modal tạo thông báo mới */}
      <CreateNotificationModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onAddNotification={handleCreateNotification}
      />
    </div>
  );
}
