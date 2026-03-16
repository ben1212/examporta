import { X, Maximize2, Minimize2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ExamViewerProps {
  title: string;
  content: string;
  onClose: () => void;
}

export function ExamViewer({ title, content, onClose }: ExamViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleClose = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      <div className="h-16 border-b border-border bg-card px-6 flex items-center justify-between flex-shrink-0">
        <h2 className="text-xl font-bold text-foreground truncate">{title}</h2>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={toggleFullscreen} className="hidden sm:flex gap-2">
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </Button>
          <Button variant="destructive" size="sm" onClick={handleClose} className="gap-2">
            <X className="w-4 h-4" /> Back to Dashboard
          </Button>
        </div>
      </div>
      <div className="flex-1 bg-muted p-4 sm:p-8 overflow-hidden">
        <div className="w-full h-full bg-white rounded-xl shadow-2xl overflow-hidden border border-border/50">
          <iframe
            srcDoc={content}
            className="w-full h-full border-none bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms"
            title="Exam Content"
          />
        </div>
      </div>
    </div>
  );
}
