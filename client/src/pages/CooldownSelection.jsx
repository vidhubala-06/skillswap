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
      <div className="max-w-md mx-auto bg-white border border-[#E7E5DD] rounded-xl p-7">
        <h1 className="font-display text-lg font-semibold text-ink mb-2">
          You taught <span className="font-tag text-teal-text bg-teal-bg px-2 py-0.5 rounded">{skillName}</span>
        </h1>
        <p className="text-sm text-[#6B6E76] mb-5">
          Set a cooldown period before you can be matched to teach this skill again.
        </p>

        {error && <div className="bg-[#FCEBEB] text-[#791F1F] p-3 rounded-lg mb-4 text-sm">{error}</div>}

        <form onSubmit={handleConfirm} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Cooldown period (in days)</label>
            <input
              type="number"
              min="0"
              max="365"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              placeholder="e.g. 14"
              className="w-full border border-[#D8D6CC] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-brand/40"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !days}
            className="w-full bg-teal-brand text-white py-2.5 rounded-lg font-medium text-sm hover:bg-teal-brand/90 disabled:opacity-40 transition-colors"
          >
            {submitting ? 'Saving...' : 'Confirm'}
          </button>
        </form>

        <button
          onClick={handleNil}
          disabled={submitting}
          className="w-full mt-3 bg-[#F1EFE8] text-ink py-2.5 rounded-lg font-medium text-sm hover:bg-[#E7E5DD] disabled:opacity-40 transition-colors"
        >
          Nil (no cooldown)
        </button>
      </div>
    </Layout>
  );
}

export default CooldownSelection;