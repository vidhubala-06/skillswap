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
                axios.get('http://localhost:5000/api/admin/skills/suggestions', { withCredentials: true }),
                axios.get('http://localhost:5000/api/admin/skills', { withCredentials: true })
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
                'http://localhost:5000/api/admin/skills',
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
            await axios.post(`http://localhost:5000/api/admin/skills/suggestions/${id}/dismiss`, {}, { withCredentials: true });
            await loadAll();
        } catch (err) {
            setError('Failed to dismiss');
        }
    };

    if (loading) return <AdminLayout><p className="text-gray-500">Loading...</p></AdminLayout>;

    return (
        <AdminLayout>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Manage Skills</h1>

            <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
                <h2 className="font-semibold text-gray-700 mb-3">Add a Skill</h2>
                {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-3 text-sm">{error}</div>}
                {message && <div className="bg-green-100 text-green-700 p-2 rounded mb-3 text-sm">{message}</div>}
                <form onSubmit={handleAddSkill} className="flex gap-3">
                    <input
                        type="text"
                        value={newSkillName}
                        onChange={(e) => setNewSkillName(e.target.value)}
                        placeholder="Skill name..."
                        required
                        className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        disabled={submitting}
                        className="bg-blue-600 text-white px-5 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                        {submitting ? 'Adding...' : 'Add Skill'}
                    </button>
                </form>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
                <h2 className="font-semibold text-gray-700 mb-3">Pending Suggestions ({suggestions.length})</h2>
                {suggestions.length === 0 ? (
                    <p className="text-sm text-gray-500">No pending suggestions.</p>
                ) : (
                    <div className="space-y-2">
                        {suggestions.map((s) => (
                            <div key={s.id} className="flex items-center justify-between border border-gray-100 rounded p-3">
                                <div>
                                    <p className="text-sm font-medium text-gray-800">
                                        {s.suggestedName} <span className="text-xs text-gray-400">×{s.requestCount}</span>
                                    </p>
                                    <p className="text-xs text-gray-500">Submitted by {s.submittedByName}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleUseSuggestion(s)} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-100">
                                        Use this suggestion
                                    </button>
                                    <button onClick={() => handleDismiss(s.id)} className="text-xs bg-gray-50 text-gray-500 px-3 py-1.5 rounded hover:bg-gray-100">
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h2 className="font-semibold text-gray-700 mb-3">All Skills ({allSkills.length})</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {allSkills.map((s) => (
                        <div key={s.id} className="text-sm text-gray-600 border border-gray-100 rounded px-3 py-1.5">
                            {s.name}
                        </div>
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
}

export default ManageSkills;