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
        <nav className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
            <Link to="/admin/dashboard" className="text-xl font-bold text-white">SkillSwap Admin</Link>

            <div className="flex items-center gap-6">
                <Link to="/admin/dashboard" className="text-sm text-gray-300 hover:text-white">Dashboard</Link>
                <Link to="/admin/skills" className="text-sm text-gray-300 hover:text-white">Manage Skills</Link>
                <Link to="/admin/reports" className="text-sm text-gray-300 hover:text-white">Reports</Link>
                <Link to="/admin/users" className="text-sm text-gray-300 hover:text-white">Users</Link>
                <span className="text-sm text-gray-500">|</span>
                <span className="text-sm text-gray-400">{user?.email}</span>
                <button
                    onClick={handleLogout}
                    className="text-sm bg-red-900 text-red-200 px-3 py-1.5 rounded hover:bg-red-800"
                >
                    Logout
                </button>
            </div>
        </nav>
    );
}

export default AdminNavbar;