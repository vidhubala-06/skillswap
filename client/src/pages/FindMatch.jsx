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
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Find a Match</h1>

      {activeSwap && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 text-sm text-amber-800">
          You're currently in an active swap with <strong>{activeSwap.partnerName}</strong>. 
          Complete it before finding new matches.
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6 flex items-end gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Skill you want to learn</label>
          <select
            value={selectedSkillId}
            onChange={(e) => setSelectedSkillId(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {wantedSkills.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleFindMatch}
          disabled={loading || !selectedSkillId || !!activeSwap}
          className="bg-blue-600 text-white px-5 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Find Match'}
        </button>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

      {matchType === 'none' && (
        <p className="text-gray-500 text-sm">No one currently teaches this skill.</p>
      )}

      {matchType && matchType !== 'none' && (
        <p className="text-sm text-gray-500 mb-3">
          {matchType === 'two-way' ? 'Two Way Match' : 'One Way Match'}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleResults.map((match) => (
          <div key={match.matchedUserId} className="bg-white border border-gray-200 rounded-lg p-5">
            <p className="font-medium text-gray-800">{match.name}</p>
            <p className="text-sm text-gray-500 mt-1">
              Knows <strong>{match.skillName}</strong>
              {match.selfRating && ` · Rated ${match.selfRating}/10`}
            </p>
            <div className="flex gap-3 mt-2 text-xs">
              {match.linkedinUrl && (
                <a href={match.linkedinUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">LinkedIn</a>
              )}
              {match.githubUrl && (
                <a href={match.githubUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">GitHub</a>
              )}
            </div>
            <button
              onClick={() => navigate(`/profile/${match.matchedUserId}`, { state: { matchedSkillId: match.matchedKnownSkillId } })}
              className="mt-3 w-full bg-gray-100 text-gray-700 text-sm py-2 rounded hover:bg-gray-200"
            >
              View Profile
            </button>
          </div>
        ))}
      </div>

      {results.length > visibleCount && (
        <button
          onClick={() => setVisibleCount(visibleCount + 20)}
          className="mt-4 text-blue-600 text-sm hover:underline"
        >
          Load More
        </button>
      )}
    </Layout>
  );
}

export default FindMatch;