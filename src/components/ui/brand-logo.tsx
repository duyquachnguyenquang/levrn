import React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface BrandLogoProps {
  /**
   * - "wordmark": Bản logo wordmark 'LEVRN' nguyên bản (dành cho nơi rộng rãi, lớn)
   * - "icon": Bản logo chỉ hình (dành cho nơi nhỏ, khó nhìn)
   * - "icon-transparent": Biểu tượng tím không nền
   * - "wordmark-transparent": Chữ tím không nền
   */
  variant?: "wordmark" | "icon" | "icon-transparent" | "wordmark-transparent";
  className?: string;
  imageClassName?: string;
  asLink?: boolean;
  href?: string;
  priority?: boolean;
  alt?: string;
}

/**
 * Component hiển thị logo chuẩn nhận diện thương hiệu LEVRN
 * - Chỗ rộng rãi: Dùng variant="wordmark" (bản 'LEVRN' nguyên bản)
 * - Chỗ icon nhỏ: Dùng variant="icon" (bản logo chỉ hình)
 */
export function BrandLogo({
  variant = "wordmark",
  className,
  imageClassName,
  asLink = false,
  href = "/dashboard",
  priority = false,
  alt = "LEVRN Logo",
}: BrandLogoProps) {
  let content: React.ReactNode;

  if (variant === "icon") {
    content = (
      <div
        className={cn(
          "relative overflow-hidden rounded-md shadow-xs transition-transform group-hover:scale-105 shrink-0 flex items-center justify-center bg-[#C6FF34]",
          className
        )}
      >
        <Image
          src="/brand/levrn-icon.png"
          alt={alt}
          width={48}
          height={48}
          priority={priority}
          className={cn("w-full h-full object-contain", imageClassName)}
        />
      </div>
    );
  } else if (variant === "icon-transparent") {
    content = (
      <div
        className={cn(
          "relative shrink-0 flex items-center justify-center",
          className
        )}
      >
        <Image
          src="/brand/levrn-icon-transparent.png"
          alt={alt}
          width={48}
          height={48}
          priority={priority}
          className={cn("w-full h-full object-contain", imageClassName)}
        />
      </div>
    );
  } else if (variant === "wordmark-transparent") {
    content = (
      <div
        className={cn(
          "relative shrink-0 flex items-center justify-center",
          className
        )}
      >
        <Image
          src="/brand/levrn-wordmark-transparent.png"
          alt={alt}
          width={216}
          height={56}
          priority={priority}
          className={cn("h-full w-auto object-contain", imageClassName)}
        />
      </div>
    );
  } else {
    // "wordmark" - bản logo wordmark 'LEVRN' nguyên bản
    content = (
      <div
        className={cn(
          "relative overflow-hidden rounded-md shadow-sm transition-transform group-hover:scale-[1.02] shrink-0 flex items-center justify-center bg-[#C6FF34]",
          className
        )}
      >
        <Image
          src="/brand/levrn-wordmark.png"
          alt={alt}
          width={216}
          height={56}
          priority={priority}
          className={cn("h-full w-auto object-contain", imageClassName)}
        />
      </div>
    );
  }

  if (asLink) {
    return (
      <Link
        href={href}
        className="group inline-flex items-center gap-2 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D39EB] rounded-lg"
        aria-label="Trang chủ LEVRN"
      >
        {content}
      </Link>
    );
  }

  return content;
}
