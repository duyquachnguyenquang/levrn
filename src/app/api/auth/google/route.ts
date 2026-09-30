import { NextRequest, NextResponse } from "next/server";
import { getGoogleOAuthUrl } from "@/lib/googleCalendar";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const returnUrl = searchParams.get("returnUrl") || "/dashboard";

    const origin = request.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUri = `${origin}/api/auth/google/callback`;

    const state = JSON.stringify({ returnUrl, redirectUri });
    const authUrl = getGoogleOAuthUrl(state, redirectUri);

    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error("Lỗi khởi tạo Google OAuth:", error);
    return NextResponse.json(
      { error: error.message || "Không thể khởi tạo xác thực Google" },
      { status: 500 }
    );
  }
}
