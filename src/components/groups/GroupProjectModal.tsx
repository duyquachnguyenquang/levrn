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
  GroupProjectStatus,
  Subject,
} from "@/lib/types";
import { CURRENT_SEMESTER } from "@/lib/semesterUtils";
import {
  Users,
  Calendar,
  BookOpen,
  Clock,
  Link2,
  Folder,
  MessageCircle,
  Plus,
  Trash2,
  Crown,
  Phone,
  Award,
  ExternalLink,
  CheckCircle2,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { useCourseGrades } from "@/hooks/useCourseGrades";

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
  // 1. Tên nhóm
  const [name, setName] = useState("");

  // 2. Học kỳ & Môn học (phân tầng theo Học kỳ)
  const semesters = useMemo(() => {
    const list = Array.from(
      new Set(subjects.map((s) => s.semester).filter(Boolean))
    ) as string[];
    if (list.length === 0) return [CURRENT_SEMESTER, "HK2 2026-2027", "HK hè 2026-2027"];
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

  // 3. Đề tài đồ án / Báo cáo
  const [topic, setTopic] = useState("");

  // 4. Trạng thái & Hạn nộp bài
  const [status, setStatus] = useState<GroupProjectStatus>("in_progress");
  const [deadline, setDeadline] = useState("");

  // Tích hợp Quản lý điểm số môn học
  const { grades: allCourseGrades, updateComponentScore } = useCourseGrades();
  const [gradeComponentId, setGradeComponentId] = useState("");
  const [gradeComponentName, setGradeComponentName] = useState("");
  const [gradeWeight, setGradeWeight] = useState<number | undefined>(undefined);
  const [gradeScore, setGradeScore] = useState<string>("");

  // Tìm bảng điểm môn học tương ứng
  const currentCourseGrade = useMemo(() => {
    return allCourseGrades.find(
      (g) =>
        (subjectId && g.subjectId === subjectId) ||
        (subjectCode && g.subjectCode === subjectCode)
    );
  }, [allCourseGrades, subjectId, subjectCode]);

  // 5. Liên kết chung (Google Drive & Zalo/Discord) & Ảnh bìa
  const [driveUrl, setDriveUrl] = useState("");
  const [chatUrl, setChatUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [previewError, setPreviewError] = useState(false);

  // 6. Danh sách Thành viên (kèm SĐT)
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

      setTopic(groupToEdit.topic || "");
      setStatus(groupToEdit.status || "in_progress");
      setDeadline(groupToEdit.deadline ? groupToEdit.deadline.slice(0, 16) : "");

      setDriveUrl(groupToEdit.driveUrl || "");
      setChatUrl(groupToEdit.chatUrl || "");
      setImageUrl(groupToEdit.imageUrl || "");
      setPreviewError(false);
      setMembers(groupToEdit.members || []);
      setNewMemberName("");
      setNewMemberId("");
      setNewMemberPhone("");

      // Nạp thông tin trọng số điểm
      setGradeComponentId(groupToEdit.gradeComponentId || "");
      setGradeComponentName(groupToEdit.gradeComponentName || "");
      setGradeWeight(groupToEdit.gradeWeight);
      setGradeScore(
        groupToEdit.gradeScore !== null && groupToEdit.gradeScore !== undefined
          ? String(groupToEdit.gradeScore)
          : ""
      );
    } else {
      setName("");

      const initialSem = subjects[0]?.semester || semesters[0] || CURRENT_SEMESTER;
      setSelectedSemester(initialSem);

      const initialSubs = subjects.filter((s) => s.semester === initialSem);
      const targetSub = initialSubs[0] || subjects[0];

      setSubjectId(targetSub?.id || "");
      setSubjectCode(targetSub?.code || "SUB");
      setSubjectName(targetSub?.name || "Môn học");

      setTopic("");
      setStatus("in_progress");
      setDeadline("");

      setDriveUrl("");
      setChatUrl("");
      setImageUrl("");
      setPreviewError(false);
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

      setGradeComponentId("");
      setGradeComponentName("");
      setGradeWeight(undefined);
      setGradeScore("");
    }
  }, [groupToEdit, subjects, semesters, open]);

  // Chọn cột điểm thành phần từ Quản lý điểm số
  const handleSelectGradeComponent = (compId: string) => {
    setGradeComponentId(compId);
    if (!compId) {
      setGradeComponentName("");
      setGradeWeight(undefined);
      setGradeScore("");
      return;
    }
    const comp = currentCourseGrade?.components.find((c) => c.id === compId);
    if (comp) {
      setGradeComponentName(comp.name);
      setGradeWeight(comp.weight);
      if (comp.score !== null && comp.score !== undefined) {
        setGradeScore(String(comp.score));
      } else {
        setGradeScore("");
      }
    }
  };

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
    if (!name.trim() || !topic.trim()) return;

    const parsedScore = gradeScore.trim() !== "" ? parseFloat(gradeScore) : null;
    const validScore = parsedScore !== null && !isNaN(parsedScore) ? Math.min(10, Math.max(0, parsedScore)) : null;

    const data: GroupProjectFormData = {
      name: name.trim(),
      subjectId: subjectId || undefined,
      subjectCode: subjectCode || "SUB",
      subjectName: subjectName || "Môn học",
      topic: topic.trim(),
      description: groupToEdit?.description || undefined,
      semester: selectedSemester || undefined,
      status: status,
      deadline: deadline ? new Date(deadline).toISOString() : groupToEdit?.deadline || undefined,
      driveUrl: driveUrl.trim() || undefined,
      chatUrl: chatUrl.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      repoUrl: groupToEdit?.repoUrl || undefined,
      meetingUrl: groupToEdit?.meetingUrl || undefined,
      // Gán Trọng số điểm & Điểm số
      gradeComponentId: gradeComponentId || undefined,
      gradeComponentName: gradeComponentName || undefined,
      gradeWeight: gradeWeight,
      gradeScore: validScore,
      members: members.map((m) => ({
        ...m,
        avatarColor: m.role === "leader" ? "#7D39EB" : "#3B82F6",
        contributionScore: m.contributionScore ?? 100,
      })),
      // BẢO TOÀN DỮ LIỆU NHIỆM VỤ HIỆN CÓ, TUYỆT ĐỐI KHÔNG TỰ ĐỘNG THÊM NHIỆM VỤ MỚI
      tasks: groupToEdit?.tasks || [],
    };

    onSave(data, groupToEdit?.id);

    // Đồng bộ điểm sang bảng điểm môn học
    if (gradeComponentId && (subjectId || subjectCode)) {
      updateComponentScore(subjectId || subjectCode, gradeComponentId, validScore);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border-border shadow-2xl p-5 sm:p-6 [&>button.absolute]:hidden">
        {/* 1. Header Dialog: Tiêu đề ngắn gọn, không có đoạn văn dài */}
        <DialogHeader className="pb-3 border-b border-border/60">
          <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
            {groupToEdit ? "Chỉnh sửa nhóm" : "Tạo nhóm"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* 2. Tên nhóm */}
          <div className="space-y-1.5">
            <Label htmlFor="grp-name" className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-[#7D39EB]" />
              <span>Tên nhóm</span>
              <span className="text-destructive">*</span>
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

          {/* 4. Đề tài đồ án / Báo cáo */}
          <div className="space-y-1.5">
            <Label htmlFor="grp-topic" className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-[#7D39EB]" />
              <span>Đề tài đồ án / Báo cáo</span>
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="grp-topic"
              placeholder="VD: Tối ưu hoá mạng lưới kho bãi và trung tâm phân phối miền Nam"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
              className="h-9 text-xs rounded-lg bg-card"
            />
          </div>

          {/* 5. Trạng thái & Hạn nộp bài */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Trạng thái đồ án */}
            <div className="space-y-1.5">
              <Label htmlFor="grp-status" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#7D39EB]" />
                <span>Trạng thái đồ án</span>
              </Label>
              <select
                id="grp-status"
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

            {/* Hạn nộp bài */}
            <div className="space-y-1.5">
              <Label htmlFor="grp-deadline" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#7D39EB]" />
                <span>Hạn nộp bài</span>
              </Label>
              <DateTimePicker
                id="grp-deadline"
                value={deadline}
                onChange={setDeadline}
                placeholder="Chọn hạn nộp bài..."
                includeTime={true}
              />
            </div>
          </div>

          {/* 6. Gán Trọng số điểm từ phần Quản lý điểm số của môn học */}
          <div className="p-3 rounded-lg border border-[#7D39EB]/30 bg-[#7D39EB]/5 space-y-2 mt-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-[#7D39EB]" />
                <span>Gán trọng số điểm từ Quản lý điểm số</span>
              </Label>
              <Link
                href="/grades"
                target="_blank"
                className="text-[11px] font-semibold text-[#7D39EB] hover:underline flex items-center gap-1"
                title="Xem bảng điểm môn học"
              >
                <span>Quản lý điểm số</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
              {/* Chọn cột điểm thành phần */}
              <div className="sm:col-span-7 space-y-1">
                <Label htmlFor="grade-comp-select" className="text-[10px] font-semibold text-muted-foreground">
                  Cột điểm của môn {subjectCode ? `[${subjectCode}]` : ""}
                </Label>
                <select
                  id="grade-comp-select"
                  value={gradeComponentId}
                  onChange={(e) => handleSelectGradeComponent(e.target.value)}
                  className="w-full h-8 text-xs px-2 rounded-md bg-card border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-[#7D39EB]"
                >
                  <option value="">-- Chưa gán cột điểm --</option>
                  {currentCourseGrade?.components && currentCourseGrade.components.length > 0 ? (
                    currentCourseGrade.components.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.weight}%) {c.score !== null && c.score !== undefined ? `• Điểm: ${c.score}/10` : "• Chưa có điểm"}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      Môn học này chưa có cột điểm thành phần
                    </option>
                  )}
                </select>
              </div>

              {/* Trọng số (%) & Điểm số đạt được */}
              <div className="sm:col-span-5 grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">
                    Trọng số (%)
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="30"
                      value={gradeWeight ?? ""}
                      onChange={(e) => setGradeWeight(e.target.value ? Number(e.target.value) : undefined)}
                      className="h-8 text-xs font-mono font-bold rounded-md bg-card pr-5"
                    />
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-bold">
                      %
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">
                    Điểm (Hệ 10)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    step={0.1}
                    placeholder="VD: 8.5"
                    value={gradeScore}
                    onChange={(e) => setGradeScore(e.target.value)}
                    className="h-8 text-xs font-mono font-black text-[#7D39EB] rounded-md bg-card"
                  />
                </div>
              </div>
            </div>

            {gradeComponentId && (
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="h-3 w-3 shrink-0" />
                <span>
                  Đã liên kết với <strong>{gradeComponentName}</strong> ({gradeWeight || 0}%). Điểm nhập ở đây sẽ đồng bộ tức thì sang Quản lý điểm số.
                </span>
              </div>
            )}
          </div>

          {/* 7. Liên kết (Google Drive và Zalo/Discord) */}
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

          {/* 8. Ảnh bìa đồ án (Permanent link) */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-[#7D39EB]" />
              <span>Ảnh bìa đồ án (Permanent Link)</span>
            </Label>

            <div className="space-y-2">
              <div className="relative">
                <Input
                  placeholder="Dán link ảnh vĩnh viễn (Unsplash, Imgur, Cloudinary...)"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setPreviewError(false);
                  }}
                  className="h-8 text-xs rounded-md bg-card font-mono pr-8"
                />
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Xem trước ảnh nếu có */}
              {imageUrl && !previewError && (
                <div className="relative w-full h-24 rounded-lg overflow-hidden border border-border/70">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Preview cover"
                    className="w-full h-full object-cover"
                    onError={() => setPreviewError(true)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 9. Thành viên (kèm Số điện thoại, nút chỉ dấu cộng) */}
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
                      aria-label="Xoá thành viên"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Footer dialog: Button text-only chuẩn quy tắc 1.2 */}
          <DialogFooter className="pt-3 border-t border-border/60 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8 rounded-md"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || !topic.trim()}
              className="text-xs h-8 bg-[#7D39EB] hover:bg-[#6D28D9] text-white font-bold rounded-md"
            >
              {groupToEdit ? "Lưu thay đổi" : "Tạo nhóm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
