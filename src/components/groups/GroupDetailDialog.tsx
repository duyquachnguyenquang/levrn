"use client";

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GroupProject,
  GroupMember,
  GroupMemberRole,
  GroupTaskStatus,
} from "@/lib/types";
import {
  Users,
  CheckSquare,
  Plus,
  Trash2,
  Crown,
  Clock,
  Folder,
  Flag,
  UserPlus,
  Phone,
  Award,
  ExternalLink,
  Pencil,
  X,
  GripVertical,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { GroupTaskModal } from "./GroupTaskModal";
import { MarqueeText } from "@/components/ui/marquee-text";
import { cn } from "@/lib/utils";

interface GroupDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: GroupProject | null;
  onEdit?: (group: GroupProject) => void;
  onAddMember: (groupId: string, memberData: Omit<GroupMember, "id">) => void;
  onRemoveMember: (groupId: string, memberId: string) => void;
  onAddTask: (groupId: string, taskData: any) => void;
  onUpdateTaskStatus: (groupId: string, taskId: string, status: GroupTaskStatus) => void;
  onDeleteTask: (groupId: string, taskId: string) => void;
  onUpdateGradeScore?: (groupId: string, score: number | null) => void;
}

export function GroupDetailDialog({
  open,
  onOpenChange,
  group,
  onEdit,
  onAddMember,
  onRemoveMember,
  onAddTask,
  onUpdateTaskStatus,
  onDeleteTask,
  onUpdateGradeScore,
}: GroupDetailDialogProps) {
  const [activeTab, setActiveTab] = useState<"tasks" | "members">("tasks");
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [detailScoreInput, setDetailScoreInput] = useState("");

  // Kéo thả thẻ Kanban
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<GroupTaskStatus | null>(null);

  // Form thêm thành viên mới
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberStudentId, setNewMemberStudentId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<GroupMemberRole>("member");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberPhone, setNewMemberPhone] = useState("");
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);

  const tasksToShow = useMemo(() => {
    if (!group) return [];
    return group.tasks || [];
  }, [group]);

  if (!group) return null;

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    onAddMember(group.id, {
      name: newMemberName.trim(),
      studentId: newMemberStudentId.trim() || undefined,
      phone: newMemberPhone.trim() || undefined,
      role: newMemberRole,
      email: newMemberEmail.trim() || undefined,
      contributionScore: 100,
      avatarColor:
        newMemberRole === "leader"
          ? "#7D39EB"
          : newMemberRole === "secretary"
          ? "#EC4899"
          : "#3B82F6",
    });

    setNewMemberName("");
    setNewMemberStudentId("");
    setNewMemberPhone("");
    setNewMemberRole("member");
    setNewMemberEmail("");
    setShowAddMemberForm(false);
  };

  const handleSaveScore = () => {
    const parsed = detailScoreInput.trim() !== "" ? parseFloat(detailScoreInput) : null;
    const validScore = parsed !== null && !isNaN(parsed) ? Math.min(10, Math.max(0, parsed)) : null;
    onUpdateGradeScore?.(group.id, validScore);
    setGradeModalOpen(false);
  };

  const completedTasks = tasksToShow.filter((t) => t.status === "done").length;
  const progress =
    tasksToShow.length > 0
      ? Math.round((completedTasks / tasksToShow.length) * 100)
      : 0;

  const taskStatuses: { key: GroupTaskStatus; label: string; color: string }[] = [
    { key: "todo", label: "Cần làm", color: "text-slate-400" },
    { key: "in_progress", label: "Đang làm", color: "text-[#7D39EB]" },
    { key: "review", label: "Chờ duyệt", color: "text-amber-500" },
    { key: "done", label: "Hoàn thành", color: "text-emerald-500" },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-lg border-border shadow-2xl [&>button.absolute]:hidden">
          {/* Header chi tiết nhóm với Marquee và khoảng cách cân đối */}
          <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-border/60 shrink-0 bg-card space-y-1.5">
            {/* Hàng 1: Mã môn, Tên môn, Tên nhóm với Marquee; Nút Chỉnh sửa & Thoát ở bên phải */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                <span className="font-mono font-black text-xs px-2 py-0.5 rounded-md bg-[#7D39EB]/15 text-[#7D39EB] border border-[#7D39EB]/30 shrink-0">
                  {group.subjectCode}
                </span>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <MarqueeText
                    text={`${group.subjectName} • ${group.name}`}
                    className="text-xs sm:text-sm font-bold text-foreground"
                  />
                </div>
              </div>

              {/* Cụm nút icon Bút chì & Thoát ngang hàng chuẩn h-8 w-8 */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onEdit?.(group)}
                  className="h-8 w-8 rounded-md border border-border/80 bg-background hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all"
                  title="Chỉnh sửa nhóm"
                  aria-label="Chỉnh sửa nhóm"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="h-8 w-8 rounded-md border border-border/80 bg-background hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all"
                  title="Đóng"
                  aria-label="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Hàng 2: Tên đề tài/nhiệm vụ lớn với Marquee; Hạn chót chỉ hiển thị ngày ở bên phải */}
            <div className="flex items-center justify-between gap-3 pt-0.5">
              <div className="min-w-0 flex-1 overflow-hidden">
                <MarqueeText
                  text={group.topic}
                  className="text-base sm:text-lg font-black text-foreground tracking-tight"
                />
              </div>

              {group.deadline && (
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-500 text-xs font-bold shrink-0 shadow-xs"
                  title="Hạn chót"
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>{new Date(group.deadline).toLocaleDateString("vi-VN")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Phần nội dung cuộn */}
          <div className="px-4 py-3 sm:px-5 sm:py-3.5 overflow-y-auto flex-1 space-y-3">
            {/* Tab switcher: Nhiệm vụ & Thành viên dạng icon-only tinh gọn */}
            <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
              <div className="flex items-center gap-1.5">
                {/* Nút icon Nhiệm vụ */}
                <button
                  type="button"
                  onClick={() => setActiveTab("tasks")}
                  className={cn(
                    "h-8 w-8 rounded-md flex items-center justify-center transition-all relative border",
                    activeTab === "tasks"
                      ? "bg-[#7D39EB] text-white border-[#7D39EB] shadow-xs"
                      : "bg-muted/50 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  title={`Nhiệm vụ (${tasksToShow.length})`}
                  aria-label={`Nhiệm vụ (${tasksToShow.length})`}
                >
                  <CheckSquare className="h-4 w-4" />
                  {tasksToShow.length > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-mono font-bold bg-[#C6FF33] text-black flex items-center justify-center border border-card shadow-xs">
                      {tasksToShow.length}
                    </span>
                  )}
                </button>

                {/* Nút icon Thành viên */}
                <button
                  type="button"
                  onClick={() => setActiveTab("members")}
                  className={cn(
                    "h-8 w-8 rounded-md flex items-center justify-center transition-all relative border",
                    activeTab === "members"
                      ? "bg-[#7D39EB] text-white border-[#7D39EB] shadow-xs"
                      : "bg-muted/50 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  title={`Thành viên (${group.members.length})`}
                  aria-label={`Thành viên (${group.members.length})`}
                >
                  <Users className="h-4 w-4" />
                  {group.members.length > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-mono font-bold bg-[#7D39EB] text-white flex items-center justify-center border border-card shadow-xs">
                      {group.members.length}
                    </span>
                  )}
                </button>
              </div>

              {activeTab === "tasks" && (
                <button
                  type="button"
                  onClick={() => setTaskModalOpen(true)}
                  className="h-8 w-8 rounded-md bg-[#7D39EB] text-white hover:bg-[#6D28D9] flex items-center justify-center shadow-xs transition-all"
                  title="Giao nhiệm vụ mới cho nhóm"
                  aria-label="Giao nhiệm vụ mới cho nhóm"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}

              {activeTab === "members" && (
                <button
                  type="button"
                  onClick={() => setShowAddMemberForm(!showAddMemberForm)}
                  className="h-8 w-8 rounded-md bg-[#7D39EB] text-white hover:bg-[#6D28D9] flex items-center justify-center shadow-xs transition-all"
                  title={showAddMemberForm ? "Đóng form" : "Thêm thành viên mới"}
                  aria-label={showAddMemberForm ? "Đóng form" : "Thêm thành viên mới"}
                >
                  <UserPlus className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* TAB 1: DANH SÁCH NHIỆM VỤ THEO KANBAN */}
            {activeTab === "tasks" && (
              <div className="space-y-3">
                {/* Thanh tiến độ dự án ngang dài, chỉ hiện số lượng hoàn thành trên tổng số ở trên bên phải */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <Flag className="h-3.5 w-3.5 text-[#7D39EB]" />
                      Tiến độ dự án
                    </span>
                    <span className="font-mono font-bold text-[11px] text-muted-foreground">
                      {completedTasks}/{tasksToShow.length}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-md bg-muted/80 overflow-hidden border border-border/50">
                    <div
                      className="h-full bg-gradient-to-r from-[#7D39EB] to-[#C6FF33] transition-all duration-300 rounded-sm"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Bảng Kanban 4 cột hỗ trợ kéo thả trực tiếp, chỉ hiển thị nhiệm vụ con */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {taskStatuses.map((col) => {
                    const colTasks = tasksToShow.filter((t) => t.status === col.key);
                    const isOver = dragOverCol === col.key;

                    return (
                      <div
                        key={col.key}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                          if (dragOverCol !== col.key) setDragOverCol(col.key);
                        }}
                        onDragLeave={(e) => {
                          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                            if (dragOverCol === col.key) setDragOverCol(null);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
                          if (taskId) {
                            onUpdateTaskStatus(group.id, taskId, col.key);
                          }
                          setDraggedTaskId(null);
                          setDragOverCol(null);
                        }}
                        className={cn(
                          "bg-card border rounded-lg p-2.5 flex flex-col min-h-[170px] transition-all duration-150",
                          isOver
                            ? "border-[#7D39EB] bg-[#7D39EB]/5 ring-1 ring-[#7D39EB]/30"
                            : "border-border/70"
                        )}
                      >
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/50 text-xs font-bold">
                          <span className={col.color}>{col.label}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                            {colTasks.length}
                          </span>
                        </div>

                        <div className="space-y-2 flex-1">
                          {colTasks.map((task) => (
                            <div
                              key={task.id}
                              draggable
                              onDragStart={(e) => {
                                setDraggedTaskId(task.id);
                                e.dataTransfer.setData("text/plain", task.id);
                                e.dataTransfer.effectAllowed = "move";
                              }}
                              onDragEnd={() => {
                                setDraggedTaskId(null);
                                setDragOverCol(null);
                              }}
                              className={cn(
                                "p-2.5 rounded-md bg-muted/30 border border-border/60 text-xs transition-all cursor-grab active:cursor-grabbing group/task",
                                draggedTaskId === task.id
                                  ? "opacity-30 scale-[0.98] border-dashed border-[#7D39EB]"
                                  : "hover:border-[#7D39EB]/40 hover:bg-muted/50"
                              )}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div className="flex items-start gap-1 min-w-0">
                                  <GripVertical className="h-3 w-3 text-muted-foreground/40 group-hover/task:text-muted-foreground mt-0.5 shrink-0" />
                                  <p className="font-semibold text-foreground text-xs leading-snug break-words">
                                    {task.title}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => onDeleteTask(group.id, task.id)}
                                  className="text-muted-foreground hover:text-destructive opacity-0 group-hover/task:opacity-100 transition-opacity shrink-0"
                                  title="Xoá nhiệm vụ"
                                  aria-label="Xoá nhiệm vụ"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>

                              {task.assigneeName && (
                                <div className="flex items-center gap-1 text-[11px] text-[#7D39EB] font-medium mt-1.5 pl-4">
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#7D39EB]" />
                                  <span className="truncate">{task.assigneeName}</span>
                                </div>
                              )}

                              <div className="flex items-center justify-between gap-1 mt-2 pt-1.5 border-t border-border/40 text-[10px] text-muted-foreground pl-4">
                                {task.dueDate ? (
                                  <span>Hạn: {task.dueDate}</span>
                                ) : (
                                  <span>Không hạn</span>
                                )}

                                {/* Dropdown chuyển trạng thái nhanh dự phòng cho thiết bị cảm ứng */}
                                <select
                                  value={task.status}
                                  onChange={(e) =>
                                    onUpdateTaskStatus(
                                      group.id,
                                      task.id,
                                      e.target.value as GroupTaskStatus
                                    )
                                  }
                                  className="text-[10px] bg-background border border-border/60 rounded px-1 py-0.5 text-foreground cursor-pointer"
                                  title="Đổi trạng thái"
                                >
                                  <option value="todo">Cần làm</option>
                                  <option value="in_progress">Đang làm</option>
                                  <option value="review">Chờ duyệt</option>
                                  <option value="done">Xong</option>
                                </select>
                              </div>
                            </div>
                          ))}

                          {colTasks.length === 0 && (
                            <div className="text-center py-6 text-[11px] text-muted-foreground/60 italic border border-dashed border-border/40 rounded-md">
                              Chưa có việc
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: DANH SÁCH THÀNH VIÊN */}
            {activeTab === "members" && (
              <div className="space-y-3">
                {/* Form thêm thành viên mới nếu đang bật */}
                {showAddMemberForm && (
                  <form
                    onSubmit={handleCreateMember}
                    className="p-3.5 rounded-lg bg-muted/40 border border-[#7D39EB]/30 space-y-3 animate-in fade-in-50 duration-150"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
                      <Input
                        placeholder="Họ và tên *"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        required
                        className="h-8 text-xs rounded-md bg-card"
                      />
                      <Input
                        placeholder="Mã số SV (MSSV)"
                        value={newMemberStudentId}
                        onChange={(e) => setNewMemberStudentId(e.target.value)}
                        className="h-8 text-xs rounded-md bg-card"
                      />
                      <Input
                        placeholder="Số điện thoại"
                        value={newMemberPhone}
                        onChange={(e) => setNewMemberPhone(e.target.value)}
                        className="h-8 text-xs rounded-md bg-card"
                      />
                      <select
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value as GroupMemberRole)}
                        className="h-8 text-xs px-2 rounded-md bg-card border border-border/80 text-foreground"
                      >
                        <option value="member">Thành viên</option>
                        <option value="leader">Trưởng nhóm</option>
                        <option value="secretary">Thư ký</option>
                      </select>
                      <Input
                        placeholder="Email liên hệ"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        className="h-8 text-xs rounded-md bg-card"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAddMemberForm(false)}
                        className="h-7 text-xs"
                      >
                        Hủy
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={!newMemberName.trim()}
                        className="h-7 text-xs bg-[#7D39EB] text-white font-bold"
                      >
                        Thêm ngay
                      </Button>
                    </div>
                  </form>
                )}

                {/* Bảng danh sách thành viên */}
                <div className="border border-border/70 rounded-lg overflow-hidden bg-card">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground font-bold">
                      <tr>
                        <th className="py-2.5 px-3">Thành viên</th>
                        <th className="py-2.5 px-3">MSSV</th>
                        <th className="py-2.5 px-3">Vai trò</th>
                        <th className="py-2.5 px-3">Liên hệ</th>
                        <th className="py-2.5 px-3 text-right">Đóng góp</th>
                        <th className="py-2.5 px-3 text-center">Xoá</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {group.members.map((member) => (
                        <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-7 w-7 rounded-full flex items-center justify-center font-bold text-white text-[11px] shrink-0"
                                style={{ backgroundColor: member.avatarColor || "#7D39EB" }}
                              >
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-bold text-foreground">{member.name}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-muted-foreground">
                            {member.studentId || "—"}
                          </td>
                          <td className="py-2.5 px-3">
                            {member.role === "leader" ? (
                              <span className="inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-500 border border-amber-500/30">
                                <Crown className="h-3 w-3" /> Trưởng nhóm
                              </span>
                            ) : member.role === "secretary" ? (
                              <span className="inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-md bg-pink-500/15 text-pink-500 border border-pink-500/30">
                                Thư ký
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Thành viên</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground truncate max-w-[180px]">
                            {member.phone ? (
                              <div className="flex flex-col">
                                <span className="font-mono text-xs text-foreground flex items-center gap-1 font-semibold">
                                  <Phone className="h-3 w-3 text-[#7D39EB]" /> {member.phone}
                                </span>
                                {member.email && (
                                  <span className="text-[10px] text-muted-foreground truncate">
                                    {member.email}
                                  </span>
                                )}
                              </div>
                            ) : member.email ? (
                              member.email
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="font-mono font-bold text-[#7D39EB]">
                              {member.contributionScore ?? 100}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onRemoveMember(group.id, member.id)}
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              title="Xoá thành viên khỏi nhóm"
                              aria-label="Xoá thành viên khỏi nhóm"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Hàng nút điều hướng cố định dưới chân pop-up: Bên trái là icon Tài liệu, bên phải là Nhập điểm và Giao việc */}
          <div className="border-t border-border/60 bg-muted/20 px-4 py-3 sm:px-6 flex items-center justify-between gap-3 shrink-0">
            {/* Bên trái: Nút icon Tài liệu (Google Drive) */}
            <div>
              {group.driveUrl ? (
                <a
                  href={group.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 w-8 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 flex items-center justify-center transition-all shadow-xs"
                  title="Tài liệu (Mở Google Drive)"
                  aria-label="Tài liệu (Mở Google Drive)"
                >
                  <Folder className="h-4 w-4" />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => onEdit?.(group)}
                  className="h-8 w-8 rounded-md border border-border/70 bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-all"
                  title="Chưa có liên kết tài liệu (Bấm để gán trong Chỉnh sửa nhóm)"
                  aria-label="Tài liệu"
                >
                  <Folder className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Bên phải: Nút Nhập điểm và Giao việc */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setDetailScoreInput(
                    group.gradeScore !== null && group.gradeScore !== undefined
                      ? String(group.gradeScore)
                      : ""
                  );
                  setGradeModalOpen(true);
                }}
                className="h-8 px-3 text-xs font-bold rounded-md border-border/80 bg-background hover:bg-muted text-foreground flex items-center gap-1.5"
                title="Nhập và gán điểm nhóm"
              >
                <Award className="h-3.5 w-3.5 text-[#7D39EB]" />
                <span>
                  {group.gradeScore !== null && group.gradeScore !== undefined
                    ? `Điểm: ${group.gradeScore}/10`
                    : "Nhập điểm"}
                </span>
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => setTaskModalOpen(true)}
                className="h-8 px-3 text-xs font-bold rounded-md bg-[#C6FF33] text-black hover:bg-[#b2e82e] shadow-xs flex items-center gap-1.5"
                title="Giao việc mới"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Giao việc</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pop-up nhỏ để Nhập và Gán điểm */}
      <Dialog open={gradeModalOpen} onOpenChange={setGradeModalOpen}>
        <DialogContent className="max-w-sm rounded-lg border-border shadow-2xl p-5 space-y-4 [&>button.absolute]:hidden">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/60">
            <DialogTitle className="text-sm font-black text-foreground tracking-tight">
              Nhập & Gán điểm
            </DialogTitle>
            <button
              type="button"
              onClick={() => setGradeModalOpen(false)}
              className="h-8 w-8 rounded-md border border-border/80 bg-background hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all"
              title="Đóng"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Thông tin cột điểm liên kết */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                Cột điểm môn học
              </Label>
              <div className="p-2.5 rounded-md bg-muted/40 border border-border/70 text-xs">
                {group.gradeComponentName ? (
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-foreground">
                      {group.gradeComponentName}{" "}
                      <span className="text-muted-foreground font-normal">
                        ({group.gradeWeight ?? 0}%)
                      </span>
                    </span>
                    <Link
                      href="/grades"
                      target="_blank"
                      className="text-[11px] text-[#7D39EB] font-bold hover:underline flex items-center gap-0.5 shrink-0"
                    >
                      <span>Bảng điểm</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground italic">
                      Chưa liên kết cột điểm
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setGradeModalOpen(false);
                        onEdit?.(group);
                      }}
                      className="text-[11px] text-[#7D39EB] font-bold hover:underline"
                    >
                      Liên kết ngay
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Ô nhập điểm số */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <Award className="w-3.5 h-3.5 text-muted-foreground" />
                Điểm số (Thang điểm 10)
              </Label>
              <Input
                type="number"
                min={0}
                max={10}
                step={0.1}
                placeholder="Ví dụ: 8.5"
                value={detailScoreInput}
                onChange={(e) => setDetailScoreInput(e.target.value)}
                className="h-9 text-sm font-mono font-bold rounded-md bg-card"
                autoFocus
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setGradeModalOpen(false)}
              className="h-8 text-xs font-bold rounded-md"
            >
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveScore}
              className="h-8 text-xs font-bold rounded-md bg-[#7D39EB] text-white hover:bg-[#6D28D9]"
            >
              Lưu điểm
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal giao việc mới */}
      <GroupTaskModal
        open={taskModalOpen}
        onOpenChange={setTaskModalOpen}
        groupId={group.id}
        members={group.members}
        onAddTask={onAddTask}
      />
    </>
  );
}
