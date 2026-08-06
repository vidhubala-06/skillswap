import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Meeting() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const jitsiContainerRef = useRef(null);
    const apiRef = useRef(null);

    const [roomId, setRoomId] = useState(null);
    const [token, setToken] = useState(null);
    const [partnerName, setPartnerName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRoom();
        return () => {
            if (apiRef.current) {
                apiRef.current.dispose();
            }
        };
    }, [id]);

    async function loadRoom() {
        try {
            const res = await axios.get(`http://localhost:5000/api/swap-requests/${id}/meeting-room`, { withCredentials: true });
            setRoomId(res.data.roomId);
            setToken(res.data.token);
            setPartnerName(res.data.partnerName);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load meeting room');
            setLoading(false);
            return;
        }
        setLoading(false);
    }

    useEffect(() => {
        if (!roomId || !token) return;

        const scriptId = 'jaas-external-api-script';
        let script = document.getElementById(scriptId);

        function initJitsi() {
            const domain = '8x8.vc';
            const options = {
                roomName: roomId,
                jwt: token,
                parentNode: jitsiContainerRef.current,
                width: '100%',
                height: '100%',
                userInfo: {
                    displayName: user?.email?.split('@')[0] || 'User'
                },
                configOverwrite: {
                    disableSimulcast: false
                },
                interfaceConfigOverwrite: {
                    TOOLBAR_BUTTONS: [
                        'microphone', 'camera', 'desktop', 'fullscreen', 'hangup', 'tileview'
                    ]
                }
            };
            apiRef.current = new window.JitsiMeetExternalAPI(domain, options);

            apiRef.current.addEventListener('readyToClose', () => {
                navigate(`/active-swap/${id}`);
            });
        }

        if (window.JitsiMeetExternalAPI) {
            initJitsi();
        } else if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://8x8.vc/libs/external_api.min.js';
            script.async = true;
            script.onload = initJitsi;
            document.body.appendChild(script);
        } else {
            script.onload = initJitsi;
        }
    }, [roomId, token]);

    if (loading) return <div className="p-8 text-gray-500">Loading meeting...</div>;
    if (error) return <div className="p-8 text-red-600">{error}</div>;

    return (
        <div className="h-screen flex flex-col bg-gray-900">
            <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between">
                <span className="text-sm">Meeting with {partnerName}</span>
                <button
                    onClick={() => navigate(`/active-swap/${id}`)}
                    className="text-sm bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
                >
                    ← Back to Swap
                </button>
            </div>
            <div ref={jitsiContainerRef} className="flex-1" />
        </div>
    );
}

export default Meeting;