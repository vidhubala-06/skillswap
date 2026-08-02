import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
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
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">My Profile</h1>
        <p className="text-sm text-[#6B6E76] mt-1">Manage your details, skills, and teaching availability.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E7E5DD] p-8">
          {error && <div className="bg-[#FCEBEB] text-[#791F1F] p-3 rounded-lg mb-4 text-sm">{error}</div>}
          {success && <div className="bg-teal-bg text-teal-text p-3 rounded-lg mb-4 text-sm">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-[#D8D6CC] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-brand/40 focus:border-teal-brand"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">LinkedIn URL</label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="w-full border border-[#D8D6CC] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-brand/40 focus:border-teal-brand"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">GitHub URL</label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="w-full border border-[#D8D6CC] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-brand/40 focus:border-teal-brand"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">Experience</label>
              <textarea
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                rows={3}
                className="w-full border border-[#D8D6CC] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-brand/40 focus:border-teal-brand"
              />
            </div>

            <div>
              <SkillSelector
                label="Skills You Know"
                selectedSkills={knownSkills}
                onAdd={(skill) => setKnownSkills([...knownSkills, skill])}
                onRemove={(id) => setKnownSkills(knownSkills.filter((s) => s.id !== id))}
                excludedIds={wantedSkills.map((s) => s.id)}
                variant="teal"
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
              variant="violet"
            />

            <button
              type="submit"
              disabled={!canSave || saving}
              className="w-full bg-teal-brand text-white py-2.5 rounded-lg font-medium text-sm hover:bg-teal-brand/90 disabled:opacity-40 transition-colors"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#E7E5DD]">
            <h2 className="font-display text-base font-semibold text-ink mb-1">Teaching cooldowns</h2>
            <p className="text-xs text-[#9A9890] mb-3">Control when you become available again to teach a skill you've taught before.</p>
            {cooldownMessage && <p className="text-sm text-teal-text mb-3">{cooldownMessage}</p>}
            {cooldowns.length === 0 ? (
              <p className="text-sm text-[#9A9890]">You haven't taught any skills yet.</p>
            ) : (
              <div className="space-y-3">
                {cooldowns.map((c) => (
                  <div key={c.skillId} className="flex items-center justify-between border border-[#E7E5DD] rounded-lg p-3">
                    <div>
                      <p className="text-sm font-medium text-ink font-tag">{c.skillName}</p>
                      <p className="text-xs text-[#9A9890]">
                        {c.cooldownUntil ? `Cooling down until ${c.cooldownUntil.split('T')[0]}` : 'Available to teach'}
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
                        className="w-20 border border-[#D8D6CC] rounded-lg px-2 py-1 text-sm"
                      />
                      <button
                        onClick={() => handleUpdateCooldown(c.skillId, parseInt(cooldownInputs[c.skillId], 10))}
                        disabled={!cooldownInputs[c.skillId]}
                        className="text-xs bg-teal-bg text-teal-text px-3 py-1.5 rounded-lg hover:bg-teal-brand/20 disabled:opacity-40"
                      >
                        Update
                      </button>
                      <button
                        onClick={() => handleUpdateCooldown(c.skillId, null)}
                        className="text-xs bg-[#F1EFE8] text-[#5F5E5A] px-3 py-1.5 rounded-lg hover:bg-[#E7E5DD]"
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

        <div className="space-y-4">
          {/* Profile summary */}
          <div className="bg-white rounded-xl border border-[#E7E5DD] p-5">
            <div className="w-12 h-12 rounded-full bg-teal-bg text-teal-text font-display font-semibold text-lg flex items-center justify-center mb-3">
              {name ? name.charAt(0).toUpperCase() : '?'}
            </div>
            <p className="font-display font-semibold text-ink">{name || 'Your profile'}</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6B6E76]">Known skills</span>
                <span className="font-tag text-teal-text">{knownSkills.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6E76]">Wanted skills</span>
                <span className="font-tag text-violet-text">{wantedSkills.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6E76]">Verified</span>
                <span className="font-tag text-teal-text">
                  {knownSkills.filter(s => s.status === 'verified').length}
                </span>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-teal-bg/60 rounded-xl border border-teal-brand/20 p-5">
            <p className="text-xs font-medium text-teal-text uppercase tracking-wide mb-2">Good to know</p>
            <ul className="text-sm text-ink space-y-2">
              <li>Only verified skills are visible to potential matches — pass the quiz to unlock matching for a skill.</li>
              <li>A skill can't appear in both your known and wanted lists at once.</li>
              <li>Removing your only verified skill isn't allowed — you'll need at least one to keep matching active.</li>
            </ul>
          </div>

          {/* Quick links */}
          <div className="bg-white rounded-xl border border-[#E7E5DD] p-5">
            <p className="text-xs font-medium text-[#6B6E76] uppercase tracking-wide mb-3">Quick links</p>
            <div className="space-y-2 text-sm">
              <Link to="/find-match" className="block text-teal-text hover:underline">Find a match →</Link>
              <Link to="/quiz-landing" className="block text-teal-text hover:underline">View quiz status →</Link>
              <Link to="/swap-requests" className="block text-teal-text hover:underline">Swap requests →</Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default MyProfile;