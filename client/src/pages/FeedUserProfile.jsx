import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import ProjectCard from '../components/ProjectCard';

function FeedUserProfile() {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  async function loadProfile() {
    try {
      const res = await axios.get(`/api/feed/user/${userId}`, { withCredentials: true });
      setData(res.data);
    } catch (err) {
      console.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Layout><p className="text-gray-500">Loading...</p></Layout>;
  if (!data) return <Layout><p className="text-red-600">User not found</p></Layout>;

  return (
    <Layout>
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-full bg-teal-bg text-teal-text font-display font-semibold text-xl flex items-center justify-center flex-shrink-0">
          {data.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">{data.name}</h1>
          <div className="flex gap-2 mt-1.5">
            {data.skillBadges.map((s, i) => (
              <span key={i} className="font-tag text-xs bg-teal-bg text-teal-text px-2 py-1 rounded-lg">{s}</span>
            ))}
          </div>
        </div>
      </div>

      <h2 className="font-display text-base font-semibold text-ink mb-3">Projects ({data.projects.length})</h2>
      {data.projects.length === 0 ? (
        <p className="text-gray-500 text-sm">No projects shared yet.</p>
      ) : (
        data.projects.map((p) => <ProjectCard key={p.id} project={p} showPoster={false} />)
      )}
    </Layout>
  );
}

export default FeedUserProfile;