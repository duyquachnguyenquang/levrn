"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  User,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const { user, signIn, signUp, signInWithGoogle, isLoading } = useAuth();

  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Nếu đã đăng nhập, tự động chuyển hướng sang Dashboard
  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  // Đánh giá độ mạnh mật khẩu (Password Strength)
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "", color: "" };
    if (pwd.length < 6) return { score: 1, label: "Mật khẩu yếu", color: "bg-destructive text-destructive" };
    const hasLetter = /[a-zA-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);

    if (pwd.length >= 8 && hasLetter && hasNumber && hasSpecial) {
      return { score: 3, label: "Mật khẩu rất mạnh", color: "bg-[#C6FF33] text-emerald-600 dark:text-[#C6FF33]" };
    }
    if (pwd.length >= 6 && hasLetter && hasNumber) {
      return { score: 2, label: "Good password", color: "bg-emerald-500 text-emerald-500" };
    }
    return { score: 1, label: "Mật khẩu cơ bản", color: "bg-amber-500 text-amber-500" };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    if (!email.trim() || !password) {
      setErrorMessage("Vui lòng điền đầy đủ Email và Mật khẩu.");
      return;
    }

    if (mode === "signup") {
      if (password.length < 6) {
        setErrorMessage("Mật khẩu phải chứa ít nhất 6 ký tự.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage("Mật khẩu xác nhận không khớp.");
        return;
      }

      setIsSubmitting(true);
      const fullName = `${lastName.trim()} ${firstName.trim()}`.trim();
      const result = await signUp(email, password, fullName, phone);
      setIsSubmitting(false);

      if (result.success) {
        if (result.requireConfirmation) {
          setSuccessNotice(`Đã gửi email kích hoạt đến "${email}". Vui lòng kiểm tra hộp thư của bạn!`);
        } else {
          router.push("/dashboard");
        }
      } else {
        setErrorMessage(result.error || "Đăng ký không thành công.");
      }
    } else {
      // Đăng nhập
      setIsSubmitting(true);
      const result = await signIn(email, password);
      setIsSubmitting(false);

      if (result.success) {
        router.push("/dashboard");
      } else {
        setErrorMessage(result.error || "Email hoặc mật khẩu không chính xác.");
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsGoogleLoading(true);
    const result = await signInWithGoogle();
    if (!result.success) {
      setErrorMessage(result.error || "Không thể kết nối với tài khoản Google.");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#F5F6FA] dark:bg-[#0B0D12] transition-colors">
      {/* Container thẻ chính: Chia 2 nửa (Banner bên trái + Form bên phải) bo góc 5-10% */}
      <div className="w-full max-w-4xl bg-card border border-border/80 shadow-2xl rounded-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        {/* ================= CỘT TRÁI: BRAND BANNER GRAPHIC ================= */}
        <div className="relative lg:col-span-5 bg-[#4C44F6] text-white p-8 sm:p-10 flex flex-col justify-between overflow-hidden select-none">
          {/* Lớp hình khối đồ hoạ trang trí trừu tượng LEVRN */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Vòng cong tròn màu hồng Magenta phong cách Modern Poster */}
            <div className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full border-[38px] border-[#FF2A85] opacity-90 transform -rotate-12" />
            <div className="absolute bottom-20 left-12 w-48 h-48 rounded-full border-[32px] border-[#FF2A85] opacity-90" />
            {/* Điểm nhấn vàng chanh Lime LEVRN */}
            <div className="absolute top-1/2 -right-8 w-24 h-24 rounded-full bg-[#C6FF33]/25 blur-xl" />
          </div>

          {/* Logo khối thương hiệu ở góc trên bên trái */}
          <div className="relative z-10 flex items-start gap-2.5">
            <div className="bg-[#FF2A85] text-white text-[10px] font-black uppercase tracking-widest px-1.5 py-2.5 rounded-xs writing-vertical shadow-xs flex items-center justify-center">
              LEVRN
            </div>
            <div className="text-3xl sm:text-4xl font-black tracking-tighter leading-[0.88] uppercase">
              <div>STUDY</div>
              <div>CUM</div>
              <div>BER</div>
            </div>
          </div>

          {/* Thông điệp bên dưới */}
          <div className="relative z-10 mt-20 lg:mt-0 pt-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-black/30 backdrop-blur-md border border-white/15 text-[11px] font-bold text-white/95">
              <ShieldCheck className="h-3.5 w-3.5 text-[#C6FF33]" />
              <span>Bảo mật dữ liệu cá nhân 100%</span>
            </div>
          </div>
        </div>

        {/* ================= CỘT PHẢI: FORM ĐĂNG KÝ / ĐĂNG NHẬP ================= */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between bg-card">
          <div>
            {/* Header tinh gọn theo Rule 1.1: Tiêu đề đứng độc lập, không chữ thừa */}
            <h1 className="text-3xl sm:text-4xl font-black text-[#FF2A85] tracking-tight mb-6">
              {mode === "signup" ? "Sign up" : "Sign in"}
            </h1>

            {/* Thông báo lỗi nếu có */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/25 text-destructive text-xs font-semibold flex items-center gap-2 animate-in fade-in-50">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Thông báo thành công */}
            {successNotice && (
              <div className="mb-4 p-3.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-start gap-2 animate-in fade-in-50">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{successNotice}</span>
              </div>
            )}

            {/* FORM CHÍNH */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <>
                  {/* Hàng 1: First name & Last name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>First name</span>
                      </Label>
                      <Input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Kanye"
                        required
                        className="rounded-md h-10 border-border/70 focus-visible:ring-[#4C44F6]"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Last name</span>
                      </Label>
                      <Input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="West"
                        className="rounded-md h-10 border-border/70 focus-visible:ring-[#4C44F6]"
                      />
                    </div>
                  </div>

                  {/* Hàng 2: Phone & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Phone</span>
                      </Label>
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0912 345 678"
                        className="rounded-md h-10 border-border/70 focus-visible:ring-[#4C44F6]"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>E-mail</span>
                      </Label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="knwst@gmail.com"
                        required
                        className="rounded-md h-10 border-border/70 focus-visible:ring-[#4C44F6]"
                      />
                    </div>
                  </div>

                  {/* Hàng 3: Password & Confirm Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Password</span>
                      </Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="rounded-md h-10 pr-9 border-border/70 focus-visible:ring-[#4C44F6]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>

                      {/* Password strength indicator bar */}
                      {password && (
                        <div className="pt-1.5 space-y-1">
                          <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                passwordStrength.score === 3
                                  ? "w-full bg-[#C6FF33]"
                                  : passwordStrength.score === 2
                                  ? "w-2/3 bg-emerald-500"
                                  : "w-1/3 bg-destructive"
                              }`}
                            />
                          </div>
                          <p className={`text-[10px] font-bold ${passwordStrength.color}`}>
                            {passwordStrength.label}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Confirm Password</span>
                      </Label>
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="rounded-md h-10 border-border/70 focus-visible:ring-[#4C44F6]"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* CHẾ ĐỘ ĐĂNG NHẬP (SIGN IN) */}
              {mode === "signin" && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>E-mail</span>
                    </Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="knwst@gmail.com"
                      required
                      className="rounded-md h-10 border-border/70 focus-visible:ring-[#4C44F6]"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Password</span>
                      </Label>
                    </div>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="rounded-md h-10 pr-9 border-border/70 focus-visible:ring-[#4C44F6]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* HÀNG NÚT BẤM HÀNH ĐỘNG VÀ ĐIỀU HƯỚNG */}
              <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 px-8 rounded-md bg-[#4C44F6] hover:bg-[#3D35E5] text-white font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  {isSubmitting ? (
                    "Đang xử lý..."
                  ) : mode === "signup" ? (
                    "Create account"
                  ) : (
                    "Sign in"
                  )}
                </Button>

                <div className="text-xs text-muted-foreground">
                  {mode === "signup" ? (
                    <span>
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setMode("signin");
                          setErrorMessage(null);
                        }}
                        className="text-[#FF2A85] font-bold hover:underline"
                      >
                        Sign in
                      </button>
                    </span>
                  ) : (
                    <span>
                      Don't have an account?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setMode("signup");
                          setErrorMessage(null);
                        }}
                        className="text-[#FF2A85] font-bold hover:underline"
                      >
                        Sign up
                      </button>
                    </span>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* ĐĂNG NHẬP GOOGLE OAUTH */}
          <div className="pt-6 border-t border-border/40 mt-6">
            <Button
              type="button"
              variant="outline"
              disabled={isGoogleLoading || isSubmitting}
              onClick={handleGoogleSignIn}
              className="w-full h-10 rounded-md border-border/80 hover:bg-muted font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              {isGoogleLoading ? (
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{isGoogleLoading ? "Đang chuyển hướng sang Google..." : "Tiếp tục với Google"}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
