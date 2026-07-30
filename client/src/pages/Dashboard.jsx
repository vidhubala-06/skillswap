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
    return <Layout><p className="text-gray-500">Loading...</p></Layout>;
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-gray-800">
        Welcome back{data?.name ? `, ${data.name}` : ''}
      </h1>
      <p className="text-gray-500 text-sm mt-1">{user?.email}</p>

      {data?.activeSwap && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            You're currently in an active swap with <strong>{data.activeSwap.partnerName}</strong>
          </p>
          <Link to={`/active-swap/${data.activeSwap.swapId}`} className="text-sm text-blue-600 hover:underline mt-1 inline-block">
            View Swap →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-sm text-gray-500">Known Skills</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{data?.skills.verified || 0} verified</p>
          <p className="text-xs text-gray-400 mt-1">
            {data?.skills.pendingQuiz || 0} pending quiz · {data?.skills.cooldown || 0} in cooldown
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-sm text-gray-500">Wanted Skills</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{data?.wantedCount || 0}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-sm text-gray-500">Pending Requests</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{data?.pendingRequestsCount || 0}</p>
          {data?.pendingRequestsCount > 0 && (
            <Link to="/swap-requests" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
              View requests →
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Link
          to="/find-match"
          className="bg-blue-600 text-white px-5 py-2.5 rounded font-medium hover:bg-blue-700 text-sm"
        >
          Find a Match
        </Link>
        <Link
          to="/quiz-landing"
          className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded font-medium hover:bg-gray-200 text-sm"
        >
          View Quiz Status
        </Link>
      </div>
    </Layout>
  );
}

export default Dashboard;