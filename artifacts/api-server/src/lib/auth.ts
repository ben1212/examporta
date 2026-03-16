import { db } from "@workspace/db";
import { sessionsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import type { Request, Response } from "express";

export async function createSession(username: string, res: Response): Promise<string> {
  const sessionId = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await db.insert(sessionsTable).values({
    id: sessionId,
    username,
    expiresAt,
  });

  res.cookie("session", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/",
  });

  return sessionId;
}

export async function getSessionUser(req: Request): Promise<string | null> {
  const sessionId = req.cookies?.session;
  if (!sessionId) return null;

  const sessions = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.id, sessionId))
    .limit(1);

  const session = sessions[0];
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId));
    return null;
  }

  return session.username;
}

export async function deleteSession(req: Request, res: Response): Promise<void> {
  const sessionId = req.cookies?.session;
  if (sessionId) {
    await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId));
  }
  res.clearCookie("session", { path: "/" });
}

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "exam_portal_salt_2024").digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}
