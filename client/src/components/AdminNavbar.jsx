import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AdminNavbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

  return (
    <nav
      className="bg-ink text-white px-6 py-3.5 flex items-center justify-between"
      style={{ animation: 'slideDown 0.5s ease-out forwards' }}
    >
      <Link to="/admin/dashboard" className="flex items-center gap-2 group">
        <span className="w-2 h-2 rounded-full bg-teal-brand animate-pulse"></span>
        <span className="font-display text-xl font-semibold group-hover:scale-105 transition-transform">
          SkillSwap <span className="text-teal-brand">Admin</span>
        </span>
      </Link>

      <div className="flex items-center gap-5">
        <Link to="/admin/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors animate-fade-in-up" style={{ animationDelay: '60ms', opacity: 0 }}>Dashboard</Link>
        <Link to="/admin/skills" className="text-sm text-gray-400 hover:text-white transition-colors animate-fade-in-up" style={{ animationDelay: '110ms', opacity: 0 }}>Manage Skills</Link>
        <Link to="/admin/reports" className="text-sm text-gray-400 hover:text-white transition-colors animate-fade-in-up" style={{ animationDelay: '160ms', opacity: 0 }}>Reports</Link>
        <Link to="/admin/feed" className="text-sm text-gray-400 hover:text-white transition-colors animate-fade-in-up" style={{ animationDelay: '210ms', opacity: 0 }}>Manage Feed</Link>
        <Link to="/admin/users" className="text-sm text-gray-400 hover:text-white transition-colors animate-fade-in-up" style={{ animationDelay: '260ms', opacity: 0 }}>Users</Link>

        <span className="w-px h-4 bg-gray-700"></span>

        <span className="text-sm text-gray-500 animate-fade-in-up" style={{ animationDelay: '300ms', opacity: 0 }}>{user?.email}</span>
        <button
          onClick={handleLogout}
          className="text-sm bg-red-900/40 text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-900/60 hover:scale-105 transition-all duration-300 animate-fade-in-up"
          style={{ animationDelay: '340ms', opacity: 0 }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default AdminNavbar;