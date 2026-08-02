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
    <nav className="bg-ink text-white px-6 py-3.5 flex items-center justify-between">
      <Link to="/admin/dashboard" className="font-display text-xl font-semibold text-white">
        SkillSwap <span className="text-teal-brand">Admin</span>
      </Link>

      <div className="flex items-center gap-5">
        <Link to="/admin/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">Dashboard</Link>
        <Link to="/admin/skills" className="text-sm text-gray-400 hover:text-white transition-colors">Manage Skills</Link>
        <Link to="/admin/reports" className="text-sm text-gray-400 hover:text-white transition-colors">Reports</Link>
        <Link to="/admin/feed" className="text-sm text-gray-400 hover:text-white transition-colors">Manage Feed</Link>
        <Link to="/admin/users" className="text-sm text-gray-400 hover:text-white transition-colors">Users</Link>

        <span className="w-px h-4 bg-gray-700"></span>

        <span className="text-sm text-gray-500">{user?.email}</span>
        <button
          onClick={handleLogout}
          className="text-sm bg-red-900/40 text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-900/60 transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default AdminNavbar;