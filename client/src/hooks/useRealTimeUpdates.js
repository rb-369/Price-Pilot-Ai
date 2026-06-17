import { useEffect } from 'react';
import toast from 'react-hot-toast';

export default function useRealTimeUpdates() {
    useEffect(() => {
        const eventSource = new EventSource(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/stream`);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                if (data.type === 'connected') {
                    console.log('SSE Connected');
                    return;
                }
                if (data.type === 'ping') {
                    return;
                }

                // Show a toast based on event type
                if (data.type === 'alert') {
                    toast(data.message, {
                        icon: '⚠️',
                        style: {
                            background: 'rgba(239, 68, 68, 0.9)',
                            color: '#fff',
                            backdropFilter: 'blur(10px)',
                        },
                        duration: 5000,
                    });
                } else if (data.type === 'recommendation') {
                    toast(data.message, {
                        icon: '💡',
                        style: {
                            background: 'rgba(99, 102, 241, 0.9)',
                            color: '#fff',
                            backdropFilter: 'blur(10px)',
                        },
                        duration: 5000,
                    });
                } else if (data.type === 'demand') {
                    toast(data.message, {
                        icon: '🔥',
                        style: {
                            background: 'rgba(245, 158, 11, 0.9)',
                            color: '#fff',
                            backdropFilter: 'blur(10px)',
                        },
                        duration: 5000,
                    });
                } else {
                    toast.success(data.message || 'System update received');
                }
            } catch (err) {
                console.error('Failed to parse SSE message', err);
            }
        };

        eventSource.onerror = (err) => {
            console.error('SSE Error', err);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, []);
}
