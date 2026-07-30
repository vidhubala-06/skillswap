import { createContext, useContext, useState } from 'react';

const NavLockContext = createContext(null);

export function NavLockProvider({ children }) {
    const [locked, setLocked] = useState(false);
    const [lockMessage, setLockMessage] = useState('');

    const lockNavigation = (message) => {
        setLocked(true);
        setLockMessage(message);
    };

    const unlockNavigation = () => {
        setLocked(false);
        setLockMessage('');
    };

    return (
        <NavLockContext.Provider value={{ locked, lockMessage, lockNavigation, unlockNavigation }}>
            {children}
        </NavLockContext.Provider>
    );
}

export function useNavLock() {
    return useContext(NavLockContext);
}