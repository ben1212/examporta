import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useSSE() {
  const qc = useQueryClient();

  useEffect(() => {
    const es = new EventSource("/api/events", { withCredentials: true });

    es.addEventListener("exam_created", () => qc.invalidateQueries({ queryKey: ["exams"] }));
    es.addEventListener("exam_updated", () => qc.invalidateQueries({ queryKey: ["exams"] }));
    es.addEventListener("exam_deleted", () => qc.invalidateQueries({ queryKey: ["exams"] }));
    es.addEventListener("department_created", () => qc.invalidateQueries({ queryKey: ["departments"] }));
    es.addEventListener("department_deleted", () => qc.invalidateQueries({ queryKey: ["departments"] }));
    es.addEventListener("new_message", (e) => {
      qc.invalidateQueries({ queryKey: ["messages"] });
      qc.invalidateQueries({ queryKey: ["unread"] });
      if (Notification.permission === "granted" && document.visibilityState === "hidden") {
        try {
          const d = JSON.parse(e.data);
          new Notification("New Message", { body: `From ${d.sender}: ${d.text?.slice(0, 80)}` });
        } catch {}
      }
    });

    es.onerror = () => {};

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => es.close();
  }, [qc]);
}
