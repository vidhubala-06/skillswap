import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useNavLock } from '../context/NavLockContext';
import { useSocket } from '../hooks/useSocket';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const { locked, lockMessage } = useNavLock();

  const socketRef = useSocket();

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleNew = () => setUnreadCount((prev) => prev + 1);
    socket.on('notification:new', handleNew);

    return () => socket.off('notification:new', handleNew);
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const handleNewChat = () => setUnreadChatCount((prev) => prev + 1);
    socket.on('chat:new-message', handleNewChat);
    return () => socket.off('chat:new-message', handleNewChat);
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => {
      try {
        const res = await axios.get('/api/notifications/unread-count', { withCredentials: true });
        setUnreadCount(res.data.count);
      } catch (err) { /* silent */ }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchChatCount = async () => {
      try {
        const res = await axios.get('/api/chat/unread-count', { withCredentials: true });
        setUnreadChatCount(res.data.count);
      } catch (err) { /* silent */ }
    };
    fetchChatCount();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav
      className="bg-white border-b border-[#E7E5DD] px-6 py-3.5 flex items-center justify-between"
      style={{ animation: 'slideDown 0.5s ease-out forwards' }}
    >
      <Link to="/dashboard" className="flex items-center gap-2 group">
        <span className="w-2 h-2 rounded-full bg-teal-brand animate-pulse"></span>
        <span className="font-display text-xl font-semibold logo-gradient group-hover:scale-105 transition-transform inline-block">
          SkillSwap
        </span>
      </Link>

      {user && (
        <div className="flex items-center gap-5">
          <Link
            to="/dashboard"
            onClick={(e) => { if (locked) { e.preventDefault(); alert(lockMessage); } }}
            className={`text-sm transition-colors animate-fade-in-up ${locked ? 'text-gray-300 cursor-not-allowed' : 'text-[#6B6E76] hover:text-ink'}`}
            style={{ animationDelay: '60ms', opacity: 0 }}
          >
            Dashboard
          </Link>
          <Link
            to="/profile"
            onClick={(e) => { if (locked) { e.preventDefault(); alert(lockMessage); } }}
            className={`text-sm transition-colors animate-fade-in-up ${locked ? 'text-gray-300 cursor-not-allowed' : 'text-[#6B6E76] hover:text-ink'}`}
            style={{ animationDelay: '100ms', opacity: 0 }}
          >
            My Profile
          </Link>
          <Link
            to="/swap-requests"
            onClick={(e) => { if (locked) { e.preventDefault(); alert(lockMessage); } }}
            className={`text-sm transition-colors animate-fade-in-up ${locked ? 'text-gray-300 cursor-not-allowed' : 'text-[#6B6E76] hover:text-ink'}`}
            style={{ animationDelay: '140ms', opacity: 0 }}
          >
            Swap Requests
          </Link>
          <Link
            to="/chat"
            onClick={(e) => { if (locked) { e.preventDefault(); alert(lockMessage); } }}
            className={`text-sm relative transition-colors animate-fade-in-up ${locked ? 'text-gray-300 cursor-not-allowed' : 'text-[#6B6E76] hover:text-ink'}`}
            style={{ animationDelay: '180ms', opacity: 0 }}
          >
            Chat
            {unreadChatCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-amber-brand text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center animate-bounce">
                {unreadChatCount}
              </span>
            )}
          </Link>
          <Link
            to="/notifications"
            onClick={(e) => { if (locked) { e.preventDefault(); alert(lockMessage); } }}
            className={`text-sm relative transition-colors animate-fade-in-up ${locked ? 'text-gray-300 cursor-not-allowed' : 'text-[#6B6E76] hover:text-ink'}`}
            style={{ animationDelay: '220ms', opacity: 0 }}
          >
            Notifications
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-amber-brand text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </Link>
          <Link
            to="/feed"
            onClick={(e) => { if (locked) { e.preventDefault(); alert(lockMessage); } }}
            className={`text-sm transition-colors animate-fade-in-up ${locked ? 'text-gray-300 cursor-not-allowed' : 'text-[#6B6E76] hover:text-ink'}`}
            style={{ animationDelay: '260ms', opacity: 0 }}
          >
            Feed
          </Link>

          <span className="w-px h-4 bg-[#E7E5DD]"></span>

          <span className="text-sm text-[#9A9890] animate-fade-in-up" style={{ animationDelay: '300ms', opacity: 0 }}>
            {user.email}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm bg-[#FCEBEB] text-[#791F1F] px-3 py-1.5 rounded-lg hover:bg-[#F7C1C1] hover:scale-105 transition-all duration-300 animate-fade-in-up"
            style={{ animationDelay: '340ms', opacity: 0 }}
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;