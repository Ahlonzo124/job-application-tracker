import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const SignupSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(24, "Username must be 24 characters or less.")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password must be 72 characters or less."),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = SignupSchema.parse(body);

    const username = input.username.trim();

    const existing = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Username is already taken." },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(input.password, 12);

    const created = await prisma.user.create({
      data: {
        username,
        password: hashed,
      },
      select: {
        id: true,
        username: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ok: true, user: created });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Signup failed" },
      { status: 400 }
    );
  }
}
