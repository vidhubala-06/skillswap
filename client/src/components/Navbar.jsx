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
        const res = await axios.get('http://localhost:5000/api/notifications/unread-count', { withCredentials: true });
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
        const res = await axios.get('http://localhost:5000/api/chat/unread-count', { withCredentials: true });
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
    <nav className="bg-white border-b border-[#E7E5DD] px-6 py-3.5 flex items-center justify-between">
      <Link to="/dashboard" className="font-display text-xl font-semibold text-ink tracking-tight">
        SkillSwap
      </Link>

      {user && (
        <div className="flex items-center gap-5">
          <Link
            to="/dashboard"
            onClick={(e) => { if (locked) { e.preventDefault(); alert(lockMessage); } }}
            className={`text-sm transition-colors ${locked ? 'text-gray-300 cursor-not-allowed' : 'text-[#6B6E76] hover:text-ink'}`}
          >
            Dashboard
          </Link>
          <Link
            to="/profile"
            onClick={(e) => { if (locked) { e.preventDefault(); alert(lockMessage); } }}
            className={`text-sm transition-colors ${locked ? 'text-gray-300 cursor-not-allowed' : 'text-[#6B6E76] hover:text-ink'}`}
          >
            My Profile
          </Link>
          <Link
            to="/swap-requests"
            onClick={(e) => { if (locked) { e.preventDefault(); alert(lockMessage); } }}
            className={`text-sm transition-colors ${locked ? 'text-gray-300 cursor-not-allowed' : 'text-[#6B6E76] hover:text-ink'}`}
          >
            Swap Requests
          </Link>
          <Link
            to="/chat"
            onClick={(e) => { if (locked) { e.preventDefault(); alert(lockMessage); } }}
            className={`text-sm relative transition-colors ${locked ? 'text-gray-300 cursor-not-allowed' : 'text-[#6B6E76] hover:text-ink'}`}
          >
            Chat
            {unreadChatCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-amber-brand text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {unreadChatCount}
              </span>
            )}
          </Link>
          <Link
            to="/notifications"
            onClick={(e) => { if (locked) { e.preventDefault(); alert(lockMessage); } }}
            className={`text-sm relative transition-colors ${locked ? 'text-gray-300 cursor-not-allowed' : 'text-[#6B6E76] hover:text-ink'}`}
          >
            Notifications
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-amber-brand text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Link>
          <Link
            to="/feed"
            onClick={(e) => { if (locked) { e.preventDefault(); alert(lockMessage); } }}
            className={`text-sm transition-colors ${locked ? 'text-gray-300 cursor-not-allowed' : 'text-[#6B6E76] hover:text-ink'}`}
          >
            Feed
          </Link>

          <span className="w-px h-4 bg-[#E7E5DD]"></span>

          <span className="text-sm text-[#9A9890]">{user.email}</span>
          <button
            onClick={handleLogout}
            className="text-sm bg-[#FCEBEB] text-[#791F1F] px-3 py-1.5 rounded-lg hover:bg-[#F7C1C1] transition-colors"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;