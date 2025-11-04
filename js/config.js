// Configuration file for College Complaint Management System
// This file should be secured and not exposed publicly in production

const CONFIG = {
    // AI API Configuration
    AI_API: {
        // OpenAI API configuration
        OPENAI_API_KEY: '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', // Your actual API key
        OPENAI_API_URL: 'https://api.openai.com/v1/chat/completions',
        OPENAI_MODEL: 'gpt-3.5-turbo',
        
        // Alternative: Hugging Face API configuration
        HUGGING_FACE_API_KEY: 'YOUR_HUGGING_FACE_API_KEY', // Replace with your actual API key
        HUGGING_FACE_API_URL: 'https://api-inference.huggingface.co/models/',
        
        // AI Provider selection (openai, huggingface, or none to disable)
        PROVIDER: 'openai', // Using OpenAI
        
        // AI Settings
        ENABLED: true, // Enable AI features
        MAX_TOKENS: 150,
        TEMPERATURE: 0.7
    },
    
    // System settings
    SYSTEM: {
        NAME: 'College Assistant',
        VERSION: '1.0.0'
    }
};

// Export configuration (for Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

// For browser environment, make it available globally
if (typeof window !== 'undefined') {
    window.APP_CONFIG = CONFIG;
}