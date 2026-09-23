import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

// Cấu hình font Be Vietnam Pro: Chuẩn học thuật, tối giản, hỗ trợ 100% tiếng Việt không lỗi dấu, cả chữ và số dùng chung font
const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LEVRN - Quản lý tiến độ học tập thông minh",
  description: "Web app cá nhân quản lý môn học, phiên học, mục tiêu và tiến độ học tập hiệu quả dành cho sinh viên.",
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/brand/levrn-icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/brand/levrn-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${beVietnamPro.className} ${beVietnamPro.variable} min-h-screen bg-background text-foreground antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
