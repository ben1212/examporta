import { useState } from "react";
import { Lock, ShieldAlert } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

export function ChangePasswordModal() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      api.post("/api/auth/change-password", {
        currentPassword: current,
        newPassword: next,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!current || !next || !confirm) { setError("All fields required"); return; }
    if (next.length < 4) { setError("New password must be at least 4 characters"); return; }
    if (next !== confirm) { setError("Passwords do not match"); return; }
    mutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border p-8"
      >
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Action Required</h2>
          <p className="text-muted-foreground text-sm mt-2">
            You must change your password before continuing.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {[
            { placeholder: "Current Password", value: current, set: setCurrent },
            { placeholder: "New Password", value: next, set: setNext },
            { placeholder: "Confirm New Password", value: confirm, set: setConfirm },
          ].map(({ placeholder, value, set }) => (
            <input
              key={placeholder}
              type="password"
              placeholder={placeholder}
              value={value}
              onChange={(e) => set(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
            />
          ))}

          {error && (
            <p className="text-destructive text-sm text-center bg-destructive/10 py-2 rounded-lg font-medium">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60 mt-2 flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Lock className="w-4 h-4" /> Change Password</>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
