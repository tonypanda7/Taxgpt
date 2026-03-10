import { createContext, useContext, useState, useEffect } from 'react';

const ChatContext = createContext(null);

const PROFILE_STORAGE_KEY = 'taxcopilot_profile';

const defaultProfile = {
    salary: null,
    basic_salary: null,
    hra_received: null,
    rent_paid: null,
    section_80c: null,
    section_80d: null,
    other_deductions: null,
    deductions: null,
    financial_year: 'FY 2024-25'
};

export function ChatProvider({ children }) {
    const [messages, setMessages] = useState([]);

    // Load persisted profile from localStorage on mount
    const [userProfile, setUserProfileState] = useState(() => {
        try {
            const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
            return stored ? JSON.parse(stored) : { ...defaultProfile };
        } catch {
            return { ...defaultProfile };
        }
    });

    // Persist profile to localStorage whenever it changes
    const setUserProfile = (profile) => {
        setUserProfileState(profile);
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    };

    const clearChat = () => {
        setMessages([]);
    };

    return (
        <ChatContext.Provider value={{ messages, setMessages, userProfile, setUserProfile, clearChat }}>
            {children}
        </ChatContext.Provider>
    );
}

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) throw new Error('useChat must be used within a ChatProvider');
    return context;
};
