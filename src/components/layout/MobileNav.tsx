"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ArrowUpRight } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { navigationItems } from "./Sidebar";
import { BrandLogo } from "@/components/ui/brand-logo";
import { cn } from "@/lib/utils";

/**
 * MobileNav Drawer phong cách Eduplex: nền tối #13151B, active item Lime #C6FF33
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden rounded-lg h-9 w-9 text-muted-foreground hover:text-foreground"
          aria-label="Mở menu di động"
          title="Mở menu di động"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-[280px] p-0 flex flex-col bg-[#13151B] text-white border-r border-[#1F222C]"
      >
        {/* Header Logo: Wordmark 'LEVRN' nguyên bản rộng rãi thoải mái */}
        <div className="h-20 flex items-center px-6 border-b border-[#1F222C]">
          <BrandLogo
            variant="wordmark"
            asLink
            priority
            className="h-10 px-3.5 py-1.5 shadow-md shadow-[#C6FF33]/15"
            alt="LEVRN"
          />
        </div>

        {/* Danh sách Menu */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {navigationItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 active:scale-98",
                  isActive
                    ? "bg-[#C6FF33] text-black shadow-md shadow-[#C6FF33]/20 font-bold scale-[1.01]"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-black" : "text-zinc-400"
                  )}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Banner mini chân Drawer */}
        <div className="p-4 border-t border-[#1F222C]">
          <div className="rounded-lg bg-gradient-to-br from-[#C6FF33] to-[#A8E817] p-3 text-black shadow-md transition-transform hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <BrandLogo variant="icon-transparent" className="h-4 w-4" alt="LEVRN Icon" />
                <span className="font-bold text-xs">LEVRN Mobile</span>
              </div>
              <div className="h-5 w-5 rounded-md bg-black flex items-center justify-center text-[#C6FF33]">
                <ArrowUpRight className="h-3 w-3" />
              </div>
            </div>
            <p className="text-[11px] text-black/80 font-medium">
              Tối ưu trải nghiệm học tập
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
