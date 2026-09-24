"use client";

import React, { useState, useMemo } from "react";
import { useSubjects } from "@/hooks/useSubjects";
import { useGroups } from "@/hooks/useGroups";
import { GroupProjectCard } from "@/components/groups/GroupProjectCard";
import { GroupProjectModal } from "@/components/groups/GroupProjectModal";
import { GroupDetailDialog } from "@/components/groups/GroupDetailDialog";
import { GroupProject, GroupProjectFormData, GroupProjectStatus } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Plus,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  Clock,
  FolderGit2,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function GroupsPage() {
  const { subjects } = useSubjects();
  const {
    groups,
    stats,
    isLoading,
    isSupabaseActive,
    addGroup,
    updateGroup,
    deleteGroup,
    addMember,
    removeMember,
    addTask,
    updateTaskStatus,
    deleteTask,
    refreshGroups,
  } = useGroups();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<GroupProject | null>(null);
  const [detailGroup, setDetailGroup] = useState<GroupProject | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Lọc danh sách nhóm
  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        g.name.toLowerCase().includes(q) ||
        g.topic.toLowerCase().includes(q) ||
        g.subjectCode.toLowerCase().includes(q) ||
        g.subjectName.toLowerCase().includes(q);

      const matchStatus = statusFilter === "all" || g.status === statusFilter;

      return matchQuery && matchStatus;
    });
  }, [groups, searchQuery, statusFilter]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshGroups();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleOpenDetail = (group: GroupProject) => {
    setDetailGroup(group);
    setDetailOpen(true);
  };

  const handleOpenEdit = (group: GroupProject) => {
    setGroupToEdit(group);
    setCreateModalOpen(true);
  };

  const handleSaveGroup = async (data: GroupProjectFormData, id?: string) => {
    if (id) {
      await updateGroup(id, data);
    } else {
      await addGroup(data);
    }
  };

  // Đồng bộ detailGroup khi dữ liệu groups thay đổi
  const currentDetailGroup = useMemo(() => {
    if (!detailGroup) return null;
    return groups.find((g) => g.id === detailGroup.id) || null;
  }, [groups, detailGroup]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header trang */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#7D39EB]/10 border border-[#7D39EB]/25 flex items-center justify-center text-[#7D39EB]">
              <Users className="h-4.5 w-4.5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              Quản lý nhóm &amp; Đồ án học phần
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Theo dõi tiến độ làm việc nhóm, phân công nhiệm vụ và tài liệu chung cho bài tập lớn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-9 text-xs rounded-lg border-border/80 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5 mr-1.5", isRefreshing && "animate-spin text-[#7D39EB]")}
            />
            {isRefreshing ? "Đang đồng bộ..." : "Đồng bộ"}
          </Button>

          <Button
            onClick={() => {
              setGroupToEdit(null);
              setCreateModalOpen(true);
            }}
            className="h-9 text-xs font-bold rounded-lg bg-[#7D39EB] hover:bg-[#6D28D9] text-white shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Tạo nhóm mới
          </Button>
        </div>
      </div>

      {/* 4 Thẻ KPI thống kê nhóm */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* 1. Tổng số nhóm */}
        <Card className="border border-border/80 bg-card hover:border-[#7D39EB]/50 transition-all rounded-lg shadow-xs">
          <CardContent className="p-4 sm:p-4.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Nhóm đồ án
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-foreground">
                  {stats.totalGroups}
                </span>
                <span className="text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-md bg-[#7D39EB]/15 text-[#7D39EB]">
                  {stats.totalMembers} thành viên
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Đang cùng tham gia
              </p>
            </div>
            <div className="h-11 w-11 rounded-lg bg-[#7D39EB]/10 border border-[#7D39EB]/20 flex items-center justify-center text-[#7D39EB] shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* 2. Tổng nhiệm vụ */}
        <Card className="border border-border/80 bg-card hover:border-blue-500/50 transition-all rounded-lg shadow-xs">
          <CardContent className="p-4 sm:p-4.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Nhiệm vụ nhóm
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-blue-500">
                  {stats.completedTasks}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-muted-foreground">
                  /{stats.totalTasks} việc
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Đã hoàn thành xuất sắc
              </p>
            </div>
            <div className="h-11 w-11 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* 3. Tiến độ chung */}
        <Card className="border border-border/80 bg-card hover:border-emerald-500/50 transition-all rounded-lg shadow-xs">
          <CardContent className="p-4 sm:p-4.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tiến độ chung
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-emerald-500">
                  {stats.overallProgress}%
                </span>
                <span className="text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-500 inline-flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" /> Ổn định
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Khối lượng công việc đã làm
              </p>
            </div>
            <div className="h-11 w-11 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
              <FolderGit2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* 4. Hạn chót sắp tới */}
        <Card className="border border-border/80 bg-card hover:border-amber-500/50 transition-all rounded-lg shadow-xs">
          <CardContent className="p-4 sm:p-4.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Hạn nộp trong 7 ngày
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className={cn(
                    "text-2xl sm:text-3xl font-extrabold font-mono tracking-tight",
                    stats.upcomingDeadlines > 0 ? "text-amber-500" : "text-foreground"
                  )}
                >
                  {stats.upcomingDeadlines}
                </span>
                <span className="text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-500">
                  Cần tập trung
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Đồ án chuẩn bị báo cáo
              </p>
            </div>
            <div className="h-11 w-11 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar tìm kiếm và lọc */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên nhóm, đề tài đồ án, mã môn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9 pr-4 text-xs rounded-lg bg-card border-border/80"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 text-xs px-3 rounded-lg bg-card border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-[#7D39EB]"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="planning">Lên kế hoạch</option>
            <option value="in_progress">Đang thực hiện</option>
            <option value="submitted">Đã nộp bài</option>
            <option value="completed">Hoàn thành</option>
          </select>
        </div>
      </div>

      {/* Danh sách các nhóm đồ án */}
      {isLoading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          Đang tải danh sách nhóm đồ án...
        </div>
      ) : filteredGroups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map((group) => (
            <GroupProjectCard
              key={group.id}
              group={group}
              onOpenDetail={handleOpenDetail}
              onEdit={handleOpenEdit}
              onDelete={deleteGroup}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-border/80 rounded-lg p-8">
          <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2" />
          <h3 className="text-sm font-bold text-foreground">Không tìm thấy nhóm đồ án nào</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== "all"
              ? "Hãy thử xoá bộ lọc hoặc từ khoá tìm kiếm."
              : "Bạn chưa có nhóm đồ án nào. Hãy bấm 'Tạo nhóm mới' để bắt đầu làm việc nhóm hiệu quả."}
          </p>
          <Button
            onClick={() => {
              setGroupToEdit(null);
              setCreateModalOpen(true);
            }}
            className="mt-4 h-8 text-xs font-bold bg-[#7D39EB] text-white"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Tạo nhóm ngay
          </Button>
        </div>
      )}

      {/* Modal tạo/sửa nhóm */}
      <GroupProjectModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        groupToEdit={groupToEdit}
        subjects={subjects}
        onSave={handleSaveGroup}
      />

      {/* Dialog xem chi tiết nhóm & Kanban tasks */}
      <GroupDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        group={currentDetailGroup}
        onAddMember={addMember}
        onRemoveMember={removeMember}
        onAddTask={addTask}
        onUpdateTaskStatus={updateTaskStatus}
        onDeleteTask={deleteTask}
      />
    </div>
  );
}
