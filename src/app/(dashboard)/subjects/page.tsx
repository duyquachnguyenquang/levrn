"use client";

import React, { useState } from "react";
import { useSubjects } from "@/hooks/useSubjects";
import { SubjectList } from "@/components/subjects/SubjectList";
import { SubjectForm } from "@/components/subjects/SubjectForm";
import { Button } from "@/components/ui/button";
import { Subject, SubjectFormData } from "@/lib/types";
import { Plus, BookOpen, Database, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";

/**
 * Trang Quản lý Môn học (/subjects) kết nối trực tiếp với Supabase Database
 */
export default function SubjectsPage() {
  const {
    subjects,
    isLoading,
    isSupabaseActive,
    errorMessage,
    addSubject,
    updateSubject,
    deleteSubject,
    refreshSubjects,
  } = useSubjects();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleAddNew = () => {
    setSelectedSubject(null);
    setFormMode("create");
    setFormOpen(true);
  };

  const handleEdit = (subject: Subject) => {
    setSelectedSubject(subject);
    setFormMode("edit");
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: SubjectFormData) => {
    if (formMode === "create") {
      return await addSubject(data);
    } else if (selectedSubject) {
      return await updateSubject(selectedSubject.id, data);
    }
    return { success: false, error: "Đã xảy ra lỗi không xác định." };
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshSubjects();
    setIsRefreshing(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* 1. Header Trang */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-md bg-[#7D39EB]/15 flex items-center justify-center text-[#7D39EB]">
              <BookOpen className="h-5 w-5" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Môn học của tôi
            </h2>
          </div>
        </div>

        {/* Nút thao tác: Làm mới + Thêm môn học (+) */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="rounded-md h-10 w-10 border-border/70 text-muted-foreground hover:text-foreground transition-all active:scale-95"
            title="Tải lại dữ liệu từ Supabase"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>

          <Button
            size="icon"
            onClick={handleAddNew}
            className="h-10 w-10 bg-[#C6FF33] hover:bg-[#B5F51B] text-black font-black rounded-md shadow-md transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shrink-0"
            title="Thêm môn học"
            aria-label="Thêm môn học"
          >
            <Plus className="h-5 w-5 stroke-[3]" />
          </Button>
        </div>
      </div>

      {/* Thông báo hướng dẫn tạo bảng Supabase nếu bảng chưa được tạo */}
      {errorMessage && !isSupabaseActive && (
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Đã kết nối Supabase, cần khởi tạo bảng 'subjects':</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Vào <strong>Supabase Dashboard → SQL Editor</strong> và chạy nội dung file <code className="px-1.5 py-0.5 rounded bg-muted font-mono">supabase_schema.sql</code>. Ứng dụng hiện đang lưu tạm dữ liệu trên thiết bị.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleRefresh}
            className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-md text-xs h-8 active:scale-95"
          >
            Kiểm tra lại
          </Button>
        </div>
      )}

      {/* 2. Danh sách môn học dạng Responsive Grid */}
      <SubjectList
        subjects={subjects}
        isLoading={isLoading}
        onAddNew={handleAddNew}
        onEdit={handleEdit}
        onDelete={deleteSubject}
      />

      {/* 3. Dialog Thêm / Sửa môn học */}
      <SubjectForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        initialData={selectedSubject}
        mode={formMode}
      />
    </div>
  );
}
