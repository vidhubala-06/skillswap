import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { useSocket } from '../hooks/useSocket';

function Chat() {
    const { conversationId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const socketRef = useSocket();

    const [inbox, setInbox] = useState([]);
    const [messages, setMessages] = useState([]);
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
            axios.post(`http://localhost:5000/api/chat/${conversationId}/read`, {}, { withCredentials: true }).catch(() => {});
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

    return (
        <Layout>
            <div className="flex h-[70vh] bg-white border border-gray-200 rounded-lg overflow-hidden">
                {/* Inbox panel */}
                <div className="w-64 border-r border-gray-200 overflow-y-auto">
                    {loading ? (
                        <p className="p-4 text-sm text-gray-500">Loading...</p>
                    ) : inbox.length === 0 ? (
                        <p className="p-4 text-sm text-gray-500">No conversations yet.</p>
                    ) : (
                        inbox.map((c) => (
                            <button
                                key={c.conversationId}
                                onClick={() => navigate(`/chat/${c.conversationId}`)}
                                className={`w-full text-left p-3 border-b border-gray-100 hover:bg-gray-50 flex items-center justify-between ${conversationId === c.conversationId ? 'bg-blue-50' : ''
                                    }`}
                            >
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm truncate ${c.hasUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}`}>
                                        {c.otherUserName}
                                    </p>
                                    {c.lastMessage && (
                                        <p className={`text-xs truncate mt-0.5 ${c.hasUnread ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                                            {c.lastMessage}
                                        </p>
                                    )}
                                </div>
                                {c.hasUnread && <span className="w-2.5 h-2.5 bg-blue-600 rounded-full ml-2 flex-shrink-0"></span>}
                            </button>
                        ))
                    )}
                </div>

                {/* Thread panel */}
                <div className="flex-1 flex flex-col">
                    {!conversationId ? (
                        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                            Select a conversation
                        </div>
                    ) : (
                        <>
                            <div className="border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                                <span className="text-xs text-gray-400">Conversation</span>
                                <button onClick={() => setShowReport(!showReport)} className="text-xs text-red-500 hover:underline">
                                    Report User
                                </button>
                            </div>

                            {showReport && (
                                <form onSubmit={handleReport} className="px-4 py-2 bg-red-50 space-y-2">
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
                            {reportMessage && <p className="text-xs text-gray-500 px-4 pt-1">{reportMessage}</p>}

                            <div
                                ref={messagesContainerRef}
                                onScroll={handleScroll}
                                className="flex-1 overflow-y-auto p-4 space-y-2"
                            >
                                {loadingMore && <p className="text-center text-xs text-gray-400">Loading older messages...</p>}
                                {!hasMore && messages.length > 0 && (
                                    <p className="text-center text-xs text-gray-300">Beginning of conversation</p>
                                )}
                                {messages.map((m) => (
                                    <div
                                        key={m.id}
                                        className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${m.senderId === user.id
                                                ? 'bg-blue-600 text-white ml-auto'
                                                : 'bg-gray-100 text-gray-800'
                                            }`}
                                    >
                                        {m.messageType === 'image' ? (
                                            <a href={m.attachmentUrl} target="_blank" rel="noreferrer">
                                                <img src={m.attachmentUrl} alt={m.attachmentName} className="max-w-full rounded" />
                                            </a>
                                        ) : m.messageType === 'file' ? (
                                            <a
                                                href={m.attachmentUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className={`flex items-center gap-2 underline ${m.senderId === user.id ? 'text-white' : 'text-blue-600'}`}
                                            >
                                                📎 {m.attachmentName}
                                            </a>
                                        ) : (
                                            m.message
                                        )}
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {canSend ? (
                                <form onSubmit={handleSend} className="p-3 border-t border-gray-200 flex gap-2 items-center">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="text-gray-500 hover:text-blue-600 text-lg px-1 disabled:opacity-50"
                                        title="Attach a file"
                                    >
                                        📎
                                    </button>
                                    <input
                                        type="text"
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        type="submit"
                                        className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700"
                                    >
                                        Send
                                    </button>
                                </form>
                            ) : (
                                <div className="p-3 border-t border-gray-200 text-sm text-gray-500 bg-gray-50 text-center">
                                    This conversation is closed. Send a new swap request to reconnect.
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </Layout>
    );
}

export default Chat;