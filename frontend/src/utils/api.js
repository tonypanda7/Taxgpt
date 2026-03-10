import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000'; // Define backend URL

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const api = {
    // Chat API
    chat: {
        sendMessage: async (query, userProfile = null) => {
            try {
                // The backend expects {"query": "message", "user_profile": {}}
                const response = await apiClient.post('/tax/chat', { query, user_profile: userProfile });
                return response.data;
            } catch (error) {
                console.error('Error sending message:', error);
                throw error;
            }
        },
        // Mock getHistory since backend doesn't have a history endpoint yet
        // The PRD mentions conversation history is a requirement, but it seems
        // the backend endpoint for fetching history isn't fully implemented in api/tax.py
        getHistory: async () => {
            // Return a simulated initial greeting if no history exists on backend yet
            return [
                {
                    id: 1,
                    role: 'assistant',
                    text: "Hi! I'm your AI Tax Copilot. I'm now connected to the real backend. How can I help you save tax today?",
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                }
            ];
        }
    },
    // Tax API
    tax: {
        getComparison: async () => {
            try {
                const response = await apiClient.get('/tax/comparison');
                return response.data;
            } catch (error) {
                console.error('Error fetching tax comparison:', error);
                throw error;
            }
        }
    }
};
