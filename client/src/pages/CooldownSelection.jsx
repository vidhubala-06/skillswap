import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';

function CooldownSelection() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [skillName, setSkillName] = useState('');
  const [skillId, setSkillId] = useState(null);
  const [days, setDays] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTaughtSkill();
  }, [id]);

  async function loadTaughtSkill() {
    try {
      const res = await axios.get(`http://localhost:5000/api/skill-cooldowns/${id}/taught-skill`, { withCredentials: true });
      setSkillName(res.data.skillName);
      setSkillId(res.data.skillId);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  const submitCooldown = async (cooldownDays) => {
    setError('');
    setSubmitting(true);
    try {
      await axios.post(
        'http://localhost:5000/api/skill-cooldowns',
        { swapId: id, cooldownDays },
        { withCredentials: true }
      );
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
      setSubmitting(false);
    }
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    const parsedDays = parseInt(days, 10);
    if (isNaN(parsedDays) || parsedDays < 0) {
      setError('Please enter a valid number of days');
      return;
    }
    submitCooldown(parsedDays);
  };

  const handleNil = () => {
    submitCooldown(null);
  };

  if (loading) return <Layout><p className="text-gray-500">Loading...</p></Layout>;
  if (error && !skillId) return <Layout><p className="text-red-600">{error}</p></Layout>;

  return (
    <Layout>
      <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-lg p-6">
        <h1 className="text-lg font-bold text-gray-800 mb-2">
          You taught <span className="text-blue-600">{skillName}</span>
        </h1>
        <p className="text-sm text-gray-500 mb-5">
          Set a cooldown period before you can be matched to teach this skill again.
        </p>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleConfirm} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cooldown period (in days)</label>
            <input
              type="number"
              min="0"
              max="365"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              placeholder="e.g. 14"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !days}
            className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Confirm'}
          </button>
        </form>

        <button
          onClick={handleNil}
          disabled={submitting}
          className="w-full mt-3 bg-gray-100 text-gray-700 py-2 rounded font-medium hover:bg-gray-200 disabled:opacity-50"
        >
          Nil (no cooldown)
        </button>
      </div>
    </Layout>
  );
}

export default CooldownSelection;