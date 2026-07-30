import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { useSocket } from '../hooks/useSocket';
import { useNavLock } from '../context/NavLockContext';

function ActiveSwap() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const socketRef = useSocket();
  const { lockNavigation, unlockNavigation } = useNavLock();

  const [swap, setSwap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [sessionHistory, setSessionHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const [marking, setMarking] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportMessage, setReportMessage] = useState('');

  useEffect(() => {
    loadSwap();
  }, [id]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !id) return;

    socket.emit('join-swap', id);

    const handleUpdate = () => {
      loadSwap();
    };
    socket.on('swap-updated', handleUpdate);

    return () => {
      socket.emit('leave-swap', id);
      socket.off('swap-updated', handleUpdate);
    };
  }, [id]);

  useEffect(() => {
    if (swap && swap.status === 'accepted') {
      lockNavigation('Please schedule your session before navigating elsewhere.');
    } else {
      unlockNavigation();
    }
    return () => unlockNavigation(); // always release the lock when leaving this page
  }, [swap]);

  async function loadSwap() {
    try {
      const res = await axios.get(`http://localhost:5000/api/swap-requests/${id}`, { withCredentials: true });
      if (res.data.swap.status === 'completed') {
        navigate(`/cooldown-selection/${id}`, { replace: true });
        return;
      }
      setSwap(res.data.swap);
      await loadHistory();
    } catch (err) {
      setError('Failed to load this swap');
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    try {
      const res = await axios.get(`http://localhost:5000/api/swap-requests/${id}/history`, { withCredentials: true });
      setSessionHistory(res.data.sessions);
    } catch (err) {
      console.error('Failed to load session history');
    }
  }

  const handleSchedule = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await axios.post(
        `http://localhost:5000/api/swap-requests/${id}/schedule`,
        { sessionDate, sessionTime },
        { withCredentials: true }
      );
      setShowReschedule(false);
      await loadSwap();
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkComplete = async () => {
    setError('');
    setMarking(true);
    try {
      const res = await axios.post(
        `http://localhost:5000/api/swap-requests/${id}/mark-complete`,
        {},
        { withCredentials: true }
      );
      if (res.data.swapCompleted) {
        navigate(`/cooldown-selection/${id}`);
      } else {
        await loadSwap();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setMarking(false);
    }
  };

  const handleReport = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/reports', { swapId: id, reason: reportReason }, { withCredentials: true });
      setReportMessage('Report submitted.');
      setShowReport(false);
      setReportReason('');
    } catch (err) {
      setReportMessage(err.response?.data?.error || 'Something went wrong');
    }
  };

  if (loading) return <Layout><p className="text-gray-500">Loading...</p></Layout>;
  if (error && !swap) return <Layout><p className="text-red-600">{error}</p></Layout>;
  if (!swap) return null;

  const isRequester = swap.requesterId === user.id;
  const myMarkedComplete = isRequester ? swap.requesterMarkedComplete : swap.recipientMarkedComplete;
  const partnerMarkedComplete = isRequester ? swap.recipientMarkedComplete : swap.requesterMarkedComplete;
  const isScheduled = swap.status === 'in_progress';
  const sessionDateTime = swap.sessionDate && swap.sessionTime
    ? new Date(`${swap.sessionDate}T${swap.sessionTime}`)
    : null;
  const sessionHasPassed = sessionDateTime ? new Date() >= sessionDateTime : false;
  const canJoinMeeting = sessionDateTime
    ? new Date() >= new Date(sessionDateTime.getTime() - 10 * 60 * 1000)
    : false;

  return (
    <Layout>
      <div className="max-w-xl mx-auto bg-white border border-gray-200 rounded-lg p-6">
        <h1 className="text-xl font-bold text-gray-800">Swap with {swap.partnerName}</h1>
        <p className="text-sm text-gray-500 mt-1">
          You're learning <strong>{swap.wantedSkillName}</strong>, teaching <strong>{swap.offeredSkillName}</strong>
        </p>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mt-4 text-sm">{error}</div>}

        {!isScheduled ? (
          <form onSubmit={handleSchedule} className="mt-6 space-y-4">
            <div className="bg-blue-50 text-blue-700 p-3 rounded text-sm">
              Enter your session date and time to continue.
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Date</label>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Time</label>
              <input
                type="time"
                value={sessionTime}
                onChange={(e) => setSessionTime(e.target.value)}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Confirm Session'}
            </button>
          </form>
        ) : (
          <div className="mt-6">
            <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm text-gray-700 flex items-center justify-between">
              <span>Session: {swap.sessionDate} at {swap.sessionTime}</span>
              <button
                onClick={() => setShowReschedule(!showReschedule)}
                className="text-blue-600 text-xs hover:underline"
              >
                {showReschedule ? 'Cancel' : 'Need another session?'}
              </button>
            </div>

            {showReschedule && (
              <form onSubmit={handleSchedule} className="mt-3 space-y-3 bg-blue-50 p-4 rounded">
                <p className="text-xs text-blue-700">Set a new date/time if you need more time to finish teaching.</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Session Date</label>
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Session Time</label>
                  <input
                    type="time"
                    value={sessionTime}
                    onChange={(e) => setSessionTime(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Updating...' : 'Confirm New Session'}
                </button>
              </form>
            )}

            <div className="mt-3">
              {canJoinMeeting ? (
                <button
                  onClick={() => navigate(`/meeting/${id}`)}
                  className="w-full bg-green-600 text-white py-2 rounded font-medium hover:bg-green-700"
                >
                  🎥 Join Meeting
                </button>
              ) : (
                <p className="text-xs text-gray-400 text-center py-2">
                  Join Meeting unlocks 10 minutes before your session
                </p>
              )}
            </div>

            {sessionHistory.length > 1 && (
              <div className="mt-3 text-xs text-gray-500">
                <p className="font-medium mb-1">Session History</p>
                {sessionHistory.map((s, i) => (
                  <p key={i}>Session {i + 1}: {s.sessionDate} at {s.sessionTime} (set by {s.scheduledByName})</p>
                ))}
              </div>
            )}

            <div className="mt-5">
              <p className="text-sm font-medium text-gray-700 mb-2">Completion Status</p>
              <div className="flex gap-4 text-sm">
                <span>You: {myMarkedComplete ? '✅ Marked Complete' : '⏳ Waiting'}</span>
                <span>Partner: {partnerMarkedComplete ? '✅ Marked Complete' : '⏳ Waiting'}</span>
              </div>
            </div>

            {!sessionHasPassed && !myMarkedComplete && (
              <p className="mt-4 text-xs text-amber-600">
                You'll be able to mark this complete after your scheduled session time.
              </p>
            )}
            <button
              onClick={handleMarkComplete}
              disabled={myMarkedComplete || marking || !sessionHasPassed}
              className="mt-2 w-full bg-green-600 text-white py-2 rounded font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {myMarkedComplete ? 'You already marked this complete' : marking ? 'Submitting...' : 'Mark as Complete'}
            </button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-100">
          {reportMessage && <p className="text-xs text-gray-500 mb-2">{reportMessage}</p>}
          <button onClick={() => setShowReport(!showReport)} className="text-xs text-red-500 hover:underline">
            Report an Issue
          </button>
          {showReport && (
            <form onSubmit={handleReport} className="mt-2 space-y-2">
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Describe the issue..."
                rows={2}
                required
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
              <button type="submit" className="bg-red-600 text-white text-xs px-3 py-1.5 rounded hover:bg-red-700">
                Submit Report
              </button>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default ActiveSwap;