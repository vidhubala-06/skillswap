import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import SkillSelector from '../components/SkillSelector';

function ProfileSetup() {
  const [name, setName] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [experience, setExperience] = useState('');
  const [knownSkills, setKnownSkills] = useState([]);
  const [wantedSkills, setWantedSkills] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const canSave = name.trim() && knownSkills.length > 0 && wantedSkills.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!canSave) {
      setError('Please fill in your name and add at least one known and one wanted skill.');
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        '/api/profile',
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
      navigate('/quiz-landing');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Build Your Profile</h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>
        )}

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
              placeholder="https://linkedin.com/in/..."
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GitHub URL</label>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/..."
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

          <SkillSelector
            label="Skills You Know"
            selectedSkills={knownSkills}
            onAdd={(skill) => setKnownSkills([...knownSkills, skill])}
            onRemove={(id) => setKnownSkills(knownSkills.filter((s) => s.id !== id))}
            excludedIds={wantedSkills.map((s) => s.id)}
            variant="teal"
          />

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
            disabled={!canSave || loading}
            className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </Layout>
  );
}

export default ProfileSetup;