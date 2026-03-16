import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePushNotifications } from './use-push';

export function useRealtimeEvents() {
  const queryClient = useQueryClient();
  const { sendNotification } = usePushNotifications();

  useEffect(() => {
    const eventSource = new EventSource('/api/events', { withCredentials: true });

    const invalidateExams = () => queryClient.invalidateQueries({ queryKey: ['/api/exams'] });
    const invalidateDepts = () => queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
    const invalidateMessages = () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/unread-count'] });
    };

    eventSource.addEventListener('exam_created', (e) => {
      invalidateExams();
      try {
        const data = JSON.parse(e.data);
        sendNotification('New Exam Posted', `"${data.title}" is now available!`);
      } catch {}
    });

    eventSource.addEventListener('exam_updated', () => invalidateExams());
    eventSource.addEventListener('exam_deleted', () => invalidateExams());

    eventSource.addEventListener('department_created', () => invalidateDepts());
    eventSource.addEventListener('department_deleted', () => invalidateDepts());

    eventSource.addEventListener('new_message', (e) => {
      invalidateMessages();
      try {
        const data = JSON.parse(e.data);
        sendNotification('New Message', `From ${data.sender}: ${data.text.slice(0, 60)}`);
      } catch {
        sendNotification('New Message', 'You received a new message');
      }
    });

    eventSource.onerror = () => {
      console.warn('SSE connection error, will auto-reconnect');
    };

    return () => {
      eventSource.close();
    };
  }, [queryClient, sendNotification]);
}
