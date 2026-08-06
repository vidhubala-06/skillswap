import { useState, useEffect } from 'react';
import axios from 'axios';

function SendRequestModal({ recipientId, wantedSkillId, wantedSkillName, onClose, onSuccess }) {
  const [myKnownSkills, setMyKnownSkills] = useState([]);
  const [offeredSkillId, setOfferedSkillId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMySkills();
  }, []);

  async function loadMySkills() {
    try {
      const res = await axios.get('/api/profile', { withCredentials: true });
      const verified = res.data.knownSkills.filter((s) => s.status === 'verified');
      setMyKnownSkills(verified);
      if (verified.length > 0) setOfferedSkillId(verified[0].id);
    } catch (err) {
      setError('Failed to load your skills');
    }
  }

  const handleSend = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(
        '/api/swap-requests',
        { recipientId, offeredSkillId, wantedSkillId },
        { withCredentials: true }
      );
      onSuccess(res.data.conversationId);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Send Swap Request</h2>

        <p className="text-sm text-gray-600 mb-3">
          You're requesting to learn: <strong>{wantedSkillName}</strong>
        </p>

        {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-3 text-sm">{error}</div>}

        {myKnownSkills.length === 0 ? (
          <p className="text-sm text-red-600">You have no verified skills to offer.</p>
        ) : (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">What will you teach in return?</label>
            <select
              value={offeredSkillId}
              onChange={(e) => setOfferedSkillId(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {myKnownSkills.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 py-2 rounded font-medium hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={loading || myKnownSkills.length === 0}
            className="flex-1 bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Confirm & Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SendRequestModal;