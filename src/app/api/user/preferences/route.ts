import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { CURRENT_APP_VERSION } from "@/lib/appVersion";
import { authOptions } from "@/lib/authOptions";

export const runtime = "nodejs";

function coerceUserId(raw: unknown): number | null {
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * GET /api/user/preferences
 * Returns onboarding + version state for the signed-in user
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = coerceUserId((session?.user as any)?.id);

  if (!session || !userId) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      onboardingDismissedAt: true,
      lastSeenVersion: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "User not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    preferences: {
      onboardingDismissedAt: user.onboardingDismissedAt,
      lastSeenVersion: user.lastSeenVersion,
      currentVersion: CURRENT_APP_VERSION,
    },
  });
}

/**
 * POST /api/user/preferences
 * Supported actions:
 * - dismissOnboarding: permanently dismiss onboarding
 * - acknowledgeVersion: mark current version as seen
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = coerceUserId((session?.user as any)?.id);

  if (!session || !userId) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));

  const dismissOnboarding = Boolean(body?.dismissOnboarding);
  const acknowledgeVersion = Boolean(body?.acknowledgeVersion);

  const version: string =
    typeof body?.version === "string" && body.version.trim().length > 0
      ? body.version.trim()
      : CURRENT_APP_VERSION;

  const data: Record<string, any> = {};

  // Permanent dismissal of onboarding
  if (dismissOnboarding) {
    data.onboardingDismissedAt = new Date();
    data.lastSeenVersion = version;
  }

  // Used when acknowledging version without onboarding
  if (acknowledgeVersion && !dismissOnboarding) {
    data.lastSeenVersion = version;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { ok: false, error: "No changes requested" },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      onboardingDismissedAt: true,
      lastSeenVersion: true,
    },
  });

  return NextResponse.json({
    ok: true,
    preferences: updated,
  });
}
