// Student Dashboard functionality for College Complaint Management System

let currentUser = null;
let chatbotState = 0; // Track chatbot conversation state
let complaintData = {}; // Store complaint data during chatbot conversation
let chatHistory = []; // Store chat history for AI context

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    currentUser = getCurrentUser();
    if (!currentUser || currentUser.type !== 'student') {
        window.location.href = 'index.html';
        return;
    }
    
    // Load student data
    loadStudentData(currentUser);
    setupEventListeners();
    initializeChatbot();
});

// Load student data
function loadStudentData(userData) {
    // Update form fields
    document.getElementById('studentName').value = userData.name || '';
    document.getElementById('enrollmentNumber').value = userData.enrollmentNumber || '';
    
    // Update profile view
    document.getElementById('profileName').value = userData.name || '';
    document.getElementById('profileEnrollment').value = userData.enrollmentNumber || '';
    document.getElementById('profileEmail').value = userData.email || '';
    
    // Load dashboard stats
    loadDashboardStats();
    loadRecentComplaints();
}

// Load dashboard statistics
function loadDashboardStats() {
    // In a real implementation, this would fetch from a database
    // For now, we'll simulate with sample data
    document.getElementById('totalComplaints').textContent = '5';
    document.getElementById('pendingComplaints').textContent = '2';
    document.getElementById('resolvedComplaints').textContent = '3';
}

// Load recent complaints
function loadRecentComplaints() {
    // In a real implementation, this would fetch from a database
    // For now, we'll simulate with sample data
    const tableBody = document.getElementById('recentComplaintsTable');
    tableBody.innerHTML = `
        <tr>
            <td>CMPL-001</td>
            <td>Hostel/Mess</td>
            <td>No hot water in hostel</td>
            <td><span class="status-badge badge-resolved">Resolved</span></td>
            <td>2025-10-25</td>
            <td>
                <button class="btn btn-sm btn-primary btn-action">View</button>
            </td>
        </tr>
        <tr>
            <td>CMPL-003</td>
            <td>Academic</td>
            <td>Issue with course material</td>
            <td><span class="status-badge badge-pending">Pending</span></td>
            <td>2025-10-28</td>
            <td>
                <button class="btn btn-sm btn-primary btn-action">View</button>
            </td>
        </tr>
    `;
}

// Setup event listeners
function setupEventListeners() {
    // Navigation links (dropdown menu only now)
    document.getElementById('dashboardSystemLink').addEventListener('click', (e) => {
        e.preventDefault();
        showView('dashboardView');
    });
    
    document.getElementById('newComplaintSystemLink').addEventListener('click', (e) => {
        e.preventDefault();
        showView('newComplaintView');
    });
    
    document.getElementById('myComplaintsSystemLink').addEventListener('click', (e) => {
        e.preventDefault();
        showView('myComplaintsView');
        loadMyComplaints();
    });
    
    document.getElementById('profileSystemLink').addEventListener('click', (e) => {
        e.preventDefault();
        showView('profileView');
    });
    
    document.getElementById('settingsSystemLink').addEventListener('click', (e) => {
        e.preventDefault();
        showView('settingsView');
    });
    
    // Complaint form submission
    const complaintForm = document.getElementById('complaintForm');
    if (complaintForm) {
        complaintForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitComplaint();
        });
    }
    
    // Change password form
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            changePassword();
        });
    }
}

// Show specific view
function showView(viewId) {
    // Hide all views
    document.getElementById('dashboardView').style.display = 'none';
    document.getElementById('newComplaintView').style.display = 'none';
    document.getElementById('myComplaintsView').style.display = 'none';
    document.getElementById('profileView').style.display = 'none';
    document.getElementById('settingsView').style.display = 'none';
    
    // Show selected view
    document.getElementById(viewId).style.display = 'block';
}

// Load my complaints
function loadMyComplaints() {
    // In a real implementation, this would fetch from a database
    // For now, we'll simulate with sample data
    const tableBody = document.getElementById('myComplaintsTable');
    tableBody.innerHTML = `
        <tr>
            <td>CMPL-001</td>
            <td>Hostel/Mess</td>
            <td>No hot water in hostel</td>
            <td><span class="status-badge badge-resolved">Resolved</span></td>
            <td>2025-10-25</td>
            <td>
                <button class="btn btn-sm btn-primary btn-action">View</button>
            </td>
        </tr>
        <tr>
            <td>CMPL-002</td>
            <td>Exam Related</td>
            <td>Exam schedule conflict</td>
            <td><span class="status-badge badge-resolved">Resolved</span></td>
            <td>2025-10-26</td>
            <td>
                <button class="btn btn-sm btn-primary btn-action">View</button>
            </td>
        </tr>
        <tr>
            <td>CMPL-003</td>
            <td>Academic</td>
            <td>Issue with course material</td>
            <td><span class="status-badge badge-pending">Pending</span></td>
            <td>2025-10-28</td>
            <td>
                <button class="btn btn-sm btn-primary btn-action">View</button>
            </td>
        </tr>
        <tr>
            <td>CMPL-004</td>
            <td>Disciplinary</td>
            <td>Library noise complaint</td>
            <td><span class="status-badge badge-resolved">Resolved</span></td>
            <td>2025-10-29</td>
            <td>
                <button class="btn btn-sm btn-primary btn-action">View</button>
            </td>
        </tr>
        <tr>
            <td>CMPL-005</td>
            <td>Other</td>
            <td>Wi-Fi connectivity issue</td>
            <td><span class="status-badge badge-resolved">Resolved</span></td>
            <td>2025-10-30</td>
            <td>
                <button class="btn btn-sm btn-primary btn-action">View</button>
            </td>
        </tr>
    `;
}

// Submit complaint
function submitComplaint() {
    const complaintData = {
        studentId: currentUser.id,
        studentName: currentUser.name,
        enrollmentNumber: currentUser.enrollmentNumber,
        houseName: document.getElementById('houseName').value,
        roomNumber: document.getElementById('roomNumber').value,
        complaintType: document.getElementById('complaintType').value,
        complaintDescription: document.getElementById('complaintDescription').value,
        status: 'pending',
        createdAt: new Date().toISOString(),
        assignedTo: getInitialAuthority(document.getElementById('complaintType').value)
    };
    
    // In a real implementation, this would save to a database
    // For now, we'll just show a success message
    alert('Complaint submitted successfully! Complaint ID: CMPL-' + Math.floor(Math.random() * 1000 + 1000));
    
    // Reset form
    document.getElementById('complaintForm').reset();
    
    // Switch to dashboard view
    showView('dashboardView');
    
    // Refresh dashboard stats
    loadDashboardStats();
    loadRecentComplaints();
}

// Determine initial authority based on complaint type
function getInitialAuthority(complaintType) {
    const authorityMap = {
        'hostel': 'warden',
        'academic': 'mentor',
        'exam': 'examcell',
        'disciplinary': 'disciplinary',
        'other': 'registrar'
    };
    
    return authorityMap[complaintType] || 'registrar';
}

// Change password
function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        alert('New passwords do not match');
        return;
    }
    
    if (newPassword.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
    }
    
    // Show loading state
    const submitBtn = document.querySelector('#changePasswordForm button');
    const originalBtnText = submitBtn.textContent;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating...';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        alert('Password updated successfully');
        document.getElementById('changePasswordForm').reset();
        
        // Reset button
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
    }, 500);
}

// Initialize chatbot
function initializeChatbot() {
    const chatbotToggle = document.getElementById('chatbotToggle');
    const chatbotWidget = document.getElementById('chatbotWidget');
    const chatbotClose = document.getElementById('chatbotClose');
    const chatbotSend = document.getElementById('chatbotSend');
    const chatbotInput = document.getElementById('chatbotInput');
    
    // Check if chatbot elements exist
    if (!chatbotToggle || !chatbotWidget || !chatbotClose || !chatbotSend || !chatbotInput) {
        console.error('Chatbot elements not found in the DOM');
        return;
    }
    
    // Toggle chatbot visibility
    chatbotToggle.addEventListener('click', () => {
        chatbotWidget.style.display = chatbotWidget.style.display === 'flex' ? 'none' : 'flex';
        if (chatbotWidget.style.display === 'flex') {
            chatbotInput.focus();
        }
    });
    
    // Close chatbot
    chatbotClose.addEventListener('click', () => {
        chatbotWidget.style.display = 'none';
    });
    
    // Send message on button click
    chatbotSend.addEventListener('click', () => {
        sendMessage();
    });
    
    // Send message on Enter key
    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Add initial bot message
    addBotMessage("Hi there! I'm your College Assistant. How can I help you today?");
    
    console.log('Chatbot initialized successfully');
}

// Send message function
function sendMessage() {
    const chatbotInput = document.getElementById('chatbotInput');
    const message = chatbotInput.value.trim();
    
    if (message) {
        // Add user message
        addUserMessage(message);
        chatbotInput.value = '';
        
        // Process message and generate bot response
        setTimeout(() => {
            processUserMessage(message);
        }, 500);
    }
}

// Add user message to chat
function addUserMessage(message) {
    const messagesContainer = document.getElementById('chatbotMessages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'user-message');
    messageElement.textContent = message;
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Add to chat history
    chatHistory.push({role: "user", content: message});
}

// Add bot message to chat
function addBotMessage(message, buttons = null) {
    const messagesContainer = document.getElementById('chatbotMessages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'bot-message');
    
    // Add message text
    const textElement = document.createElement('div');
    textElement.textContent = message;
    messageElement.appendChild(textElement);
    
    // Add buttons if provided
    if (buttons) {
        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('button-container');
        buttonContainer.style.marginTop = '10px';
        
        buttons.forEach(button => {
            const btn = document.createElement('button');
            btn.classList.add('btn', 'btn-sm', 'btn-outline-primary', 'me-2', 'mb-2');
            btn.textContent = button.text;
            btn.onclick = () => {
                // Add user message for the button click
                addUserMessage(button.text);
                // Process the button action
                if (button.action) {
                    button.action();
                }
            };
            buttonContainer.appendChild(btn);
        });
        
        messageElement.appendChild(buttonContainer);
    }
    
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Add to chat history
    chatHistory.push({role: "assistant", content: message});
}

// Process user message and generate response using AI
async function processUserMessage(message) {
    message = message.toLowerCase();
    
    // Reset chatbot if user says "reset" or "start over"
    if (message.includes('reset') || message.includes('start over')) {
        chatbotState = 0;
        complaintData = {};
        chatHistory = [];
        addBotMessage("Okay, let's start over. How can I help you today?");
        return;
    }
    
    // Check if AI is enabled and available
    const config = window.APP_CONFIG || { AI_API: { ENABLED: false, PROVIDER: 'none' } };
    
    console.log('AI Config:', config);
    
    if (config.AI_API.ENABLED && config.AI_API.PROVIDER !== 'none') {
        try {
            // Use AI to generate response
            console.log('Attempting to use AI for response');
            const aiResponse = await getAIResponse(message);
            if (aiResponse && aiResponse !== "undefined") {
                addBotMessage(aiResponse);
            } else {
                throw new Error("Received undefined response from AI");
            }
        } catch (error) {
            console.error('AI API error:', error);
            // Fallback to original rule-based system with a helpful message
            addBotMessage("I'm currently unable to connect to the AI service. Let me help you with our standard options instead.");
            processUserMessageFallback(message);
        }
    } else {
        // Use original rule-based system
        console.log('Using fallback rule-based system');
        processUserMessageFallback(message);
    }
}

// Get response from AI API with improved error handling
async function getAIResponse(userMessage) {
    const config = window.APP_CONFIG || {};
    const aiConfig = config.AI_API || {};
    
    console.log('AI Configuration:', aiConfig);
    
    // Prepare messages for AI context
    const messages = [
        {
            role: "system",
            content: "You are a helpful college assistant for a student complaint management system. You help students with their queries about college life, academics, hostel facilities, and help them file complaints. Keep responses concise and helpful. When appropriate, guide users to file complaints through the system. Do not provide responses that could be harmful or inappropriate."
        },
        ...chatHistory.slice(-10), // Include last 10 messages for context
        {role: "user", content: userMessage}
    ];
    
    try {
        // Try using the OpenAI SDK first if available
        if (typeof OpenAI !== 'undefined') {
            console.log('Using OpenAI SDK');
            try {
                // Get API key from config if available
                const apiKey = aiConfig.OPENAI_API_KEY || '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';
                
                if (!apiKey || apiKey === 'YOUR_OPENAI_API_KEY') {
                    throw new Error("OpenAI API key not configured");
                }
                
                const openai = new OpenAI({
                    apiKey: apiKey,
                    dangerouslyAllowBrowser: true // Required for client-side usage
                });
                
                const response = await openai.chat.completions.create({
                    model: aiConfig.OPENAI_MODEL || 'gpt-3.5-turbo',
                    messages: messages,
                    temperature: aiConfig.TEMPERATURE || 0.7,
                    max_tokens: aiConfig.MAX_TOKENS || 150
                });
                
                console.log('OpenAI API Response:', response);
                
                if (response && response.choices && response.choices.length > 0) {
                    const content = response.choices[0].message.content;
                    return content ? content.trim() : "I'm here to help! What can I assist you with?";
                } else {
                    throw new Error("Unexpected response format from OpenAI API");
                }
            } catch (sdkError) {
                console.error('OpenAI SDK error:', sdkError);
                // Fall back to fetch API
                return await fetchAIResponse(aiConfig, messages);
            }
        } else {
            // Fall back to fetch API
            return await fetchAIResponse(aiConfig, messages);
        }
    } catch (error) {
        console.error('Error getting AI response:', error);
        throw error;
    }
}

// Fetch AI response using fetch API
async function fetchAIResponse(aiConfig, messages) {
    try {
        // Get API key from config if available
        const apiKey = aiConfig.OPENAI_API_KEY || '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';
        
        if (!apiKey || apiKey === 'YOUR_OPENAI_API_KEY') {
            throw new Error("OpenAI API key not configured");
        }
        
        const response = await fetchWithTimeout(aiConfig.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: aiConfig.OPENAI_MODEL || 'gpt-3.5-turbo',
                messages: messages,
                temperature: aiConfig.TEMPERATURE || 0.7,
                max_tokens: aiConfig.MAX_TOKENS || 150
            })
        }, 10000); // 10 second timeout
        
        console.log('API Response Status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`AI API error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('API Response Data:', data);
        
        if (data && data.choices && data.choices.length > 0) {
            const content = data.choices[0].message.content;
            return content ? content.trim() : "I'm here to help! What can I assist you with?";
        } else {
            throw new Error("Unexpected response format from API");
        }
    } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        throw fetchError;
    }
}

// Fetch with timeout
function fetchWithTimeout(url, options, timeout) {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeout)
        )
    ]);
}

// Original rule-based processing as fallback with enhanced functionality
function processUserMessageFallback(message) {
    message = message.toLowerCase();
    
    // Enhanced keyword-based responses for common queries
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
        addBotMessage("Hello! I'm your College Assistant. I can help you file complaints or answer questions about college services. What would you like to know?");
        return;
    }
    
    if (message.includes('bye') || message.includes('goodbye')) {
        addBotMessage("Goodbye! Feel free to come back if you need any assistance.");
        return;
    }
    
    if (message.includes('complaint') || message.includes('issue') || message.includes('problem')) {
        addBotMessage("I can help you file a complaint. What type of complaint do you have?", [
            { text: "Hostel/Mess", action: () => { complaintData.complaintType = 'hostel'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } },
            { text: "Academic", action: () => { complaintData.complaintType = 'academic'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } },
            { text: "Exam Related", action: () => { complaintData.complaintType = 'exam'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } },
            { text: "Disciplinary Issue", action: () => { complaintData.complaintType = 'disciplinary'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } },
            { text: "Other", action: () => { complaintData.complaintType = 'other'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } }
        ]);
        return;
    }
    
    if (message.includes('status') || message.includes('check')) {
        addBotMessage("You can check the status of your complaints by navigating to the 'My Complaints' section in your dashboard.");
        return;
    }
    
    if (message.includes('contact') || message.includes('help')) {
        addBotMessage("You can reach out to the college administration through the following contacts:\n- Academic Issues: academic@college.edu\n- Hostel Issues: hostel@college.edu\n- General Enquiries: info@college.edu");
        return;
    }
    
    if (message.includes('file') || message.includes('submit')) {
        addBotMessage("I can help you file a complaint. What type of complaint do you have?", [
            { text: "Hostel/Mess", action: () => { complaintData.complaintType = 'hostel'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } },
            { text: "Academic", action: () => { complaintData.complaintType = 'academic'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } },
            { text: "Exam Related", action: () => { complaintData.complaintType = 'exam'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } },
            { text: "Disciplinary Issue", action: () => { complaintData.complaintType = 'disciplinary'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } },
            { text: "Other", action: () => { complaintData.complaintType = 'other'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } }
        ]);
        return;
    }
    
    if (message.includes('thank')) {
        addBotMessage("You're welcome! Is there anything else I can help you with?");
        return;
    }
    
    // Handle the repetitive response issue
    if (message.includes('guide') || message.includes('process') || message.includes('filing')) {
        addBotMessage("I can help you file a complaint. What type of complaint do you have?", [
            { text: "Hostel/Mess", action: () => { complaintData.complaintType = 'hostel'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } },
            { text: "Academic", action: () => { complaintData.complaintType = 'academic'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } },
            { text: "Exam Related", action: () => { complaintData.complaintType = 'exam'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } },
            { text: "Disciplinary Issue", action: () => { complaintData.complaintType = 'disciplinary'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } },
            { text: "Other", action: () => { complaintData.complaintType = 'other'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } }
        ]);
        return;
    }
    
    // Prevent repetitive responses by checking chat history
    const lastBotMessage = chatHistory.length > 0 ? chatHistory[chatHistory.length - 1].content : "";
    if (lastBotMessage.includes("formal complaint through our system")) {
        addBotMessage("I can help you file a complaint. What type of complaint do you have?", [
            { text: "Hostel/Mess", action: () => { complaintData.complaintType = 'hostel'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } },
            { text: "Academic", action: () => { complaintData.complaintType = 'academic'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } },
            { text: "Exam Related", action: () => { complaintData.complaintType = 'exam'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } },
            { text: "Disciplinary Issue", action: () => { complaintData.complaintType = 'disciplinary'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } },
            { text: "Other", action: () => { complaintData.complaintType = 'other'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } }
        ]);
        return;
    }
    
    // More specific responses for common queries
    if (message.includes("mess")) {
        addBotMessage("Are you having issues with the mess facilities? You can file a complaint about this, and it will be directed to the hostel administration. Would you like me to help you file a complaint?", [
            { text: "Yes, File Complaint", action: () => { complaintData.complaintType = 'hostel'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } },
            { text: "No, Thanks", action: () => { addBotMessage("Okay, let me know if there's anything else I can help you with."); } }
        ]);
        return;
    }
    
    if (message.includes("wifi") || message.includes("internet") || message.includes("network")) {
        addBotMessage("I understand you're having connectivity issues. This could be related to hostel facilities or campus Wi-Fi. Would you like to file a complaint about this issue?", [
            { text: "Yes, File Complaint", action: () => { complaintData.complaintType = 'other'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } },
            { text: "No, Thanks", action: () => { addBotMessage("Okay, let me know if there's anything else I can help you with."); } }
        ]);
        return;
    }
    
    if (message.includes("exam") || message.includes("test") || message.includes("grade")) {
        addBotMessage("Exam-related issues are important. I can help you file a formal complaint that will be reviewed by the examination department. Would you like to proceed?", [
            { text: "Yes, File Complaint", action: () => { complaintData.complaintType = 'exam'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } },
            { text: "No, Thanks", action: () => { addBotMessage("Okay, let me know if there's anything else I can help you with."); } }
        ]);
        return;
    }
    
    // Original state-based processing
    switch (chatbotState) {
        case 0: // Getting name
            complaintData.name = message;
            chatbotState = 1;
            addBotMessage(`Nice to meet you, ${message.charAt(0).toUpperCase() + message.slice(1)}! What is your enrollment number?`);
            break;
            
        case 1: // Getting enrollment number
            complaintData.enrollmentNumber = message.toUpperCase();
            chatbotState = 2;
            addBotMessage("Are you a hosteller or a day scholar?", [
                { text: "Hosteller", action: () => { complaintData.accommodationType = 'hosteller'; chatbotState = 3; addBotMessage("Great! What is your house name?"); } },
                { text: "Day Scholar", action: () => { complaintData.accommodationType = 'dayScholar'; chatbotState = 4; addBotMessage("Thanks for that information. What is your address?"); } }
            ]);
            break;
            
        case 2: // Getting accommodation type (handled by buttons now)
            // This case is now handled by buttons, but kept for backward compatibility
            if (message.includes('hostel') || message.includes('hosteller')) {
                complaintData.accommodationType = 'hosteller';
                chatbotState = 3;
                addBotMessage("Great! What is your house name?");
            } else if (message.includes('day') || message.includes('scholar')) {
                complaintData.accommodationType = 'dayScholar';
                chatbotState = 4;
                addBotMessage("Thanks for that information. What is your address?");
            } else {
                addBotMessage("I didn't understand that. Are you a hosteller or a day scholar?", [
                    { text: "Hosteller", action: () => { complaintData.accommodationType = 'hosteller'; chatbotState = 3; addBotMessage("Great! What is your house name?"); } },
                    { text: "Day Scholar", action: () => { complaintData.accommodationType = 'dayScholar'; chatbotState = 4; addBotMessage("Thanks for that information. What is your address?"); } }
                ]);
            }
            break;
            
        case 3: // Getting house name for hosteller
            complaintData.houseName = message;
            chatbotState = 5;
            addBotMessage("What is your room number?");
            break;
            
        case 4: // Getting address for day scholar
            complaintData.address = message;
            chatbotState = 5;
            addBotMessage("Thanks for providing your address. Now, what type of complaint do you have?", [
                { text: "Hostel/Mess", action: () => { complaintData.complaintType = 'hostel'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } },
                { text: "Academic", action: () => { complaintData.complaintType = 'academic'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } },
                { text: "Exam Related", action: () => { complaintData.complaintType = 'exam'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } },
                { text: "Disciplinary Issue", action: () => { complaintData.complaintType = 'disciplinary'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } },
                { text: "Other", action: () => { complaintData.complaintType = 'other'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } }
            ]);
            break;
            
        case 5: // Getting room number for hosteller or moving to complaint type for day scholar
            if (complaintData.accommodationType === 'hosteller') {
                complaintData.roomNumber = message;
            }
            chatbotState = 6;
            addBotMessage("What type of complaint do you have?", [
                { text: "Hostel/Mess", action: () => { complaintData.complaintType = 'hostel'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } },
                { text: "Academic", action: () => { complaintData.complaintType = 'academic'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } },
                { text: "Exam Related", action: () => { complaintData.complaintType = 'exam'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } },
                { text: "Disciplinary Issue", action: () => { complaintData.complaintType = 'disciplinary'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } },
                { text: "Other", action: () => { complaintData.complaintType = 'other'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } }
            ]);
            break;
            
        case 6: // Getting complaint description
            complaintData.complaintDescription = message;
            chatbotState = 7;
            addBotMessage("Thank you for providing all the details. Would you like to submit this complaint now?", [
                { text: "Yes, Submit", action: submitComplaintFromChatbot },
                { text: "No, Cancel", action: () => { addBotMessage("Complaint submission cancelled. Is there anything else I can help you with?"); chatbotState = 0; complaintData = {}; } }
            ]);
            break;
            
        case 7: // Confirmation (handled by buttons now)
            // This case is now handled by buttons, but kept for backward compatibility
            if (message.includes('yes') || message.includes('submit') || message.includes('sure')) {
                // Submit the complaint
                submitComplaintFromChatbot();
            } else if (message.includes('no') || message.includes('cancel')) {
                addBotMessage("Complaint submission cancelled. Is there anything else I can help you with?");
                chatbotState = 0;
                complaintData = {};
            } else {
                addBotMessage("Would you like to submit the complaint now?", [
                    { text: "Yes, Submit", action: submitComplaintFromChatbot },
                    { text: "No, Cancel", action: () => { addBotMessage("Complaint submission cancelled. Is there anything else I can help you with?"); chatbotState = 0; complaintData = {}; } }
                ]);
            }
            break;
            
        default:
            addBotMessage("I can help you with filing complaints or answering questions about college services. What would you like to know?\n\nYou can ask me about:\n• Filing complaints\n• Checking complaint status\n• College contacts\n• Academic issues\n• Hostel facilities");
            chatbotState = 0;
    }
}

// Submit complaint from chatbot data
function submitComplaintFromChatbot() {
    // In a real implementation, this would save to a database
    // For now, we'll just show a success message
    const complaintId = 'CMPL-' + Math.floor(Math.random() * 1000 + 1000);
    
    // Prepare complaint details based on accommodation type
    let complaintDetails = `Complaint ID: ${complaintId}\n`;
    complaintDetails += `Name: ${complaintData.name}\n`;
    complaintDetails += `Enrollment Number: ${complaintData.enrollmentNumber}\n`;
    
    if (complaintData.accommodationType === 'hosteller') {
        complaintDetails += `Accommodation: Hosteller\n`;
        complaintDetails += `House Name: ${complaintData.houseName}\n`;
        complaintDetails += `Room Number: ${complaintData.roomNumber}\n`;
    } else {
        complaintDetails += `Accommodation: Day Scholar\n`;
        complaintDetails += `Address: ${complaintData.address}\n`;
    }
    
    complaintDetails += `Complaint Type: ${complaintData.complaintType}\n`;
    complaintDetails += `Description: ${complaintData.complaintDescription}`;
    
    alert(`Complaint submitted successfully through chatbot!\n\n${complaintDetails}`);
    
    addBotMessage(`Great! Your complaint has been submitted successfully with ID: ${complaintId}. We are working on it and the system will be updated recently. You can check the status of your complaint in the 'My Complaints' section of your dashboard.`);
    
    // Reset chatbot
    chatbotState = 0;
    complaintData = {};
    chatHistory = [];
    
    // Refresh dashboard stats
    loadDashboardStats();
    loadRecentComplaints();
}