import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { SidebarProvider } from "@/components/layout/SidebarContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout chính cho toàn bộ các trang thuộc nhóm (dashboard)
 * Bao gồm Sidebar dọc bên trái (Desktop) với chế độ thu gọn/mở rộng và Topbar ngang bên trên
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-row">
        {/* 1. Sidebar dọc bên trái cố định cho desktop */}
        <Sidebar />

        {/* 2. Cột nội dung chính chứa Topbar và nội dung trang */}
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
          {/* Topbar ngang sticky trên cùng */}
          <Topbar />

          {/* Khu vực nội dung hiển thị của từng trang */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
