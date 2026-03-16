import { useState, useRef, useEffect } from "react";
import { X, Send, MessageCircle, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Message, type User as UserType } from "@/lib/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType;
}

export function ChatModal({ isOpen, onClose, currentUser }: Props) {
  const [selectedUser, setSelectedUser] = useState(currentUser.isAdmin ? "" : "Admin");
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["users"],
    queryFn: () => api.get<UserType[]>("/api/users"),
    enabled: currentUser.isAdmin && isOpen,
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["messages", selectedUser],
    queryFn: () => api.get<Message[]>(`/api/messages${selectedUser ? `?otherUser=${selectedUser}` : ""}`),
    enabled: isOpen && (!!selectedUser || !currentUser.isAdmin),
    refetchInterval: 4000,
  });

  const markRead = useMutation({
    mutationFn: (sender: string) => api.post("/api/messages/mark-read", { sender }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["unread"] }),
  });

  const sendMsg = useMutation({
    mutationFn: ({ receiver, text }: { receiver: string; text: string }) =>
      api.post<Message>("/api/messages", { receiver, text }),
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["messages", selectedUser] });
    },
  });

  useEffect(() => {
    if (isOpen && selectedUser) {
      markRead.mutate(selectedUser);
    }
  }, [isOpen, selectedUser]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const receiver = currentUser.isAdmin ? selectedUser : "Admin";
    if (!receiver) return;
    sendMsg.mutate({ receiver, text: text.trim() });
  };

  const chatPartner = currentUser.isAdmin ? selectedUser : "Admin";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-6 right-6 w-80 sm:w-96 h-[480px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col z-40 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-primary to-violet-500 p-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 text-white">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold text-sm">
                {chatPartner ? `Chat with ${chatPartner}` : "Messages"}
              </span>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {currentUser.isAdmin && (
            <div className="p-3 border-b border-border bg-muted/40 flex-shrink-0">
              <select
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">Select a user to chat…</option>
                {users.filter((u) => !u.isAdmin).map((u) => (
                  <option key={u.username} value={u.username}>{u.username}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
            {!chatPartner ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <User className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-sm">Select a user to start chatting</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No messages yet. Say hi!
              </div>
            ) : (
              messages.map((msg) => {
                const mine = msg.sender === currentUser.username;
                return (
                  <div key={msg.id} className={`flex flex-col max-w-[80%] ${mine ? "self-end items-end ml-auto" : "items-start"}`}>
                    <div className={`px-3.5 py-2 rounded-2xl text-sm break-words ${mine ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm"}`}>
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-0.5 px-1">{msg.time}</span>
                  </div>
                );
              })
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 border-t border-border bg-card flex gap-2 flex-shrink-0">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={chatPartner ? "Type a message…" : "Select a user first"}
              disabled={!chatPartner}
              className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground placeholder-muted-foreground text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!chatPartner || !text.trim() || sendMsg.isPending}
              className="p-2.5 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
