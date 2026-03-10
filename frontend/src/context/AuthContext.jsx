import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check local storage on initial load
    useEffect(() => {
        const storedUser = localStorage.getItem('taxcopilot_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = (email, password) => {
        // Mock login
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (email && password) {
                    const mockUser = { id: '1', email, name: email.split('@')[0], persona: 'salaried' };
                    setUser(mockUser);
                    localStorage.setItem('taxcopilot_user', JSON.stringify(mockUser));
                    resolve(mockUser);
                } else {
                    reject(new Error('Invalid credentials'));
                }
            }, 500);
        });
    };

    const register = (email, password) => {
        // Mock register
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (email && password) {
                    // Newly registered users do not have a persona yet
                    const mockUser = { id: Date.now().toString(), email, name: email.split('@')[0], persona: null };
                    setUser(mockUser);
                    localStorage.setItem('taxcopilot_user', JSON.stringify(mockUser));
                    resolve(mockUser);
                } else {
                    reject(new Error('Invalid details'));
                }
            }, 500);
        });
    };

    const updatePersona = (persona) => {
        if (user) {
            const updatedUser = { ...user, persona };
            setUser(updatedUser);
            localStorage.setItem('taxcopilot_user', JSON.stringify(updatedUser));
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('taxcopilot_user');
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout, updatePersona }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
