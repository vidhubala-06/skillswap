import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';

function formatCountdown(cooldownUntil) {
  const diff = new Date(cooldownUntil) - new Date();
  if (diff <= 0) return null;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

function StatusBadge({ status, cooldownUntil }) {
  if (status === 'verified') {
    return <span className="text-xs font-medium bg-teal-bg text-teal-text px-2.5 py-1 rounded-full">Verified</span>;
  }
  if (status === 'cooldown') {
    const countdown = formatCountdown(cooldownUntil);
    return (
      <span className="text-xs font-medium bg-amber-bg text-amber-text px-2.5 py-1 rounded-full">
        {countdown ? `Cooldown: ${countdown}` : 'Cooldown ended'}
      </span>
    );
  }
  return <span className="text-xs font-medium bg-[#F1EFE8] text-[#6B6E76] px-2.5 py-1 rounded-full">Not started</span>;
}

function QuizLanding() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const res = await axios.get('/api/quiz/status', { withCredentials: true });
      setSkills(res.data.skills);
    } catch (err) {
      setError('Failed to load quiz status');
    } finally {
      setLoading(false);
    }
  }

  const canStart = (skill) => {
    if (skill.status === 'pending_quiz') return true;
    if (skill.status === 'cooldown' && new Date(skill.cooldown_until) <= new Date()) return true;
    return false;
  };

  const handleStart = async (skillId) => {
    setError('');
    setStarting(skillId);
    try {
      const res = await axios.post(
        '/api/quiz/start',
        { skillId },
        { withCredentials: true }
      );
      const skillName = skills.find((s) => s.skill_id === skillId)?.name || '';
      navigate(`/quiz-attempt/${res.data.sessionId}`, { state: { ...res.data, skillId, skillName } });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
      setStarting(null);
    }
  };

  const verifiedCount = skills.filter((s) => s.status === 'verified').length;
  const pendingCount = skills.filter((s) => s.status === 'pending_quiz').length;
  const cooldownCount = skills.filter((s) => s.status === 'cooldown').length;

  if (loading) {
    return <Layout><p className="text-gray-500">Loading...</p></Layout>;
  }

  return (
    <Layout>
      <div className="relative -mx-6 px-6 -mt-10 pt-10 pb-2 dot-grid overflow-hidden">
        <div className="absolute top-10 right-10 w-72 h-72 bg-teal-brand/[0.06] rounded-full blur-3xl animate-[float_6s_ease-in-out_infinite] pointer-events-none"></div>
        <div className="absolute top-40 left-0 w-64 h-64 bg-violet-brand/[0.06] rounded-full blur-3xl animate-[float_7s_ease-in-out_infinite_1s] pointer-events-none"></div>

        <div className="relative mb-6 animate-fade-in-up" style={{ opacity: 0 }}>
          <h1 className="font-display text-2xl font-semibold text-ink">Verify your skills</h1>
          <p className="text-sm text-[#6B6E76] mt-1">Pass a quiz to confirm a skill and make it visible to potential matches.</p>
        </div>

        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {verifiedCount === 0 && (
              <div className="bg-teal-bg text-teal-text p-4 rounded-xl mb-6 text-sm animate-fade-in-up" style={{ opacity: 0 }}>
                Pass at least one quiz to unlock the rest of SkillSwap.
              </div>
            )}

            {error && (
              <div className="bg-[#FCEBEB] text-[#791F1F] p-3 rounded-lg mb-4 text-sm">{error}</div>
            )}

            <div className="space-y-3">
              {skills.map((skill, i) => (
                <div
                  key={skill.skill_id}
                  className="bg-white border border-[#E7E5DD] rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${i * 60}ms`, opacity: 0 }}
                >
                  <div>
                    <p className="font-medium text-ink font-tag">{skill.name}</p>
                    <div className="mt-1.5">
                      <StatusBadge status={skill.status} cooldownUntil={skill.cooldown_until} />
                    </div>
                    {skill.status === 'verified' && skill.self_rating && (
                      <p className="text-xs text-[#9A9890] mt-1.5">Your rating: {skill.self_rating}/10</p>
                    )}
                  </div>

                  <button
                    onClick={() => handleStart(skill.skill_id)}
                    disabled={!canStart(skill) || starting === skill.skill_id}
                    className="bg-teal-brand text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-teal-brand/90 hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 transition-all duration-300"
                  >
                    {starting === skill.skill_id
                      ? 'Starting...'
                      : skill.status === 'cooldown'
                        ? 'Retry quiz'
                        : 'Start quiz'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '150ms', opacity: 0 }}>
            <div className="bg-white rounded-xl border border-[#E7E5DD] p-5">
              <p className="text-xs font-medium text-[#6B6E76] uppercase tracking-wide mb-3">Your progress</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6B6E76]">Verified</span>
                  <span className="font-tag text-teal-text">{verifiedCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B6E76]">Pending quiz</span>
                  <span className="font-tag text-[#9A9890]">{pendingCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B6E76]">In cooldown</span>
                  <span className="font-tag text-amber-text">{cooldownCount}</span>
                </div>
              </div>
            </div>

            <div className="bg-violet-bg/60 rounded-xl border border-violet-brand/20 p-5">
              <p className="text-xs font-medium text-violet-text uppercase tracking-wide mb-2">Quiz rules</p>
              <ul className="text-sm text-ink space-y-2">
                <li>25 questions, need 48/50 to pass.</li>
                <li>Failing means a 24-hour cooldown before retrying.</li>
                <li>Only verified skills are matchable with others.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default QuizLanding;