import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
      const res = await axios.get('/api/profile/dashboard-data', { withCredentials: true });
      setActiveSwap(res.data.activeSwap);
    } catch (err) {
      console.error('Failed to check lock status');
    }
  }

  async function loadProfile() {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`/api/profile/${userId}/public`, { withCredentials: true });
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
      <div className="relative -mx-6 px-6 -mt-10 pt-10 pb-2 dot-grid overflow-hidden">
        <div className="absolute top-10 right-10 w-72 h-72 bg-teal-brand/[0.06] rounded-full blur-3xl animate-[float_6s_ease-in-out_infinite] pointer-events-none"></div>
        <div className="absolute top-40 left-0 w-64 h-64 bg-violet-brand/[0.06] rounded-full blur-3xl animate-[float_7s_ease-in-out_infinite_1s] pointer-events-none"></div>

        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main profile card */}
          <div className="lg:col-span-2 bg-white border border-[#E7E5DD] rounded-xl overflow-hidden animate-fade-in-up" style={{ opacity: 0 }}>
            {/* Cover gradient */}
            <div className="h-24 bg-gradient-to-r from-teal-brand/20 to-violet-brand/20"></div>

            <div className="px-7 pb-7 -mt-10">
              <div className="w-20 h-20 rounded-full bg-teal-bg text-teal-text font-display font-semibold text-2xl flex items-center justify-center border-4 border-white shadow-sm">
                {data.profile.name.charAt(0).toUpperCase()}
              </div>

              <h1 className="font-display text-xl font-semibold text-ink mt-3">{data.profile.name}</h1>
              <div className="flex gap-3 text-sm mt-1">
                {data.profile.linkedinUrl && (
                  <a href={data.profile.linkedinUrl} target="_blank" rel="noreferrer" className="text-teal-text hover:underline">LinkedIn</a>
                )}
                {data.profile.githubUrl && (
                  <a href={data.profile.githubUrl} target="_blank" rel="noreferrer" className="text-teal-text hover:underline">GitHub</a>
                )}
              </div>
              {data.profile.experience && <p className="text-sm text-[#6B6E76] mt-4 leading-relaxed">{data.profile.experience}</p>}

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
                    className="bg-teal-brand text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-teal-brand/90 hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 transition-all duration-300"
                  >
                    Send swap request
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '150ms', opacity: 0 }}>
            <div className="bg-teal-bg/60 rounded-xl border border-teal-brand/20 p-5">
              <p className="text-xs font-medium text-teal-text uppercase tracking-wide mb-2">Why this match</p>
              <p className="text-sm text-ink leading-relaxed">
                {data.knownSkills.length > 0 && data.wantedSkills.length > 0
                  ? `${data.profile.name} knows ${data.knownSkills.length} skill${data.knownSkills.length > 1 ? 's' : ''} and wants to learn ${data.wantedSkills.length} more — a great candidate for a two-way skill exchange.`
                  : `${data.profile.name} has skills you might be looking for.`}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-[#E7E5DD] p-5">
              <p className="text-xs font-medium text-[#6B6E76] uppercase tracking-wide mb-3">Before you reach out</p>
              <ul className="text-sm text-ink space-y-2">
                <li>Sending a request opens a chat — discuss availability before committing.</li>
                <li>You'll offer one of your own verified skills in return.</li>
                <li>Once accepted, you'll both be locked until the swap completes.</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-[#E7E5DD] p-5">
              <p className="text-xs font-medium text-[#6B6E76] uppercase tracking-wide mb-3">Quick links</p>
              <div className="space-y-2 text-sm">
                <button onClick={() => navigate('/find-match')} className="block text-teal-text hover:underline text-left">← Back to matches</button>
                <Link to="/swap-requests" className="block text-teal-text hover:underline">Swap requests →</Link>
              </div>
            </div>
          </div>
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