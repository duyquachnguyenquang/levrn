"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUserProfile, UserProfile } from "@/hooks/useUserProfile";
import {
  User,
  CreditCard,
  Mail,
  Phone,
  Building2,
  GraduationCap,
  Calendar,
  Sparkles,
  Pencil,
  X,
  Palette,
  Check,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AVATAR_COLORS = [
  { value: "#7D39EB", label: "Tím Violet (LEVRN)" },
  { value: "#C6FF33", label: "Vàng chanh Lime", textDark: true },
  { value: "#06B6D4", label: "Xanh Cyan" },
  { value: "#EC4899", label: "Hồng Neon" },
  { value: "#10B981", label: "Xanh Emerald" },
  { value: "#3B82F6", label: "Xanh Royal Blue" },
  { value: "#F97316", label: "Cam Sunset" },
];

export function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
  const { profile, updateProfile } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState<UserProfile>(profile);

  // Đồng bộ formData khi mở modal hoặc khi profile thay đổi
  useEffect(() => {
    if (open) {
      setFormData(profile);
      setIsEditing(false);
    }
  }, [open, profile]);

  const initials = (formData.fullName || "Sinh viên")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) return;

    setIsSaving(true);
    await updateProfile(formData);
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-lg border-border shadow-2xl [&>button.absolute]:hidden">
        {/* Header 3 thành phần cùng hàng: Tiêu đề, Nút Bút chì / Mắt, Nút Thoát */}
        <div className="px-5 py-3.5 border-b border-border/60 shrink-0 bg-card flex items-center justify-between gap-3">
          <DialogTitle className="text-base sm:text-lg font-black text-foreground tracking-tight">
            {isEditing ? "Chỉnh sửa thông tin cá nhân" : "Thông tin cá nhân"}
          </DialogTitle>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Nút chuyển đổi View / Edit mode */}
            <button
              type="button"
              onClick={() => {
                if (isEditing) {
                  handleCancel();
                } else {
                  setIsEditing(true);
                }
              }}
              className={cn(
                "h-8 w-8 rounded-md border border-border/80 flex items-center justify-center transition-all",
                isEditing
                  ? "bg-[#7D39EB] text-white hover:bg-[#6D28D9] border-[#7D39EB]"
                  : "bg-background hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
              title={isEditing ? "Chuyển sang chế độ xem" : "Chỉnh sửa thông tin"}
              aria-label={isEditing ? "Chuyển sang chế độ xem" : "Chỉnh sửa thông tin"}
            >
              {isEditing ? <Eye className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
            </button>

            {/* Nút Thoát X vuông bo góc 5-10% */}
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

        {/* Nội dung chính cuộn mượt */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Card Avatar nhận diện sinh viên */}
          <div className="p-4 rounded-lg bg-card border border-border/70 flex items-center gap-4">
            <div
              className="h-16 w-16 rounded-lg flex items-center justify-center text-xl font-black text-white shrink-0 shadow-md transition-all duration-300 border border-white/20"
              style={{
                backgroundColor: formData.avatarColor || "#7D39EB",
                color: formData.avatarColor === "#C6FF33" ? "#000000" : "#FFFFFF",
              }}
            >
              {initials}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-foreground truncate">
                  {formData.fullName}
                </h3>
                {formData.studentId && (
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-[#7D39EB]/15 text-[#7D39EB] border border-[#7D39EB]/30">
                    {formData.studentId}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {formData.major ? `${formData.major}` : "Sinh viên"}
                {formData.university && ` • ${formData.university}`}
              </p>
            </div>
          </div>

          {/* CHẾ ĐỘ XEM (VIEW MODE) */}
          {!isEditing ? (
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Họ và tên */}
                <div className="space-y-1">
                  <Label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    Họ và tên
                  </Label>
                  <p className="text-sm font-bold text-foreground">
                    {profile.fullName || "—"}
                  </p>
                </div>

                {/* Mã số sinh viên (MSSV) */}
                <div className="space-y-1">
                  <Label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                    Mã số sinh viên (MSSV)
                  </Label>
                  <p className="text-sm font-mono font-bold text-foreground">
                    {profile.studentId || "—"}
                  </p>
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <Label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    Email
                  </Label>
                  <p className="text-sm font-bold text-foreground truncate">
                    {profile.email || "—"}
                  </p>
                </div>

                {/* Số điện thoại */}
                <div className="space-y-1">
                  <Label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    Số điện thoại
                  </Label>
                  <p className="text-sm font-mono font-bold text-foreground">
                    {profile.phone || "—"}
                  </p>
                </div>

                {/* Trường Đại học */}
                <div className="space-y-1 sm:col-span-2">
                  <Label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                    Trường / Cơ sở đào tạo
                  </Label>
                  <p className="text-sm font-bold text-foreground">
                    {profile.university || "—"}
                  </p>
                </div>

                {/* Chuyên ngành */}
                <div className="space-y-1">
                  <Label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <GraduationCap className="w-3.5 h-3.5 text-muted-foreground" />
                    Chuyên ngành
                  </Label>
                  <p className="text-sm font-bold text-foreground">
                    {profile.major || "—"}
                  </p>
                </div>

                {/* Niên khóa */}
                <div className="space-y-1">
                  <Label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    Khóa học / Niên khóa
                  </Label>
                  <p className="text-sm font-bold text-foreground">
                    {profile.academicYear || "—"}
                  </p>
                </div>

                {/* Mục tiêu / Châm ngôn */}
                <div className="space-y-1 sm:col-span-2">
                  <Label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
                    Mục tiêu / Châm ngôn học tập
                  </Label>
                  <p className="text-sm font-medium text-foreground/90 italic bg-muted/30 p-2.5 rounded-md border border-border/50">
                    &ldquo;{profile.bio || "Chưa thiết lập mục tiêu"}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* CHẾ ĐỘ CHỈNH SỬA (EDIT MODE) */
            <form id="profile-form" onSubmit={handleSave} className="space-y-3.5 pt-1">
              {/* Chọn màu Avatar đại diện */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <Palette className="w-3.5 h-3.5 text-muted-foreground" />
                  Màu đại diện Avatar
                </Label>
                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                  {AVATAR_COLORS.map((col) => (
                    <button
                      key={col.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, avatarColor: col.value })}
                      className={cn(
                        "h-7 w-7 rounded-md flex items-center justify-center transition-all duration-150 border-2",
                        formData.avatarColor === col.value
                          ? "border-foreground scale-110 shadow-sm"
                          : "border-transparent opacity-80 hover:opacity-100 hover:scale-105"
                      )}
                      style={{ backgroundColor: col.value }}
                      title={col.label}
                    >
                      {formData.avatarColor === col.value && (
                        <Check
                          className={cn(
                            "w-3.5 h-3.5 stroke-[3]",
                            col.textDark ? "text-black" : "text-white"
                          )}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Các trường nhập liệu đồng cấp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Họ và tên */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    Họ và tên *
                  </Label>
                  <Input
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    className="h-9 text-xs rounded-md bg-card"
                  />
                </div>

                {/* Mã số sinh viên (MSSV) */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                    Mã số sinh viên (MSSV)
                  </Label>
                  <Input
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    placeholder="2251010045"
                    className="h-9 text-xs font-mono rounded-md bg-card"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    Email
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                    className="h-9 text-xs rounded-md bg-card"
                  />
                </div>

                {/* Số điện thoại */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    Số điện thoại
                  </Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0912345678"
                    className="h-9 text-xs font-mono rounded-md bg-card"
                  />
                </div>

                {/* Trường Đại học */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                    Trường / Cơ sở đào tạo
                  </Label>
                  <Input
                    value={formData.university}
                    onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                    placeholder="Đại học Giao thông Vận tải TP.HCM"
                    className="h-9 text-xs rounded-md bg-card"
                  />
                </div>

                {/* Chuyên ngành */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <GraduationCap className="w-3.5 h-3.5 text-muted-foreground" />
                    Chuyên ngành
                  </Label>
                  <Input
                    value={formData.major}
                    onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                    placeholder="Quản trị Logistics & Chuỗi cung ứng"
                    className="h-9 text-xs rounded-md bg-card"
                  />
                </div>

                {/* Niên khóa */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    Khóa học / Niên khóa
                  </Label>
                  <Input
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    placeholder="K22 (2022 - 2026)"
                    className="h-9 text-xs rounded-md bg-card"
                  />
                </div>

                {/* Mục tiêu / Châm ngôn */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
                    Mục tiêu / Châm ngôn học tập
                  </Label>
                  <Textarea
                    rows={2}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Mục tiêu GPA 3.6+ & Tốt nghiệp loại Giỏi..."
                    className="text-xs rounded-md bg-card resize-none"
                  />
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer: hiển thị các nút thao tác khi ở Edit mode */}
        {isEditing && (
          <div className="px-5 py-3 border-t border-border/60 bg-muted/20 shrink-0 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
              className="h-8 text-xs font-bold rounded-md"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              form="profile-form"
              size="sm"
              disabled={isSaving || !formData.fullName.trim()}
              className="h-8 text-xs font-bold rounded-md bg-[#7D39EB] text-white hover:bg-[#6D28D9] shadow-xs"
            >
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
