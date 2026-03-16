import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, LogIn, UserPlus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { api, type User } from "@/lib/api";

export default function Login() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: () =>
      api.post<{ user: User }>("/api/auth/login", { username, password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setLocation("/");
    },
    onError: (e: Error) => setError(e.message),
  });

  const registerMutation = useMutation({
    mutationFn: () =>
      api.post<{ user: User }>("/api/auth/register", {
        username,
        password,
        confirmPassword: confirm,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setLocation("/");
    },
    onError: (e: Error) => setError(e.message),
  });

  const isPending = loginMutation.isPending || registerMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Please fill all fields");
      return;
    }
    if (tab === "login") {
      loginMutation.mutate();
    } else {
      if (username.length < 3) { setError("Username must be at least 3 characters"); return; }
      if (password.length < 4) { setError("Password must be at least 4 characters"); return; }
      if (password !== confirm) { setError("Passwords do not match"); return; }
      registerMutation.mutate();
    }
  };

  const switchTab = (t: "login" | "register") => {
    setTab(t);
    setError("");
    setUsername("");
    setPassword("");
    setConfirm("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-600 via-purple-600 to-blue-600 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/5"
            style={{
              width: `${120 + i * 60}px`,
              height: `${120 + i * 60}px`,
              left: `${10 + i * 15}%`,
              top: `${5 + i * 12}%`,
            }}
            animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.5 }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <GraduationCap className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">ExamPortal</h1>
            <p className="text-white/60 text-sm mt-1">Academic Examination System</p>
          </div>

          <div className="flex p-1 bg-white/10 rounded-2xl mb-6 relative">
            <motion.div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow"
              animate={{ left: tab === "login" ? "4px" : "calc(50%)" }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl z-10 relative transition-colors ${tab === t ? "text-violet-700" : "text-white/70 hover:text-white"}`}
              >
                {t === "login" ? "Login" : "Register"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, x: tab === "login" ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: tab === "login" ? 20 : -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  className="w-full px-4 py-3 rounded-xl bg-white/15 border border-white/20 text-white placeholder-white/50 outline-none focus:border-white/60 focus:bg-white/20 transition-all text-sm"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={tab === "login" ? "current-password" : "new-password"}
                  className="w-full px-4 py-3 rounded-xl bg-white/15 border border-white/20 text-white placeholder-white/50 outline-none focus:border-white/60 focus:bg-white/20 transition-all text-sm"
                />
                {tab === "register" && (
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    className="w-full px-4 py-3 rounded-xl bg-white/15 border border-white/20 text-white placeholder-white/50 outline-none focus:border-white/60 focus:bg-white/20 transition-all text-sm"
                  />
                )}
              </motion.div>
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/20 border border-red-400/30 text-red-200 text-sm text-center py-2.5 px-4 rounded-xl font-medium"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3.5 rounded-xl bg-white text-violet-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg mt-2"
            >
              {isPending ? (
                <span className="w-5 h-5 border-2 border-violet-700/30 border-t-violet-700 rounded-full animate-spin" />
              ) : tab === "login" ? (
                <><LogIn className="w-4 h-4" /> Sign In</>
              ) : (
                <><UserPlus className="w-4 h-4" /> Create Account</>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
