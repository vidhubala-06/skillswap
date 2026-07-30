import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useSocket } from '../hooks/useSocket';

function RejectModal({ requestId, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReject = async () => {
    if (!reason.trim()) {
      setError('A reason is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await axios.post(
        `http://localhost:5000/api/swap-requests/${requestId}/reject`,
        { reason },
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
        <h2 className="text-lg font-bold text-gray-800 mb-3">Reject Request</h2>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for rejecting..."
          rows={3}
          className="w-full border border-gray-300 rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200">Cancel</button>
          <button onClick={handleReject} disabled={loading} className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50">
            {loading ? 'Rejecting...' : 'Confirm Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SwapRequests() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('received');
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [fullHistory, setFullHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState(null);
  const [message, setMessage] = useState('');

  const socketRef = useSocket();

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleUpdate = () => loadAll();
    socket.on('swap-request-updated', handleUpdate);

    return () => socket.off('swap-request-updated', handleUpdate);
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [r, s, c, h] = await Promise.all([
        axios.get('http://localhost:5000/api/swap-requests/received', { withCredentials: true }),
        axios.get('http://localhost:5000/api/swap-requests/sent', { withCredentials: true }),
        axios.get('http://localhost:5000/api/swap-requests/completed', { withCredentials: true }),
        axios.get('http://localhost:5000/api/swap-requests/history', { withCredentials: true })
      ]);
      setReceived(r.data.requests);
      setSent(s.data.requests);
      setCompleted(c.data.requests);
      setFullHistory(h.data.requests);
    } catch (err) {
      console.error('Failed to load swap requests', err);
    } finally {
      setLoading(false);
    }
  }

  const handleAccept = async (id) => {
    setMessage('');
    try {
      await axios.post(`http://localhost:5000/api/swap-requests/${id}/accept`, {}, { withCredentials: true });
      navigate(`/active-swap/${id}`);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Something went wrong');
    }
  };

  const handleCancel = async (id) => {
    setMessage('');
    try {
      await axios.post(`http://localhost:5000/api/swap-requests/${id}/cancel`, {}, { withCredentials: true });
      setMessage('Request cancelled.');
      loadAll();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Something went wrong');
    }
  };

  const tabs = [
    { key: 'received', label: `Received (${received.length})` },
    { key: 'sent', label: `Sent (${sent.length})` },
    { key: 'completed', label: `Completed (${completed.length})` },
    { key: 'history', label: `All History (${fullHistory.length})` }
  ];

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Swap Requests</h1>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {message && <div className="bg-blue-100 text-blue-700 p-3 rounded mb-4 text-sm">{message}</div>}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="space-y-3">
          {tab === 'received' && (
            received.length === 0 ? <p className="text-gray-500 text-sm">No pending requests.</p> :
            received.map((r) => (
              <div key={r.id} className={`border rounded-lg p-4 flex items-center justify-between ${
                r.status === 'cancelled' ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
              }`}>
                <div>
                  <p className={`font-medium ${r.status === 'cancelled' ? 'text-gray-500' : 'text-gray-800'}`}>
                    {r.requesterName}
                  </p>
                  <p className="text-sm text-gray-500">Offers <strong>{r.offeredSkillName}</strong> · Wants <strong>{r.wantedSkillName}</strong></p>
                  {r.status === 'cancelled' && (
                    <p className="text-xs text-gray-400 mt-1 italic">
                      This request is no longer available — the sender became unavailable (already matched with someone else).
                    </p>
                  )}
                </div>
                {r.status === 'pending' ? (
                  <div className="flex gap-2">
                    <button onClick={() => handleAccept(r.id)} className="bg-green-600 text-white text-sm px-3 py-1.5 rounded hover:bg-green-700">Accept</button>
                    <button onClick={() => setRejectingId(r.id)} className="bg-red-50 text-red-600 text-sm px-3 py-1.5 rounded hover:bg-red-100">Reject</button>
                  </div>
                ) : (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Cancelled</span>
                )}
              </div>
            ))
          )}

          {tab === 'sent' && (
            sent.length === 0 ? <p className="text-gray-500 text-sm">No sent requests.</p> :
            sent.map((r) => (
              <div key={r.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{r.recipientName}</p>
                    <p className="text-sm text-gray-500">Offering <strong>{r.offeredSkillName}</strong> · Wanting <strong>{r.wantedSkillName}</strong></p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      r.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      r.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                    }`}>{r.status}</span>
                    {r.status === 'pending' && (
                      <button onClick={() => handleCancel(r.id)} className="text-xs text-gray-500 hover:text-red-600 underline">Cancel</button>
                    )}
                  </div>
                </div>
                {r.status === 'rejected' && r.rejectReason && (
                  <p className="text-xs text-red-500 mt-2">Reason: {r.rejectReason}</p>
                )}
              </div>
            ))
          )}

          {tab === 'completed' && (
            completed.length === 0 ? <p className="text-gray-500 text-sm">No completed swaps yet.</p> :
            completed.map((r) => (
              <div key={r.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="font-medium text-gray-800">{r.partnerName}</p>
                <p className="text-sm text-gray-500">Taught <strong>{r.skillITaught}</strong> · Learned <strong>{r.skillILearned}</strong></p>
              </div>
            ))
          )}

          {tab === 'history' && (
            fullHistory.length === 0 ? <p className="text-gray-500 text-sm">No swap history yet.</p> :
            fullHistory.map((r) => (
              <div key={r.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {r.direction === 'sent' ? 'To' : 'From'} {r.partnerName}
                    </p>
                    <p className="text-sm text-gray-500">
                      Offered <strong>{r.offeredSkillName}</strong> · Wanted <strong>{r.wantedSkillName}</strong>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{r.createdAt?.split('T')[0]}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                    r.status === 'completed' ? 'bg-green-100 text-green-700' :
                    r.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    r.status === 'rejected' || r.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {r.status.replace('_', ' ')}
                  </span>
                </div>
                {r.rejectReason && (
                  <p className="text-xs text-red-500 mt-2">Reason: {r.rejectReason}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {rejectingId && (
        <RejectModal
          requestId={rejectingId}
          onClose={() => setRejectingId(null)}
          onSuccess={() => { setRejectingId(null); setMessage('Request rejected.'); loadAll(); }}
        />
      )}
    </Layout>
  );
}

export default SwapRequests;