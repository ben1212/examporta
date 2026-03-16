import { useState, useEffect, useRef } from "react";
import { Users, Building2, FileText, UploadCloud, Plus, Trash2, X, ChevronDown } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { api, type User, type Department, type Exam } from "@/lib/api";

interface Props {
  editingExam: Exam | null;
  onClearEdit: () => void;
}

type Tab = "users" | "depts" | "exams";

export function AdminPanel({ editingExam, onClearEdit }: Props) {
  const [tab, setTab] = useState<Tab>(editingExam ? "exams" : "users");
  const [deptName, setDeptName] = useState("");
  const [examTitle, setExamTitle] = useState("");
  const [examDept, setExamDept] = useState("");
  const [examCountdown, setExamCountdown] = useState("0");
  const [examFile, setExamFile] = useState<{ name: string; content: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: () => api.get<User[]>("/api/users"),
    enabled: tab === "users",
  });

  const { data: depts = [] } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: () => api.get<Department[]>("/api/departments"),
  });

  useEffect(() => {
    if (editingExam) {
      setExamTitle(editingExam.title);
      setExamDept(editingExam.department);
      setExamCountdown(String(editingExam.countdown));
      setExamFile(null);
      setTab("exams");
    }
  }, [editingExam]);

  const delUser = useMutation({
    mutationFn: (username: string) => api.del(`/api/users/${username}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  const addDept = useMutation({
    mutationFn: (name: string) => api.post<Department>("/api/departments", { name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["departments"] }); setDeptName(""); },
  });

  const delDept = useMutation({
    mutationFn: (id: number) => api.del(`/api/departments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["departments"] }),
  });

  const saveExam = useMutation({
    mutationFn: (payload: object) =>
      editingExam
        ? api.put(`/api/exams/${editingExam.id}`, payload)
        : api.post("/api/exams", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exams"] });
      resetExamForm();
    },
  });

  const resetExamForm = () => {
    setExamTitle("");
    setExamDept("");
    setExamCountdown("0");
    setExamFile(null);
    onClearEdit();
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith(".html")) { alert("Please upload an HTML file"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) setExamFile({ name: f.name, content: ev.target.result as string });
    };
    reader.readAsText(f);
  };

  const handleSaveExam = () => {
    if (!examTitle.trim() || !examDept) { alert("Title and Department are required"); return; }
    if (!editingExam && !examFile) { alert("Please upload an HTML file for the exam"); return; }
    saveExam.mutate({
      title: examTitle.trim(),
      department: examDept,
      countdown: parseInt(examCountdown) || 0,
      ...(examFile && { fileName: examFile.name, content: examFile.content }),
    });
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "users", label: "Users", icon: <Users className="w-4 h-4" /> },
    { key: "depts", label: "Departments", icon: <Building2 className="w-4 h-4" /> },
    { key: "exams", label: "Post Exam", icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow mb-6">
      <div className="flex border-b border-border bg-muted/40 p-1.5 gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          {tab === "users" && (
            <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h3 className="font-bold text-lg mb-4 flex items-center justify-between">
                Registered Users
                <span className="text-sm font-normal bg-primary/10 text-primary px-3 py-1 rounded-full">{users.length} total</span>
              </h3>
              <div className="divide-y border border-border rounded-xl overflow-hidden">
                {users.length === 0 ? (
                  <p className="p-6 text-center text-muted-foreground text-sm">No users registered yet</p>
                ) : users.map((u) => (
                  <div key={u.username} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-violet-500 text-white flex items-center justify-center font-bold text-sm">
                        {u.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground flex items-center gap-2">
                          {u.username}
                          {u.isAdmin && <span className="text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">Admin</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">Joined: {u.joinDate}</p>
                      </div>
                    </div>
                    {!u.isAdmin && (
                      <button
                        onClick={() => delUser.mutate(u.username)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {tab === "depts" && (
            <motion.div key="depts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h3 className="font-bold text-lg mb-4">Manage Departments</h3>
              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  placeholder="Department name…"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && deptName.trim() && addDept.mutate(deptName.trim())}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button
                  onClick={() => deptName.trim() && addDept.mutate(deptName.trim())}
                  disabled={addDept.isPending}
                  className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
              {depts.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-6 border border-dashed border-border rounded-xl">
                  No departments yet. Add one above.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {depts.map((d) => (
                    <div key={d.id} className="flex items-center justify-between bg-background border border-border rounded-xl px-4 py-3 group hover:border-primary/40 transition-colors">
                      <span className="font-medium text-sm truncate">{d.name}</span>
                      <button
                        onClick={() => delDept.mutate(d.id)}
                        className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all ml-2 flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {tab === "exams" && (
            <motion.div key="exams" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h3 className="font-bold text-lg mb-4">{editingExam ? "Edit Exam" : "Post New Exam"}</h3>
              <div className="space-y-4 max-w-xl">
                <input
                  type="text"
                  placeholder="Exam Title *"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />

                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <select
                      value={examDept}
                      onChange={(e) => setExamDept(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                    >
                      <option value="">Select Department *</option>
                      {depts.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                  <input
                    type="number"
                    placeholder="Countdown (sec)"
                    value={examCountdown}
                    onChange={(e) => setExamCountdown(e.target.value)}
                    min="0"
                    className="w-40 px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-border hover:border-primary bg-muted/20 hover:bg-primary/5 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all"
                >
                  <input ref={fileRef} type="file" accept=".html" className="hidden" onChange={handleFile} />
                  <UploadCloud className="w-10 h-10 text-muted-foreground mb-2" />
                  <p className="font-medium text-sm text-foreground">
                    {examFile?.name || editingExam?.fileName || "Click to upload HTML file"}
                  </p>
                  {!examFile && !editingExam && (
                    <p className="text-xs text-muted-foreground mt-1">Only .html files accepted</p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSaveExam}
                    disabled={saveExam.isPending}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60"
                  >
                    {saveExam.isPending ? "Saving…" : editingExam ? "Update Exam" : "Post Exam"}
                  </button>
                  {editingExam && (
                    <button
                      onClick={resetExamForm}
                      className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
