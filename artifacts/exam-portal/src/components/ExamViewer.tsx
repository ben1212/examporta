import { X } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  title: string;
  content: string;
  onClose: () => void;
}

export function ExamViewer({ title, content, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shadow-sm flex-shrink-0">
        <h2 className="font-bold text-lg text-foreground truncate">{title}</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 overflow-auto"
      >
        <iframe
          srcDoc={content}
          title={title}
          className="w-full h-full border-0"
          sandbox="allow-same-origin"
        />
      </motion.div>
    </div>
  );
}
