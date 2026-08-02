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
            const res = await axios.get(`http://localhost:5000/api/feed/user/${userId}`, { withCredentials: true });
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
            <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-800">{data.name}</h1>
                <div className="flex gap-2 mt-2">
                    {data.skillBadges.map((s, i) => (
                        <span key={i} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">{s}</span>
                    ))}
                </div>
            </div>

            <h2 className="font-semibold text-gray-700 mb-3">Projects ({data.projects.length})</h2>
            {data.projects.length === 0 ? (
                <p className="text-gray-500 text-sm">No projects shared yet.</p>
            ) : (
                data.projects.map((p) => <ProjectCard key={p.id} project={p} showPoster={false} />)
            )}
        </Layout>
    );
}

export default FeedUserProfile;