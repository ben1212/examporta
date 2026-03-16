import { Router, type IRouter } from "express";
import crypto from "crypto";
import { addSSEClient, removeSSEClient } from "../lib/sse.js";
import { getSessionUser } from "../lib/auth.js";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const username = await getSessionUser(req);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const clientId = crypto.randomBytes(16).toString("hex");
  addSSEClient(clientId, username ?? "anonymous", res);

  res.write(`event: connected\ndata: ${JSON.stringify({ clientId })}\n\n`);

  const heartbeat = setInterval(() => {
    try {
      res.write(`:heartbeat\n\n`);
    } catch {
      clearInterval(heartbeat);
    }
  }, 30000);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeSSEClient(clientId);
  });
});

export default router;
