import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.redirect(new URL("/login", request.url));

  const appId = process.env.META_APP_ID;
  const redirectUri = new URL("/api/connections/meta/callback", request.url).toString();
  if (!appId) return NextResponse.redirect(new URL("/connections?error=meta_not_configured", request.url));

  const state = Buffer.from(JSON.stringify({ userId: session.user.id, nonce: crypto.randomUUID() })).toString("base64url");
  const response = NextResponse.redirect(
    `https://www.facebook.com/v23.0/dialog/oauth?client_id=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&response_type=code&scope=${encodeURIComponent("pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish")}`
  );
  response.cookies.set("clipmee_meta_state", state, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 600, path: "/" });
  return response;
}
