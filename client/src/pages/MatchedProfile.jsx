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
      <div className="max-w-2xl bg-white border border-[#E7E5DD] rounded-xl p-7">
        <div className="flex items-center gap-4 mb-1">
          <div className="w-14 h-14 rounded-full bg-teal-bg text-teal-text font-display font-semibold text-xl flex items-center justify-center flex-shrink-0">
            {data.profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-ink">{data.profile.name}</h1>
            <div className="flex gap-3 text-sm mt-0.5">
              {data.profile.linkedinUrl && (
                <a href={data.profile.linkedinUrl} target="_blank" rel="noreferrer" className="text-teal-text hover:underline">LinkedIn</a>
              )}
              {data.profile.githubUrl && (
                <a href={data.profile.githubUrl} target="_blank" rel="noreferrer" className="text-teal-text hover:underline">GitHub</a>
              )}
            </div>
          </div>
        </div>
        {data.profile.experience && <p className="text-sm text-[#6B6E76] mt-4">{data.profile.experience}</p>}

        <div className="mt-6 pt-6 border-t border-[#E7E5DD]">
          <h2 className="text-xs font-medium text-[#6B6E76] uppercase tracking-wide mb-2">Can teach</h2>
          <div className="flex flex-wrap gap-2">
            {data.knownSkills.map((s) => (
              <span key={s.id} className="font-tag bg-teal-bg text-teal-text text-sm px-3 py-1 rounded-lg">
                {s.name}{s.selfRating ? ` · ${s.selfRating}/10` : ''}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <h2 className="text-xs font-medium text-[#6B6E76] uppercase tracking-wide mb-2">Wants to learn</h2>
          <div className="flex flex-wrap gap-2">
            {data.wantedSkills.map((s) => (
              <span key={s.id} className="font-tag bg-violet-bg text-violet-text text-sm px-3 py-1 rounded-lg">
                {s.name}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-[#E7E5DD]">
          {requestSent ? (
            <div>
              <p className="text-teal-text text-sm font-medium">Swap request sent!</p>
              {sentConversationId && (
                <button
                  onClick={() => navigate(`/chat/${sentConversationId}`)}
                  className="mt-2 text-sm bg-teal-bg text-teal-text px-4 py-2 rounded-lg hover:bg-teal-brand/20 transition-colors"
                >
                  Open chat with {data.profile.name}
                </button>
              )}
            </div>
          ) : data.pendingRequest ? (
            <div className="bg-amber-bg border border-amber-brand/20 rounded-xl p-4">
              <p className="text-sm text-amber-text">
                {data.pendingRequest.requesterId === user.id
                  ? `You already have a pending request with ${data.profile.name}.`
                  : `You have a pending request from ${data.profile.name}.`}
              </p>
              <button
                onClick={() => navigate('/swap-requests')}
                className="mt-2 text-sm text-amber-text underline hover:no-underline font-medium"
              >
                View in swap requests →
              </button>
            </div>
          ) : activeSwap ? (
            <p className="text-amber-text text-sm bg-amber-bg border border-amber-brand/20 rounded-xl p-4">
              You're currently in an active swap. Complete it before sending new requests.
            </p>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              disabled={!targetSkill}
              className="bg-teal-brand text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-teal-brand/90 disabled:opacity-40 transition-colors"
            >
              Send swap request
            </button>
          )}
        </div>
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