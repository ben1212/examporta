import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, sessionsTable } from "@workspace/db/schema";
import { eq, ne } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAuth.js";

const router: IRouter = Router();

router.get("/", requireAdmin as any, async (_req, res) => {
  const users = await db
    .select()
    .from(usersTable)
    .orderBy(usersTable.createdAt);

  res.json(users.map(u => ({
    username: u.username,
    isAdmin: u.isAdmin,
    joinDate: u.joinDate,
    mustChangePassword: u.mustChangePassword,
  })));
});

router.delete("/:username", requireAdmin as any, async (req, res) => {
  const { username } = req.params;

  if (username === "Admin") {
    res.status(400).json({ error: "Cannot delete admin" });
    return;
  }

  await db.delete(sessionsTable).where(eq(sessionsTable.username, username));
  await db.delete(usersTable).where(eq(usersTable.username, username));

  res.json({ success: true, message: "User deleted" });
});

export default router;
