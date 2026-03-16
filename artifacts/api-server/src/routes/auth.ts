import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { createSession, deleteSession, getSessionUser, hashPassword, verifyPassword } from "../lib/auth.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const router: IRouter = Router();

const ADMIN_USERNAME = "Admin";
const DEFAULT_ADMIN_PASSWORD = "cotm2018";

async function ensureAdminExists() {
  const admins = await db.select().from(usersTable).where(eq(usersTable.username, ADMIN_USERNAME)).limit(1);
  if (!admins[0]) {
    await db.insert(usersTable).values({
      username: ADMIN_USERNAME,
      password: hashPassword(DEFAULT_ADMIN_PASSWORD),
      isAdmin: true,
      mustChangePassword: true,
      joinDate: new Date().toLocaleDateString(),
    });
  }
}

ensureAdminExists().catch(console.error);

router.post("/login", async (req, res) => {
  const { username, password } = req.body as { username: string; password: string };
  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }

  const users = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  const user = users[0];

  if (!user || !verifyPassword(password, user.password)) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  await createSession(username, res);

  res.json({
    user: {
      username: user.username,
      isAdmin: user.isAdmin,
      joinDate: user.joinDate,
      mustChangePassword: user.mustChangePassword,
    },
    mustChangePassword: user.mustChangePassword,
  });
});

router.post("/register", async (req, res) => {
  const { username, password, confirmPassword } = req.body as {
    username: string;
    password: string;
    confirmPassword: string;
  };

  if (!username || !password || !confirmPassword) {
    res.status(400).json({ error: "All fields required" });
    return;
  }

  if (username.length < 3) {
    res.status(400).json({ error: "Username must be at least 3 characters" });
    return;
  }

  if (password.length < 4) {
    res.status(400).json({ error: "Password must be at least 4 characters" });
    return;
  }

  if (password !== confirmPassword) {
    res.status(400).json({ error: "Passwords do not match" });
    return;
  }

  if (username.toLowerCase() === "admin") {
    res.status(400).json({ error: "Username not allowed" });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  if (existing[0]) {
    res.status(400).json({ error: "Username already taken" });
    return;
  }

  const newUser = await db
    .insert(usersTable)
    .values({
      username,
      password: hashPassword(password),
      isAdmin: false,
      mustChangePassword: false,
      joinDate: new Date().toLocaleDateString(),
    })
    .returning();

  await createSession(username, res);

  res.status(201).json({
    user: {
      username: newUser[0].username,
      isAdmin: newUser[0].isAdmin,
      joinDate: newUser[0].joinDate,
      mustChangePassword: newUser[0].mustChangePassword,
    },
    mustChangePassword: false,
  });
});

router.get("/me", requireAuth as any, async (req, res) => {
  const user = (req as any).user;
  res.json({
    username: user.username,
    isAdmin: user.isAdmin,
    joinDate: user.joinDate,
    mustChangePassword: user.mustChangePassword,
  });
});

router.post("/logout", async (req, res) => {
  await deleteSession(req, res);
  res.json({ success: true, message: "Logged out" });
});

router.post("/change-password", requireAuth as any, async (req, res) => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword: string;
    newPassword: string;
  };
  const user = (req as any).user;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "All fields required" });
    return;
  }

  if (!verifyPassword(currentPassword, user.password)) {
    res.status(400).json({ error: "Current password is incorrect" });
    return;
  }

  if (newPassword.length < 4) {
    res.status(400).json({ error: "New password must be at least 4 characters" });
    return;
  }

  await db
    .update(usersTable)
    .set({ password: hashPassword(newPassword), mustChangePassword: false })
    .where(eq(usersTable.username, user.username));

  res.json({ success: true, message: "Password changed successfully" });
});

export default router;
