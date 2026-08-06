import { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';

function ActionModal({ type, report, onClose, onSuccess }) {
    const [input, setInput] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const config = {
        warn: { title: 'Send Warning', label: 'Warning message', placeholder: 'Explain what behavior needs to stop...', endpoint: 'warn', body: (v) => ({ userId: report.reportedUserId, message: v }) },
        tempBan: { title: 'Temporary Ban', label: 'Ban duration (days)', placeholder: 'e.g. 7', endpoint: 'temp-ban', body: (v) => ({ userId: report.reportedUserId, days: parseInt(v, 10) }) }
    };
    const c = config[type];

    const handleSubmit = async () => {
        setError('');
        setLoading(true);
        try {
            await axios.post(
                `/api/admin/reports/${report.id}/${c.endpoint}`,
                c.body(input),
                { withCredentials: true }
            );
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.error || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <h2 className="font-display text-lg font-semibold text-ink mb-3">{c.title}</h2>
                <p className="text-sm text-[#6B6E76] mb-3">Regarding: {report.reportedName}</p>
                {type === 'tempBan' ? (
                    <input
                        type="number"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={c.placeholder}
                        className="w-full border border-[#D8D6CC] rounded-lg px-3 py-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-brand/40"
                    />
                ) : (
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={c.placeholder}
                        rows={3}
                        className="w-full border border-[#D8D6CC] rounded-lg px-3 py-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-brand/40"
                    />
                )}
                {error && <p className="text-[#791F1F] text-sm mb-3">{error}</p>}
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 bg-[#F1EFE8] text-ink py-2 rounded-lg hover:bg-[#E7E5DD] transition-colors text-sm">Cancel</button>
                    <button onClick={handleSubmit} disabled={loading || !input} className="flex-1 bg-teal-brand text-white py-2 rounded-lg hover:bg-teal-brand/90 disabled:opacity-40 transition-colors text-sm">
                        {loading ? 'Submitting...' : 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function AdminReports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null); // { type, report }
    const [message, setMessage] = useState('');
    const [tab, setTab] = useState('pending');
    const [handledReports, setHandledReports] = useState([]);

    useEffect(() => {
        loadReports();
    }, []);

    async function loadReports() {
        try {
            const [pending, handled] = await Promise.all([
                axios.get('/api/admin/reports', { withCredentials: true }),
                axios.get('/api/admin/reports/handled', { withCredentials: true })
            ]);
            setReports(pending.data.reports);
            setHandledReports(handled.data.reports);
        } catch (err) {
            console.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    }

    const handleDismiss = async (id) => {
        try {
            await axios.post(`/api/admin/reports/${id}/dismiss`, {}, { withCredentials: true });
            setMessage('Report dismissed.');
            loadReports();
        } catch (err) {
            setMessage('Failed to dismiss');
        }
    };

    const handlePermanentBan = async (report) => {
        if (!window.confirm(`Permanently ban ${report.reportedName}? This cannot be undone.`)) return;
        try {
            await axios.post(
                `/api/admin/reports/${report.id}/permanent-ban`,
                { userId: report.reportedUserId },
                { withCredentials: true }
            );
            setMessage(`${report.reportedName} has been permanently banned.`);
            loadReports();
        } catch (err) {
            setMessage('Failed to ban');
        }
    };

    return (
        <AdminLayout>
            <h1 className="font-display text-2xl font-semibold text-ink mb-6">Reports ({reports.length})</h1>

            <div className="flex gap-1 mb-6 border-b border-[#E7E5DD]">
                <button onClick={() => setTab('pending')} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'pending' ? 'border-teal-brand text-teal-text' : 'border-transparent text-[#9A9890] hover:text-ink'}`}>
                    Pending ({reports.length})
                </button>
                <button onClick={() => setTab('handled')} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'handled' ? 'border-teal-brand text-teal-text' : 'border-transparent text-[#9A9890] hover:text-ink'}`}>
                    Handled ({handledReports.length})
                </button>
            </div>

            {message && <div className="bg-teal-bg text-teal-text p-3 rounded-lg mb-4 text-sm">{message}</div>}

            {loading ? (
                <p className="text-gray-500">Loading...</p>
            ) : (
                <>
                    {tab === 'pending' && (
                        reports.length === 0 ? <p className="text-[#9A9890] text-sm">No pending reports.</p> :
                            <div className="space-y-3">
                                {reports.map((r) => (
                                    <div key={r.id} className="bg-white border border-[#E7E5DD] rounded-xl p-4">
                                        <p className="text-sm text-ink">
                                            <strong>{r.reporterName}</strong> reported <strong>{r.reportedName}</strong>
                                        </p>
                                        <p className="text-sm text-[#6B6E76] mt-1 italic">"{r.reason}"</p>
                                        <div className="flex gap-2 mt-3">
                                            <button onClick={() => handleDismiss(r.id)} className="text-xs bg-[#F1EFE8] text-[#5F5E5A] px-3 py-1.5 rounded-lg hover:bg-[#E7E5DD] transition-colors">Dismiss</button>
                                            <button onClick={() => setModal({ type: 'warn', report: r })} className="text-xs bg-amber-bg text-amber-text px-3 py-1.5 rounded-lg hover:bg-amber-brand/20 transition-colors">Send warning</button>
                                            <button onClick={() => setModal({ type: 'tempBan', report: r })} className="text-xs bg-[#FAECE7] text-[#712B13] px-3 py-1.5 rounded-lg hover:bg-[#F0997B]/30 transition-colors">Temporary ban</button>
                                            <button onClick={() => handlePermanentBan(r)} className="text-xs bg-[#FCEBEB] text-[#791F1F] px-3 py-1.5 rounded-lg hover:bg-[#F7C1C1] transition-colors">Permanent ban</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                    )}

                    {tab === 'handled' && (
                        handledReports.length === 0 ? <p className="text-[#9A9890] text-sm">No handled reports yet.</p> :
                            handledReports.map((r) => (
                                <div key={r.id} className="bg-white border border-[#E7E5DD] rounded-xl p-4">
                                    <p className="text-sm text-ink">
                                        <strong>{r.reporterName}</strong> reported <strong>{r.reportedName}</strong>
                                    </p>
                                    <p className="text-sm text-[#6B6E76] mt-1 italic">"{r.reason}"</p>
                                    <span className="inline-block mt-2 text-xs px-2.5 py-1 rounded-full bg-[#F1EFE8] text-[#6B6E76]">
                                        {r.status.replace('_', ' ')}
                                    </span>
                                </div>
                            ))
                    )}
                </>
            )}

            {modal && (
                <ActionModal
                    type={modal.type}
                    report={modal.report}
                    onClose={() => setModal(null)}
                    onSuccess={() => { setModal(null); setMessage('Action completed.'); loadReports(); }}
                />
            )}
        </AdminLayout>
    );
}

export default AdminReports;