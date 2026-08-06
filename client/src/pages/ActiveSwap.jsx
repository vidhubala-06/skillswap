import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
      const res = await axios.get(`/api/swap-requests/${id}`, { withCredentials: true });
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
      const res = await axios.get(`/api/swap-requests/${id}/history`, { withCredentials: true });
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
        `/api/swap-requests/${id}/schedule`,
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
        `/api/swap-requests/${id}/mark-complete`,
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
      await axios.post('/api/reports', { swapId: id, reason: reportReason }, { withCredentials: true });
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
      <div className="relative -mx-6 px-6 -mt-10 pt-10 pb-2 dot-grid overflow-hidden">
        <div className="absolute top-10 right-10 w-72 h-72 bg-teal-brand/[0.06] rounded-full blur-3xl animate-[float_6s_ease-in-out_infinite] pointer-events-none"></div>
        <div className="absolute top-40 left-0 w-64 h-64 bg-violet-brand/[0.06] rounded-full blur-3xl animate-[float_7s_ease-in-out_infinite_1s] pointer-events-none"></div>

        <div className="relative mb-6 animate-fade-in-up" style={{ opacity: 0 }}>
          <h1 className="font-display text-2xl font-semibold text-ink">Active swap</h1>
          <p className="text-sm text-[#6B6E76] mt-1">Coordinate your session and mark it complete when you're done.</p>
        </div>

        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-[#E7E5DD] rounded-xl p-7 animate-fade-in-up" style={{ animationDelay: '100ms', opacity: 0 }}>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-11 h-11 rounded-full bg-teal-bg text-teal-text font-display font-semibold flex items-center justify-center flex-shrink-0">
                {swap.partnerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-ink">Swap with {swap.partnerName}</h2>
                <p className="text-sm text-[#6B6E76] mt-0.5">
                  Learning <span className="font-tag text-violet-text bg-violet-bg px-2 py-0.5 rounded">{swap.wantedSkillName}</span>
                  {' '}· teaching <span className="font-tag text-teal-text bg-teal-bg px-2 py-0.5 rounded">{swap.offeredSkillName}</span>
                </p>
              </div>
            </div>

            {error && <div className="bg-[#FCEBEB] text-[#791F1F] p-3 rounded-lg mt-4 text-sm">{error}</div>}

            {!isScheduled ? (
              <form onSubmit={handleSchedule} className="mt-6 space-y-4">
                <div className="bg-teal-bg text-teal-text p-3.5 rounded-xl text-sm">
                  Enter your session date and time to unlock the rest of this page.
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Session date</label>
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    required
                    className="w-full border border-[#D8D6CC] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-brand/40 focus:border-teal-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Session time</label>
                  <input
                    type="time"
                    value={sessionTime}
                    onChange={(e) => setSessionTime(e.target.value)}
                    required
                    className="w-full border border-[#D8D6CC] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-brand/40 focus:border-teal-brand"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-teal-brand text-white py-2.5 rounded-lg font-medium text-sm hover:bg-teal-brand/90 disabled:opacity-40 transition-colors animate-fade-in-up"
                >
                  {saving ? 'Saving...' : 'Confirm session'}
                </button>
              </form>
            ) : (
              <div className="mt-6">
                <div className="bg-[#F5F4EF] border border-[#E7E5DD] rounded-xl p-4 flex items-center justify-between">
                  <span className="text-sm text-ink">Session: <span className="font-medium">{swap.sessionDate} at {swap.sessionTime}</span></span>
                  <button
                    onClick={() => setShowReschedule(!showReschedule)}
                    className="text-teal-text text-xs font-medium hover:underline"
                  >
                    {showReschedule ? 'Cancel' : 'Need another session?'}
                  </button>
                </div>

                {showReschedule && (
                  <form onSubmit={handleSchedule} className="mt-3 space-y-3 bg-teal-bg/40 p-4 rounded-xl">
                    <p className="text-xs text-teal-text">Set a new date/time if you need more time to finish teaching.</p>
                    <div>
                      <label className="block text-sm font-medium text-ink mb-1">New session date</label>
                      <input
                        type="date"
                        value={sessionDate}
                        onChange={(e) => setSessionDate(e.target.value)}
                        required
                        className="w-full border border-[#D8D6CC] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-brand/40"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink mb-1">New session time</label>
                      <input
                        type="time"
                        value={sessionTime}
                        onChange={(e) => setSessionTime(e.target.value)}
                        required
                        className="w-full border border-[#D8D6CC] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-brand/40"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full bg-teal-brand text-white py-2 rounded-lg font-medium text-sm hover:bg-teal-brand/90 disabled:opacity-40 transition-colors"
                    >
                      {saving ? 'Updating...' : 'Confirm new session'}
                    </button>
                  </form>
                )}

                <div className="mt-3">
                  {canJoinMeeting ? (
                    <button
                      onClick={() => navigate(`/meeting/${id}`)}
                      className="w-full bg-violet-brand text-white py-2.5 rounded-lg font-medium text-sm hover:bg-violet-brand/90 transition-colors"
                    >
                      Join meeting
                    </button>
                  ) : (
                    <p className="text-xs text-[#9A9890] text-center py-2">
                      Join meeting unlocks 10 minutes before your session
                    </p>
                  )}
                </div>

                {sessionHistory.length > 1 && (
                  <div className="mt-3 text-xs text-[#9A9890]">
                    <p className="font-medium mb-1 text-[#6B6E76]">Session history</p>
                    {sessionHistory.map((s, i) => (
                      <p key={i}>Session {i + 1}: {s.sessionDate} at {s.sessionTime} (set by {s.scheduledByName})</p>
                    ))}
                  </div>
                )}

                <div className="mt-5 pt-5 border-t border-[#E7E5DD]">
                  <p className="text-sm font-medium text-ink mb-2">Completion status</p>
                  <div className="flex gap-4 text-sm">
                    <span className={myMarkedComplete ? 'text-teal-text font-medium' : 'text-[#9A9890]'}>
                      You: {myMarkedComplete ? 'Marked complete' : 'Waiting'}
                    </span>
                    <span className={partnerMarkedComplete ? 'text-teal-text font-medium' : 'text-[#9A9890]'}>
                      Partner: {partnerMarkedComplete ? 'Marked complete' : 'Waiting'}
                    </span>
                  </div>
                </div>

                {!sessionHasPassed && !myMarkedComplete && (
                  <p className="mt-4 text-xs text-amber-text">
                    You'll be able to mark this complete after your scheduled session time.
                  </p>
                )}
                <button
                  onClick={handleMarkComplete}
                  disabled={myMarkedComplete || marking || !sessionHasPassed}
                  className="mt-2 w-full bg-teal-brand text-white py-2.5 rounded-lg font-medium text-sm hover:bg-teal-brand/90 disabled:opacity-40 transition-colors"
                >
                  {myMarkedComplete ? 'You already marked this complete' : marking ? 'Submitting...' : 'Mark as complete'}
                </button>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-[#E7E5DD]">
              {reportMessage && <p className="text-xs text-[#9A9890] mb-2">{reportMessage}</p>}
              <button onClick={() => setShowReport(!showReport)} className="text-xs text-[#B4B2A9] hover:text-[#993C1D] transition-colors">
                Report an issue
              </button>
              {showReport && (
                <form onSubmit={handleReport} className="mt-2 space-y-2">
                  <textarea
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Describe the issue..."
                    rows={2}
                    required
                    className="w-full border border-[#D8D6CC] rounded-lg px-2 py-1.5 text-xs"
                  />
                  <button type="submit" className="bg-[#993C1D] text-white text-xs px-3 py-1.5 rounded-lg hover:bg-[#791F1F]">
                    Submit report
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '200ms', opacity: 0 }}>
            <div className="bg-teal-bg/60 rounded-xl border border-teal-brand/20 p-5">
              <p className="text-xs font-medium text-teal-text uppercase tracking-wide mb-2">About this swap</p>
              <p className="text-sm text-ink leading-relaxed">
                You're both locked to this swap until it's marked complete by both sides — you won't be able to accept other requests until then.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-[#E7E5DD] p-5">
              <p className="text-xs font-medium text-[#6B6E76] uppercase tracking-wide mb-3">Good to know</p>
              <ul className="text-sm text-ink space-y-2">
                <li>Need more time? You can reschedule as many times as needed.</li>
                <li>Video meetings unlock 10 minutes before your session time.</li>
                <li>Marking complete requires the session time to have passed.</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-[#E7E5DD] p-5">
              <p className="text-xs font-medium text-[#6B6E76] uppercase tracking-wide mb-3">Quick links</p>
              <div className="space-y-2 text-sm">
                <button onClick={() => navigate(`/chat`)} className="block text-teal-text hover:underline text-left">Go to chat →</button>
                <Link to="/swap-requests" className="block text-teal-text hover:underline">Swap requests →</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default ActiveSwap;