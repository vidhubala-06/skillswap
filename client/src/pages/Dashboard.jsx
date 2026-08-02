import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      const res = await axios.get('http://localhost:5000/api/profile/dashboard-data', { withCredentials: true });
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <Layout><p className="text-[#9A9890]">Loading...</p></Layout>;
  }

  const showGettingStarted = data?.wantedCount === 0 || (data?.skills.verified === 0 && data?.skills.pendingQuiz === 0);

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Welcome back{data?.name ? `, ${data.name}` : ''}
        </h1>
        <p className="text-sm text-[#6B6E76] mt-1">Here's where your skill exchange stands today.</p>
      </div>

      {/* Active Swap Spotlight */}
      {data?.activeSwap && (
        <div className="bg-teal-bg border border-teal-brand/20 rounded-xl p-5 mb-6">
          <p className="text-xs font-medium text-teal-text uppercase tracking-wide mb-1">Active swap</p>
          <p className="text-sm text-ink">
            You're currently exchanging skills with <strong>{data.activeSwap.partnerName}</strong>
          </p>
          <Link
            to={`/active-swap/${data.activeSwap.swapId}`}
            className="inline-block mt-2 text-sm text-teal-text font-medium hover:underline"
          >
            View swap details →
          </Link>
        </div>
      )}

      {/* Getting Started */}
      {showGettingStarted && (
        <div className="bg-amber-bg border border-amber-brand/20 rounded-xl p-5 mb-6">
          <p className="text-xs font-medium text-amber-text uppercase tracking-wide mb-2">Getting started</p>
          <ul className="space-y-1.5 text-sm text-ink">
            {data?.skills.verified === 0 && data?.skills.pendingQuiz === 0 && (
              <li>• Add a skill you know on <Link to="/profile" className="underline font-medium">My Profile</Link> and pass its quiz</li>
            )}
            {data?.wantedCount === 0 && (
              <li>• Add a skill you'd like to learn to unlock matching</li>
            )}
          </ul>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-[#E7E5DD] rounded-xl p-4">
          <p className="text-sm text-[#6B6E76]">Known skills</p>
          <p className="font-display text-2xl font-semibold text-ink mt-1">{data?.skills.verified || 0} verified</p>
          <p className="text-xs text-[#9A9890] mt-1">
            {data?.skills.pendingQuiz || 0} pending quiz · {data?.skills.cooldown || 0} in cooldown
          </p>
        </div>
        <div className="bg-white border border-[#E7E5DD] rounded-xl p-4">
          <p className="text-sm text-[#6B6E76]">Wanted skills</p>
          <p className="font-display text-2xl font-semibold text-ink mt-1">{data?.wantedCount || 0}</p>
          <p className="text-xs text-[#9A9890] mt-1">Ready to match</p>
        </div>
        <div className="bg-white border border-[#E7E5DD] rounded-xl p-4">
          <p className="text-sm text-[#6B6E76]">Pending requests</p>
          <p className="font-display text-2xl font-semibold text-ink mt-1">{data?.pendingRequestsCount || 0}</p>
          {data?.pendingRequestsCount > 0 ? (
            <Link to="/swap-requests" className="text-xs text-teal-text font-medium hover:underline mt-1 inline-block">
              View requests →
            </Link>
          ) : (
            <p className="text-xs text-[#9A9890] mt-1">All caught up</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link to="/find-match" className="bg-teal-brand text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-teal-brand/90 transition-colors">
          Find a match
        </Link>
        <Link to="/quiz-landing" className="bg-white border border-[#E7E5DD] text-ink px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-[#F5F4EF] transition-colors">
          View quiz status
        </Link>
        <Link to="/feed" className="bg-white border border-[#E7E5DD] text-ink px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-[#F5F4EF] transition-colors">
          Browse feed
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Swap History */}
        <div className="bg-white border border-[#E7E5DD] rounded-xl p-5">
          <h2 className="font-display text-base font-semibold text-ink mb-3">Recent swaps</h2>
          {data?.recentSwaps?.length > 0 ? (
            <div className="space-y-3">
              {data.recentSwaps.map((s) => (
                <div key={s.id} className="text-sm">
                  <p className="text-ink">With <strong>{s.partnerName}</strong></p>
                  <p className="text-xs text-[#6B6E76] mt-0.5">
                    Taught <span className="font-tag text-teal-text">{s.skillTaught}</span> · Learned <span className="font-tag text-violet-text">{s.skillLearned}</span>
                  </p>
                </div>
              ))}
              <Link to="/swap-requests" className="text-xs text-teal-text font-medium hover:underline inline-block mt-1">
                View all history →
              </Link>
            </div>
          ) : (
            <p className="text-sm text-[#9A9890]">No completed swaps yet. Find a match to get started.</p>
          )}
        </div>

        {/* Feed Teaser */}
        <div className="bg-white border border-[#E7E5DD] rounded-xl p-5">
          <h2 className="font-display text-base font-semibold text-ink mb-3">From the feed</h2>
          {data?.feedTeaser?.length > 0 ? (
            <div className="space-y-3">
              {data.feedTeaser.map((p) => (
                <div key={p.id} className="text-sm">
                  <p className="text-ink font-medium">{p.posterName}</p>
                  <p className="text-xs text-[#6B6E76] mt-0.5 line-clamp-2">{p.description}</p>
                </div>
              ))}
              <Link to="/feed" className="text-xs text-teal-text font-medium hover:underline inline-block mt-1">
                View feed →
              </Link>
            </div>
          ) : (
            <p className="text-sm text-[#9A9890]">No projects shared yet.</p>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;