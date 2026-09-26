"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    fullName?: string,
    phone?: string
  ) => Promise<{ success: boolean; error?: string; requireConfirmation?: boolean }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signIn: async () => ({ success: false }),
  signUp: async () => ({ success: false }),
  signInWithGoogle: async () => ({ success: false }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // 1. Kiểm tra session hiện tại
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // 2. Lắng nghe thay đổi trạng thái xác thực
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Đăng nhập bằng Email và Password
  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { success: false, error: "Chưa cấu hình Supabase Client." };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        let msg = error.message;
        if (error.message.includes("Invalid login credentials")) {
          msg = "Email hoặc mật khẩu không chính xác.";
        } else if (error.message.includes("Email not confirmed")) {
          msg = "Email này chưa được xác nhận. Vui lòng kiểm tra hộp thư đến.";
        }
        return { success: false, error: msg };
      }

      setSession(data.session);
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Đã xảy ra lỗi khi đăng nhập." };
    }
  };

  // Đăng ký tài khoản mới
  const signUp = async (
    email: string,
    password: string,
    fullName?: string,
    phone?: string
  ) => {
    if (!supabase) {
      return { success: false, error: "Chưa cấu hình Supabase Client." };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName?.trim() || "",
            phone: phone?.trim() || "",
          },
        },
      });

      if (error) {
        let msg = error.message;
        if (error.message.includes("User already registered")) {
          msg = "Email này đã được đăng ký. Bạn có thể đăng nhập ngay.";
        } else if (error.message.includes("Password should be at least")) {
          msg = "Mật khẩu phải chứa ít nhất 6 ký tự.";
        }
        return { success: false, error: msg };
      }

      // Nếu Supabase yêu cầu xác nhận email qua link
      const requireConfirmation = !data.session && !!data.user;

      if (data.session) {
        setSession(data.session);
        setUser(data.user);
      }

      return { success: true, requireConfirmation };
    } catch (err: any) {
      return { success: false, error: err.message || "Đã xảy ra lỗi khi đăng ký." };
    }
  };

  // Đăng nhập bằng Google OAuth
  const signInWithGoogle = async () => {
    if (!supabase) {
      return { success: false, error: "Chưa cấu hình Supabase Client." };
    }

    try {
      const redirectUrl = typeof window !== "undefined"
        ? `${window.location.origin}/dashboard`
        : undefined;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Lỗi đăng nhập Google." };
    }
  };

  // Đăng xuất
  const signOut = async () => {
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (e) {
      console.error("Lỗi khi đăng xuất:", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
