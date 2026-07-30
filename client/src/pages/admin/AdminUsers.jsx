import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';

function AdminUsers() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUsers();
    }, [page]);

    async function loadUsers() {
        setLoading(true);
        try {
            const res = await axios.get(
                `http://localhost:5000/api/admin/users?search=${encodeURIComponent(search)}&page=${page}`,
                { withCredentials: true }
            );
            setUsers(res.data.users);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            console.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    }

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        loadUsers();
    };

    return (
        <AdminLayout>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">All Users</h1>

            <form onSubmit={handleSearch} className="mb-4 flex gap-2">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700">
                    Search
                </button>
            </form>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {loading ? (
                    <p className="p-4 text-gray-500 text-sm">Loading...</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left text-gray-500">
                            <tr>
                                <th className="px-4 py-2">Name</th>
                                <th className="px-4 py-2">Email</th>
                                <th className="px-4 py-2">Verified</th>
                                <th className="px-4 py-2">Status</th>
                                <th className="px-4 py-2">Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id} onClick={() => navigate(`/admin/users/${u.id}`)} className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer">
                                    <td className="px-4 py-2">{u.name || '—'}</td>
                                    <td className="px-4 py-2">{u.email}</td>
                                    <td className="px-4 py-2">{u.emailVerified ? '✅' : '❌'}</td>
                                    <td className="px-4 py-2">
                                        <span className={`text-xs px-2 py-1 rounded-full ${u.accountStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>{u.accountStatus}</span>
                                    </td>
                                    <td className="px-4 py-2 text-gray-500">{u.createdAt?.split('T')[0]}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex gap-2 mt-4">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`px-3 py-1 rounded text-sm ${page === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            )}
        </AdminLayout>
    );
}

export default AdminUsers;