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
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="font-display text-2xl font-semibold text-ink">Notifications</h1>
                <p className="text-sm text-[#6B6E76] mt-1">Stay on top of requests, swaps, and updates.</p>
              </div>
              <button onClick={handleMarkAllRead} className="text-sm text-teal-text font-medium hover:underline">
                Mark all as read
              </button>
            </div>

            {loading ? (
                <p className="text-gray-500">Loading...</p>
            ) : notifications.length === 0 ? (
                <div className="bg-white border border-[#E7E5DD] rounded-xl p-10 text-center">
                  <p className="text-sm text-[#6B6E76]">No notifications yet.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => handleClick(n)}
                          className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                            n.isRead ? 'bg-white border-[#E7E5DD]' : 'bg-teal-bg/50 border-teal-brand/20'
                          }`}
                        >
                          <span className="text-lg">{ICONS[n.type] || '🔔'}</span>
                          <div className="flex-1">
                            <p className={`text-sm ${n.isRead ? 'text-[#6B6E76]' : 'text-ink font-medium'}`}>{n.message}</p>
                            <p className="text-xs text-[#9A9890] mt-0.5">{timeAgo(n.createdAt)}</p>
                          </div>
                          {!n.isRead && <span className="w-2 h-2 bg-teal-brand rounded-full mt-1.5 flex-shrink-0"></span>}
                        </button>
                    ))}
                </div>
            )}
        </Layout>
    );
}

export default Notifications;