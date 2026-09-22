"use client";

import React from "react";
import { useSidebar } from "./SidebarContext";
import { cn } from "@/lib/utils";

/**
 * Spacer giữ chỗ trong Flex layout tương ứng với chiều rộng của Sidebar cố định (fixed)
 * Giúp cột nội dung chính không bị Sidebar fixed đè lên và co giãn mượt mà khi thu gọn/mở rộng
 */
export function SidebarSpacer() {
  const { isCollapsed } = useSidebar();

  return (
    <div
      aria-hidden="true"
      className={cn(
        "hidden lg:block shrink-0 transition-[width] duration-300 pointer-events-none select-none",
        isCollapsed ? "w-[72px]" : "w-[240px]"
      )}
    />
  );
}
