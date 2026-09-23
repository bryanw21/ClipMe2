import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const savedState = request.cookies.get("clipmee_meta_state")?.value;
  const redirect = new URL("/connections", request.url);
  if (!code || !state || state !== savedState) {
    redirect.searchParams.set("error", "meta_connection_cancelled");
    return NextResponse.redirect(redirect);
  }
  try {
    const { userId } = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
    const redirectUri = new URL("/api/connections/meta/callback", request.url).toString();
    const tokenUrl = new URL("https://graph.facebook.com/v23.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", process.env.META_APP_ID);
    tokenUrl.searchParams.set("client_secret", process.env.META_APP_SECRET);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);
    const tokenResponse = await fetch(tokenUrl);
    if (!tokenResponse.ok) throw new Error("Meta authorization failed.");
    const token = await tokenResponse.json();
    const pagesResponse = await fetch("https://graph.facebook.com/v23.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,name}", { headers: { Authorization: `Bearer ${token.access_token}` } });
    if (!pagesResponse.ok) throw new Error("Unable to read your Facebook Pages.");
    const pages = (await pagesResponse.json()).data || [];
    await Promise.all(pages.flatMap((page) => {
      const updates = [prisma.connectedAccount.upsert({
        where: { provider_providerAccountId: { provider: "facebook", providerAccountId: page.id } },
        update: { userId, displayName: page.name, pageId: page.id, accessToken: encrypt(page.access_token), scopes: "pages_show_list,pages_read_engagement,pages_manage_posts" },
        create: { userId, provider: "facebook", providerAccountId: page.id, displayName: page.name, pageId: page.id, accessToken: encrypt(page.access_token), scopes: "pages_show_list,pages_read_engagement,pages_manage_posts" },
      })];
      if (page.instagram_business_account?.id) updates.push(prisma.connectedAccount.upsert({
        where: { provider_providerAccountId: { provider: "instagram", providerAccountId: page.instagram_business_account.id } },
        update: { userId, displayName: page.instagram_business_account.username || page.instagram_business_account.name || page.name, pageId: page.id, accessToken: encrypt(page.access_token), scopes: "instagram_basic,instagram_content_publish" },
        create: { userId, provider: "instagram", providerAccountId: page.instagram_business_account.id, displayName: page.instagram_business_account.username || page.instagram_business_account.name || page.name, pageId: page.id, accessToken: encrypt(page.access_token), scopes: "instagram_basic,instagram_content_publish" },
      }));
      return updates;
    }));
    redirect.searchParams.set("connected", "meta");
  } catch (error) {
    console.error("[META_CONNECTION]", error);
    redirect.searchParams.set("error", "meta_connection_failed");
  }
  const response = NextResponse.redirect(redirect);
  response.cookies.set("clipmee_meta_state", "", { maxAge: 0, path: "/" });
  return response;
}
