import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import { useSocket } from '../hooks/useSocket';

const ICONS = {
    swap_request_received: '📥',
    swap_request_accepted: '✅',
    swap_request_rejected: '❌',
    swap_request_cancelled: '🚫',
    session_reminder: '⏰',
    skill_suggestion_handled: '🏷️',
    account_warning: '⚠️'
};

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const socketRef = useSocket();

    useEffect(() => {
        loadNotifications();
    }, []);

    useEffect(() => {
      const socket = socketRef.current;
      if (!socket) return;

      const handleNew = (notification) => {
        setNotifications((prev) => [notification, ...prev]);
      };
      socket.on('notification:new', handleNew);

      return () => socket.off('notification:new', handleNew);
    }, []);

    async function loadNotifications() {
        try {
            const res = await axios.get('http://localhost:5000/api/notifications', { withCredentials: true });
            setNotifications(res.data.notifications);
        } catch (err) {
            console.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    }

    const handleClick = async (n) => {
        if (!n.isRead) {
            try {
                await axios.post(`http://localhost:5000/api/notifications/${n.id}/read`, {}, { withCredentials: true });
                setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, isRead: true } : x));
            } catch (err) {
                console.error('Failed to mark read');
            }
        }
        if (n.relatedSwapId) {
            navigate(`/swap-requests`);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await axios.post('http://localhost:5000/api/notifications/read-all', {}, { withCredentials: true });
            setNotifications((prev) => prev.map((x) => ({ ...x, isRead: true })));
        } catch (err) {
            console.error('Failed to mark all read');
        }
    };

    return (
        <Layout>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
                <button onClick={handleMarkAllRead} className="text-sm text-blue-600 hover:underline">
                    Mark all as read
                </button>
            </div>

            {loading ? (
                <p className="text-gray-500">Loading...</p>
            ) : notifications.length === 0 ? (
                <p className="text-gray-500 text-sm">No notifications yet.</p>
            ) : (
                <div className="space-y-2">
                    {notifications.map((n) => (
                        <button
                            key={n.id}
                            onClick={() => handleClick(n)}
                            className={`w-full text-left flex items-start gap-3 p-4 rounded-lg border ${n.isRead ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'
                                }`}
                        >
                            <span className="text-lg">{ICONS[n.type] || '🔔'}</span>
                            <div className="flex-1">
                                <p className={`text-sm ${n.isRead ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>{n.message}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                            </div>
                            {!n.isRead && <span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></span>}
                        </button>
                    ))}
                </div>
            )}
        </Layout>
    );
}

export default Notifications;