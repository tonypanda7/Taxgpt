import { createContext, useContext, useState } from 'react';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
    const [messages, setMessages] = useState([]);

    // Track the user's financial profile parameters shared during onboarding or chats
    const [userProfile, setUserProfile] = useState({
        gross_income: null,
        rent_paid: null,
        deductions: null,
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
