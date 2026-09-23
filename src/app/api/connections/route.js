import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accounts = await prisma.connectedAccount.findMany({
    where: { userId: session.user.id },
    select: { id: true, provider: true, providerAccountId: true, displayName: true, pageId: true, expiresAt: true, scopes: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  const google = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "google" },
    select: { providerAccountId: true, scope: true, expires_at: true },
  });
  if (google) {
    accounts.unshift({
      id: "google-youtube",
      provider: "youtube",
      providerAccountId: google.providerAccountId,
      displayName: "Google / YouTube channel",
      pageId: null,
      expiresAt: google.expires_at ? new Date(google.expires_at * 1000) : null,
      scopes: google.scope,
      createdAt: null,
    });
  }
  return NextResponse.json({ accounts });
}
