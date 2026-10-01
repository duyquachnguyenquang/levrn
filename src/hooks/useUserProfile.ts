"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export interface UserProfile {
  id?: string;
  fullName: string;
  studentId: string;
  email: string;
  phone: string;
  university: string;
  major: string;
  academicYear: string;
  bio: string;
  avatarColor: string;
  avatarUrl?: string;
}

const DEFAULT_PROFILE: UserProfile = {
  fullName: "Quang Duy",
  studentId: "2251010045",
  email: "duy.qn@levrn.edu.vn",
  phone: "0912345678",
  university: "Đại học Giao thông Vận tải TP.HCM (UTH)",
  major: "Quản trị Logistics & Chuỗi cung ứng",
  academicYear: "K22 (2022 - 2026)",
  bio: "Mục tiêu GPA 3.6+ & Tốt nghiệp đúng hạn",
  avatarColor: "#7D39EB",
  avatarUrl: "",
};

const STORAGE_KEY = "levrn_user_profile";
const PROFILE_UPDATE_EVENT = "levrn-profile-updated";

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(true);

  // Nạp thông tin từ localStorage hoặc Supabase
  const loadProfile = useCallback(() => {
    try {
      // 1. Kiểm tra localStorage trước
      const saved = localStorage.getItem(STORAGE_KEY);
      let localData: Partial<UserProfile> = {};
      if (saved) {
        try {
          localData = JSON.parse(saved);
        } catch {
          // ignore error
        }
      }

      // 2. Dữ liệu từ Supabase User Metadata nếu có
      const meta = user?.user_metadata || {};

      const merged: UserProfile = {
        fullName: localData.fullName || meta.full_name || user?.email?.split("@")[0] || DEFAULT_PROFILE.fullName,
        studentId: localData.studentId || meta.student_id || DEFAULT_PROFILE.studentId,
        email: user?.email || localData.email || DEFAULT_PROFILE.email,
        phone: localData.phone || meta.phone || DEFAULT_PROFILE.phone,
        university: localData.university || meta.university || DEFAULT_PROFILE.university,
        major: localData.major || meta.major || DEFAULT_PROFILE.major,
        academicYear: localData.academicYear || meta.academic_year || DEFAULT_PROFILE.academicYear,
        bio: localData.bio || meta.bio || DEFAULT_PROFILE.bio,
        avatarColor: localData.avatarColor || meta.avatar_color || DEFAULT_PROFILE.avatarColor,
        avatarUrl: localData.avatarUrl || meta.avatar_url || DEFAULT_PROFILE.avatarUrl,
      };

      setProfile(merged);
    } catch (e) {
      console.error("Lỗi nạp profile:", e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();

    // Lắng nghe sự kiện cập nhật profile từ các component khác
    const handleUpdate = () => {
      loadProfile();
    };

    window.addEventListener(PROFILE_UPDATE_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(PROFILE_UPDATE_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [loadProfile]);

  // Cập nhật thông tin người dùng
  const updateProfile = async (updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    try {
      const newProfile: UserProfile = {
        ...profile,
        ...updates,
      };

      // 1. Lưu ngay vào localStorage để phản hồi tức thì
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
      setProfile(newProfile);

      // Phát sự kiện để Topbar và các view khác cập nhật ngay lập tức
      window.dispatchEvent(new Event(PROFILE_UPDATE_EVENT));

      // 2. Đồng bộ lên Supabase nếu có kết nối
      if (supabase && user) {
        // Cập nhật user_metadata trong Supabase Auth
        await supabase.auth.updateUser({
          data: {
            full_name: newProfile.fullName,
            student_id: newProfile.studentId,
            phone: newProfile.phone,
            university: newProfile.university,
            major: newProfile.major,
            academic_year: newProfile.academicYear,
            bio: newProfile.bio,
            avatar_color: newProfile.avatarColor,
            avatar_url: newProfile.avatarUrl,
          },
        });

        // Cập nhật bảng public.user_profiles nếu có
        try {
          await supabase.from("user_profiles").upsert({
            id: user.id,
            full_name: newProfile.fullName,
            student_id: newProfile.studentId,
            email: newProfile.email,
            phone: newProfile.phone,
            university: newProfile.university,
            major: newProfile.major,
            academic_year: newProfile.academicYear,
            bio: newProfile.bio,
            avatar_color: newProfile.avatarColor,
            avatar_url: newProfile.avatarUrl,
            updated_at: new Date().toISOString(),
          });
        } catch {
          // Bỏ qua nếu bảng chưa tồn tại
        }
      }

      return { success: true };
    } catch (err: any) {
      console.error("Lỗi cập nhật profile:", err);
      return { success: false, error: err.message || "Không thể cập nhật thông tin." };
    }
  };

  return {
    profile,
    isLoading,
    updateProfile,
    refreshProfile: loadProfile,
  };
}
