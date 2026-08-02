import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';

function FindMatch() {
  const [wantedSkills, setWantedSkills] = useState([]);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [matchType, setMatchType] = useState(null);
  const [results, setResults] = useState([]);
  const [visibleCount, setVisibleCount] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeSwap, setActiveSwap] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadWantedSkills();
    checkLockStatus();
  }, []);

  async function loadWantedSkills() {
    try {
      const res = await axios.get('http://localhost:5000/api/profile', { withCredentials: true });
      setWantedSkills(res.data.wantedSkills);
      if (res.data.wantedSkills.length > 0) {
        setSelectedSkillId(res.data.wantedSkills[0].id);
      }
    } catch (err) {
      setError('Failed to load your wanted skills');
    }
  }

  async function checkLockStatus() {
    try {
      const res = await axios.get('http://localhost:5000/api/profile/dashboard-data', { withCredentials: true });
      setActiveSwap(res.data.activeSwap);
    } catch (err) {
      console.error('Failed to check lock status');
    }
  }

  const handleFindMatch = async () => {
    if (!selectedSkillId) return;
    setLoading(true);
    setError('');
    setResults([]);
    setVisibleCount(20);

    try {
      const res = await axios.get(
        `http://localhost:5000/api/matches?wantedSkillId=${selectedSkillId}`,
        { withCredentials: true }
      );
      setMatchType(res.data.matchType);
      setResults(res.data.results);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const visibleResults = results.slice(0, visibleCount);

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">Find a match</h1>
        <p className="text-sm text-[#6B6E76] mt-1">Search for someone who knows what you want to learn.</p>
      </div>

      {activeSwap && (
        <div className="bg-amber-bg border border-amber-brand/20 rounded-xl p-4 mb-4 text-sm text-amber-text">
          You're currently exchanging skills with <strong>{activeSwap.partnerName}</strong>. Complete that swap before finding a new match.
        </div>
      )}

      <div className="bg-white border border-[#E7E5DD] rounded-xl p-6 mb-6 flex items-end gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-ink mb-1.5">Skill you want to learn</label>
          <select
            value={selectedSkillId}
            onChange={(e) => setSelectedSkillId(e.target.value)}
            className="w-full border border-[#D8D6CC] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-brand/40 focus:border-violet-brand"
          >
            {wantedSkills.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleFindMatch}
          disabled={loading || !selectedSkillId || !!activeSwap}
          className="bg-teal-brand text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-teal-brand/90 disabled:opacity-40 transition-colors"
        >
          {loading ? 'Searching...' : 'Find match'}
        </button>
      </div>

      {error && <div className="bg-[#FCEBEB] text-[#791F1F] p-3 rounded-lg mb-4 text-sm">{error}</div>}

      {matchType === 'none' && (
        <div className="bg-white border border-[#E7E5DD] rounded-xl p-8 text-center">
          <p className="text-sm text-[#6B6E76]">No one currently teaches this skill.</p>
          <p className="text-xs text-[#9A9890] mt-1">Check back later, or try a different skill.</p>
        </div>
      )}

      {matchType && matchType !== 'none' && (
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            matchType === 'two-way' ? 'bg-teal-bg text-teal-text' : 'bg-violet-bg text-violet-text'
          }`}>
            {matchType === 'two-way' ? 'Two-way match' : 'One-way match'}
          </span>
          <span className="text-xs text-[#9A9890]">{results.length} {results.length === 1 ? 'person' : 'people'}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleResults.map((match) => (
          <div key={match.matchedUserId} className="bg-white border border-[#E7E5DD] rounded-xl p-5 hover:border-teal-brand/40 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-teal-bg text-teal-text font-display font-semibold flex items-center justify-center flex-shrink-0">
                {match.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-ink">{match.name}</p>
                {match.selfRating && <p className="text-xs text-[#9A9890]">Self-rated {match.selfRating}/10</p>}
              </div>
            </div>

            <p className="text-sm text-[#6B6E76]">
              Knows <span className="font-tag text-teal-text bg-teal-bg px-2 py-0.5 rounded">{match.skillName}</span>
            </p>

            <div className="flex gap-3 mt-3 text-xs">
              {match.linkedinUrl && (
                <a href={match.linkedinUrl} target="_blank" rel="noreferrer" className="text-teal-text hover:underline">LinkedIn</a>
              )}
              {match.githubUrl && (
                <a href={match.githubUrl} target="_blank" rel="noreferrer" className="text-teal-text hover:underline">GitHub</a>
              )}
            </div>

            <button
              onClick={() => navigate(`/profile/${match.matchedUserId}`, { state: { matchedSkillId: match.matchedKnownSkillId } })}
              className="mt-4 w-full bg-[#F5F4EF] text-ink text-sm py-2 rounded-lg hover:bg-[#E7E5DD] transition-colors"
            >
              View profile
            </button>
          </div>
        ))}
      </div>

      {results.length > visibleCount && (
        <button
          onClick={() => setVisibleCount(visibleCount + 20)}
          className="mt-6 text-teal-text text-sm font-medium hover:underline"
        >
          Load more
        </button>
      )}
    </Layout>
  );
}

export default FindMatch;