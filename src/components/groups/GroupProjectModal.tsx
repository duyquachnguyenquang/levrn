"use client";

import React, { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  GroupProject,
  GroupProjectFormData,
  GroupProjectStatus,
  Subject,
} from "@/lib/types";
import {
  Users,
  Calendar,
  Folder,
  Globe,
  Video,
  MessageCircle,
  Plus,
  Trash2,
  Crown,
} from "lucide-react";

interface GroupProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupToEdit?: GroupProject | null;
  subjects: Subject[];
  onSave: (data: GroupProjectFormData, id?: string) => void;
}

export function GroupProjectModal({
  open,
  onOpenChange,
  groupToEdit,
  subjects,
  onSave,
}: GroupProjectModalProps) {
  const [name, setName] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [semester, setSemester] = useState("");
  const [status, setStatus] = useState<GroupProjectStatus>("in_progress");
  const [deadline, setDeadline] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [chatUrl, setChatUrl] = useState("");

  // Quản lý thành viên khi tạo nhóm
  const [members, setMembers] = useState<
    { id: string; name: string; studentId?: string; role: "leader" | "member" | "secretary" }[]
  >([
    { id: "mem-self", name: "Quang Duy (Bạn)", studentId: "2251010045", role: "leader" },
  ]);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberId, setNewMemberId] = useState("");

  useEffect(() => {
    if (groupToEdit) {
      setName(groupToEdit.name);
      setSubjectId(groupToEdit.subjectId || "");
      setSubjectCode(groupToEdit.subjectCode);
      setSubjectName(groupToEdit.subjectName);
      setTopic(groupToEdit.topic);
      setDescription(groupToEdit.description || "");
      setSemester(groupToEdit.semester || "");
      setStatus(groupToEdit.status);
      setDeadline(
        groupToEdit.deadline
          ? groupToEdit.deadline.slice(0, 16)
          : ""
      );
      setDriveUrl(groupToEdit.driveUrl || "");
      setRepoUrl(groupToEdit.repoUrl || "");
      setMeetingUrl(groupToEdit.meetingUrl || "");
      setChatUrl(groupToEdit.chatUrl || "");
      setMembers(groupToEdit.members || []);
    } else {
      setName("");
      setSubjectId(subjects[0]?.id || "");
      setSubjectCode(subjects[0]?.code || "MAT");
      setSubjectName(subjects[0]?.name || "Môn học");
      setTopic("");
      setDescription("");
      setSemester(subjects[0]?.semester || "HK1 2024-2025");
      setStatus("in_progress");
      setDeadline("");
      setDriveUrl("");
      setRepoUrl("");
      setMeetingUrl("");
      setChatUrl("");
      setMembers([
        { id: `mem-${Date.now()}`, name: "Quang Duy (Bạn)", studentId: "2251010045", role: "leader" },
      ]);
    }
  }, [groupToEdit, subjects, open]);

  // Cập nhật mã và tên môn khi chọn môn
  const handleSelectSubject = (selectedId: string) => {
    setSubjectId(selectedId);
    const sub = subjects.find((s) => s.id === selectedId);
    if (sub) {
      setSubjectCode(sub.code);
      setSubjectName(sub.name);
      if (sub.semester) setSemester(sub.semester);
    }
  };

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    setMembers([
      ...members,
      {
        id: `mem-${Date.now()}`,
        name: newMemberName.trim(),
        studentId: newMemberId.trim() || undefined,
        role: "member",
      },
    ]);
    setNewMemberName("");
    setNewMemberId("");
  };

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !topic.trim()) return;

    const data: GroupProjectFormData = {
      name: name.trim(),
      subjectId: subjectId || undefined,
      subjectCode: subjectCode || "SUB",
      subjectName: subjectName || "Môn học",
      topic: topic.trim(),
      description: description.trim() || undefined,
      semester: semester || undefined,
      status,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
      driveUrl: driveUrl.trim() || undefined,
      repoUrl: repoUrl.trim() || undefined,
      meetingUrl: meetingUrl.trim() || undefined,
      chatUrl: chatUrl.trim() || undefined,
      members: members.map((m) => ({
        ...m,
        avatarColor: m.role === "leader" ? "#7D39EB" : "#3B82F6",
        contributionScore: 100,
      })),
      tasks: groupToEdit?.tasks || [],
    };

    onSave(data, groupToEdit?.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border-border shadow-2xl p-5 sm:p-6">
        <DialogHeader className="pb-3 border-b border-border/60">
          <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
            {groupToEdit ? "Chỉnh sửa nhóm đồ án" : "Tạo nhóm đồ án / bài tập lớn mới"}
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quản lý đề tài, tiến độ làm việc chung và phân chia nhiệm vụ cho thành viên.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Tên nhóm & Môn học */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="grp-name" className="text-xs font-bold text-foreground">
                Tên nhóm <span className="text-destructive">*</span>
              </Label>
              <Input
                id="grp-name"
                placeholder="VD: Nhóm 04 - Logistics Warriors"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-9 text-xs rounded-lg bg-card"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="grp-subject" className="text-xs font-bold text-foreground">
                Môn học liên kết
              </Label>
              <select
                id="grp-subject"
                value={subjectId}
                onChange={(e) => handleSelectSubject(e.target.value)}
                className="w-full h-9 text-xs px-3 rounded-lg bg-card border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-[#7D39EB]"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    [{sub.code}] {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Đề tài đồ án */}
          <div className="space-y-1.5">
            <Label htmlFor="grp-topic" className="text-xs font-bold text-foreground">
              Đề tài đồ án / Báo cáo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="grp-topic"
              placeholder="VD: Nghiên cứu tối ưu chuỗi cung ứng Shopee Xpress..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
              className="h-9 text-xs rounded-lg bg-card"
            />
          </div>

          {/* Mô tả & Trạng thái & Hạn chót */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                Trạng thái đồ án
              </Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as GroupProjectStatus)}
                className="w-full h-9 text-xs px-3 rounded-lg bg-card border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-[#7D39EB]"
              >
                <option value="planning">Lên kế hoạch</option>
                <option value="in_progress">Đang thực hiện</option>
                <option value="submitted">Đã nộp bài</option>
                <option value="completed">Hoàn thành</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="grp-deadline" className="text-xs font-bold text-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Hạn nộp bài
              </Label>
              <Input
                id="grp-deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="h-9 text-xs rounded-lg bg-card"
              />
            </div>
          </div>

          {/* Các liên kết nhanh */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <Label className="text-xs font-bold text-foreground">
              Liên kết tài liệu &amp; Họp nhóm (Drive, Github, Meet, Zalo)
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
                <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7D39EB]" />
                <Input
                  placeholder="Link Github repo / Figma / Canva"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="h-8 pl-8 text-xs rounded-md bg-card"
                />
              </div>
              <div className="relative">
                <Video className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-500" />
                <Input
                  placeholder="Link Google Meet / Zoom"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
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

          {/* Danh sách thành viên ban đầu */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground">
                Thành viên nhóm ({members.length})
              </Label>
            </div>

            {/* Thêm thành viên nhanh */}
            <div className="flex gap-2">
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
                className="h-8 text-xs rounded-md bg-card w-28"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAddMember}
                className="h-8 text-xs bg-[#7D39EB] text-white font-bold shrink-0"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Thêm
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
                  {members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m.id)}
                      className="text-muted-foreground hover:text-destructive ml-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>

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
              disabled={!name.trim() || !topic.trim()}
              className="text-xs h-8 bg-[#7D39EB] hover:bg-[#6D28D9] text-white font-bold"
            >
              {groupToEdit ? "Lưu thay đổi" : "Tạo nhóm mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
