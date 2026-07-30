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
                `http://localhost:5000/api/admin/reports/${report.id}/${c.endpoint}`,
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
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-lg font-bold text-gray-800 mb-3">{c.title}</h2>
                <p className="text-sm text-gray-500 mb-3">Regarding: {report.reportedName}</p>
                {type === 'tempBan' ? (
                    <input
                        type="number"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={c.placeholder}
                        className="w-full border border-gray-300 rounded px-3 py-2 mb-3"
                    />
                ) : (
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={c.placeholder}
                        rows={3}
                        className="w-full border border-gray-300 rounded px-3 py-2 mb-3"
                    />
                )}
                {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200">Cancel</button>
                    <button onClick={handleSubmit} disabled={loading || !input} className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
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
          axios.get('http://localhost:5000/api/admin/reports', { withCredentials: true }),
          axios.get('http://localhost:5000/api/admin/reports/handled', { withCredentials: true })
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
            await axios.post(`http://localhost:5000/api/admin/reports/${id}/dismiss`, {}, { withCredentials: true });
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
                `http://localhost:5000/api/admin/reports/${report.id}/permanent-ban`,
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
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Reports ({reports.length})</h1>

            <div className="flex gap-2 mb-4 border-b border-gray-200">
              <button onClick={() => setTab('pending')} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'pending' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
                Pending ({reports.length})
              </button>
              <button onClick={() => setTab('handled')} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'handled' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
                Handled ({handledReports.length})
              </button>
            </div>

            {message && <div className="bg-blue-100 text-blue-700 p-3 rounded mb-4 text-sm">{message}</div>}

            {loading ? (
                <p className="text-gray-500">Loading...</p>
            ) : (
                <>
                    {tab === 'pending' && (
                        reports.length === 0 ? <p className="text-gray-500 text-sm">No pending reports.</p> :
                        <div className="space-y-3">
                            {reports.map((r) => (
                                <div key={r.id} className="bg-white border border-gray-200 rounded-lg p-4">
                                    <p className="text-sm text-gray-800">
                                        <strong>{r.reporterName}</strong> reported <strong>{r.reportedName}</strong>
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1 italic">"{r.reason}"</p>
                                    <div className="flex gap-2 mt-3">
                                        <button onClick={() => handleDismiss(r.id)} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded hover:bg-gray-200">Dismiss</button>
                                        <button onClick={() => setModal({ type: 'warn', report: r })} className="text-xs bg-amber-50 text-amber-700 px-3 py-1.5 rounded hover:bg-amber-100">Send Warning</button>
                                        <button onClick={() => setModal({ type: 'tempBan', report: r })} className="text-xs bg-orange-50 text-orange-700 px-3 py-1.5 rounded hover:bg-orange-100">Temporary Ban</button>
                                        <button onClick={() => handlePermanentBan(r)} className="text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded hover:bg-red-100">Permanent Ban</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {tab === 'handled' && (
                      handledReports.length === 0 ? <p className="text-gray-500 text-sm">No handled reports yet.</p> :
                      handledReports.map((r) => (
                        <div key={r.id} className="bg-white border border-gray-200 rounded-lg p-4">
                          <p className="text-sm text-gray-800">
                            <strong>{r.reporterName}</strong> reported <strong>{r.reportedName}</strong>
                          </p>
                          <p className="text-sm text-gray-600 mt-1 italic">"{r.reason}"</p>
                          <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
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