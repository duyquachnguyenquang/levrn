"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  CalendarSync,
  Mail,
  ShieldCheck,
  RefreshCw,
  Unlink,
  CheckCircle2,
  X,
  ExternalLink,
  Check,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Subject } from "@/lib/types";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { cn } from "@/lib/utils";

interface GoogleCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects?: Subject[];
}

export function GoogleCalendarModal({
  isOpen,
  onClose,
  subjects = [],
}: GoogleCalendarModalProps) {
  const {
    connected,
    email,
    calendarId,
    isLoading,
    isSyncing,
    isDisconnecting,
    connect,
    disconnect,
    syncAll,
  } = useGoogleCalendar();

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [localSubjects, setLocalSubjects] = useState<Subject[]>(subjects);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Cập nhật danh sách môn học khi props thay đổi
  useEffect(() => {
    setLocalSubjects(subjects);
  }, [subjects]);

  const handleConnect = () => {
    setMessage(null);
    connect(typeof window !== "undefined" ? window.location.pathname : "/dashboard");
  };

  const handleDisconnect = async () => {
    setMessage(null);
    const ok = await disconnect();
    if (ok) {
      setMessage({ type: "success", text: "Đã ngắt kết nối Google Calendar thành công." });
    } else {
      setMessage({ type: "error", text: "Không thể ngắt kết nối, vui lòng thử lại." });
    }
  };

  const handleSyncAll = async () => {
    setMessage(null);
    const res = await syncAll();
    if (res.success) {
      setMessage({
        type: "success",
        text: `Đồng bộ thành công ${res.count ?? 0} môn học sang Google Calendar!`,
      });
    } else {
      setMessage({ type: "error", text: res.error || "Lỗi đồng bộ" });
    }
  };

  // Bật hoặc tắt đồng bộ cho 1 môn học cụ thể
  const handleToggleSubject = async (subjectId: string, enabled: boolean) => {
    setTogglingId(subjectId);
    setMessage(null);

    // Cập nhật lạc quan (Optimistic update)
    setLocalSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? {
              ...s,
              syncToGoogle: enabled,
              googleEventId: enabled ? s.googleEventId : undefined,
            }
          : s
      )
    );

    try {
      const res = await fetch("/api/calendar/google/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle-subject",
          subjectId,
          enabled,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLocalSubjects((prev) =>
          prev.map((s) =>
            s.id === subjectId
              ? {
                  ...s,
                  syncToGoogle: enabled,
                  googleEventId: data.googleEventId || (enabled ? s.googleEventId : undefined),
                }
              : s
          )
        );
        setMessage({
          type: "success",
          text: enabled
            ? "Đã đưa môn học lên Google Calendar thành công."
            : "Đã gỡ môn học khỏi Google Calendar (tránh trùng lịch thủ công).",
        });
      } else {
        setMessage({ type: "error", text: data.error || "Lỗi cập nhật môn học" });
      }
    } catch {
      setMessage({ type: "error", text: "Lỗi kết nối khi cập nhật môn học." });
    } finally {
      setTogglingId(null);
    }
  };

  // Lọc môn học theo từ khóa tìm kiếm
  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return localSubjects;
    const q = searchQuery.toLowerCase().trim();
    return localSubjects.filter(
      (s) =>
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.room && s.room.toLowerCase().includes(q))
    );
  }, [localSubjects, searchQuery]);

  // Kiểm tra xem tất cả môn học có đang được bật hay không
  const allSynced = useMemo(() => {
    if (localSubjects.length === 0) return false;
    return localSubjects.every((s) => s.syncToGoogle !== false);
  }, [localSubjects]);

  // Thao tác bật/tắt toàn bộ bằng nút trượt Tất cả
  const handleToggleAllSwitch = async () => {
    setMessage(null);
    const targetState = !allSynced;
    const targets = localSubjects.filter((s) => (s.syncToGoogle !== false) !== targetState);
    if (targets.length === 0) return;

    for (const sub of targets) {
      await handleToggleSubject(sub.id, targetState);
    }
  };

  const formatScheduleText = (s: Subject) => {
    const days =
      s.scheduleDays && s.scheduleDays.length > 0
        ? s.scheduleDays.map((d) => (d === 0 ? "CN" : `T${d + 1}`)).join(", ")
        : "Chưa xếp thứ";
    const time = s.startTime && s.endTime ? `${s.startTime} - ${s.endTime}` : "";
    const place = s.room ? `P.${s.room}` : "";
    return [days, time, place].filter(Boolean).join(" • ");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] rounded-lg border border-border bg-card p-0 overflow-hidden shadow-xl max-h-[90vh] flex flex-col [&>button.absolute]:hidden">
        {/* Header tuân thủ Rule 1.1 (Không có subtitle) & Rule 1.10 (Header 3 thành phần cùng hàng) */}
        <DialogHeader className="p-4 sm:p-5 border-b border-border/80 flex flex-row items-center justify-between space-y-0 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <CalendarSync className="w-5 h-5 text-[#7D39EB]" />
            Google Calendar
          </DialogTitle>
          <button
            type="button"
            onClick={onClose}
            title="Đóng"
            aria-label="Đóng"
            className="h-8 w-8 rounded-md border border-border/80 bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all active:scale-95 shadow-2xs shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </DialogHeader>

        {/* Nội dung Dialog: Tuân thủ Rule 1.3 (Label Icons) & Rule 1.9 (Flat fields) */}
        <div className="p-5 space-y-3.5 overflow-y-auto flex-1">
          {message && (
            <div
              className={`p-3 rounded-md text-xs font-semibold flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                  : "bg-red-500/10 text-red-600 border border-red-500/20"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{message.text}</span>
            </div>
          )}

          {/* Hàng 1: 'Trạng thái' bên trái, 'Đã kết nối' / 'Chưa kết nối' bên phải */}
          <div className="flex items-center justify-between py-0.5">
            <Label className="flex items-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
              Trạng thái
            </Label>
            <Badge
              variant="outline"
              className={`text-xs font-bold rounded-md px-2.5 py-0.5 ${
                connected
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                  : "bg-muted text-muted-foreground border-border"
              }`}
            >
              {isLoading ? "Đang kiểm tra..." : connected ? "Đã kết nối" : "Chưa kết nối"}
            </Badge>
          </div>

          {/* Hàng 2: 'Tài khoản Google' bên trái, email người dùng bên phải */}
          <div className="flex items-center justify-between py-1.5 border-t border-border/50">
            <Label className="flex items-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <Mail className="w-3.5 h-3.5 mr-1.5" />
              Tài khoản Google
            </Label>
            <div className="text-xs font-bold text-foreground">
              {email || (connected ? "Đã cấp quyền" : "Chưa liên kết")}
            </div>
          </div>

          {/* Hàng 3 & Danh sách môn học: Chỉ hiển thị khi đã kết nối */}
          {connected && (
            <div className="space-y-2.5 pt-2 border-t border-border/60">
              {/* Hàng 3: Thanh tìm kiếm bên trái, Công tắc trượt + chữ 'Tất cả' bên phải */}
              <div className="flex items-center justify-between gap-3">
                {/* Thanh tìm kiếm bên trái */}
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Tìm môn học..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 pl-8 pr-2.5 text-xs rounded-md border-border/80 bg-background focus-visible:ring-1 focus-visible:ring-[#7D39EB]"
                  />
                </div>

                {/* Nút bật tắt dạng trượt + chữ 'Tất cả' bên phải */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-foreground select-none">Tất cả</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={allSynced}
                    onClick={handleToggleAllSwitch}
                    disabled={localSubjects.length === 0 || isSyncing}
                    className={cn(
                      "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      allSynced ? "bg-[#7D39EB]" : "bg-muted"
                    )}
                    title={allSynced ? "Tắt tất cả" : "Bật tất cả"}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-md transition duration-200 ease-in-out",
                        allSynced ? "translate-x-4" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
              </div>

              {/* Danh sách môn học với cơ chế Check-box */}
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {filteredSubjects.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground font-medium">
                    {searchQuery ? "Không tìm thấy môn học phù hợp" : "Chưa có môn học nào"}
                  </div>
                ) : (
                  filteredSubjects.map((sub) => {
                    const isSynced = sub.syncToGoogle !== false;
                    const isProcessing = togglingId === sub.id;

                    return (
                      <div
                        key={sub.id}
                        onClick={() => !isProcessing && handleToggleSubject(sub.id, !isSynced)}
                        className={cn(
                          "p-2.5 rounded-lg border transition-all flex items-center justify-between gap-3 cursor-pointer select-none",
                          isSynced
                            ? "bg-card border-border hover:border-[#7D39EB]/40 shadow-2xs"
                            : "bg-muted/20 border-border/40 opacity-60 hover:opacity-90"
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-xs shrink-0"
                              style={{ backgroundColor: sub.color || "#7D39EB" }}
                            />
                            <span className="text-xs font-bold text-foreground truncate">
                              [{sub.code}] {sub.name}
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5 truncate pl-4.5">
                            {formatScheduleText(sub)}
                          </div>
                        </div>

                        {/* Hộp chọn Check-box chuẩn phong cách LEVRN */}
                        <div
                          className={cn(
                            "h-5 w-5 rounded-md border flex items-center justify-center transition-all shrink-0",
                            isSynced
                              ? "bg-[#7D39EB] border-[#7D39EB] text-white shadow-2xs"
                              : "border-border bg-background hover:border-[#7D39EB]/50"
                          )}
                          title={isSynced ? "Bỏ chọn môn này" : "Chọn đồng bộ môn này"}
                        >
                          {isProcessing ? (
                            <RefreshCw className="w-3 h-3 animate-spin text-white" />
                          ) : isSynced ? (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer thao tác tuân thủ Button Hierarchy Rule 1.2:
            - Bên trái: Nút điều hướng 'Google Calendar'
            - Bên phải: Cụm nút 'Ngắt kết nối' và 'Đồng bộ' */}
        <div className="p-4 border-t border-border/80 bg-muted/20 flex items-center justify-between gap-2 shrink-0">
          {connected ? (
            <>
              {/* Nút điều hướng Google Calendar chuyển xuống ngang hàng ở footer */}
              <a
                href="https://calendar.google.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#7D39EB] font-bold hover:underline py-1.5 cursor-pointer"
                title="Mở Google Calendar trên tab mới"
              >
                <span>Google Calendar</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {/* Cụm nút thao tác bên phải */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDisconnect}
                  disabled={isDisconnecting || isSyncing}
                  title="Ngắt kết nối Google Calendar"
                  className="rounded-md font-bold text-xs h-9 px-3 text-destructive border-destructive/30 hover:bg-destructive/10 cursor-pointer"
                >
                  <Unlink className="w-3.5 h-3.5 mr-1.5" />
                  Ngắt kết nối
                </Button>
                <Button
                  type="button"
                  onClick={handleSyncAll}
                  disabled={isSyncing || isDisconnecting}
                  title="Đồng bộ lịch lên Google Calendar"
                  className="bg-[#7D39EB] hover:bg-[#6C2BD9] text-white rounded-md font-bold text-xs h-9 px-4 cursor-pointer"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", isSyncing && "animate-spin")} />
                  {isSyncing ? "Đang đồng bộ..." : "Đồng bộ"}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-end w-full">
              <Button
                type="button"
                onClick={handleConnect}
                disabled={isLoading}
                className="bg-[#7D39EB] hover:bg-[#6C2BD9] text-white rounded-md font-bold text-xs h-9 px-4 cursor-pointer"
              >
                <CalendarSync className="w-4 h-4 mr-2" />
                Kết nối Google Calendar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
