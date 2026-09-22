import { redirect } from "next/navigation";

/**
 * Trang gốc '/' tự động chuyển hướng người dùng đến trang tổng quan '/dashboard'
 */
export default function HomePage() {
  redirect("/dashboard");
}
