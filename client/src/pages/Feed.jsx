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
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h1 className="font-display text-2xl font-semibold text-ink">Project feed</h1>
                    <p className="text-sm text-[#6B6E76] mt-1">See what others have built with skills learned through SkillSwap.</p>
                </div>
                <button
                    onClick={() => eligible ? setShowModal(true) : alert('Complete at least one swap to share a project.')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${eligible ? 'bg-teal-brand text-white hover:bg-teal-brand/90' : 'bg-[#F1EFE8] text-[#9A9890]'
                        }`}
                >
                    + Share project
                </button>
            </div>

            <select
                value={selectedSkillId}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="border border-[#D8D6CC] rounded-lg px-3 py-2 mb-6 mt-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-brand/40"
            >
                <option value="">All Technologies</option>
                {skills.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                ))}
            </select>

            {newPostsAvailable && (
              <button
                onClick={handleRefreshClick}
                className="w-full bg-teal-bg text-teal-text text-sm py-2.5 rounded-lg mb-4 hover:bg-teal-brand/20 font-medium transition-colors"
              >
                New posts available — click to refresh
              </button>
            )}

            {loading ? (
                <p className="text-[#9A9890] text-sm">Loading feed...</p>
            ) : projects.length === 0 ? (
                <div className="bg-white border border-[#E7E5DD] rounded-xl p-10 text-center">
                    <p className="text-sm text-[#6B6E76]">No projects yet.</p>
                    <p className="text-xs text-[#9A9890] mt-1">Be the first to share what you've built.</p>
                </div>
            ) : (
                <div>
                    {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
                    {loadingMore && <p className="text-center text-sm text-[#9A9890]">Loading more...</p>}
                    {!hasMore && <p className="text-center text-xs text-[#B4B2A9]">You've reached the end</p>}
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