import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export function useSocket() {
    const socketRef = useRef(null);

    useEffect(() => {
        socketRef.current = io('/', { withCredentials: true, path: '/socket.io' });
        return () => {
            socketRef.current.disconnect();
        };
    }, []);

    return socketRef;
}