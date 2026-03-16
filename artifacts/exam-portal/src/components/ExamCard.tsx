import { useState, useEffect } from "react";
import { Clock, CheckCircle2, PlayCircle, Pencil, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import type { Exam } from "@/lib/api";

interface Props {
  exam: Exam;
  isAdmin: boolean;
  onEdit?: (exam: Exam) => void;
  onDelete?: (id: number) => void;
  onStart?: (exam: Exam) => void;
}

function formatTime(s: number) {
  if (s <= 0) return "0s";
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export function ExamCard({ exam, isAdmin, onEdit, onDelete, onStart }: Props) {
  const [timeLeft, setTimeLeft] = useState(exam.countdown);

  useEffect(() => {
    setTimeLeft(exam.countdown);
  }, [exam.countdown, exam.id]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = setInterval(() => {
      setTimeLeft((p) => (p <= 1 ? 0 : p - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [timeLeft > 0 ? "running" : "stopped"]);

  const ready = timeLeft <= 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="p-5 flex-1">
        <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary mb-3">
          {exam.department}
        </span>
        <h3 className="font-bold text-foreground text-base leading-snug line-clamp-2 mb-4">
          {exam.title}
        </h3>
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-mono font-semibold ${ready ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
          {ready ? (
            <><CheckCircle2 className="w-4 h-4" /> Available Now</>
          ) : (
            <><Clock className="w-4 h-4" /> {formatTime(timeLeft)}</>
          )}
        </div>
      </div>

      <div className="border-t border-border p-4 bg-muted/20">
        {isAdmin ? (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit?.(exam)}
              className="flex-1 py-2 rounded-xl border border-border bg-background text-foreground text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-muted transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            <button
              onClick={() => onDelete?.(exam.id)}
              className="flex-1 py-2 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        ) : (
          <button
            onClick={() => ready && onStart?.(exam)}
            disabled={!ready}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {ready ? (
              <><PlayCircle className="w-4 h-4" /> Start Exam</>
            ) : (
              <><Clock className="w-4 h-4" /> Locked</>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}
