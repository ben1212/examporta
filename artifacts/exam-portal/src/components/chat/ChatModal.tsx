import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  useGetMessages, 
  useSendMessage, 
  useGetUsers,
  useMarkMessagesRead
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { username: string; isAdmin: boolean };
}

export function ChatModal({ isOpen, onClose, currentUser }: ChatModalProps) {
  const [selectedUser, setSelectedUser] = useState<string>(currentUser.isAdmin ? "" : "Admin");
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: users = [] } = useGetUsers({ query: { queryKey: ['/api/users'], enabled: currentUser.isAdmin && isOpen } });
  
  const { data: messages = [] } = useGetMessages(
    { otherUser: selectedUser || undefined },
    { query: { queryKey: ['/api/messages', selectedUser], enabled: isOpen && !!selectedUser, refetchInterval: 3000 } }
  );

  const { mutate: markRead } = useMarkMessagesRead({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/messages/unread-count'] })
    }
  });

  const { mutate: sendMsg, isPending } = useSendMessage({
    mutation: {
      onSuccess: () => {
        setNewMessage("");
        queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      }
    }
  });

  useEffect(() => {
    if (isOpen && selectedUser) {
      markRead({ data: { sender: selectedUser } });
    }
  }, [isOpen, selectedUser, markRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;
    sendMsg({ data: { receiver: selectedUser, text: newMessage } });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="fixed bottom-6 right-6 w-80 sm:w-96 h-[500px] bg-card border border-border shadow-2xl rounded-2xl flex flex-col z-50 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-primary to-secondary p-4 flex items-center justify-between text-primary-foreground">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <h3 className="font-semibold">Messages</h3>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {currentUser.isAdmin && (
            <div className="p-3 border-b border-border bg-muted/50">
              <select 
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">Select a user...</option>
                {users.filter(u => !u.isAdmin).map(u => (
                  <option key={u.username} value={u.username}>{u.username}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-background">
            {!selectedUser ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-center">
                <User className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-sm">Select a user to start chatting</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                No messages yet. Say hi!
              </div>
            ) : (
              messages.map(msg => {
                const isMine = msg.sender === currentUser.username;
                return (
                  <div key={msg.id} className={`flex flex-col max-w-[80%] ${isMine ? 'self-end items-end' : 'self-start items-start'}`}>
                    <div className={`px-4 py-2 rounded-2xl ${isMine ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm'}`}>
                      <p className="text-sm break-words">{msg.text}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 px-1">
                      {msg.time}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-border bg-card">
            <form onSubmit={handleSend} className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={!selectedUser || isPending}
                className="rounded-full"
              />
              <Button type="submit" size="icon" disabled={!selectedUser || !newMessage.trim() || isPending} className="rounded-full flex-shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
