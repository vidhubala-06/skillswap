import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import ProjectCard from '../components/ProjectCard';
import ShareProjectModal from '../components/ShareProjectModal';
import { useSocket } from '../hooks/useSocket';

function Feed() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [eligible, setEligible] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [skills, setSkills] = useState([]);
    const [selectedSkillId, setSelectedSkillId] = useState('');
    const socketRef = useSocket();
    const [newPostsAvailable, setNewPostsAvailable] = useState(false);

    useEffect(() => {
        checkEligibility();
        loadSkillList();
        loadFeed(true);
    }, []);

    useEffect(() => {
      const socket = socketRef.current;
      if (!socket) return;

      const handleNewPost = () => setNewPostsAvailable(true);
      socket.on('feed:new-post', handleNewPost);

      return () => socket.off('feed:new-post', handleNewPost);
    }, []);

    const handleRefreshClick = () => {
      setNewPostsAvailable(false);
      loadFeed(true);
    };

    async function checkEligibility() {
        try {
            const res = await axios.get('http://localhost:5000/api/feed/eligibility', { withCredentials: true });
            setEligible(res.data.eligible);
        } catch (err) { /* silent */ }
    }

    async function loadSkillList() {
        try {
            const res = await axios.get('http://localhost:5000/api/skills/all', { withCredentials: true });
            setSkills(res.data.skills);
        } catch (err) { /* silent */ }
    }

    async function loadFeed(reset = false, skillId = selectedSkillId) {
        if (reset) {
            setLoading(true);
            setProjects([]);
            setHasMore(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const currentList = reset ? [] : projects;
            const last = currentList[currentList.length - 1];
            const params = new URLSearchParams();
            if (skillId) params.append('skillId', skillId);
            if (!reset && last) {
                params.append('cursorCreatedAt', last.createdAt);
                params.append('cursorId', last.id);
            }

            const res = await axios.get(`http://localhost:5000/api/feed?${params.toString()}`, { withCredentials: true });
            const newProjects = res.data.projects;

            setProjects(reset ? newProjects : [...currentList, ...newProjects]);
            setHasMore(newProjects.length === 20);
        } catch (err) {
            console.error('Failed to load feed');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }

    const handleFilterChange = (skillId) => {
        setSelectedSkillId(skillId);
        loadFeed(true, skillId);
    };

    const handleScroll = useCallback((e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target.documentElement;
        if (scrollHeight - scrollTop - clientHeight < 300 && hasMore && !loadingMore) {
            loadFeed(false);
        }
    }, [hasMore, loadingMore, projects, selectedSkillId]);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    return (
        <Layout>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-800">Project Feed</h1>
                <button
                    onClick={() => eligible ? setShowModal(true) : alert('Complete at least one swap to share a project.')}
                    className={`px-4 py-2 rounded font-medium text-sm ${eligible ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400'
                        }`}
                >
                    + Share Project
                </button>
            </div>

            <select
                value={selectedSkillId}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 mb-4 text-sm"
            >
                <option value="">All Technologies</option>
                {skills.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                ))}
            </select>

            {newPostsAvailable && (
              <button
                onClick={handleRefreshClick}
                className="w-full bg-blue-50 text-blue-700 text-sm py-2 rounded mb-4 hover:bg-blue-100"
              >
                ⬆️ New posts available — click to refresh
              </button>
            )}

            {loading ? (
                <p className="text-gray-500">Loading feed...</p>
            ) : projects.length === 0 ? (
                <p className="text-gray-500 text-sm">No projects yet.</p>
            ) : (
                <div>
                    {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
                    {loadingMore && <p className="text-center text-sm text-gray-400">Loading more...</p>}
                    {!hasMore && <p className="text-center text-xs text-gray-300">You've reached the end</p>}
                </div>
            )}

            {showModal && (
                <ShareProjectModal
                    onClose={() => setShowModal(false)}
                    onSuccess={() => { setShowModal(false); loadFeed(true); }}
                />
            )}
        </Layout>
    );
}

export default Feed;