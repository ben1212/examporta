import type { Request, Response, NextFunction } from "express";
import { getSessionUser } from "../lib/auth.js";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const username = await getSessionUser(req);
  if (!username) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const users = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  if (!users[0]) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  (req as any).user = users[0];
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  await requireAuth(req, res, async () => {
    const user = (req as any).user;
    if (!user?.isAdmin) {
      res.status(403).json({ error: "Admin only" });
      return;
    }
    next();
  });
}
