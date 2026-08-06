import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { useCountUp } from '../hooks/useCountUp';

function StatCard({ icon, label, value, sublabel, sublinkTo, sublinkText, delay }) {
  const count = useCountUp(typeof value === 'number' ? value : 0);
  return (
    <div
      className="bg-white border border-[#E7E5DD] rounded-xl p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms`, opacity: 0 }}
    >
      <div className="w-9 h-9 rounded-lg bg-teal-bg flex items-center justify-center mb-3">{icon}</div>
      <p className="text-sm text-[#6B6E76]">{label}</p>
      <p className="font-display text-2xl font-semibold text-ink mt-1">
        {typeof value === 'number' ? count : value}
      </p>
      {sublinkTo ? (
        <Link to={sublinkTo} className="text-xs text-teal-text font-medium hover:underline mt-1 inline-block">
          {sublinkText} →
        </Link>
      ) : (
        <p className="text-xs text-[#9A9890] mt-1">{sublabel}</p>
      )}
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      const res = await axios.get('/api/profile/dashboard-data', { withCredentials: true });
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
      <div className="relative overflow-hidden -mx-6 px-6 -mt-10 pt-10 pb-2 dot-grid">
        <div className="absolute top-0 right-0 w-72 h-72 bg-teal-brand/[0.06] rounded-full blur-3xl animate-[float_6s_ease-in-out_infinite] pointer-events-none"></div>
        <div className="absolute top-20 left-0 w-64 h-64 bg-violet-brand/[0.06] rounded-full blur-3xl animate-[float_7s_ease-in-out_infinite_1s] pointer-events-none"></div>

        <div className="relative mb-8 animate-fade-in-up" style={{ opacity: 0 }}>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-ink">
            Welcome back{data?.name ? `, ${data.name}` : ''}
          </h1>
          <p className="text-sm text-[#6B6E76] mt-1">Here's where your skill exchange stands today.</p>
        </div>

        {/* Active Swap Spotlight */}
        {data?.activeSwap && (
          <div className="relative bg-gradient-to-r from-teal-bg to-violet-bg border border-teal-brand/20 rounded-xl p-5 mb-6 overflow-hidden animate-fade-in-up" style={{ opacity: 0 }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-teal-brand animate-pulse"></span>
              <p className="text-xs font-medium text-teal-text uppercase tracking-wide">Active swap</p>
            </div>
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

        {/* Getting Started checklist */}
        {showGettingStarted && (
          <div className="bg-amber-bg border border-amber-brand/20 rounded-xl p-5 mb-6 animate-fade-in-up" style={{ opacity: 0 }}>
            <p className="text-xs font-medium text-amber-text uppercase tracking-wide mb-3">Getting started</p>
            <div className="space-y-2">
              {data?.skills.verified === 0 && data?.skills.pendingQuiz === 0 && (
                <Link to="/profile" className="flex items-center gap-2.5 text-sm text-ink hover:text-amber-text group">
                  <span className="w-5 h-5 rounded-full border-2 border-amber-brand/40 flex-shrink-0 group-hover:border-amber-brand transition-colors"></span>
                  Add a skill you know and pass its quiz
                </Link>
              )}
              {data?.wantedCount === 0 && (
                <Link to="/profile" className="flex items-center gap-2.5 text-sm text-ink hover:text-amber-text group">
                  <span className="w-5 h-5 rounded-full border-2 border-amber-brand/40 flex-shrink-0 group-hover:border-amber-brand transition-colors"></span>
                  Add a skill you'd like to learn
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard
            delay={0}
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2"><path d="M12 15l-3.5 2 1-4-3-2.6 4-.3L12 6l1.5 4.1 4 .3-3 2.6 1 4z" /><circle cx="12" cy="12" r="10" /></svg>}
            label="Known skills"
            value={data?.skills.verified || 0}
            sublabel={`${data?.skills.pendingQuiz || 0} pending quiz · ${data?.skills.cooldown || 0} in cooldown`}
          />
          <StatCard
            delay={80}
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>}
            label="Wanted skills"
            value={data?.wantedCount || 0}
            sublabel="Ready to match"
          />
          <StatCard
            delay={160}
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>}
            label="Pending requests"
            value={data?.pendingRequestsCount || 0}
            sublabel="All caught up"
            sublinkTo={data?.pendingRequestsCount > 0 ? '/swap-requests' : null}
            sublinkText="View requests"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 mb-8 animate-fade-in-up" style={{ animationDelay: '250ms', opacity: 0 }}>
          <Link to="/find-match" className="bg-teal-brand text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-teal-brand/90 hover:scale-105 transition-all duration-300">
            Find a match
          </Link>
          <Link to="/quiz-landing" className="bg-white border border-[#E7E5DD] text-ink px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-[#F5F4EF] hover:scale-105 transition-all duration-300">
            View quiz status
          </Link>
          <Link to="/feed" className="bg-white border border-[#E7E5DD] text-ink px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-[#F5F4EF] hover:scale-105 transition-all duration-300">
            Browse feed
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Swap History */}
        <div className="bg-white border border-[#E7E5DD] rounded-xl p-5 hover:shadow-md transition-shadow duration-300 animate-fade-in-up" style={{ animationDelay: '300ms', opacity: 0 }}>
          <h2 className="font-display text-base font-semibold text-ink mb-3">Recent swaps</h2>
          {data?.recentSwaps?.length > 0 ? (
            <div className="space-y-3">
              {data.recentSwaps.map((s) => (
                <div key={s.id} className="flex items-start gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-teal-bg text-teal-text font-display font-semibold text-xs flex items-center justify-center flex-shrink-0">
                    {s.partnerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-ink">With <strong>{s.partnerName}</strong></p>
                    <p className="text-xs text-[#6B6E76] mt-0.5">
                      Taught <span className="font-tag text-teal-text">{s.skillTaught}</span> · Learned <span className="font-tag text-violet-text">{s.skillLearned}</span>
                    </p>
                  </div>
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
        <div className="bg-white border border-[#E7E5DD] rounded-xl p-5 hover:shadow-md transition-shadow duration-300 animate-fade-in-up" style={{ animationDelay: '380ms', opacity: 0 }}>
          <h2 className="font-display text-base font-semibold text-ink mb-3">From the feed</h2>
          {data?.feedTeaser?.length > 0 ? (
            <div className="space-y-3">
              {data.feedTeaser.map((p) => (
                <div key={p.id} className="flex items-start gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-violet-bg text-violet-text font-display font-semibold text-xs flex items-center justify-center flex-shrink-0">
                    {p.posterName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-ink font-medium">{p.posterName}</p>
                    <p className="text-xs text-[#6B6E76] mt-0.5 line-clamp-2">{p.description}</p>
                  </div>
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