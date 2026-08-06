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
      <div className="relative -mx-6 px-6 -mt-10 pt-10 pb-2 dot-grid overflow-hidden">
        <div className="absolute top-10 right-0 w-72 h-72 bg-teal-brand/[0.06] rounded-full blur-3xl animate-[float_6s_ease-in-out_infinite] pointer-events-none"></div>
        <div className="absolute top-32 left-0 w-64 h-64 bg-violet-brand/[0.06] rounded-full blur-3xl animate-[float_7s_ease-in-out_infinite_1s] pointer-events-none"></div>

        <div className="relative mb-6 animate-fade-in-up" style={{ opacity: 0 }}>
          <h1 className="font-display text-2xl font-semibold text-ink">Find a match</h1>
          <p className="text-sm text-[#6B6E76] mt-1">Search for someone who knows what you want to learn.</p>
        </div>

        <div className="relative bg-white border border-[#E7E5DD] rounded-xl p-6 mb-6 flex items-end gap-4 animate-fade-in-up" style={{ animationDelay: '100ms', opacity: 0 }}>
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
            disabled={loading || !selectedSkillId}
            className={`relative bg-teal-brand text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-teal-brand/90 disabled:opacity-40 transition-all duration-300 ${loading ? '' : 'hover:scale-105'}`}
          >
            {loading && <span className="absolute inset-0 rounded-lg bg-teal-brand/40 animate-ping"></span>}
            <span className="relative">{loading ? 'Searching...' : 'Find match'}</span>
          </button>
        </div>

        {activeSwap && (
          <div className="relative bg-amber-bg border border-amber-brand/20 rounded-xl p-4 mb-4 text-sm text-amber-text animate-fade-in-up" style={{ opacity: 0 }}>
            You're currently exchanging skills with <strong>{activeSwap.partnerName}</strong>. Complete that swap before finding a new match.
          </div>
        )}

        {error && <div className="relative bg-[#FCEBEB] text-[#791F1F] p-3 rounded-lg mb-4 text-sm animate-fade-in-up" style={{ opacity: 0 }}>{error}</div>}

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-[#E7E5DD] rounded-xl p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#F1EFE8]"></div>
                  <div className="flex-1">
                    <div className="h-3 bg-[#F1EFE8] rounded w-24 mb-2"></div>
                    <div className="h-2.5 bg-[#F1EFE8] rounded w-16"></div>
                  </div>
                </div>
                <div className="h-3 bg-[#F1EFE8] rounded w-32 mb-3"></div>
                <div className="h-8 bg-[#F1EFE8] rounded"></div>
              </div>
            ))}
          </div>
        )}

        {!loading && matchType === 'none' && (
          <div className="bg-white border border-[#E7E5DD] rounded-xl p-8 text-center">
            <p className="text-sm text-[#6B6E76]">No one currently teaches this skill.</p>
            <p className="text-xs text-[#9A9890] mt-1">Check back later, or try a different skill.</p>
          </div>
        )}

        {!loading && matchType && matchType !== 'none' && (
          <div className="flex items-center gap-2 mb-4 animate-fade-in-up" style={{ opacity: 0 }}>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              matchType === 'two-way' ? 'bg-teal-bg text-teal-text' : 'bg-violet-bg text-violet-text'
            }`}>
              {matchType === 'two-way' ? 'Two-way match' : 'One-way match'}
            </span>
            <span className="text-xs text-[#9A9890]">{results.length} {results.length === 1 ? 'person' : 'people'}</span>
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleResults.map((match, i) => (
              <div
                key={match.matchedUserId}
                className="bg-white border border-[#E7E5DD] rounded-xl p-5 hover:border-teal-brand/40 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${(i % 10) * 50}ms`, opacity: 0 }}
              >
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
        )}

        {results.length > visibleCount && (
          <button
            onClick={() => setVisibleCount(visibleCount + 20)}
            className="mt-6 text-teal-text text-sm font-medium hover:underline"
          >
            Load more
          </button>
        )}
      </div>
    </Layout>
  );
}

export default FindMatch;