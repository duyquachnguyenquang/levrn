"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GroupProject,
  GroupProjectFormData,
  GroupMember,
  GroupTask,
  Subject,
} from "@/lib/types";
import {
  Users,
  Calendar,
  BookOpen,
  ListTodo,
  Clock,
  Link2,
  Folder,
  MessageCircle,
  Plus,
  Trash2,
  Crown,
  Phone,
} from "lucide-react";

interface GroupProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupToEdit?: GroupProject | null;
  subjects: Subject[];
  onSave: (data: GroupProjectFormData, id?: string) => void;
}

interface FormTaskItem {
  id: string;
  title: string;
  dueDate?: string;
}

export function GroupProjectModal({
  open,
  onOpenChange,
  groupToEdit,
  subjects,
  onSave,
}: GroupProjectModalProps) {
  // 1. Nhóm (Tên nhóm)
  const [name, setName] = useState("");

  // 2. Học kỳ & Môn học (phân tầng theo Học kỳ)
  const semesters = useMemo(() => {
    const list = Array.from(
      new Set(subjects.map((s) => s.semester).filter(Boolean))
    ) as string[];
    if (list.length === 0) return ["HK1 2024-2025", "HK2 2024-2025", "HK3 2024-2025"];
    return list;
  }, [subjects]);

  const [selectedSemester, setSelectedSemester] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectName, setSubjectName] = useState("");

  // Danh sách môn học được lọc theo Học kỳ đã chọn
  const filteredSubjects = useMemo(() => {
    if (!selectedSemester) return subjects;
    return subjects.filter((s) => s.semester === selectedSemester);
  }, [subjects, selectedSemester]);

  // 3. Danh sách Nhiệm vụ (Tasks) kèm Hạn nộp
  const [tasks, setTasks] = useState<FormTaskItem[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");

  // 4. Liên kết chung (Google Drive & Zalo/Discord)
  const [driveUrl, setDriveUrl] = useState("");
  const [chatUrl, setChatUrl] = useState("");

  // 5. Danh sách Thành viên (kèm SĐT)
  const [members, setMembers] = useState<GroupMember[]>([
    {
      id: "mem-self",
      name: "Quang Duy (Bạn)",
      studentId: "2251010045",
      phone: "",
      role: "leader",
    },
  ]);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberId, setNewMemberId] = useState("");
  const [newMemberPhone, setNewMemberPhone] = useState("");

  useEffect(() => {
    if (groupToEdit) {
      setName(groupToEdit.name);

      const sem = groupToEdit.semester || subjects[0]?.semester || semesters[0] || "";
      setSelectedSemester(sem);

      setSubjectId(groupToEdit.subjectId || "");
      setSubjectCode(groupToEdit.subjectCode);
      setSubjectName(groupToEdit.subjectName);

      // Load tasks
      if (groupToEdit.tasks && groupToEdit.tasks.length > 0) {
        setTasks(
          groupToEdit.tasks.map((t) => ({
            id: t.id,
            title: t.title,
            dueDate: t.dueDate ? t.dueDate.slice(0, 16) : undefined,
          }))
        );
      } else if (groupToEdit.topic) {
        setTasks([
          {
            id: `gt-initial`,
            title: groupToEdit.topic,
            dueDate: groupToEdit.deadline ? groupToEdit.deadline.slice(0, 16) : undefined,
          },
        ]);
      } else {
        setTasks([]);
      }

      setDriveUrl(groupToEdit.driveUrl || "");
      setChatUrl(groupToEdit.chatUrl || "");
      setMembers(groupToEdit.members || []);
      setNewTaskTitle("");
      setNewTaskDueDate("");
      setNewMemberName("");
      setNewMemberId("");
      setNewMemberPhone("");
    } else {
      setName("");

      const initialSem = subjects[0]?.semester || semesters[0] || "HK1 2024-2025";
      setSelectedSemester(initialSem);

      const initialSubs = subjects.filter((s) => s.semester === initialSem);
      const targetSub = initialSubs[0] || subjects[0];

      setSubjectId(targetSub?.id || "");
      setSubjectCode(targetSub?.code || "SUB");
      setSubjectName(targetSub?.name || "Môn học");

      setTasks([]);
      setNewTaskTitle("");
      setNewTaskDueDate("");
      setDriveUrl("");
      setChatUrl("");
      setMembers([
        {
          id: `mem-${Date.now()}`,
          name: "Quang Duy (Bạn)",
          studentId: "2251010045",
          phone: "",
          role: "leader",
        },
      ]);
      setNewMemberName("");
      setNewMemberId("");
      setNewMemberPhone("");
    }
  }, [groupToEdit, subjects, semesters, open]);

  // Khi chọn học kỳ mới -> cập nhật môn học phù hợp
  const handleSelectSemester = (newSem: string) => {
    setSelectedSemester(newSem);
    const subsInSem = subjects.filter((s) => s.semester === newSem);
    if (subsInSem.length > 0) {
      setSubjectId(subsInSem[0].id);
      setSubjectCode(subsInSem[0].code);
      setSubjectName(subsInSem[0].name);
    } else {
      setSubjectId("");
      setSubjectCode("");
      setSubjectName("");
    }
  };

  // Khi chọn môn học
  const handleSelectSubject = (selectedId: string) => {
    setSubjectId(selectedId);
    const sub = subjects.find((s) => s.id === selectedId);
    if (sub) {
      setSubjectCode(sub.code);
      setSubjectName(sub.name);
    }
  };

  // Thêm nhiệm vụ con vào nhóm
  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    setTasks((prev) => [
      ...prev,
      {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title: newTaskTitle.trim(),
        dueDate: newTaskDueDate || undefined,
      },
    ]);
    setNewTaskTitle("");
    setNewTaskDueDate("");
  };

  // Xoá nhiệm vụ con
  const handleRemoveTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // Thêm thành viên
  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    setMembers((prev) => [
      ...prev,
      {
        id: `mem-${Date.now()}`,
        name: newMemberName.trim(),
        studentId: newMemberId.trim() || undefined,
        phone: newMemberPhone.trim() || undefined,
        role: "member",
      },
    ]);
    setNewMemberName("");
    setNewMemberId("");
    setNewMemberPhone("");
  };

  // Xoá thành viên
  const handleRemoveMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  // Submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Tự động gom nhiệm vụ đang gõ dở nếu chưa ấn +
    const finalTasks = [...tasks];
    if (newTaskTitle.trim()) {
      finalTasks.push({
        id: `task-${Date.now()}`,
        title: newTaskTitle.trim(),
        dueDate: newTaskDueDate || undefined,
      });
    }

    if (finalTasks.length === 0) return;

    // Tìm deadline sớm nhất từ các nhiệm vụ
    const dueDates = finalTasks
      .map((t) => t.dueDate)
      .filter(Boolean)
      .sort() as string[];
    const earliestDeadline = dueDates.length > 0 ? new Date(dueDates[0]).toISOString() : undefined;

    // Đồng bộ topic chuỗi nhiệm vụ để tương thích với Supabase NOT NULL và Card
    const topicSummary = finalTasks.map((t) => t.title).join(", ");

    const groupTasks: GroupTask[] = finalTasks.map((t, idx) => {
      const existing = groupToEdit?.tasks?.find((gt) => gt.id === t.id);
      return {
        id: t.id || `gt-${Date.now()}-${idx}`,
        groupId: groupToEdit?.id || "",
        title: t.title,
        status: existing?.status || "todo",
        priority: existing?.priority || "medium",
        dueDate: t.dueDate ? t.dueDate.slice(0, 10) : undefined,
        createdAt: existing?.createdAt || new Date().toISOString(),
      };
    });

    const data: GroupProjectFormData = {
      name: name.trim(),
      subjectId: subjectId || undefined,
      subjectCode: subjectCode || "SUB",
      subjectName: subjectName || "Môn học",
      topic: topicSummary,
      description: groupToEdit?.description || undefined,
      semester: selectedSemester || undefined,
      status: groupToEdit?.status || "in_progress",
      deadline: earliestDeadline || groupToEdit?.deadline || undefined,
      driveUrl: driveUrl.trim() || undefined,
      chatUrl: chatUrl.trim() || undefined,
      repoUrl: groupToEdit?.repoUrl || undefined,
      meetingUrl: groupToEdit?.meetingUrl || undefined,
      members: members.map((m) => ({
        ...m,
        avatarColor: m.role === "leader" ? "#7D39EB" : "#3B82F6",
        contributionScore: m.contributionScore ?? 100,
      })),
      tasks: groupTasks,
    };

    onSave(data, groupToEdit?.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border-border shadow-2xl p-5 sm:p-6">
        {/* 1. Header Dialog: Tiêu đề ngắn gọn, không có đoạn văn dài */}
        <DialogHeader className="pb-3 border-b border-border/60">
          <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
            {groupToEdit ? "Chỉnh sửa nhóm" : "Tạo nhóm"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* 2. Nhóm (Tên nhóm) */}
          <div className="space-y-1.5">
            <Label htmlFor="grp-name" className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-[#7D39EB]" />
              <span>Nhóm</span>
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="grp-name"
              placeholder="VD: Nhóm 01"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-9 text-xs rounded-lg bg-card"
            />
          </div>

          {/* 3. Phân tầng: Học kỳ & Môn học */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Học kỳ */}
            <div className="space-y-1.5">
              <Label htmlFor="grp-semester" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#7D39EB]" />
                <span>Học kỳ</span>
              </Label>
              <select
                id="grp-semester"
                value={selectedSemester}
                onChange={(e) => handleSelectSemester(e.target.value)}
                className="w-full h-9 text-xs px-3 rounded-lg bg-card border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-[#7D39EB]"
              >
                {semesters.map((sem) => (
                  <option key={sem} value={sem}>
                    {sem}
                  </option>
                ))}
              </select>
            </div>

            {/* Môn học (danh sách lọc theo học kỳ) */}
            <div className="space-y-1.5">
              <Label htmlFor="grp-subject" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-[#7D39EB]" />
                <span>Môn học</span>
                <span className="text-destructive">*</span>
              </Label>
              <select
                id="grp-subject"
                value={subjectId}
                onChange={(e) => handleSelectSubject(e.target.value)}
                className="w-full h-9 text-xs px-3 rounded-lg bg-card border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-[#7D39EB]"
              >
                {filteredSubjects.length > 0 ? (
                  filteredSubjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      [{sub.code}] {sub.name}
                    </option>
                  ))
                ) : (
                  <option value="">Không có môn học trong kỳ này</option>
                )}
              </select>
            </div>
          </div>

          {/* 4. Nhiệm vụ & Hạn nộp (hỗ trợ 1 hoặc nhiều nhiệm vụ con) */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <ListTodo className="h-3.5 w-3.5 text-[#7D39EB]" />
              <span>Nhiệm vụ {tasks.length > 0 && `(${tasks.length})`}</span>
              <span className="text-destructive">*</span>
            </Label>

            {/* Hàng nhập nhiệm vụ con + Hạn nộp + nút icon (+) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Nhiệm vụ / Đề tài báo cáo..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTask();
                    }
                  }}
                  className="h-9 text-xs rounded-lg bg-card"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="relative w-full sm:w-44">
                  <Input
                    type="datetime-local"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="h-9 text-[11px] rounded-lg bg-card"
                    title="Hạn nộp"
                  />
                </div>

                <Button
                  type="button"
                  size="icon"
                  onClick={handleAddTask}
                  disabled={!newTaskTitle.trim()}
                  className="h-9 w-9 bg-[#7D39EB] hover:bg-[#6D28D9] text-white rounded-lg shrink-0 transition-transform active:scale-95"
                  title="Thêm nhiệm vụ"
                  aria-label="Thêm nhiệm vụ"
                >
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                </Button>
              </div>
            </div>

            {/* Danh sách nhiệm vụ đã thêm */}
            {tasks.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {tasks.map((t, idx) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/40 border border-border/70 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="h-5 w-5 rounded-md bg-[#7D39EB]/15 text-[#7D39EB] font-bold text-[10px] flex items-center justify-center shrink-0 font-mono">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-foreground truncate">{t.title}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {t.dueDate && (
                        <span className="text-[11px] font-medium text-amber-500 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                          <Clock className="h-3 w-3" />
                          {new Date(t.dueDate).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveTask(t.id)}
                        className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
                        title="Xoá nhiệm vụ"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. Liên kết (chỉ Google Drive và Zalo/Discord) */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5 text-[#7D39EB]" />
              <span>Liên kết</span>
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="relative">
                <Folder className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-amber-500" />
                <Input
                  placeholder="Link Google Drive chung"
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  className="h-8 pl-8 text-xs rounded-md bg-card"
                />
              </div>
              <div className="relative">
                <MessageCircle className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald-500" />
                <Input
                  placeholder="Link Zalo / Discord nhóm"
                  value={chatUrl}
                  onChange={(e) => setChatUrl(e.target.value)}
                  className="h-8 pl-8 text-xs rounded-md bg-card"
                />
              </div>
            </div>
          </div>

          {/* 6. Thành viên (kèm Số điện thoại, nút chỉ dấu cộng) */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-[#7D39EB]" />
                <span>Thành viên ({members.length})</span>
              </Label>
            </div>

            {/* Hàng thêm thành viên */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Input
                placeholder="Họ tên thành viên..."
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="h-8 text-xs rounded-md bg-card flex-1"
              />
              <Input
                placeholder="MSSV"
                value={newMemberId}
                onChange={(e) => setNewMemberId(e.target.value)}
                className="h-8 text-xs rounded-md bg-card w-full sm:w-28"
              />
              <Input
                placeholder="Số điện thoại"
                value={newMemberPhone}
                onChange={(e) => setNewMemberPhone(e.target.value)}
                className="h-8 text-xs rounded-md bg-card w-full sm:w-32"
              />
              <Button
                type="button"
                size="icon"
                onClick={handleAddMember}
                disabled={!newMemberName.trim()}
                className="h-8 w-8 bg-[#7D39EB] hover:bg-[#6D28D9] text-white rounded-md shrink-0 self-end sm:self-auto transition-transform active:scale-95"
                title="Thêm thành viên"
                aria-label="Thêm thành viên"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
              </Button>
            </div>

            {/* Danh sách chip thành viên */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {members.map((m) => (
                <span
                  key={m.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 border border-border/80 text-xs"
                >
                  {m.role === "leader" && <Crown className="h-3 w-3 text-amber-500 fill-amber-500" />}
                  <span className="font-semibold text-foreground">{m.name}</span>
                  {m.studentId && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      ({m.studentId})
                    </span>
                  )}
                  {m.phone && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 font-mono">
                      <Phone className="h-2.5 w-2.5 text-[#7D39EB]" />
                      {m.phone}
                    </span>
                  )}
                  {members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m.id)}
                      className="text-muted-foreground hover:text-destructive ml-1"
                      title="Xoá thành viên"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Footer dialog */}
          <DialogFooter className="pt-3 border-t border-border/60 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || (tasks.length === 0 && !newTaskTitle.trim())}
              className="text-xs h-8 bg-[#7D39EB] hover:bg-[#6D28D9] text-white font-bold"
            >
              {groupToEdit ? "Lưu thay đổi" : "Tạo nhóm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
