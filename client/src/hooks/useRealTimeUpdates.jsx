import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import SlidableNotificationToast from '../components/SlidableNotificationToast';
import { useAuth } from '../context/AuthContext';

export default function useRealTimeUpdates() {
    const { token, user } = useAuth();
    const eventSourceRef = useRef(null);

    useEffect(() => {
        const authToken = token || localStorage.getItem('token');
        if (!authToken || !user) {
            return;
        }

        const rawUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:5000/api');
        const baseUrl = rawUrl.replace(/\/+$/, '').replace(/\/api\/api$/, '/api') + (rawUrl.endsWith('/api') ? '' : '/api');
        const sseUrl = `${baseUrl}/stream?token=${encodeURIComponent(authToken)}`;

        try {
            const eventSource = new EventSource(sseUrl);
            eventSourceRef.current = eventSource;

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data.type === 'connected') {
                        return;
                    }
                    if (data.type === 'ping') {
                        return;
                    }

                    // Render custom interactive, slidable, and cancellable notification card
                    toast.custom((t) => (
                        <SlidableNotificationToast
                            t={t}
                            onDismiss={() => toast.dismiss(t.id)}
                            type={data.type}
                            severity={data.severity}
                            title={data.title}
                            message={data.message}
                            actionUrl={data.actionUrl}
                            actionLabel={data.actionLabel}
                            duration={data.duration || 6500}
                        />
                    ), {
                        duration: data.duration || 6500,
                        position: 'top-right',
                        id: data.id || `notif-${Date.now()}`
                    });
                } catch (err) {
                    console.error('[SSE] Failed to parse message payload:', err);
                }
            };

            eventSource.onerror = () => {
                eventSource.close();
            };

            return () => {
                if (eventSource) {
                    eventSource.close();
                }
            };
        } catch (err) {
            console.error('[SSE] Failed to initialize EventSource:', err);
        }
    }, [token, user]);
}
