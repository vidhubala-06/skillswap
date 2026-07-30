import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import SkillSelector from '../components/SkillSelector';

function MyProfile() {
  const [name, setName] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [experience, setExperience] = useState('');
  const [knownSkills, setKnownSkills] = useState([]);
  const [wantedSkills, setWantedSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cooldowns, setCooldowns] = useState([]);
  const [cooldownInputs, setCooldownInputs] = useState({});
  const [cooldownMessage, setCooldownMessage] = useState('');

  async function loadCooldowns() {
    try {
      const res = await axios.get('http://localhost:5000/api/skill-cooldowns/mine', { withCredentials: true });
      setCooldowns(res.data.cooldowns);
    } catch (err) {
      console.error('Failed to load cooldowns');
    }
  }

  useEffect(() => {
    loadProfile();
    loadCooldowns();
  }, []);

  async function loadProfile() {
    try {
      const res = await axios.get('http://localhost:5000/api/profile', { withCredentials: true });
      const { profile, knownSkills: known, wantedSkills: wanted } = res.data;

      setName(profile?.name || '');
      setLinkedinUrl(profile?.linkedin_url || '');
      setGithubUrl(profile?.github_url || '');
      setExperience(profile?.experience || '');
      setKnownSkills(known.map((s) => ({ id: s.id, name: s.name, status: s.status })));
      setWantedSkills(wanted.map((s) => ({ id: s.id, name: s.name })));
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  const canSave = name.trim() && knownSkills.length > 0 && wantedSkills.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!canSave) {
      setError('Please fill in your name and keep at least one known and one wanted skill.');
      return;
    }

    setSaving(true);
    try {
      await axios.post(
        'http://localhost:5000/api/profile',
        {
          name,
          linkedinUrl,
          githubUrl,
          experience,
          knownSkillIds: knownSkills.map((s) => s.id),
          wantedSkillIds: wantedSkills.map((s) => s.id)
        },
        { withCredentials: true }
      );
      setSuccess('Profile updated!');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCooldown = async (skillId, days) => {
    setCooldownMessage('');
    try {
      await axios.post(
        `http://localhost:5000/api/skill-cooldowns/${skillId}/edit`,
        { cooldownDays: days },
        { withCredentials: true }
      );
      setCooldownMessage('Cooldown updated!');
      loadCooldowns();
    } catch (err) {
      setCooldownMessage(err.response?.data?.error || 'Something went wrong');
    }
  };

  if (loading) {
    return <Layout><p className="text-gray-500">Loading...</p></Layout>;
  }

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h1>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GitHub URL</label>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
            <textarea
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <SkillSelector
              label="Skills You Know"
              selectedSkills={knownSkills}
              onAdd={(skill) => setKnownSkills([...knownSkills, skill])}
              onRemove={(id) => setKnownSkills(knownSkills.filter((s) => s.id !== id))}
              excludedIds={wantedSkills.map((s) => s.id)}
            />
            <div className="flex flex-wrap gap-2 mt-1">
              {knownSkills.map((s) => s.status === 'verified' && (
                <span key={s.id} className="text-xs text-green-600">✓ {s.name} verified</span>
              ))}
            </div>
          </div>

          <SkillSelector
            label="Skills You Want to Learn"
            selectedSkills={wantedSkills}
            onAdd={(skill) => setWantedSkills([...wantedSkills, skill])}
            onRemove={(id) => setWantedSkills(wantedSkills.filter((s) => s.id !== id))}
            excludedIds={knownSkills.map((s) => s.id)}
          />

          <button
            type="submit"
            disabled={!canSave || saving}
            className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="font-semibold text-gray-700 mb-3">Your Teaching Cooldowns</h2>
          {cooldownMessage && <p className="text-sm text-blue-600 mb-3">{cooldownMessage}</p>}
          {cooldowns.length === 0 ? (
            <p className="text-sm text-gray-400">You haven't taught any skills yet.</p>
          ) : (
            <div className="space-y-3">
              {cooldowns.map((c) => (
                <div key={c.skillId} className="flex items-center justify-between border border-gray-100 rounded p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{c.skillName}</p>
                    <p className="text-xs text-gray-500">
                      {c.cooldownUntil ? `Cooling down until ${c.cooldownUntil.split('T')[0]}` : 'No cooldown — available to teach'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="365"
                      placeholder="days"
                      value={cooldownInputs[c.skillId] || ''}
                      onChange={(e) => setCooldownInputs({ ...cooldownInputs, [c.skillId]: e.target.value })}
                      className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                    <button
                      onClick={() => handleUpdateCooldown(c.skillId, parseInt(cooldownInputs[c.skillId], 10))}
                      disabled={!cooldownInputs[c.skillId]}
                      className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-100 disabled:opacity-50"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => handleUpdateCooldown(c.skillId, null)}
                      className="text-xs bg-gray-50 text-gray-600 px-3 py-1.5 rounded hover:bg-gray-100"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default MyProfile;