"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IMAGE_PRESETS, ImagePresetItem } from "@/lib/imagePresets";
import { Image as ImageIcon, Link as LinkIcon, Sparkles, Check, Trash2 } from "lucide-react";

interface ChangeCoverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUrl?: string;
  title?: string;
  subtitle?: string;
  onSave: (url: string) => void;
}

export function ChangeCoverDialog({
  open,
  onOpenChange,
  currentUrl = "",
  title = "Thay đổi ảnh bìa",
  subtitle = "Dán link ảnh vĩnh viễn (permanent link) hoặc chọn nhanh bộ ảnh nghệ thuật chuẩn hoá.",
  onSave,
}: ChangeCoverDialogProps) {
  const [url, setUrl] = useState(currentUrl);
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    setUrl(currentUrl);
    setPreviewError(false);
  }, [currentUrl, open]);

  const handleSelectPreset = (presetUrl: string) => {
    setUrl(presetUrl);
    setPreviewError(false);
  };

  const handleSave = () => {
    onSave(url.trim());
    onOpenChange(false);
  };

  const handleClear = () => {
    setUrl("");
    onSave("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-lg p-6 bg-card border border-border shadow-2xl">
        <DialogHeader className="space-y-1 pb-2 border-b border-border/50">
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <div className="h-8 w-8 rounded-md bg-[#7D39EB]/15 flex items-center justify-center text-[#7D39EB]">
              <ImageIcon className="h-4 w-4" />
            </div>
            {title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {subtitle || title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Nhập URL ảnh */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <LinkIcon className="h-3.5 w-3.5 text-[#7D39EB]" />
              Link ảnh vĩnh viễn (Permanent Image URL)
            </Label>
            <div className="relative">
              <Input
                placeholder="https://images.unsplash.com/... hoặc direct image link"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setPreviewError(false);
                }}
                className="h-10 text-xs pr-8 rounded-md font-mono"
              />
              {url && (
                <button
                  type="button"
                  onClick={() => setUrl("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Xem trước ảnh */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground">Xem trước hiển thị:</span>
            <div className="relative w-full h-36 rounded-lg overflow-hidden border border-border bg-muted/30 flex items-center justify-center">
              {url && !previewError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={url}
                  alt="Preview cover"
                  className="w-full h-full object-cover"
                  onError={() => setPreviewError(true)}
                />
              ) : (
                <div className="text-center p-4 text-muted-foreground space-y-1">
                  <ImageIcon className="h-7 w-7 mx-auto opacity-40" />
                  <p className="text-xs">
                    {previewError
                      ? "Không tải được ảnh từ link này. Vui lòng kiểm tra lại URL."
                      : "Chưa có ảnh (sẽ dùng ảnh phong cảnh mặc định theo chủ đề)"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bộ sưu tập ảnh mẫu chuẩn hoá 1-click */}
          <div className="space-y-2">
            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-[#7D39EB]" />
              Gợi ý ảnh bìa thẩm mỹ cao (1-click chọn):
            </Label>
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {IMAGE_PRESETS.map((preset) => {
                const isSelected = url === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.url)}
                    className={`group relative rounded-md overflow-hidden border text-left transition-all h-20 flex flex-col justify-end p-1.5 ${
                      isSelected
                        ? "border-[#7D39EB] ring-2 ring-[#7D39EB]/40 shadow-sm"
                        : "border-border/60 hover:border-border hover:opacity-90"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="relative z-10 text-[10px] font-bold text-white leading-tight truncate">
                      {preset.label}
                    </div>
                    {isSelected && (
                      <div className="absolute top-1 right-1 h-4 w-4 rounded-md bg-[#7D39EB] text-white flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between gap-2 pt-2 border-t border-border/50">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-xs text-muted-foreground hover:text-red-500 rounded-md"
          >
            Khôi phục mặc định
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs rounded-md"
            >
              Huỷ
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="text-xs font-bold bg-[#7D39EB] hover:bg-[#6828d4] text-white rounded-md shadow-md"
            >
              Lưu ảnh bìa
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
