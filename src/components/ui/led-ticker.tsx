"use client";

import React, { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface LedTickerProps {
  children: React.ReactNode;
  className?: string;
  speed?: number; // pixels per second
}

/**
 * Hiển thị chữ chạy ngang qua lại như bảng LED điện tử
 * Chỉ kích hoạt khi nội dung dài hơn chiều rộng vùng chứa (overflow)
 * Tự động dừng ở hai đầu để người dùng đọc rõ ràng
 */
export function LedTicker({
  children,
  className,
  speed = 28,
}: LedTickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [overflowDistance, setOverflowDistance] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const checkOverflow = () => {
      const scrollW = content.scrollWidth;
      const clientW = container.clientWidth;
      if (scrollW > clientW + 2) {
        setOverflowDistance(scrollW - clientW + 6);
      } else {
        setOverflowDistance(0);
      }
    };

    checkOverflow();

    const resizeObserver = new ResizeObserver(() => {
      checkOverflow();
    });

    resizeObserver.observe(container);
    resizeObserver.observe(content);

    return () => {
      resizeObserver.disconnect();
    };
  }, [children]);

  // Thời gian chạy dựa trên khoảng cách cần di chuyển, tối thiểu 3.5 giây
  const duration = Math.max(3.5, overflowDistance / speed + 2);

  return (
    <div
      ref={containerRef}
      className={cn("w-full overflow-hidden select-none", className)}
    >
      <div
        ref={contentRef}
        className="inline-block whitespace-nowrap will-change-transform"
        style={
          overflowDistance > 0
            ? ({
                animation: `led-ticker ${duration}s ease-in-out infinite alternate`,
                "--ticker-distance": `-${overflowDistance}px`,
              } as React.CSSProperties)
            : undefined
        }
      >
        {children}
      </div>
    </div>
  );
}
