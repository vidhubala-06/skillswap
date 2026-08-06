import { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';

function ManageSkills() {
  const [suggestions, setSuggestions] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [pendingSuggestionId, setPendingSuggestionId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const [s, a] = await Promise.all([
        axios.get('/api/admin/skills/suggestions', { withCredentials: true }),
        axios.get('/api/admin/skills', { withCredentials: true })
      ]);
      setSuggestions(s.data.suggestions);
      setAllSkills(a.data.skills);
    } catch (err) {
      setError('Failed to load skills data');
    } finally {
      setLoading(false);
    }
  }

  const handleUseSuggestion = (suggestion) => {
    setNewSkillName(suggestion.suggestedName);
    setPendingSuggestionId(suggestion.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      const res = await axios.post(
        '/api/admin/skills',
        { name: newSkillName, suggestionId: pendingSuggestionId },
        { withCredentials: true }
      );
      setMessage(res.data.message);
      setNewSkillName('');
      setPendingSuggestionId(null);
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = async (id) => {
    try {
      await axios.post(`/api/admin/skills/suggestions/${id}/dismiss`, {}, { withCredentials: true });
      await loadAll();
    } catch (err) {
      setError('Failed to dismiss');
    }
  };

  if (loading) return <AdminLayout><p className="text-gray-500">Loading...</p></AdminLayout>;

  return (
    <AdminLayout>
      <h1 className="font-display text-2xl font-semibold text-ink mb-6">Manage skills</h1>

      <div className="bg-white border border-[#E7E5DD] rounded-xl p-5 mb-6">
        <h2 className="font-display text-base font-semibold text-ink mb-3">Add a skill</h2>
        {error && <div className="bg-[#FCEBEB] text-[#791F1F] p-2 rounded-lg mb-3 text-sm">{error}</div>}
        {message && <div className="bg-teal-bg text-teal-text p-2 rounded-lg mb-3 text-sm">{message}</div>}
        <form onSubmit={handleAddSkill} className="flex gap-3">
          <input
            type="text"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            placeholder="Skill name..."
            required
            className="flex-1 border border-[#D8D6CC] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-brand/40"
          />
          <button
            type="submit"
            disabled={submitting}
            className="bg-teal-brand text-white px-5 py-2 rounded-lg font-medium text-sm hover:bg-teal-brand/90 disabled:opacity-40 transition-colors"
          >
            {submitting ? 'Adding...' : 'Add skill'}
          </button>
        </form>
      </div>

      <div className="bg-white border border-[#E7E5DD] rounded-xl p-5 mb-6">
        <h2 className="font-display text-base font-semibold text-ink mb-3">Pending suggestions ({suggestions.length})</h2>
        {suggestions.length === 0 ? (
          <p className="text-sm text-[#9A9890]">No pending suggestions.</p>
        ) : (
          <div className="space-y-2">
            {suggestions.map((s) => (
              <div key={s.id} className="flex items-center justify-between border border-[#F1EFE8] rounded-lg p-3">
                <div>
                  <p className="text-sm font-medium text-ink font-tag">
                    {s.suggestedName} <span className="text-xs text-[#9A9890] font-sans">×{s.requestCount}</span>
                  </p>
                  <p className="text-xs text-[#9A9890]">Submitted by {s.submittedByName}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleUseSuggestion(s)} className="text-xs bg-teal-bg text-teal-text px-3 py-1.5 rounded-lg hover:bg-teal-brand/20 transition-colors">
                    Use this suggestion
                  </button>
                  <button onClick={() => handleDismiss(s.id)} className="text-xs bg-[#F1EFE8] text-[#5F5E5A] px-3 py-1.5 rounded-lg hover:bg-[#E7E5DD] transition-colors">
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-[#E7E5DD] rounded-xl p-5">
        <h2 className="font-display text-base font-semibold text-ink mb-3">All skills ({allSkills.length})</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {allSkills.map((s) => (
            <div key={s.id} className="font-tag text-sm text-[#5F5E5A] border border-[#F1EFE8] rounded-lg px-3 py-1.5">
              {s.name}
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

export default ManageSkills;