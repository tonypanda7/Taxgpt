import { createContext, useContext, useState } from 'react';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
    const [messages, setMessages] = useState([]);

    // Track the user's financial profile parameters shared during onboarding or chats
    const [userProfile, setUserProfile] = useState({
        salary: null,
        basic_salary: null,
        hra_received: null,
        rent_paid: null,
        section_80c: null,
        section_80d: null,
        other_deductions: null,
        deductions: null,       // total deductions computed at onboarding end
        financial_year: 'FY 2024-25'
    });

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
