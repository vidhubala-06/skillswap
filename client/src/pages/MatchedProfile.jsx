import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import SendRequestModal from '../components/SendRequestModal';
import { useAuth } from '../context/AuthContext';

function MatchedProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [activeSwap, setActiveSwap] = useState(null);
  const [sentConversationId, setSentConversationId] = useState(null);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  useEffect(() => {
    checkLockStatus();
  }, []);

  async function checkLockStatus() {
    try {
      const res = await axios.get('http://localhost:5000/api/profile/dashboard-data', { withCredentials: true });
      setActiveSwap(res.data.activeSwap);
    } catch (err) {
      console.error('Failed to check lock status');
    }
  }

  async function loadProfile() {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`http://localhost:5000/api/profile/${userId}/public`, { withCredentials: true });
      setData(res.data);
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Layout><p className="text-gray-500">Loading...</p></Layout>;
  if (error || !data) return <Layout><p className="text-red-600">{error}</p></Layout>;

  // pick the first verified known skill as the default skill to offer in a swap request
  const targetSkill = data.knownSkills[0];

  return (
    <Layout>
      <div className="max-w-2xl bg-white border border-gray-200 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800">{data.profile.name}</h1>
        {data.profile.experience && <p className="text-gray-600 mt-2 text-sm">{data.profile.experience}</p>}

        <div className="flex gap-3 mt-3 text-sm">
          {data.profile.linkedinUrl && (
            <a href={data.profile.linkedinUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">LinkedIn</a>
          )}
          {data.profile.githubUrl && (
            <a href={data.profile.githubUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">GitHub</a>
          )}
        </div>

        <div className="mt-6">
          <h2 className="font-semibold text-gray-700 mb-2">Known Skills</h2>
          <div className="flex flex-wrap gap-2">
            {data.knownSkills.map((s) => (
              <span key={s.id} className="bg-green-50 text-green-700 text-sm px-3 py-1 rounded-full">
                {s.name}{s.selfRating ? ` · ${s.selfRating}/10` : ''}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <h2 className="font-semibold text-gray-700 mb-2">Wanted Skills</h2>
          <div className="flex flex-wrap gap-2">
            {data.wantedSkills.map((s) => (
              <span key={s.id} className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full">
                {s.name}
              </span>
            ))}
          </div>
        </div>

        {requestSent ? (
          <div className="mt-6">
            <p className="text-green-600 text-sm font-medium">Swap request sent!</p>
            {sentConversationId && (
              <button
                onClick={() => navigate(`/chat/${sentConversationId}`)}
                className="mt-2 text-sm bg-blue-50 text-blue-600 px-4 py-2 rounded hover:bg-blue-100"
              >
                💬 Open Chat with {data.profile.name}
              </button>
            )}
          </div>
        ) : data.pendingRequest ? (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              {data.pendingRequest.requesterId === user.id
                ? `You already have a pending request with ${data.profile.name}.`
                : `You have a pending request from ${data.profile.name}.`}
            </p>
            <button
              onClick={() => navigate('/swap-requests')}
              className="mt-2 text-sm text-amber-700 underline hover:text-amber-900"
            >
              View in Swap Requests →
            </button>
          </div>
        ) : activeSwap ? (
          <p className="mt-6 text-amber-600 text-sm">
            You're currently in an active swap. Complete it before sending new requests.
          </p>
        ) : (
          <button
            onClick={() => setShowModal(true)}
            disabled={!targetSkill}
            className="mt-6 bg-blue-600 text-white px-5 py-2 rounded font-medium hover:bg-blue-700 text-sm disabled:opacity-50"
          >
            Send Swap Request
          </button>
        )}
      </div>

      {showModal && targetSkill && (
        <SendRequestModal
          recipientId={userId}
          wantedSkillId={targetSkill.id}
          wantedSkillName={targetSkill.name}
          onClose={() => setShowModal(false)}
          onSuccess={(conversationId) => {
            setShowModal(false);
            setRequestSent(true);
            setSentConversationId(conversationId);
          }}
        />
      )}
    </Layout>
  );
}

export default MatchedProfile;