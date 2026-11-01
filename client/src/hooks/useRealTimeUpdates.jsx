import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import SlidableNotificationToast from '../components/SlidableNotificationToast';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function useRealTimeUpdates() {
    const { token, user } = useAuth();
    const { isMuted } = useNotification();
    const eventSourceRef = useRef(null);
    const isMutedRef = useRef(isMuted);

    useEffect(() => {
        isMutedRef.current = isMuted;
    }, [isMuted]);

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

                    // Check if on-screen notifications are muted / Do Not Disturb is enabled
                    const currentMuted = isMutedRef.current || localStorage.getItem('pricepilot_mute_notifications') === 'true';
                    if (currentMuted) {
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
