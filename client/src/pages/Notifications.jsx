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

function getDateGroup(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return 'Earlier';
}

const ICON_STYLES = {
  swap_request_received: 'bg-teal-bg',
  swap_request_accepted: 'bg-teal-bg',
  swap_request_rejected: 'bg-[#FCEBEB]',
  swap_request_cancelled: 'bg-[#F1EFE8]',
  session_reminder: 'bg-amber-bg',
  skill_suggestion_handled: 'bg-violet-bg',
  account_warning: 'bg-amber-bg'
};

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
      const res = await axios.get('/api/notifications', { withCredentials: true });
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
        await axios.post(`/api/notifications/${n.id}/read`, {}, { withCredentials: true });
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
      await axios.post('/api/notifications/read-all', {}, { withCredentials: true });
      setNotifications((prev) => prev.map((x) => ({ ...x, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read');
    }
  };

  const groups = { Today: [], Yesterday: [], Earlier: [] };
  notifications.forEach((n) => {
    groups[getDateGroup(n.createdAt)].push(n);
  });

  return (
    <Layout>
      <div className="relative -mx-6 px-6 -mt-10 pt-10 pb-2 dot-grid overflow-hidden">
        <div className="absolute top-10 right-0 w-64 h-64 bg-teal-brand/[0.06] rounded-full blur-3xl animate-[float_6s_ease-in-out_infinite] pointer-events-none"></div>

        <div className="relative flex items-center justify-between mb-6 animate-fade-in-up" style={{ opacity: 0 }}>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Notifications</h1>
            <p className="text-sm text-[#6B6E76] mt-1">Stay on top of requests, swaps, and updates.</p>
          </div>
          <button onClick={handleMarkAllRead} className="text-sm text-teal-text font-medium hover:underline">
            Mark all as read
          </button>
        </div>

        {loading ? (
          <p className="text-[#9A9890] text-sm">Loading...</p>
        ) : notifications.length === 0 ? (
          <div className="bg-white border border-[#E7E5DD] rounded-xl p-10 text-center">
            <p className="text-sm text-[#6B6E76]">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {['Today', 'Yesterday', 'Earlier'].map((groupName) =>
              groups[groupName].length === 0 ? null : (
                <div key={groupName} className="mb-6">
                  <p className="text-xs font-medium text-[#9A9890] uppercase tracking-wide mb-2">{groupName}</p>
                  <div className="space-y-2">
                    {groups[groupName].map((n, i) => (
                      <button
                        key={n.id}
                        onClick={() => handleClick(n)}
                        className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-all duration-300 hover:shadow-md animate-fade-in-up ${n.isRead ? 'bg-white border-[#E7E5DD]' : 'bg-teal-bg/40 border-teal-brand/20'
                          }`}
                        style={{ animationDelay: `${i * 50}ms`, opacity: 0 }}
                      >
                        <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0 ${ICON_STYLES[n.type] || 'bg-[#F1EFE8]'}`}>
                          {ICONS[n.type] || '🔔'}
                        </span>
                        <div className="flex-1">
                          <p className={`text-sm ${n.isRead ? 'text-[#6B6E76]' : 'text-ink font-medium'}`}>{n.message}</p>
                          <p className="text-xs text-[#9A9890] mt-0.5">{timeAgo(n.createdAt)}</p>
                        </div>
                        {!n.isRead && <span className="w-2 h-2 bg-teal-brand rounded-full mt-1.5 flex-shrink-0"></span>}
                      </button>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Notifications;