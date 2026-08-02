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
      const res = await axios.get('http://localhost:5000/api/quiz/status', { withCredentials: true });
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
        'http://localhost:5000/api/quiz/start',
        { skillId },
        { withCredentials: true }
      );
      navigate('/quiz-attempt', { state: { ...res.data, skillId } });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
      setStarting(null);
    }
  };

  const verifiedCount = skills.filter((s) => s.status === 'verified').length;

  if (loading) {
    return <Layout><p className="text-gray-500">Loading...</p></Layout>;
  }

  return (
    <Layout>
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">Verify your skills</h1>
      <p className="text-sm text-[#6B6E76] mb-4">Pass a quiz to confirm a skill and make it visible to potential matches.</p>

      {verifiedCount === 0 && (
        <div className="bg-teal-bg text-teal-text p-4 rounded-xl mb-6 text-sm">
          Pass at least one quiz to unlock the rest of SkillSwap.
        </div>
      )}

      {error && (
        <div className="bg-[#FCEBEB] text-[#791F1F] p-3 rounded-lg mb-4 text-sm">{error}</div>
      )}

      <div className="space-y-3">
        {skills.map((skill) => (
          <div
            key={skill.skill_id}
            className="bg-white border border-[#E7E5DD] rounded-xl p-4 flex items-center justify-between"
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
              className="bg-teal-brand text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-teal-brand/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
    </Layout>
  );
}

export default QuizLanding;