"use client";

import React, { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface MarqueeTextProps {
  text: string;
  className?: string;
  containerClassName?: string;
  speed?: number; // Tốc độ chạy (giây cho 1 vòng)
  pauseOnHover?: boolean;
}

/**
 * Component MarqueeText:
 * Tự động phát hiện khi văn bản bị tràn chiều rộng (overflow).
 * - Nếu không tràn: Hiển thị chữ tĩnh bình thường.
 * - Nếu tràn: Tự động chạy ngang vòng lặp tuần hoàn (vô tận), mượt mà, không dùng dấu ba chấm "..." gây cụt chữ.
 * - Rê chuột vào sẽ tạm dừng (pause on hover) để người dùng dễ đọc.
 */
export function MarqueeText({
  text,
  className,
  containerClassName,
  speed = 12,
  pauseOnHover = true,
}: MarqueeTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const textWidth = textRef.current.scrollWidth;
        setIsOverflowing(textWidth > containerWidth + 2);
      }
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [text]);

  if (!isOverflowing) {
    return (
      <div
        ref={containerRef}
        className={cn("w-full overflow-hidden whitespace-nowrap", containerClassName)}
      >
        <span ref={textRef} className={cn("inline-block", className)}>
          {text}
        </span>
      </div>
    );
  }

  // Khi tràn chữ: chạy vòng lặp tuần hoàn mượt mà
  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full overflow-hidden whitespace-nowrap group/marquee select-none",
        containerClassName
      )}
      title={text}
    >
      <div
        className={cn(
          "inline-flex will-change-transform",
          pauseOnHover && "group-hover/marquee:[animation-play-state:paused]"
        )}
        style={{
          animation: `levrn-marquee ${speed}s linear infinite`,
        }}
      >
        <span ref={textRef} className={cn("inline-block pr-8", className)}>
          {text}
        </span>
        <span className={cn("inline-block pr-8", className)} aria-hidden="true">
          {text}
        </span>
      </div>

      {/* Hiệu ứng viền mờ mép phải nhẹ nhàng khi chữ chạy vào */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-2.5 bg-gradient-to-l from-card to-transparent" />
    </div>
  );
}
