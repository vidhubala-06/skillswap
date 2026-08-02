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
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <Link to="/dashboard" className="text-xl font-bold text-blue-600">SkillSwap</Link>

      {user && (
        <div className="flex items-center gap-6">
          <Link
            to="/dashboard"
            onClick={(e) => { if (locked) { e.preventDefault(); alert(lockMessage); } }}
            className={`text-sm ${locked ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600'}`}
          >
            Dashboard
          </Link>
          <Link
            to="/feed"
            onClick={(e) => { if (locked) { e.preventDefault(); alert(lockMessage); } }}
            className={`text-sm ${locked ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600'}`}
          >
            Feed
          </Link>
          <Link
            to="/profile"
            onClick={(e) => { if (locked) { e.preventDefault(); alert(lockMessage); } }}
            className={`text-sm ${locked ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600'}`}
          >
            My Profile
          </Link>
          <Link
            to="/swap-requests"
            onClick={(e) => { if (locked) { e.preventDefault(); alert(lockMessage); } }}
            className={`text-sm ${locked ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600'}`}
          >
            Swap Requests
          </Link>
          <Link
            to="/chat"
            onClick={(e) => { if (locked) { e.preventDefault(); alert(lockMessage); } }}
            className={`text-sm relative ${locked ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600'}`}
          >
            Chat
            {unreadChatCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {unreadChatCount}
              </span>
            )}
          </Link>
          <Link
            to="/notifications"
            onClick={(e) => { if (locked) { e.preventDefault(); alert(lockMessage); } }}
            className={`text-sm relative ${locked ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600'}`}
          >
            Notifications
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Link>
          <span className="text-sm text-gray-400">|</span>
          <span className="text-sm text-gray-500">{user.email}</span>
          <button
            onClick={handleLogout}
            className="text-sm bg-red-50 text-red-600 px-3 py-1.5 rounded hover:bg-red-100"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;