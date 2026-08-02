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
            <Link to="/admin/users" className="text-sm text-teal-text hover:underline">← Back to users</Link>

            <div className="bg-white border border-[#E7E5DD] rounded-xl p-6 mt-3">
                <h1 className="font-display text-xl font-semibold text-ink">{profile.name || '—'}</h1>
                <p className="text-sm text-[#6B6E76]">{profile.email}</p>
                <div className="flex gap-2 mt-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full ${profile.emailVerified ? 'bg-teal-bg text-teal-text' : 'bg-[#F1EFE8] text-[#6B6E76]'}`}>
                        {profile.emailVerified ? 'Verified' : 'Unverified'}
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full ${profile.accountStatus === 'active' ? 'bg-teal-bg text-teal-text' : 'bg-[#FCEBEB] text-[#791F1F]'}`}>
                        {profile.accountStatus}
                    </span>
                </div>
                {profile.experience && <p className="text-sm text-[#5F5E5A] mt-3 leading-relaxed">{profile.experience}</p>}
                <p className="text-xs text-[#9A9890] mt-2">Joined {profile.joinedAt?.split('T')[0]}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="bg-white border border-[#E7E5DD] rounded-xl p-5">
                    <h2 className="font-display text-base font-semibold text-ink mb-3">Known Skills</h2>
                    {knownSkills.length === 0 ? <p className="text-sm text-[#9A9890]">None</p> : (
                      <div className="flex flex-wrap gap-2">
                        {knownSkills.map((s, i) => (
                          <div key={i} className="flex items-center gap-1.5 border border-[#F1EFE8] rounded-lg px-2.5 py-1 text-sm text-[#5F5E5A]">
                            <span className="font-tag text-teal-text bg-teal-bg px-1.5 py-0.5 rounded text-xs font-medium">{s.name}</span>
                            <span className="text-xs text-[#9A9890]">{s.status}</span>
                            {s.selfRating && <span className="text-xs text-[#9A9890]">· {s.selfRating}/10</span>}
                          </div>
                        ))}
                      </div>
                    )}
                </div>

                <div className="bg-white border border-[#E7E5DD] rounded-xl p-5">
                    <h2 className="font-display text-base font-semibold text-ink mb-3">Wanted Skills</h2>
                    {wantedSkills.length === 0 ? <p className="text-sm text-[#9A9890]">None</p> : (
                      <div className="flex flex-wrap gap-2">
                        {wantedSkills.map((s, i) => (
                          <span key={i} className="font-tag text-xs text-violet-text bg-violet-bg border border-[#F1EFE8] px-2.5 py-1.5 rounded-lg font-medium">
                            {s.name}
                          </span>
                        ))}
                      </div>
                    )}
                </div>
            </div>

            <div className="bg-white border border-[#E7E5DD] rounded-xl p-5 mt-4">
                <h2 className="font-display text-base font-semibold text-ink mb-3">Quiz Attempts</h2>
                {quizAttempts.length === 0 ? <p className="text-sm text-[#9A9890]">None</p> : (
                  <div className="space-y-2">
                    {quizAttempts.map((q, i) => (
                      <div key={i} className="flex items-center justify-between border-b border-[#F1EFE8] last:border-0 pb-2 last:pb-0 text-sm text-[#5F5E5A]">
                        <span>{q.skillName}: <strong className="text-ink">{q.score}/{q.totalMarks}</strong></span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${q.passed ? 'bg-teal-bg text-teal-text' : 'bg-[#FCEBEB] text-[#791F1F]'}`}>
                          {q.passed ? 'Passed' : 'Failed'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            <div className="bg-white border border-[#E7E5DD] rounded-xl p-5 mt-4">
                <h2 className="font-display text-base font-semibold text-ink mb-3">Swap History</h2>
                {swapHistory.length === 0 ? <p className="text-sm text-[#9A9890]">None</p> : (
                  <div className="space-y-2">
                    {swapHistory.map((s) => (
                      <div key={s.id} className="flex items-center justify-between border-b border-[#F1EFE8] last:border-0 pb-2 last:pb-0 text-sm text-[#5F5E5A]">
                        <span>With <strong className="text-ink">{s.partnerName}</strong></span>
                        <span className="capitalize text-xs text-[#9A9890]">{s.status.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            {warnings.length > 0 && (
                <div className="bg-amber-bg border border-amber-brand/20 rounded-xl p-5 mt-4">
                    <h2 className="font-display text-base font-semibold text-amber-text mb-3">Warnings</h2>
                    <div className="space-y-2">
                      {warnings.map((w, i) => (
                        <p key={i} className="text-sm text-[#795B1F]">{w.message} ({w.createdAt?.split('T')[0]})</p>
                      ))}
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

export default AdminUserDetail;