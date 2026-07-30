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
    return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Verified</span>;
  }
  if (status === 'cooldown') {
    const countdown = formatCountdown(cooldownUntil);
    return (
      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
        {countdown ? `Cooldown: ${countdown}` : 'Cooldown ended'}
      </span>
    );
  }
  return <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Not Started</span>;
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
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Verify Your Skills</h1>

      {verifiedCount === 0 && (
        <div className="bg-blue-50 text-blue-700 p-4 rounded-lg mb-6 text-sm">
          Pass at least one quiz to unlock the rest of SkillSwap.
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>
      )}

      <div className="space-y-3">
        {skills.map((skill) => (
          <div
            key={skill.skill_id}
            className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-medium text-gray-800">{skill.name}</p>
              <div className="mt-1">
                <StatusBadge status={skill.status} cooldownUntil={skill.cooldown_until} />
              </div>
              {skill.status === 'verified' && skill.self_rating && (
                <p className="text-xs text-gray-500 mt-1">Your rating: {skill.self_rating}/10</p>
              )}
            </div>

            <button
              onClick={() => handleStart(skill.skill_id)}
              disabled={!canStart(skill) || starting === skill.skill_id}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {starting === skill.skill_id
                ? 'Starting...'
                : skill.status === 'cooldown'
                ? 'Retry Quiz'
                : 'Start Quiz'}
            </button>
          </div>
        ))}
      </div>
    </Layout>
  );
}

export default QuizLanding;