import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { messagesTable } from "@workspace/db/schema";
import { and, eq, or } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth.js";
import { sendEventToUser } from "../lib/sse.js";

const router: IRouter = Router();

const ADMIN_USERNAME = "Admin";

router.get("/", requireAuth as any, async (req, res) => {
  const user = (req as any).user;
  const otherUser = req.query.otherUser as string | undefined;

  let messages;
  if (user.isAdmin && otherUser) {
    messages = await db
      .select()
      .from(messagesTable)
      .where(
        or(
          and(eq(messagesTable.sender, ADMIN_USERNAME), eq(messagesTable.receiver, otherUser)),
          and(eq(messagesTable.sender, otherUser), eq(messagesTable.receiver, ADMIN_USERNAME))
        )
      )
      .orderBy(messagesTable.createdAt);
  } else {
    messages = await db
      .select()
      .from(messagesTable)
      .where(
        or(
          and(eq(messagesTable.sender, user.username), eq(messagesTable.receiver, ADMIN_USERNAME)),
          and(eq(messagesTable.sender, ADMIN_USERNAME), eq(messagesTable.receiver, user.username))
        )
      )
      .orderBy(messagesTable.createdAt);
  }

  res.json(messages.map(m => ({
    ...m,
    createdAt: undefined,
  })));
});

router.get("/unread-count", requireAuth as any, async (req, res) => {
  const user = (req as any).user;
  const messages = await db
    .select()
    .from(messagesTable)
    .where(and(eq(messagesTable.receiver, user.username), eq(messagesTable.read, false)));
  res.json({ count: messages.length });
});

router.post("/mark-read", requireAuth as any, async (req, res) => {
  const user = (req as any).user;
  const { sender } = req.body as { sender: string };

  await db
    .update(messagesTable)
    .set({ read: true })
    .where(and(eq(messagesTable.receiver, user.username), eq(messagesTable.sender, sender)));

  res.json({ success: true, message: "Marked as read" });
});

router.post("/", requireAuth as any, async (req, res) => {
  const user = (req as any).user;
  const { receiver, text } = req.body as { receiver: string; text: string };

  if (!receiver || !text) {
    res.status(400).json({ error: "Receiver and text required" });
    return;
  }

  const message = await db
    .insert(messagesTable)
    .values({
      sender: user.username,
      receiver,
      text,
      time: new Date().toLocaleTimeString(),
      read: false,
    })
    .returning();

  const msg = message[0];
  const result = {
    id: msg.id,
    sender: msg.sender,
    receiver: msg.receiver,
    text: msg.text,
    time: msg.time,
    read: msg.read,
  };

  sendEventToUser(receiver, "new_message", result);

  res.status(201).json(result);
});

export default router;
