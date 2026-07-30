import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';

function AdminUserDetail() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadDetail();
    }, [id]);

    async function loadDetail() {
        try {
            const res = await axios.get(`http://localhost:5000/api/admin/users/${id}`, { withCredentials: true });
            setData(res.data);
        } catch (err) {
            setError('Failed to load user');
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <AdminLayout><p className="text-gray-500">Loading...</p></AdminLayout>;
    if (error || !data) return <AdminLayout><p className="text-red-600">{error}</p></AdminLayout>;

    const { profile, knownSkills, wantedSkills, quizAttempts, swapHistory, warnings } = data;

    return (
        <AdminLayout>
            <Link to="/admin/users" className="text-sm text-blue-600 hover:underline">← Back to Users</Link>

            <div className="bg-white border border-gray-200 rounded-lg p-6 mt-3">
                <h1 className="text-xl font-bold text-gray-800">{profile.name || '—'}</h1>
                <p className="text-sm text-gray-500">{profile.email}</p>
                <div className="flex gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${profile.emailVerified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {profile.emailVerified ? 'Verified' : 'Unverified'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${profile.accountStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {profile.accountStatus}
                    </span>
                </div>
                {profile.experience && <p className="text-sm text-gray-600 mt-3">{profile.experience}</p>}
                <p className="text-xs text-gray-400 mt-2">Joined {profile.joinedAt?.split('T')[0]}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h2 className="font-semibold text-gray-700 mb-2">Known Skills</h2>
                    {knownSkills.length === 0 ? <p className="text-sm text-gray-400">None</p> : knownSkills.map((s, i) => (
                        <p key={i} className="text-sm text-gray-600">
                            {s.name} — <span className={s.status === 'verified' ? 'text-green-600' : 'text-gray-400'}>{s.status}</span>
                            {s.selfRating && ` · ${s.selfRating}/10`}
                        </p>
                    ))}
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h2 className="font-semibold text-gray-700 mb-2">Wanted Skills</h2>
                    {wantedSkills.length === 0 ? <p className="text-sm text-gray-400">None</p> : wantedSkills.map((s, i) => (
                        <p key={i} className="text-sm text-gray-600">{s.name}</p>
                    ))}
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 mt-4">
                <h2 className="font-semibold text-gray-700 mb-2">Quiz Attempts</h2>
                {quizAttempts.length === 0 ? <p className="text-sm text-gray-400">None</p> : quizAttempts.map((q, i) => (
                    <p key={i} className="text-sm text-gray-600">
                        {q.skillName}: {q.score}/{q.totalMarks} — {q.passed ? '✅ Passed' : '❌ Failed'} ({q.attemptedAt?.split('T')[0]})
                    </p>
                ))}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 mt-4">
                <h2 className="font-semibold text-gray-700 mb-2">Swap History</h2>
                {swapHistory.length === 0 ? <p className="text-sm text-gray-400">None</p> : swapHistory.map((s) => (
                    <p key={s.id} className="text-sm text-gray-600">
                        With {s.partnerName} — <span className="capitalize">{s.status}</span> ({s.createdAt?.split('T')[0]})
                    </p>
                ))}
            </div>

            {warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                    <h2 className="font-semibold text-amber-800 mb-2">Warnings</h2>
                    {warnings.map((w, i) => (
                        <p key={i} className="text-sm text-amber-700">{w.message} ({w.createdAt?.split('T')[0]})</p>
                    ))}
                </div>
            )}
        </AdminLayout>
    );
}

export default AdminUserDetail;