import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { examsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAuth.js";
import { broadcastEvent } from "../lib/sse.js";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  const exams = await db.select().from(examsTable).orderBy(examsTable.createdAt);
  res.json(exams.map(e => ({
    ...e,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  })));
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const exams = await db.select().from(examsTable).where(eq(examsTable.id, id)).limit(1);
  if (!exams[0]) { res.status(404).json({ error: "Not found" }); return; }
  const e = exams[0];
  res.json({ ...e, createdAt: e.createdAt.toISOString(), updatedAt: e.updatedAt.toISOString() });
});

router.post("/", requireAdmin as any, async (req, res) => {
  const { title, department, countdown, fileName, content } = req.body;
  if (!title || !department) { res.status(400).json({ error: "Title and department required" }); return; }

  const exam = await db.insert(examsTable).values({
    title,
    department,
    countdown: countdown ?? 0,
    fileName: fileName ?? null,
    content: content ?? null,
    updatedAt: new Date(),
  }).returning();

  const e = exam[0];
  const result = { ...e, createdAt: e.createdAt.toISOString(), updatedAt: e.updatedAt.toISOString() };
  broadcastEvent("exam_created", result);
  res.status(201).json(result);
});

router.put("/:id", requireAdmin as any, async (req, res) => {
  const id = parseInt(req.params.id);
  const { title, department, countdown, fileName, content } = req.body;

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (title !== undefined) updates.title = title;
  if (department !== undefined) updates.department = department;
  if (countdown !== undefined) updates.countdown = countdown;
  if (fileName !== undefined) updates.fileName = fileName;
  if (content !== undefined) updates.content = content;

  const exam = await db.update(examsTable).set(updates).where(eq(examsTable.id, id)).returning();
  if (!exam[0]) { res.status(404).json({ error: "Not found" }); return; }
  const e = exam[0];
  const result = { ...e, createdAt: e.createdAt.toISOString(), updatedAt: e.updatedAt.toISOString() };
  broadcastEvent("exam_updated", result);
  res.json(result);
});

router.delete("/:id", requireAdmin as any, async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(examsTable).where(eq(examsTable.id, id));
  broadcastEvent("exam_deleted", { id });
  res.json({ success: true, message: "Exam deleted" });
});

export default router;
