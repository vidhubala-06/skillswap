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
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="font-display text-lg font-semibold text-ink mb-3">Reject request</h2>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for rejecting..."
          rows={3}
          className="w-full border border-[#D8D6CC] rounded-lg px-3 py-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-brand/40"
        />
        {error && <p className="text-[#791F1F] text-sm mb-3">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-[#F1EFE8] text-ink py-2 rounded-lg hover:bg-[#E7E5DD] transition-colors text-sm">Cancel</button>
          <button onClick={handleReject} disabled={loading} className="flex-1 bg-[#993C1D] text-white py-2 rounded-lg hover:bg-[#791F1F] disabled:opacity-40 transition-colors text-sm">
            {loading ? 'Rejecting...' : 'Confirm reject'}
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
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">Swap requests</h1>
        <p className="text-sm text-[#6B6E76] mt-1">Track requests you've sent, received, and completed.</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-[#E7E5DD]">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key ? 'border-teal-brand text-teal-text' : 'border-transparent text-[#9A9890] hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {message && <div className="bg-teal-bg text-teal-text p-3 rounded-lg mb-4 text-sm">{message}</div>}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="space-y-3">
          {tab === 'received' && (
            received.length === 0 ? (
              <div className="bg-white border border-[#E7E5DD] rounded-xl p-8 text-center">
                <p className="text-sm text-[#6B6E76]">No pending requests.</p>
              </div>
            ) : received.map((r) => (
              <div key={r.id} className={`border rounded-xl p-4 flex items-center justify-between mb-3 ${
                r.status === 'cancelled' ? 'bg-[#F5F4EF] border-[#E7E5DD]' : 'bg-white border-[#E7E5DD]'
              }`}>
                <div>
                  <p className={`font-medium ${r.status === 'cancelled' ? 'text-[#9A9890]' : 'text-ink'}`}>
                    {r.requesterName}
                  </p>
                  <p className="text-sm text-[#6B6E76] mt-0.5">
                    Offers <span className="font-tag text-teal-text">{r.offeredSkillName}</span> · Wants <span className="font-tag text-violet-text">{r.wantedSkillName}</span>
                  </p>
                  {r.status === 'cancelled' && (
                    <p className="text-xs text-[#9A9890] mt-1.5 italic">
                      No longer available — the sender is already matched with someone else.
                    </p>
                  )}
                </div>
                {r.status === 'pending' ? (
                  <div className="flex gap-2 flex-shrink-0 ml-4">
                    <button onClick={() => handleAccept(r.id)} className="bg-teal-brand text-white text-sm px-3 py-1.5 rounded-lg hover:bg-teal-brand/90 transition-colors">Accept</button>
                    <button onClick={() => setRejectingId(r.id)} className="bg-[#FCEBEB] text-[#791F1F] text-sm px-3 py-1.5 rounded-lg hover:bg-[#F7C1C1] transition-colors">Reject</button>
                  </div>
                ) : (
                  <span className="text-xs bg-[#E7E5DD] text-[#6B6E76] px-2.5 py-1 rounded-full flex-shrink-0 ml-4">Cancelled</span>
                )}
              </div>
            ))
          )}

          {tab === 'sent' && (
            sent.length === 0 ? (
              <div className="bg-white border border-[#E7E5DD] rounded-xl p-8 text-center">
                <p className="text-sm text-[#6B6E76]">No sent requests.</p>
              </div>
            ) : sent.map((r) => (
              <div key={r.id} className="bg-white border border-[#E7E5DD] rounded-xl p-4 mb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ink">{r.recipientName}</p>
                    <p className="text-sm text-[#6B6E76] mt-0.5">
                      Offering <span className="font-tag text-teal-text">{r.offeredSkillName}</span> · Wanting <span className="font-tag text-violet-text">{r.wantedSkillName}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      r.status === 'pending' ? 'bg-amber-bg text-amber-text' :
                      r.status === 'rejected' ? 'bg-[#FCEBEB] text-[#791F1F]' : 'bg-[#E7E5DD] text-[#6B6E76]'
                    }`}>{r.status}</span>
                    {r.status === 'pending' && (
                      <button onClick={() => handleCancel(r.id)} className="text-xs text-[#9A9890] hover:text-[#791F1F] underline">Cancel</button>
                    )}
                  </div>
                </div>
                {r.status === 'rejected' && r.rejectReason && (
                  <p className="text-xs text-[#993C1D] mt-2 italic">Reason: {r.rejectReason}</p>
                )}
              </div>
            ))
          )}

          {tab === 'completed' && (
            completed.length === 0 ? (
              <div className="bg-white border border-[#E7E5DD] rounded-xl p-8 text-center">
                <p className="text-sm text-[#6B6E76]">No completed swaps yet.</p>
              </div>
            ) : completed.map((r) => (
              <div key={r.id} className="bg-white border border-[#E7E5DD] rounded-xl p-4 mb-3">
                <p className="font-medium text-ink">{r.partnerName}</p>
                <p className="text-sm text-[#6B6E76] mt-0.5">
                  Taught <span className="font-tag text-teal-text">{r.skillITaught}</span> · Learned <span className="font-tag text-violet-text">{r.skillILearned}</span>
                </p>
              </div>
            ))
          )}

          {tab === 'history' && (
            fullHistory.length === 0 ? (
              <div className="bg-white border border-[#E7E5DD] rounded-xl p-8 text-center">
                <p className="text-sm text-[#6B6E76]">No swap history yet.</p>
              </div>
            ) : fullHistory.map((r) => (
              <div key={r.id} className="bg-white border border-[#E7E5DD] rounded-xl p-4 mb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {r.direction === 'sent' ? 'To' : 'From'} {r.partnerName}
                    </p>
                    <p className="text-sm text-[#6B6E76] mt-0.5">
                      Offered <span className="font-tag text-teal-text">{r.offeredSkillName}</span> · Wanted <span className="font-tag text-violet-text">{r.wantedSkillName}</span>
                    </p>
                    <p className="text-xs text-[#9A9890] mt-1">{r.createdAt?.split('T')[0]}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full capitalize font-medium flex-shrink-0 ml-4 ${
                    r.status === 'completed' ? 'bg-teal-bg text-teal-text' :
                    r.status === 'pending' ? 'bg-amber-bg text-amber-text' :
                    r.status === 'rejected' || r.status === 'cancelled' ? 'bg-[#FCEBEB] text-[#791F1F]' :
                    'bg-violet-bg text-violet-text'
                  }`}>
                    {r.status.replace('_', ' ')}
                  </span>
                </div>
                {r.rejectReason && (
                  <p className="text-xs text-[#993C1D] mt-2 italic">Reason: {r.rejectReason}</p>
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