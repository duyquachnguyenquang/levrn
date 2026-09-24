"use client";

import React, { useState, useMemo } from "react";
import { useSubjects } from "@/hooks/useSubjects";
import { useGroups } from "@/hooks/useGroups";
import { GroupProjectCard } from "@/components/groups/GroupProjectCard";
import { GroupProjectModal } from "@/components/groups/GroupProjectModal";
import { GroupDetailDialog } from "@/components/groups/GroupDetailDialog";
import { GroupProject, GroupProjectFormData, GroupProjectStatus } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { LedTicker } from "@/components/ui/led-ticker";
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
      {/* 1. Header Trang: Đồng bộ chuẩn Môn học & Kế hoạch học tập, luôn nằm cùng hàng trên mọi thiết bị */}
      <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-md bg-[#7D39EB]/15 flex items-center justify-center text-[#7D39EB] shrink-0">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-foreground tracking-tight truncate">
            Quản lý nhóm
          </h2>
        </div>

        {/* Cụm 2 nút thao tác bên phải: Đồng bộ + Tạo nhóm mới (+) chỉ icon, luôn ngang hàng */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="rounded-md h-8 w-8 sm:h-10 sm:w-10 border-border/70 text-muted-foreground hover:text-foreground transition-all active:scale-95 shrink-0"
            title="Đồng bộ dữ liệu"
            aria-label="Đồng bộ dữ liệu"
          >
            <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>

          <Button
            size="icon"
            onClick={() => {
              setGroupToEdit(null);
              setCreateModalOpen(true);
            }}
            className="h-8 w-8 sm:h-10 sm:w-10 bg-[#C6FF33] hover:bg-[#B5F51B] text-black font-black rounded-md shadow-md transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shrink-0"
            title="Tạo nhóm mới"
            aria-label="Tạo nhóm mới"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 stroke-[3]" />
          </Button>
        </div>
      </div>

      {/* 2. 4 Box chỉ số tối giản tinh gọn chuẩn Kế hoạch học tập & Điểm số */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        {/* Box 1: Tổng số nhóm đồ án */}
        <Card className="rounded-xl border border-border/80 bg-card p-3 sm:p-4 shadow-xs flex items-center justify-between transition-all hover:border-border/90">
          <div className="flex-1 min-w-0 pr-2 sm:pr-3">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block truncate">
              Nhóm đồ án
            </span>
            <LedTicker className="mt-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-3xl font-black text-foreground">
                  {stats.totalGroups}
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground">
                  ({stats.totalMembers} thành viên)
                </span>
              </div>
            </LedTicker>
          </div>
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-[#7D39EB]/15 text-[#7D39EB] flex items-center justify-center shrink-0">
            <Users className="h-4 w-4" />
          </div>
        </Card>

        {/* Box 2: Nhiệm vụ nhóm */}
        <Card className="rounded-xl border border-border/80 bg-card p-3 sm:p-4 shadow-xs flex items-center justify-between transition-all hover:border-border/90">
          <div className="flex-1 min-w-0 pr-2 sm:pr-3">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block truncate">
              Nhiệm vụ nhóm
            </span>
            <LedTicker className="mt-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-3xl font-black text-blue-500">
                  {stats.completedTasks}
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground">
                  /{stats.totalTasks} việc
                </span>
              </div>
            </LedTicker>
          </div>
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </Card>

        {/* Box 3: Tiến độ chung */}
        <Card className="rounded-xl border border-border/80 bg-card p-3 sm:p-4 shadow-xs flex items-center justify-between transition-all hover:border-border/90">
          <div className="flex-1 min-w-0 pr-2 sm:pr-3">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block truncate">
              Tiến độ chung
            </span>
            <LedTicker className="mt-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-3xl font-black text-[#10B981] dark:text-[#C6FF33]">
                  {stats.overallProgress}%
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground">
                  hoàn thành
                </span>
              </div>
            </LedTicker>
          </div>
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-[#C6FF33]/20 text-[#1F3E00] dark:text-[#C6FF33] flex items-center justify-center shrink-0">
            <TrendingUp className="h-4 w-4" />
          </div>
        </Card>

        {/* Box 4: Hạn nộp trong 7 ngày */}
        <Card className="rounded-xl border border-border/80 bg-card p-3 sm:p-4 shadow-xs flex items-center justify-between transition-all hover:border-border/90">
          <div className="flex-1 min-w-0 pr-2 sm:pr-3">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block truncate">
              Hạn trong 7 ngày
            </span>
            <LedTicker className="mt-1">
              <div className="flex items-baseline gap-1.5">
                <span
                  className={cn(
                    "text-xl sm:text-3xl font-black",
                    stats.upcomingDeadlines > 0 ? "text-amber-500" : "text-foreground"
                  )}
                >
                  {stats.upcomingDeadlines}
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground">
                  đồ án
                </span>
              </div>
            </LedTicker>
          </div>
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
            <Clock className="h-4 w-4" />
          </div>
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
