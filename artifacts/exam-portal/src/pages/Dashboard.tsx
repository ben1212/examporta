import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, Moon, Sun, LogOut, MessageCircle,
  LayoutDashboard, Settings, X, ChevronRight
} from "lucide-react";
import { api, type User, type Department, type Exam } from "@/lib/api";
import { ExamCard } from "@/components/ExamCard";
import { ExamViewer } from "@/components/ExamViewer";
import { AdminPanel } from "@/components/AdminPanel";
import { ChatModal } from "@/components/ChatModal";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";
import { useSSE } from "@/hooks/useSSE";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();

  const [theme, setTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem("theme") as "light" | "dark") || "light"
  );
  const [activeDept, setActiveDept] = useState("All");
  const [chatOpen, setChatOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [viewingExam, setViewingExam] = useState<Exam | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useSSE();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["me"],
    queryFn: () => api.get<User>("/api/auth/me"),
    retry: false,
  });

  const { data: depts = [] } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: () => api.get<Department[]>("/api/departments"),
    enabled: !!user,
  });

  const { data: exams = [] } = useQuery<Exam[]>({
    queryKey: ["exams"],
    queryFn: () => api.get<Exam[]>("/api/exams"),
    enabled: !!user,
  });

  const { data: unread = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["unread"],
    queryFn: () => api.get<{ count: number }>("/api/messages/unread-count"),
    enabled: !!user,
    refetchInterval: 10000,
  });

  const logout = useMutation({
    mutationFn: () => api.post("/api/auth/logout"),
    onSuccess: () => {
      qc.clear();
      setLocation("/login");
    },
  });

  const deleteExam = useMutation({
    mutationFn: (id: number) => api.del(`/api/exams/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exams"] }),
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!isLoading && !user) setLocation("/login");
  }, [isLoading, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const filtered = activeDept === "All" ? exams : exams.filter((e) => e.department === activeDept);

  const handleEdit = (exam: Exam) => {
    setEditingExam(exam);
    setAdminOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {user.mustChangePassword && <ChangePasswordModal />}
      {viewingExam && (
        <ExamViewer
          title={viewingExam.title}
          content={viewingExam.content || "<h1>Content unavailable</h1>"}
          onClose={() => setViewingExam(null)}
        />
      )}

      {/* Top Header */}
      <header className="bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 text-white px-6 py-4 shadow-lg z-30 relative flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((p) => !p)}
              className="lg:hidden p-2 rounded-xl hover:bg-white/20 transition-colors"
            >
              <LayoutDashboard className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-lg leading-none">ExamPortal</h1>
                <p className="text-white/60 text-xs leading-none mt-0.5">Academic Examination System</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setChatOpen((p) => !p)}
              className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors text-sm font-medium"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Messages</span>
              {unread.count > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center">
                  {unread.count > 9 ? "9+" : unread.count}
                </span>
              )}
            </button>

            {user.isAdmin && (
              <button
                onClick={() => setAdminOpen((p) => !p)}
                className={`p-2 rounded-xl transition-colors ${adminOpen ? "bg-white/30" : "bg-white/15 hover:bg-white/25"}`}
                title="Admin Panel"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors"
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-2 pl-1 border-l border-white/20 ml-1">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                {user.username[0].toUpperCase()}
              </div>
              <span className="hidden sm:block text-sm font-medium">{user.username}</span>
              <button
                onClick={() => logout.mutate()}
                className="p-2 rounded-xl hover:bg-white/20 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 z-20 lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside className={`fixed top-0 left-0 h-full w-64 bg-card border-r border-border pt-[73px] z-20 transition-transform duration-300 lg:static lg:h-auto lg:pt-0 lg:translate-x-0 lg:block flex-shrink-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="p-4 sticky top-4">
            <div className="flex items-center justify-between mb-3 lg:hidden">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-2">Navigation</span>
              <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-2 hidden lg:block">Departments</p>
            <nav className="space-y-1">
              {["All", ...depts.map((d) => d.name)].map((dept) => (
                <button
                  key={dept}
                  onClick={() => { setActiveDept(dept); setSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeDept === dept ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                >
                  <span>{dept === "All" ? "All Departments" : dept}</span>
                  {activeDept === dept && <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              ))}
              {depts.length === 0 && (
                <p className="text-xs text-muted-foreground px-3 py-2">
                  {user.isAdmin ? "Add departments from Admin Panel" : "No departments yet"}
                </p>
              )}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 min-w-0">
          {/* Admin panel */}
          <AnimatePresence>
            {adminOpen && user.isAdmin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <AdminPanel
                  editingExam={editingExam}
                  onClearEdit={() => setEditingExam(null)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Exam grid header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {activeDept === "All" ? "All Exams" : `${activeDept} Exams`}
              </h2>
              <p className="text-sm text-muted-foreground">{filtered.length} exam{filtered.length !== 1 ? "s" : ""} available</p>
            </div>
          </div>

          {/* Exam grid */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-2xl bg-muted/20">
              <LayoutDashboard className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <h3 className="font-semibold text-foreground mb-1">No exams yet</h3>
              <p className="text-sm text-muted-foreground">
                {user.isAdmin ? "Use the Admin Panel to post your first exam." : "Check back later for upcoming exams."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((exam) => (
                <ExamCard
                  key={exam.id}
                  exam={exam}
                  isAdmin={user.isAdmin}
                  onEdit={handleEdit}
                  onDelete={(id) => deleteExam.mutate(id)}
                  onStart={(e) => setViewingExam(e)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <ChatModal isOpen={chatOpen} onClose={() => setChatOpen(false)} currentUser={user} />
    </div>
  );
}
