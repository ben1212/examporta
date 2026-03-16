import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import examsRouter from "./exams.js";
import departmentsRouter from "./departments.js";
import messagesRouter from "./messages.js";
import usersRouter from "./users.js";
import eventsRouter from "./events.js";

const router: IRouter = Router();

router.use("/", healthRouter);
router.use("/auth", authRouter);
router.use("/exams", examsRouter);
router.use("/departments", departmentsRouter);
router.use("/messages", messagesRouter);
router.use("/users", usersRouter);
router.use("/events", eventsRouter);

export default router;
