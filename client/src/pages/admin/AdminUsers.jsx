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
            <h1 className="font-display text-2xl font-semibold text-ink mb-6">All users</h1>

            <form onSubmit={handleSearch} className="mb-4 flex gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="flex-1 border border-[#D8D6CC] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-brand/40"
              />
              <button type="submit" className="bg-teal-brand text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-teal-brand/90 transition-colors">
                Search
              </button>
            </form>

            <div className="bg-white border border-[#E7E5DD] rounded-xl overflow-hidden">
              {loading ? (
                <p className="p-4 text-[#9A9890] text-sm">Loading...</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-[#F5F4EF] text-left text-[#6B6E76]">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Name</th>
                      <th className="px-4 py-2.5 font-medium">Email</th>
                      <th className="px-4 py-2.5 font-medium">Verified</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                      <th className="px-4 py-2.5 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} onClick={() => navigate(`/admin/users/${u.id}`)} className="border-t border-[#F1EFE8] hover:bg-[#F5F4EF] cursor-pointer transition-colors">
                        <td className="px-4 py-2.5 text-ink">{u.name || '—'}</td>
                        <td className="px-4 py-2.5 text-[#6B6E76]">{u.email}</td>
                        <td className="px-4 py-2.5">{u.emailVerified ? '✓' : '—'}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            u.accountStatus === 'active' ? 'bg-teal-bg text-teal-text' : 'bg-[#FCEBEB] text-[#791F1F]'
                          }`}>{u.accountStatus}</span>
                        </td>
                        <td className="px-4 py-2.5 text-[#9A9890]">{u.createdAt?.split('T')[0]}</td>
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
                            className={`px-3 py-1 rounded-lg text-sm transition-colors ${page === p ? 'bg-teal-brand text-white' : 'bg-[#F1EFE8] text-[#6B6E76]'}`}
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