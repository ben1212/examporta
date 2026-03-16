import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { departmentsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAuth.js";
import { broadcastEvent } from "../lib/sse.js";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  const depts = await db.select().from(departmentsTable).orderBy(departmentsTable.name);
  res.json(depts);
});

router.post("/", requireAdmin as any, async (req, res) => {
  const { name } = req.body;
  if (!name) { res.status(400).json({ error: "Name required" }); return; }

  try {
    const dept = await db.insert(departmentsTable).values({ name }).returning();
    broadcastEvent("department_created", dept[0]);
    res.status(201).json(dept[0]);
  } catch {
    res.status(400).json({ error: "Department already exists" });
  }
});

router.delete("/:id", requireAdmin as any, async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(departmentsTable).where(eq(departmentsTable.id, id));
  broadcastEvent("department_deleted", { id });
  res.json({ success: true, message: "Department deleted" });
});

export default router;
