import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { useSocket } from '../hooks/useSocket';

function formatDateSeparator(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a, b) => a.toDateString() === b.toDateString();

  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Chat() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const socketRef = useSocket();

  const [inbox, setInbox] = useState([]);
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null); // null = not searching, array = showing results
  const [canSend, setCanSend] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const messagesContainerRef = useRef(null);

  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportMessage, setReportMessage] = useState('');

  const currentConversation = inbox.find((c) => c.conversationId === conversationId);

  useEffect(() => {
    loadInbox();
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const handleNewChatSomewhere = () => loadInbox();
    socket.on('chat:new-message', handleNewChatSomewhere);
    return () => socket.off('chat:new-message', handleNewChatSomewhere);
  }, []);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
      axios.post(`http://localhost:5000/api/chat/${conversationId}/read`, {}, { withCredentials: true }).catch(() => { });
      const socket = socketRef.current;
      if (socket) {
        socket.emit('join-conversation', conversationId);
        socket.on('new-message', handleIncomingMessage);
      }
      return () => {
        if (socket) {
          socket.emit('leave-conversation', conversationId);
          socket.off('new-message', handleIncomingMessage);
        }
      };
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults(null);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/chat/search?q=${encodeURIComponent(searchQuery)}`, { withCredentials: true });
        setSearchResults(res.data.conversations);
      } catch (err) {
        console.error('Search failed');
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  function handleIncomingMessage(payload) {
    if (payload.conversationId === conversationId) {
      setMessages((prev) => [...prev, payload]);
    }
  }

  async function loadInbox() {
    try {
      const res = await axios.get('http://localhost:5000/api/chat/inbox', { withCredentials: true });
      setInbox(res.data.conversations);
    } catch (err) {
      console.error('Failed to load inbox');
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages() {
    try {
      const res = await axios.get(`http://localhost:5000/api/chat/${conversationId}/messages`, { withCredentials: true });
      setMessages(res.data.messages);
      setCanSend(res.data.canSend);
      setHasMore(res.data.messages.length === 50); // if we got a full page, there might be more
    } catch (err) {
      console.error('Failed to load messages');
    }
  }

  async function loadOlderMessages() {
    if (loadingMore || !hasMore || messages.length === 0) return;

    setLoadingMore(true);
    const oldestTimestamp = messages[0].createdAt;
    const container = messagesContainerRef.current;
    const prevScrollHeight = container.scrollHeight;

    try {
      const res = await axios.get(
        `http://localhost:5000/api/chat/${conversationId}/messages?before=${encodeURIComponent(oldestTimestamp)}`,
        { withCredentials: true }
      );
      const older = res.data.messages;

      if (older.length === 0) {
        setHasMore(false);
      } else {
        setMessages((prev) => [...older, ...prev]);
        setHasMore(older.length === 50);

        // preserve scroll position so the view doesn't jump after prepending older messages
        requestAnimationFrame(() => {
          container.scrollTop = container.scrollHeight - prevScrollHeight;
        });
      }
    } catch (err) {
      console.error('Failed to load older messages');
    } finally {
      setLoadingMore(false);
    }
  }

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container && container.scrollTop < 50) {
      loadOlderMessages();
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    try {
      await axios.post(
        `http://localhost:5000/api/chat/${conversationId}/messages`,
        { message: messageText },
        { withCredentials: true }
      );
      setMessageText('');
      // no need to manually add to messages — our own socket connection also receives the 'new-message' event
    } catch (err) {
      console.error('Failed to send message');
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(
        `http://localhost:5000/api/chat/${conversationId}/upload`,
        formData,
        { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } }
      );
      // no need to manually add to messages — our socket connection also receives 'new-message'
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
      e.target.value = ''; // reset so selecting the same file again still triggers onChange
    }
  };

  const handleReport = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        'http://localhost:5000/api/reports',
        { conversationId, reason: reportReason },
        { withCredentials: true }
      );
      setReportMessage('Report submitted.');
      setShowReport(false);
      setReportReason('');
    } catch (err) {
      setReportMessage(err.response?.data?.error || 'Something went wrong');
    }
  };

  const handleHideConversation = async (e, convId) => {
    e.stopPropagation(); // don't trigger navigation when clicking the remove button
    try {
      await axios.post(`http://localhost:5000/api/chat/${convId}/hide`, {}, { withCredentials: true });
      loadInbox();
    } catch (err) {
      console.error('Failed to remove conversation');
    }
  };

  return (
    <Layout wide>
      <div className="relative -mx-6 px-6 -mt-10 pt-10 pb-2 dot-grid overflow-hidden">
        <div className="absolute top-10 right-0 w-72 h-72 bg-teal-brand/[0.06] rounded-full blur-3xl animate-[float_6s_ease-in-out_infinite] pointer-events-none"></div>
        <div className="absolute top-40 left-0 w-64 h-64 bg-violet-brand/[0.06] rounded-full blur-3xl animate-[float_7s_ease-in-out_infinite_1s] pointer-events-none"></div>

        <div className="relative mb-4 animate-fade-in-up" style={{ opacity: 0 }}>
          <h1 className="font-display text-2xl font-semibold text-ink">Chat</h1>
          <p className="text-sm text-[#6B6E76] mt-1">Coordinate with people you've matched with.</p>
        </div>

        <div className="relative flex h-[calc(100vh-140px)] bg-white border border-[#E7E5DD] rounded-xl overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms', opacity: 0 }}>
          {/* Inbox panel */}
          <div className="w-64 border-r border-[#E7E5DD] flex flex-col">
            <div className="p-3 border-b border-[#E7E5DD]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full border border-[#D8D6CC] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-brand/40"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <p className="p-4 text-sm text-[#9A9890]">Loading...</p>
              ) : searchResults !== null ? (
                searchResults.length === 0 ? (
                  <p className="p-4 text-sm text-[#9A9890]">No matches found.</p>
                ) : (
                  searchResults.map((c) => (
                    <button
                      key={c.conversationId}
                      onClick={() => { navigate(`/chat/${c.conversationId}`); setSearchQuery(''); }}
                      className="w-full text-left p-3 border-b border-[#F1EFE8] hover:bg-[#F5F4EF] flex items-center gap-2.5 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-teal-bg text-teal-text font-display font-semibold text-xs flex items-center justify-center flex-shrink-0">
                        {c.otherUserName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#3D3D3A] truncate">{c.otherUserName}</p>
                        {c.isHidden ? <p className="text-xs text-[#B4B2A9] italic">Removed — click to reopen</p> : null}
                      </div>
                    </button>
                  ))
                )
              ) : inbox.length === 0 ? (
                <p className="p-4 text-sm text-[#9A9890]">No conversations yet.</p>
              ) : (
                inbox.map((c) => (
                  <div key={c.conversationId} className="relative group">
                    <button
                      onClick={() => navigate(`/chat/${c.conversationId}`)}
                      className={`w-full text-left p-3 border-b border-[#F1EFE8] hover:bg-[#F5F4EF] flex items-center gap-2.5 transition-colors ${conversationId === c.conversationId ? 'bg-teal-bg/50' : ''
                        }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-teal-bg text-teal-text font-display font-semibold text-xs flex items-center justify-center flex-shrink-0">
                        {c.otherUserName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm truncate ${c.hasUnread ? 'font-semibold text-ink' : 'font-medium text-[#3D3D3A]'}`}>
                            {c.otherUserName}
                          </p>
                          {c.lastMessageAt && (
                            <span className="text-[10px] text-[#B4B2A9] flex-shrink-0 ml-2">
                              {new Date(c.lastMessageAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                        {c.lastMessage && (
                          <p className={`text-xs truncate mt-0.5 ${c.hasUnread ? 'text-[#3D3D3A] font-medium' : 'text-[#9A9890]'}`}>
                            {c.lastMessage}
                          </p>
                        )}
                      </div>
                      {c.hasUnread && <span className="w-2.5 h-2.5 bg-teal-brand rounded-full ml-2 flex-shrink-0"></span>}
                    </button>
                    {!c.canSend && (
                      <button
                        onClick={(e) => handleHideConversation(e, c.conversationId)}
                        className="absolute top-2 right-2 text-[#B4B2A9] hover:text-[#791F1F] opacity-0 group-hover:opacity-100 transition-opacity text-sm w-5 h-5 flex items-center justify-center"
                        title="Remove from list"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Thread panel */}
          <div className="flex-1 flex flex-col">
            {!conversationId ? (
              <div className="flex-1 flex items-center justify-center text-[#9A9890] text-sm">
                Select a conversation
              </div>
            ) : (
              <>
                {/* Thread header */}
                <div className="border-b border-[#E7E5DD] px-5 py-3.5 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-teal-bg text-teal-text font-display font-semibold text-sm flex items-center justify-center flex-shrink-0">
                      {currentConversation?.otherUserName?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-display font-semibold text-ink truncate">
                        {currentConversation?.otherUserName || 'Conversation'}
                      </p>
                      <p className={`text-xs ${canSend ? 'text-teal-text' : 'text-[#9A9890]'}`}>
                        {canSend ? 'Active' : 'Closed'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setShowReport(!showReport)} className="text-xs text-[#B4B2A9] hover:text-[#993C1D] transition-colors flex-shrink-0">
                    Report
                  </button>
                </div>

                {showReport && (
                  <form onSubmit={handleReport} className="px-4 py-3 bg-[#FCEBEB] space-y-2 border-b border-[#F7C1C1]">
                    <textarea
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder="Describe the issue..."
                      rows={2}
                      required
                      className="w-full border border-[#F7C1C1] rounded-lg px-2 py-1.5 text-sm bg-white"
                    />
                    <button type="submit" className="bg-[#993C1D] text-white text-xs px-3 py-1.5 rounded-lg hover:bg-[#791F1F] transition-colors">
                      Submit report
                    </button>
                  </form>
                )}
                {reportMessage && <p className="text-xs text-[#9A9890] px-4 pt-1.5">{reportMessage}</p>}

                {/* Messages */}
                <div
                  ref={messagesContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto p-4 space-y-1 bg-[#FAFAF8]"
                >
                  {loadingMore && <p className="text-center text-xs text-[#9A9890] mb-2">Loading older messages...</p>}
                  {!hasMore && messages.length > 0 && (
                    <p className="text-center text-xs text-[#B4B2A9] mb-2">Beginning of conversation</p>
                  )}

                  {messages.map((m, i) => {
                    const showDateSeparator = i === 0 || formatDateSeparator(m.createdAt) !== formatDateSeparator(messages[i - 1].createdAt);
                    const isMine = m.senderId === user.id;

                    return (
                      <div key={m.id}>
                        {showDateSeparator && (
                          <div className="flex justify-center my-4">
                            <span className="text-xs text-[#9A9890] bg-[#F1EFE8] px-3 py-1 rounded-full">
                              {formatDateSeparator(m.createdAt)}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1.5 animate-fade-in-up`} style={{ animationDuration: '0.3s' }}>
                          <div
                            className={`max-w-[70%] px-3.5 py-2 text-sm shadow-sm ${isMine
                              ? 'bg-teal-brand text-white rounded-2xl rounded-br-md'
                              : 'bg-white text-ink rounded-2xl rounded-bl-md border border-[#E7E5DD]'
                              }`}
                          >
                            {m.messageType === 'image' ? (
                              <a href={m.attachmentUrl} target="_blank" rel="noreferrer">
                                <img src={m.attachmentUrl} alt={m.attachmentName} className="max-w-full rounded-lg" />
                              </a>
                            ) : m.messageType === 'file' ? (
                              <a
                                href={m.attachmentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className={`flex items-center gap-2 underline ${isMine ? 'text-white' : 'text-teal-text'}`}
                              >
                                {m.attachmentName}
                              </a>
                            ) : (
                              m.message
                            )}
                            <p className={`text-[10px] mt-1 text-right ${isMine ? 'text-white/70' : 'text-[#B4B2A9]'}`}>
                              {new Date(m.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                {canSend ? (
                  <form onSubmit={handleSend} className="p-3 border-t border-[#E7E5DD] flex gap-2 items-center bg-white">
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-9 h-9 flex-shrink-0 flex items-center justify-center text-[#9A9890] hover:text-teal-text hover:bg-[#F1EFE8] rounded-full transition-colors disabled:opacity-50"
                      title="Attach a file"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
                    </button>
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 border border-[#D8D6CC] rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-brand/40 focus:border-teal-brand"
                    />
                    <button
                      type="submit"
                      disabled={!messageText.trim()}
                      className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-teal-brand text-white rounded-full hover:bg-teal-brand/90 disabled:opacity-40 transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
                    </button>
                  </form>
                ) : (
                  <div className="p-3 border-t border-[#E7E5DD] text-sm text-[#9A9890] bg-[#F5F4EF] text-center">
                    This conversation is closed. Send a new swap request to reconnect.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Chat;