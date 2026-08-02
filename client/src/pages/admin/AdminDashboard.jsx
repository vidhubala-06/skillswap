import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';

function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    async function loadStats() {
        try {
            const res = await axios.get('http://localhost:5000/api/admin/dashboard', { withCredentials: true });
            setStats(res.data);
        } catch (err) {
            console.error('Failed to load admin stats');
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <AdminLayout><p className="text-gray-500">Loading...</p></AdminLayout>;

    const swapCount = (status) => stats.swapsByStatus.find((s) => s.status === status)?.count || 0;
    const passRate = stats.quizTotal > 0 ? Math.round((stats.quizPassed / stats.quizTotal) * 100) : 0;

    return (
        <AdminLayout>
            <div className="mb-6">
              <h1 className="font-display text-2xl font-semibold text-ink">Admin dashboard</h1>
              <p className="text-sm text-[#6B6E76] mt-1">Platform overview at a glance.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total users" value={stats.totalUsers} />
              <StatCard label="Total skills" value={stats.totalSkills} />
              <StatCard label="Pending suggestions" value={stats.pendingSuggestions} highlight={stats.pendingSuggestions > 0} />
              <StatCard label="Pending reports" value={stats.pendingReports} highlight={stats.pendingReports > 0} />
              <StatCard label="Pending swaps" value={swapCount('pending')} />
              <StatCard label="Active swaps" value={swapCount('in_progress') + swapCount('accepted')} />
              <StatCard label="Completed swaps" value={swapCount('completed')} />
              <StatCard label="Quiz pass rate" value={`${passRate}%`} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-white border border-[#E7E5DD] rounded-xl p-5">
                <h2 className="font-display text-base font-semibold text-ink mb-3">Recent signups</h2>
                {stats.recentSignups?.length > 0 ? (
                  <div className="space-y-2.5">
                    {stats.recentSignups.map((u) => (
                      <div key={u.id} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="text-ink font-medium">{u.name || '—'}</p>
                          <p className="text-xs text-[#9A9890]">{u.email}</p>
                        </div>
                        <span className="text-xs text-[#9A9890]">{u.createdAt?.split('T')[0]}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#9A9890]">No users yet.</p>
                )}
              </div>

              <div className="bg-white border border-[#E7E5DD] rounded-xl p-5">
                <h2 className="font-display text-base font-semibold text-ink mb-3">Recent completed swaps</h2>
                {stats.recentSwaps?.length > 0 ? (
                  <div className="space-y-2.5">
                    {stats.recentSwaps.map((s) => (
                      <div key={s.id} className="text-sm">
                        <p className="text-ink">
                          <strong>{s.requesterName}</strong> ↔ <strong>{s.recipientName}</strong>
                        </p>
                        <p className="text-xs text-[#9A9890] mt-0.5">
                          <span className="font-tag text-teal-text">{s.offeredSkillName}</span> for <span className="font-tag text-violet-text">{s.wantedSkillName}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#9A9890]">No completed swaps yet.</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <Link to="/admin/reports" className="bg-white border border-[#E7E5DD] text-ink px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#F5F4EF] transition-colors">
                Review reports
              </Link>
              <Link to="/admin/skills" className="bg-white border border-[#E7E5DD] text-ink px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#F5F4EF] transition-colors">
                Manage skills
              </Link>
              <Link to="/admin/users" className="bg-white border border-[#E7E5DD] text-ink px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#F5F4EF] transition-colors">
                Browse users
              </Link>
            </div>
        </AdminLayout>
    );
}

function StatCard({ label, value, highlight }) {
  return (
    <div className={`border rounded-xl p-4 ${highlight ? 'bg-amber-bg border-amber-brand/20' : 'bg-white border-[#E7E5DD]'}`}>
      <p className="text-sm text-[#6B6E76]">{label}</p>
      <p className="font-display text-2xl font-semibold text-ink mt-1">{value}</p>
    </div>
  );
}

export default AdminDashboard;