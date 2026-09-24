"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GroupProject,
  GroupMember,
  GroupMemberRole,
  GroupTask,
  GroupTaskStatus,
} from "@/lib/types";
import {
  Users,
  CheckSquare,
  Plus,
  Trash2,
  Crown,
  Calendar,
  Clock,
  Folder,
  Globe,
  Video,
  MessageCircle,
  Flag,
  ArrowRight,
  Shield,
  UserPlus,
  Phone,
} from "lucide-react";
import { GroupTaskModal } from "./GroupTaskModal";
import { cn } from "@/lib/utils";

interface GroupDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: GroupProject | null;
  onAddMember: (groupId: string, memberData: Omit<GroupMember, "id">) => void;
  onRemoveMember: (groupId: string, memberId: string) => void;
  onAddTask: (groupId: string, taskData: any) => void;
  onUpdateTaskStatus: (groupId: string, taskId: string, status: GroupTaskStatus) => void;
  onDeleteTask: (groupId: string, taskId: string) => void;
}

export function GroupDetailDialog({
  open,
  onOpenChange,
  group,
  onAddMember,
  onRemoveMember,
  onAddTask,
  onUpdateTaskStatus,
  onDeleteTask,
}: GroupDetailDialogProps) {
  const [activeTab, setActiveTab] = useState<"tasks" | "members">("tasks");
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  // Form thêm thành viên mới
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberStudentId, setNewMemberStudentId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<GroupMemberRole>("member");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberPhone, setNewMemberPhone] = useState("");
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);

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

  const completedTasks = group.tasks.filter((t) => t.status === "done").length;
  const progress =
    group.tasks.length > 0
      ? Math.round((completedTasks / group.tasks.length) * 100)
      : 0;

  const taskStatuses: { key: GroupTaskStatus; label: string; color: string }[] = [
    { key: "todo", label: "Cần làm", color: "text-slate-400" },
    { key: "in_progress", label: "Đang làm", color: "text-[#7D39EB]" },
    { key: "review", label: "Chờ duyệt", color: "text-amber-500" },
    { key: "done", label: "Hoàn thành", color: "text-emerald-500" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg border-border shadow-2xl p-5 sm:p-6">
        {/* Header chi tiết nhóm */}
        <DialogHeader className="pb-4 border-b border-border/60">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono font-black text-xs px-2 py-0.5 rounded-md bg-[#7D39EB]/15 text-[#7D39EB] border border-[#7D39EB]/30">
              {group.subjectCode}
            </span>
            <span className="text-xs text-muted-foreground">{group.subjectName}</span>
          </div>

          <DialogTitle className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight">
            {group.name}
          </DialogTitle>

          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            <strong className="text-foreground">Nhiệm vụ:</strong> {group.topic}
          </p>

          {/* Quick links & Deadline */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-2 border-t border-border/40">
            <div className="flex items-center gap-2 flex-wrap">
              {group.driveUrl && (
                <a
                  href={group.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/25"
                >
                  <Folder className="h-3.5 w-3.5" /> Google Drive
                </a>
              )}
              {group.repoUrl && (
                <a
                  href={group.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#7D39EB]/10 text-[#7D39EB] hover:bg-[#7D39EB]/20 border border-[#7D39EB]/25"
                >
                  <Globe className="h-3.5 w-3.5" /> Tài liệu / Repo
                </a>
              )}
              {group.meetingUrl && (
                <a
                  href={group.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border border-blue-500/25"
                >
                  <Video className="h-3.5 w-3.5" /> Họp Google Meet
                </a>
              )}
              {group.chatUrl && (
                <a
                  href={group.chatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/25"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Nhóm Zalo
                </a>
              )}
            </div>

            {group.deadline && (
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                Hạn chót:{" "}
                <strong className="text-foreground">
                  {new Date(group.deadline).toLocaleDateString("vi-VN")}
                </strong>
              </span>
            )}
          </div>
        </DialogHeader>

        {/* Tab switcher: Nhiệm vụ & Thành viên */}
        <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("tasks")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                activeTab === "tasks"
                  ? "bg-[#7D39EB] text-white shadow-xs"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground"
              )}
            >
              <CheckSquare className="h-3.5 w-3.5" />
              <span>Nhiệm vụ ({group.tasks.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("members")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                activeTab === "members"
                  ? "bg-[#7D39EB] text-white shadow-xs"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground"
              )}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Thành viên ({group.members.length})</span>
            </button>
          </div>

          {activeTab === "tasks" ? (
            <Button
              size="sm"
              onClick={() => setTaskModalOpen(true)}
              className="h-8 text-xs font-bold bg-[#C6FF33] text-black hover:bg-[#b2e82e] shadow-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Giao việc mới
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setShowAddMemberForm(!showAddMemberForm)}
              className="h-8 text-xs font-bold bg-[#7D39EB] text-white hover:bg-[#6D28D9] shadow-xs"
            >
              <UserPlus className="h-3.5 w-3.5 mr-1" />
              {showAddMemberForm ? "Đóng form" : "Thêm thành viên"}
            </Button>
          )}
        </div>

        {/* TAB 1: DANH SÁCH NHIỆM VỤ THEO KANBAN / LIST */}
        {activeTab === "tasks" && (
          <div className="space-y-4 pt-2">
            {/* Tiến độ đồ án */}
            <div className="bg-muted/40 p-3 rounded-lg border border-border/60 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-foreground">
                  Tiến độ đồ án nhóm: {progress}%
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Đã hoàn thành {completedTasks}/{group.tasks.length} nhiệm vụ
                </p>
              </div>
              <div className="w-36 h-2 rounded-full bg-border/80 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#7D39EB] to-[#C6FF33]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Bảng nhiệm vụ chia theo cột trạng thái */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {taskStatuses.map((col) => {
                const colTasks = group.tasks.filter((t) => t.status === col.key);

                return (
                  <div
                    key={col.key}
                    className="bg-card border border-border/70 rounded-lg p-2.5 flex flex-col min-h-[160px]"
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
                          className="p-2.5 rounded-md bg-muted/30 border border-border/60 text-xs hover:border-[#7D39EB]/40 transition-all group/task"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <p className="font-semibold text-foreground text-xs leading-snug">
                              {task.title}
                            </p>
                            <button
                              type="button"
                              onClick={() => onDeleteTask(group.id, task.id)}
                              className="text-muted-foreground hover:text-destructive opacity-0 group-hover/task:opacity-100 transition-opacity"
                              title="Xoá nhiệm vụ"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>

                          {task.assigneeName && (
                            <div className="flex items-center gap-1 text-[11px] text-[#7D39EB] font-medium mt-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#7D39EB]" />
                              <span className="truncate">{task.assigneeName}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-1 mt-2 pt-1.5 border-t border-border/40 text-[10px] text-muted-foreground">
                            {task.dueDate ? (
                              <span>Hạn: {task.dueDate}</span>
                            ) : (
                              <span>Không có hạn</span>
                            )}

                            {/* Dropdown chuyển trạng thái nhanh */}
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
                        <div className="text-center py-6 text-[11px] text-muted-foreground/60 italic">
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

        {/* TAB 2: DANH SÁCH THÀNH VIÊN & ĐÁNH GIÁ ĐÓNG GÓP */}
        {activeTab === "members" && (
          <div className="space-y-4 pt-2">
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
                    <th className="py-2.5 px-3">Liên hệ (SĐT / Email)</th>
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
                          <div>
                            <p className="font-bold text-foreground">{member.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground">
                        {member.studentId || "—"}
                      </td>
                      <td className="py-2.5 px-3">
                        {member.role === "leader" ? (
                          <span className="inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
                            <Crown className="h-3 w-3" /> Trưởng nhóm
                          </span>
                        ) : member.role === "secretary" ? (
                          <span className="inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-500 border border-pink-500/30">
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
                              <span className="text-[10px] text-muted-foreground truncate">{member.email}</span>
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

        {/* Modal giao việc mới */}
        <GroupTaskModal
          open={taskModalOpen}
          onOpenChange={setTaskModalOpen}
          groupId={group.id}
          members={group.members}
          onAddTask={onAddTask}
        />
      </DialogContent>
    </Dialog>
  );
}
