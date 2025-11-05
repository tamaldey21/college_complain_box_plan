// Configuration file for College Complaint Management System
// This file should be secured and not exposed publicly in production

const CONFIG = {
    // Firebase Configuration
    FIREBASE: {
        apiKey: "AIzaSyDd67PoGZu-JiY3sKQv_iIeyPRPK3LS5Ls",
        authDomain: "collegecomplaint-3adf9.firebaseapp.com",
        projectId: "collegecomplaint-3adf9",
        storageBucket: "collegecomplaint-3adf9.firebasestorage.app",
        messagingSenderId: "438967541707",
        appId: "1:438967541707:web:5d0a92c72599c1c673204e"
    },
    
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