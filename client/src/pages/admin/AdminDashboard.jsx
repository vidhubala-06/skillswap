import { useState, useEffect } from 'react';
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
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Users" value={stats.totalUsers} />
                <StatCard label="Total Skills" value={stats.totalSkills} />
                <StatCard label="Pending Suggestions" value={stats.pendingSuggestions} highlight={stats.pendingSuggestions > 0} />
                <StatCard label="Pending Reports" value={stats.pendingReports} highlight={stats.pendingReports > 0} />
                <StatCard label="Pending Swaps" value={swapCount('pending')} />
                <StatCard label="Active Swaps" value={swapCount('in_progress') + swapCount('accepted')} />
                <StatCard label="Completed Swaps" value={swapCount('completed')} />
                <StatCard label="Quiz Pass Rate" value={`${passRate}%`} />
            </div>
        </AdminLayout>
    );
}

function StatCard({ label, value, highlight }) {
    return (
        <div className={`border rounded-lg p-4 ${highlight ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'}`}>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
    );
}

export default AdminDashboard;