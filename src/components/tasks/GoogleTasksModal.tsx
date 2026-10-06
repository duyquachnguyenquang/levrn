"use client";

import React, { useState } from "react";
import {
  CheckSquare,
  Mail,
  RefreshCw,
  ExternalLink,
  User,
  Users,
  CheckCircle2,
  Paperclip,
  Calendar,
  X,
  ShieldCheck,
  Tag,
  AlertTriangle,
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
import { StudyTask, GroupProject, Subject } from "@/lib/types";
import { useGoogleTasks } from "@/hooks/useGoogleTasks";
import { cn } from "@/lib/utils";

interface GoogleTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  personalTasks?: StudyTask[];
  groups?: GroupProject[];
  subjects?: Subject[];
}

export function GoogleTasksModal({
  isOpen,
  onClose,
  personalTasks = [],
  groups = [],
  subjects = [],
}: GoogleTasksModalProps) {
  const {
    connected,
    email,
    isLoading,
    isSyncing,
    connect,
    syncAll,
    syncPersonal,
    syncGroup,
  } = useGoogleTasks();

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [needsReauth, setNeedsReauth] = useState(false);
  const [apiDisabledUrl, setApiDisabledUrl] = useState<string | null>(null);

  // Tổng hợp số lượng task nhóm
  const totalGroupTasks = groups.reduce(
    (acc, g) => acc + (Array.isArray(g.tasks) ? g.tasks.length : 0),
    0
  );

  const handleConnect = () => {
    setMessage(null);
    setNeedsReauth(false);
    setApiDisabledUrl(null);
    connect(typeof window !== "undefined" ? window.location.pathname : "/dashboard");
  };

  const handleSyncAll = async () => {
    setMessage(null);
    const res = await syncAll({ personalTasks, groups, subjects });
    if (res.success) {
      setNeedsReauth(false);
      setApiDisabledUrl(null);
      setMessage({
        type: "success",
        text: `Đã đồng bộ ${res.total || 0} nhiệm vụ lên Google Tasks (My Tasks: ${res.personalSynced || 0}, Groupworks: ${res.groupSynced || 0})!`,
      });
    } else {
      if (res.needsReauth) setNeedsReauth(true);
      if (res.isApiDisabled && res.enableApiUrl) setApiDisabledUrl(res.enableApiUrl);
      setMessage({
        type: "error",
        text: res.error || "Đồng bộ thất bại, vui lòng kiểm tra lại quyền truy cập Google",
      });
    }
  };

  const handleSyncPersonal = async () => {
    setMessage(null);
    const res = await syncPersonal({ personalTasks, subjects });
    if (res.success) {
      setNeedsReauth(false);
      setApiDisabledUrl(null);
      setMessage({
        type: "success",
        text: `Đã đồng bộ ${res.synced || 0} nhiệm vụ cá nhân vào danh sách "My Tasks"!`,
      });
    } else {
      if (res.needsReauth) setNeedsReauth(true);
      if (res.isApiDisabled && res.enableApiUrl) setApiDisabledUrl(res.enableApiUrl);
      setMessage({
        type: "error",
        text: res.error || "Đồng bộ nhiệm vụ cá nhân thất bại",
      });
    }
  };

  const handleSyncGroup = async () => {
    setMessage(null);
    const res = await syncGroup({ groups, subjects });
    if (res.success) {
      setNeedsReauth(false);
      setApiDisabledUrl(null);
      setMessage({
        type: "success",
        text: `Đã đồng bộ ${res.synced || 0} nhiệm vụ nhóm vào danh sách "Groupworks"!`,
      });
    } else {
      if (res.needsReauth) setNeedsReauth(true);
      if (res.isApiDisabled && res.enableApiUrl) setApiDisabledUrl(res.enableApiUrl);
      setMessage({
        type: "error",
        text: res.error || "Đồng bộ nhiệm vụ nhóm thất bại",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* Container Dialog bo tròn 5-10% (rounded-lg) theo Rule 1.6 & 1.12 */}
      <DialogContent className="sm:max-w-[560px] p-5 rounded-lg border border-border/80 bg-card shadow-2xl [&>button.absolute]:hidden">
        {/* Header Tinh gọn - Không subtitle thừa bên dưới (Rule 1.1), Nút X chuẩn Rule 1.12 */}
        <DialogHeader className="p-0 border-b border-border/60 pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-[#7D39EB]/15 text-[#7D39EB] flex items-center justify-center shrink-0">
              <CheckSquare className="h-4 w-4" />
            </div>
            <DialogTitle className="text-base font-extrabold text-foreground">
              Google Tasks
            </DialogTitle>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-md border border-border/80 bg-background hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
            title="Đóng hộp thoại"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        {/* Nội dung chính */}
        <div className="space-y-4 py-1 text-xs">
          {/* Thông báo kết quả thao tác */}
          {message && (
            <div
              className={cn(
                "p-3 rounded-md text-xs font-semibold flex items-center gap-2 border animate-in fade-in-50 duration-200",
                message.type === "success"
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                  : "bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300"
              )}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <X className="h-4 w-4 shrink-0 text-rose-500" />
              )}
              <span className="flex-1">{message.text}</span>
            </div>
          )}

          {/* 1. Trạng thái kết nối Google */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5" /> Trạng thái tài khoản Google
            </Label>
            <div className="p-3 rounded-md bg-muted/40 border border-border/70 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-7 w-7 rounded-md bg-background border border-border/80 flex items-center justify-center shrink-0">
                  <Mail className="h-3.5 w-3.5 text-[#7D39EB]" />
                </div>
                <div className="min-w-0">
                  {connected && email ? (
                    <>
                      <p className="font-bold text-foreground text-xs truncate">
                        {email}
                      </p>
                      {needsReauth ? (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          Cần cấp thêm quyền Google Tasks
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Đã liên kết tài khoản Google
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-foreground text-xs">
                        Chưa liên kết tài khoản Google
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Đăng nhập để đồng bộ nhiệm vụ vào Google Tasks
                      </p>
                    </>
                  )}
                </div>
              </div>

              {connected ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleConnect}
                    disabled={isLoading || isSyncing}
                    className="h-8 px-2.5 rounded-md border-border/80 text-xs font-semibold hover:bg-muted"
                    title="Cấp lại quyền truy cập hoặc đổi tài khoản Google"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Cấp lại quyền
                  </Button>
                  <a
                    href="https://tasks.google.com/tasks/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 w-8 rounded-md border border-border/80 bg-background hover:bg-muted text-foreground flex items-center justify-center font-bold text-xs shrink-0 transition-all cursor-pointer active:scale-95"
                    title="Mở ứng dụng Google Tasks trên web"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  </a>
                </div>
              ) : (
                <Button
                  type="button"
                  onClick={handleConnect}
                  disabled={isLoading}
                  className="h-8 px-3 rounded-md bg-[#7D39EB] hover:bg-[#6826d4] text-white text-xs font-bold shrink-0 shadow-xs cursor-pointer active:scale-95"
                >
                  Kết nối Google
                </Button>
              )}
            </div>
          </div>

          {/* Cảnh báo thiếu quyền & nút cấp quyền nhanh */}
          {needsReauth && (
            <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/30 text-xs space-y-2 animate-in fade-in-50 duration-200">
              <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                <span>Yêu cầu cấp thêm quyền Google Tasks</span>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Tài khoản Google hiện tại chưa được cấp quyền Google Tasks (do đã đăng nhập từ trước khi có tính năng Tasks). Vui lòng bấm nút bên dưới để cấp quyền Google Tasks.
              </p>
              <Button
                type="button"
                onClick={handleConnect}
                className="h-8 px-3 rounded-md bg-[#7D39EB] hover:bg-[#6826d4] text-white text-xs font-bold cursor-pointer active:scale-95 w-full sm:w-auto"
              >
                Cấp quyền Google Tasks ngay
              </Button>
            </div>
          )}

          {/* Cảnh báo API chưa được Bật trên Google Cloud */}
          {apiDisabledUrl && (
            <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/30 text-xs space-y-2 animate-in fade-in-50 duration-200">
              <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                <span>Google Tasks API chưa được Bật trên Google Cloud</span>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Dự án Google Cloud của bạn chưa kích hoạt dịch vụ Google Tasks API. Bấm nút bên dưới để mở trang Google Cloud Console và bấm <strong>Bật (Enable)</strong>, sau đó đợi 1-2 phút rồi thử đồng bộ lại.
              </p>
              <a
                href={apiDisabledUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-[#7D39EB] hover:bg-[#6826d4] text-white text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
              >
                <span>Mở Google Cloud Console để Bật Tasks API</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          {/* 2. Danh sách cấu hình đồng bộ 2 tầng: My Tasks & Groupworks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Cột 1: Nhiệm vụ cá nhân -> My Tasks */}
            <div className="p-3 rounded-md bg-muted/20 border border-border/70 flex flex-col justify-between space-y-2">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-[#7D39EB]" />
                    <span className="font-extrabold text-foreground text-xs">
                      My Tasks
                    </span>
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                    {personalTasks.length} nhiệm vụ
                  </Badge>
                </div>

                <div className="space-y-1 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span>Định dạng: <strong className="text-foreground">[Mã môn] Tên task</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span>Hạn chót: <strong className="text-foreground">Cả ngày</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span>File: <strong className="text-foreground">Tài liệu, Drive & Link nộp</strong></span>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSyncPersonal}
                disabled={!connected || isSyncing || personalTasks.length === 0}
                className="w-full h-8 text-[11px] font-bold rounded-md border-border/80 hover:bg-muted cursor-pointer active:scale-95"
              >
                <RefreshCw className={cn("h-3 w-3 mr-1.5", isSyncing && "animate-spin")} />
                Đồng bộ My Tasks ({personalTasks.length})
              </Button>
            </div>

            {/* Cột 2: Nhiệm vụ nhóm -> Groupworks */}
            <div className="p-3 rounded-md bg-muted/20 border border-border/70 flex flex-col justify-between space-y-2">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-amber-500" />
                    <span className="font-extrabold text-foreground text-xs">
                      Groupworks
                    </span>
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                    {totalGroupTasks} nhiệm vụ
                  </Badge>
                </div>

                <div className="space-y-1 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span>Định dạng: <strong className="text-foreground">[Mã môn] Tên task</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span>Hạn chót: <strong className="text-foreground">Cả ngày</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span>File: <strong className="text-foreground">Drive, Repo, Meeting, Chat</strong></span>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSyncGroup}
                disabled={!connected || isSyncing || totalGroupTasks === 0}
                className="w-full h-8 text-[11px] font-bold rounded-md border-border/80 hover:bg-muted cursor-pointer active:scale-95"
              >
                <RefreshCw className={cn("h-3 w-3 mr-1.5", isSyncing && "animate-spin")} />
                Đồng bộ Groupworks ({totalGroupTasks})
              </Button>
            </div>
          </div>
        </div>

        {/* Nút hành động Footer */}
        <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="h-9 px-3 text-xs font-bold rounded-md hover:bg-muted text-muted-foreground cursor-pointer"
          >
            Đóng
          </Button>

          <Button
            type="button"
            onClick={handleSyncAll}
            disabled={!connected || isSyncing}
            className="h-9 px-4 rounded-md bg-[#7D39EB] hover:bg-[#6826d4] text-white text-xs font-extrabold shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
            <span>Đồng bộ tất cả ({personalTasks.length + totalGroupTasks} nhiệm vụ)</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
