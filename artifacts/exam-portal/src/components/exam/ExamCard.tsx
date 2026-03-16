import { useState, useEffect } from "react";
import { formatCountdown } from "@/lib/utils";
import { Clock, CheckCircle2, FileEdit, Trash2, PlayCircle } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Exam } from "@workspace/api-client-react";

interface ExamCardProps {
  exam: Exam;
  isAdmin: boolean;
  onEdit?: (exam: Exam) => void;
  onDelete?: (id: number) => void;
  onStart?: (exam: Exam) => void;
}

export function ExamCard({ exam, isAdmin, onEdit, onDelete, onStart }: ExamCardProps) {
  const [timeLeft, setTimeLeft] = useState(exam.countdown);

  useEffect(() => {
    // Reset timer if exam updates
    setTimeLeft(exam.countdown);
  }, [exam.countdown]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft]);

  const isAvailable = timeLeft <= 0;

  return (
    <Card className="flex flex-col h-full overflow-hidden group">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="secondary" className="bg-secondary/15 text-secondary font-bold">
            {exam.department}
          </Badge>
        </div>
        <CardTitle className="line-clamp-2 leading-snug">{exam.title}</CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 pb-4">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-mono font-bold ${isAvailable ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
          {isAvailable ? (
            <><CheckCircle2 className="w-4 h-4" /> Available Now</>
          ) : (
            <><Clock className="w-4 h-4" /> {formatCountdown(timeLeft)}</>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 border-t border-border/50 bg-muted/20 p-4 mt-auto">
        {isAdmin ? (
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1" onClick={() => onEdit?.(exam)}>
              <FileEdit className="w-4 h-4 mr-2" /> Edit
            </Button>
            <Button variant="destructive" className="flex-1" onClick={() => onDelete?.(exam.id)}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          </div>
        ) : (
          <Button 
            className="w-full group-hover:shadow-primary/30" 
            disabled={!isAvailable}
            onClick={() => onStart?.(exam)}
          >
            {isAvailable ? (
              <><PlayCircle className="w-4 h-4 mr-2" /> Start Exam</>
            ) : (
              <><Clock className="w-4 h-4 mr-2" /> Locked</>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
