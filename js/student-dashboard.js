// Student Dashboard functionality for College Complaint Management System

let currentUser = null;
let chatbotState = 0; // Track chatbot conversation state
let complaintData = {}; // Store complaint data during chatbot conversation
let chatHistory = []; // Store chat history for AI context
// Note: db is declared in auth.js, so we don't redeclare it here to avoid conflicts

// Initialize Firestore if available
function initializeFirestore() {
    // Use the db from auth.js (already initialized there)
    // If not available, try to get it from firebase
    if (typeof window !== 'undefined' && window.APP_CONFIG && window.APP_CONFIG.FIREBASE) {
        try {
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                // db should already be initialized in auth.js
                // Just verify it's available
                if (typeof db === 'undefined' || db === null) {
                    // If db is not available, initialize it (shouldn't happen if auth.js loaded correctly)
                    console.warn('db not found from auth.js, initializing...');
                    if (typeof window.db === 'undefined') {
                        window.db = firebase.firestore();
                    }
                }
                console.log('Firestore initialized successfully');
                return true;
            } else {
                console.error('Firebase Firestore not available');
                return false;
            }
        } catch (error) {
            console.error('Firestore initialization error:', error);
            return false;
        }
    } else {
        console.error('Firebase configuration not found');
        return false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Firestore first
    initializeFirestore();
    
    // Check authentication
    currentUser = getCurrentUser();
    if (!currentUser || currentUser.type !== 'student') {
        window.location.href = 'index.html';
        return;
    }
    
    // Verify Firestore is available
    if (!db) {
        console.error('Firestore not initialized. Please check Firebase configuration.');
        alert('Warning: Database connection not available. Some features may not work.');
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
    if (!db || !currentUser) {
        // Fallback if Firestore is not available
        document.getElementById('totalComplaints').textContent = '0';
        document.getElementById('pendingComplaints').textContent = '0';
        document.getElementById('resolvedComplaints').textContent = '0';
        return;
    }
    
    // Fetch complaints for current student
    db.collection('complaints')
        .where('enrollmentNumber', '==', currentUser.enrollmentNumber)
        .get()
        .then((querySnapshot) => {
            let total = 0;
            let pending = 0;
            let resolved = 0;
            
            querySnapshot.forEach((doc) => {
                total++;
                const data = doc.data();
                if (data.status === 'pending' || data.status === 'in-progress') {
                    pending++;
                } else if (data.status === 'resolved') {
                    resolved++;
                }
            });
            
            document.getElementById('totalComplaints').textContent = total;
            document.getElementById('pendingComplaints').textContent = pending;
            document.getElementById('resolvedComplaints').textContent = resolved;
        })
        .catch((error) => {
            console.error('Error loading dashboard stats:', error);
            document.getElementById('totalComplaints').textContent = '0';
            document.getElementById('pendingComplaints').textContent = '0';
            document.getElementById('resolvedComplaints').textContent = '0';
        });
}

// Load recent complaints
function loadRecentComplaints() {
    const tableBody = document.getElementById('recentComplaintsTable');
    
    if (!db || !currentUser) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No complaints found</td></tr>';
        return;
    }
    
    // Fetch recent complaints for current student (limit to 5 most recent)
    // Note: If orderBy fails, it means Firestore index needs to be created
    // The error will be logged and we'll fetch without ordering
    db.collection('complaints')
        .where('enrollmentNumber', '==', currentUser.enrollmentNumber)
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No complaints found</td></tr>';
                return;
            }
            
            let html = '';
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const complaintId = doc.id;
                // Handle Firestore timestamp
                let date = 'N/A';
                if (data.createdAt) {
                    if (data.createdAt.toDate) {
                        date = data.createdAt.toDate().toLocaleDateString();
                    } else if (data.createdAt.seconds) {
                        date = new Date(data.createdAt.seconds * 1000).toLocaleDateString();
                    }
                }
                const statusClass = getStatusBadgeClass(data.status);
                const statusText = getStatusText(data.status);
                const typeText = getComplaintTypeText(data.complaintType);
                const description = (data.complaintDescription || '').length > 50 
                    ? data.complaintDescription.substring(0, 50) + '...' 
                    : data.complaintDescription;
                
                html += `
                    <tr>
                        <td>${complaintId}</td>
                        <td>${typeText}</td>
                        <td>${description}</td>
                        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                        <td>${date}</td>
                        <td>
                            <button class="btn btn-sm btn-primary btn-action" onclick="viewComplaint('${complaintId}')">View</button>
            </td>
        </tr>
                `;
            });
            
            tableBody.innerHTML = html;
        })
        .catch((error) => {
            console.error('Error loading recent complaints:', error);
            // If orderBy fails, try without ordering (for when index is not created)
            if (error.code === 'failed-precondition') {
                db.collection('complaints')
                    .where('enrollmentNumber', '==', currentUser.enrollmentNumber)
                    .limit(5)
                    .get()
                    .then((querySnapshot) => {
                        if (querySnapshot.empty) {
                            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No complaints found</td></tr>';
                            return;
                        }
                        // Sort in memory
                        const complaints = [];
                        querySnapshot.forEach((doc) => {
                            complaints.push({ id: doc.id, data: doc.data() });
                        });
                        complaints.sort((a, b) => {
                            const aTime = a.data.createdAt?.toDate ? a.data.createdAt.toDate().getTime() : 0;
                            const bTime = b.data.createdAt?.toDate ? b.data.createdAt.toDate().getTime() : 0;
                            return bTime - aTime;
                        });
                        
                        let html = '';
                        complaints.slice(0, 5).forEach(({ id, data }) => {
                            let date = 'N/A';
                            if (data.createdAt) {
                                if (data.createdAt.toDate) {
                                    date = data.createdAt.toDate().toLocaleDateString();
                                } else if (data.createdAt.seconds) {
                                    date = new Date(data.createdAt.seconds * 1000).toLocaleDateString();
                                }
                            }
                            const statusClass = getStatusBadgeClass(data.status);
                            const statusText = getStatusText(data.status);
                            const typeText = getComplaintTypeText(data.complaintType);
                            const description = (data.complaintDescription || '').length > 50 
                                ? data.complaintDescription.substring(0, 50) + '...' 
                                : data.complaintDescription;
                            
                            html += `
                                <tr>
                                    <td>${id}</td>
                                    <td>${typeText}</td>
                                    <td>${description}</td>
                                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                                    <td>${date}</td>
                                    <td>
                                        <button class="btn btn-sm btn-primary btn-action" onclick="viewComplaint('${id}')">View</button>
            </td>
        </tr>
    `;
                        });
                        tableBody.innerHTML = html;
                    })
                    .catch((fallbackError) => {
                        console.error('Fallback error:', fallbackError);
                        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Error loading complaints</td></tr>';
                    });
            } else {
                tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Error loading complaints</td></tr>';
            }
        });
}

// Helper function to get status badge class
function getStatusBadgeClass(status) {
    switch(status) {
        case 'pending':
            return 'badge-pending';
        case 'in-progress':
            return 'badge-warning';
        case 'resolved':
            return 'badge-resolved';
        case 'escalated':
            return 'badge-info';
        default:
            return 'badge-secondary';
    }
}

// Helper function to get status text
function getStatusText(status) {
    switch(status) {
        case 'pending':
            return 'Pending';
        case 'in-progress':
            return 'In Progress';
        case 'resolved':
            return 'Resolved';
        case 'escalated':
            return 'Escalated';
        default:
            return status;
    }
}

// Helper function to get complaint type text
function getComplaintTypeText(type) {
    const typeMap = {
        'hostel': 'Hostel/Mess',
        'academic': 'Academic',
        'exam': 'Exam Related',
        'disciplinary': 'Disciplinary',
        'other': 'Other'
    };
    return typeMap[type] || type;
}

// Setup event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Navigation links (dropdown menu only now)
    const dashboardLink = document.getElementById('dashboardSystemLink');
    if (dashboardLink) {
        dashboardLink.addEventListener('click', (e) => {
        e.preventDefault();
            console.log('Dashboard link clicked');
            closeDropdown();
        showView('dashboardView');
    });
    } else {
        console.error('Dashboard link not found');
    }
    
    const newComplaintLink = document.getElementById('newComplaintSystemLink');
    if (newComplaintLink) {
        newComplaintLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('New Complaint link clicked');
            closeDropdown();
            
            // Ensure all other views are hidden first
            const allViews = ['dashboardView', 'myComplaintsView', 'profileView', 'settingsView'];
            allViews.forEach(viewId => {
                const view = document.getElementById(viewId);
                if (view) {
                    view.style.display = 'none';
                }
            });
            
            // Show the new complaint view
            const newComplaintView = document.getElementById('newComplaintView');
            if (newComplaintView) {
                newComplaintView.style.display = 'block';
                console.log('New Complaint view displayed');
                
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                // Focus on first input field
                setTimeout(() => {
                    const houseNameInput = document.getElementById('houseName');
                    if (houseNameInput) {
                        houseNameInput.focus();
                    }
                }, 100);
            } else {
                console.error('New Complaint view element not found!');
                alert('Error: Complaint form not found. Please refresh the page.');
            }
        });
    } else {
        console.error('New Complaint link not found');
    }
    
    const myComplaintsLink = document.getElementById('myComplaintsSystemLink');
    if (myComplaintsLink) {
        myComplaintsLink.addEventListener('click', (e) => {
        e.preventDefault();
            console.log('My Complaints link clicked');
            closeDropdown();
        showView('myComplaintsView');
        loadMyComplaints();
    });
    } else {
        console.error('My Complaints link not found');
    }
    
    const profileLink = document.getElementById('profileSystemLink');
    if (profileLink) {
        profileLink.addEventListener('click', (e) => {
        e.preventDefault();
            console.log('Profile link clicked');
            closeDropdown();
        showView('profileView');
    });
    } else {
        console.error('Profile link not found');
    }
    
    const settingsLink = document.getElementById('settingsSystemLink');
    if (settingsLink) {
        settingsLink.addEventListener('click', (e) => {
        e.preventDefault();
            console.log('Settings link clicked');
            closeDropdown();
        showView('settingsView');
    });
    } else {
        console.error('Settings link not found');
    }
    
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
    
    // Lodge Complaint button event listener
    const lodgeComplaintBtn = document.getElementById('lodgeComplaintBtn');
    if (lodgeComplaintBtn) {
        lodgeComplaintBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Lodge Complaint button clicked');
            showComplaintForm();
        });
    } else {
        console.warn('Lodge Complaint button not found');
    }
}

// Close Bootstrap dropdown
function closeDropdown() {
    // Close the dropdown menu after clicking
    try {
        const dropdownToggle = document.getElementById('navbarDropdown');
        if (dropdownToggle) {
            const dropdownInstance = bootstrap.Dropdown.getInstance(dropdownToggle);
            if (dropdownInstance) {
                dropdownInstance.hide();
            } else {
                // If instance doesn't exist, manually remove show class
                const dropdownMenu = document.querySelector('.dropdown-menu.show');
                if (dropdownMenu) {
                    dropdownMenu.classList.remove('show');
                    dropdownToggle.setAttribute('aria-expanded', 'false');
                }
            }
        }
    } catch (error) {
        console.error('Error closing dropdown:', error);
    }
}

// Show specific view
function showView(viewId) {
    console.log('Showing view:', viewId);
    
    // List of all view IDs
    const viewIds = ['dashboardView', 'newComplaintView', 'myComplaintsView', 'profileView', 'settingsView'];
    
    // Hide all views
    viewIds.forEach(id => {
        const view = document.getElementById(id);
        if (view) {
            view.style.display = 'none';
            console.log('Hiding view:', id);
        } else {
            console.warn('View not found:', id);
        }
    });
    
    // Show selected view
    const selectedView = document.getElementById(viewId);
    if (selectedView) {
        selectedView.style.display = 'block';
        console.log('View shown successfully:', viewId);
        
        // Scroll to top of the view
        selectedView.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        console.error('Selected view not found:', viewId);
        // Fallback: show dashboard if view not found
        const dashboardView = document.getElementById('dashboardView');
        if (dashboardView) {
            dashboardView.style.display = 'block';
            console.log('Fallback: Showing dashboard view');
        }
    }
}

// Load my complaints
function loadMyComplaints() {
    const tableBody = document.getElementById('myComplaintsTable');
    
    if (!db || !currentUser) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No complaints found</td></tr>';
        return;
    }
    
    // Show loading state
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Loading complaints...</td></tr>';
    
    // Fetch all complaints for current student
    db.collection('complaints')
        .where('enrollmentNumber', '==', currentUser.enrollmentNumber)
        .orderBy('createdAt', 'desc')
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No complaints found</td></tr>';
                return;
            }
            
            let html = '';
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const complaintId = doc.id;
                // Handle Firestore timestamp
                let date = 'N/A';
                if (data.createdAt) {
                    if (data.createdAt.toDate) {
                        date = data.createdAt.toDate().toLocaleDateString();
                    } else if (data.createdAt.seconds) {
                        date = new Date(data.createdAt.seconds * 1000).toLocaleDateString();
                    }
                }
                const statusClass = getStatusBadgeClass(data.status);
                const statusText = getStatusText(data.status);
                const typeText = getComplaintTypeText(data.complaintType);
                const description = (data.complaintDescription || '').length > 50 
                    ? data.complaintDescription.substring(0, 50) + '...' 
                    : data.complaintDescription;
                
                html += `
                    <tr>
                        <td>${complaintId}</td>
                        <td>${typeText}</td>
                        <td>${description}</td>
                        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                        <td>${date}</td>
                        <td>
                            <button class="btn btn-sm btn-primary btn-action" onclick="viewComplaint('${complaintId}')">View</button>
            </td>
        </tr>
                `;
            });
            
            tableBody.innerHTML = html;
        })
        .catch((error) => {
            console.error('Error loading complaints:', error);
            // If orderBy fails, try without ordering (for when index is not created)
            if (error.code === 'failed-precondition') {
                db.collection('complaints')
                    .where('enrollmentNumber', '==', currentUser.enrollmentNumber)
                    .get()
                    .then((querySnapshot) => {
                        if (querySnapshot.empty) {
                            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No complaints found</td></tr>';
                            return;
                        }
                        // Sort in memory
                        const complaints = [];
                        querySnapshot.forEach((doc) => {
                            complaints.push({ id: doc.id, data: doc.data() });
                        });
                        complaints.sort((a, b) => {
                            const aTime = a.data.createdAt?.toDate ? a.data.createdAt.toDate().getTime() : 0;
                            const bTime = b.data.createdAt?.toDate ? b.data.createdAt.toDate().getTime() : 0;
                            return bTime - aTime;
                        });
                        
                        let html = '';
                        complaints.forEach(({ id, data }) => {
                            let date = 'N/A';
                            if (data.createdAt) {
                                if (data.createdAt.toDate) {
                                    date = data.createdAt.toDate().toLocaleDateString();
                                } else if (data.createdAt.seconds) {
                                    date = new Date(data.createdAt.seconds * 1000).toLocaleDateString();
                                }
                            }
                            const statusClass = getStatusBadgeClass(data.status);
                            const statusText = getStatusText(data.status);
                            const typeText = getComplaintTypeText(data.complaintType);
                            const description = (data.complaintDescription || '').length > 50 
                                ? data.complaintDescription.substring(0, 50) + '...' 
                                : data.complaintDescription;
                            
                            html += `
                                <tr>
                                    <td>${id}</td>
                                    <td>${typeText}</td>
                                    <td>${description}</td>
                                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                                    <td>${date}</td>
                                    <td>
                                        <button class="btn btn-sm btn-primary btn-action" onclick="viewComplaint('${id}')">View</button>
            </td>
        </tr>
    `;
                        });
                        tableBody.innerHTML = html;
                    })
                    .catch((fallbackError) => {
                        console.error('Fallback error:', fallbackError);
                        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Error loading complaints</td></tr>';
                    });
            } else {
                tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Error loading complaints</td></tr>';
            }
        });
}

// View complaint details (placeholder function - can be enhanced with modal)
function viewComplaint(complaintId) {
    if (!db) {
        alert('Complaint details not available');
        return;
    }
    
    db.collection('complaints').doc(complaintId).get()
        .then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                // Handle Firestore timestamp
                let date = 'N/A';
                if (data.createdAt) {
                    if (data.createdAt.toDate) {
                        date = data.createdAt.toDate().toLocaleDateString();
                    } else if (data.createdAt.seconds) {
                        date = new Date(data.createdAt.seconds * 1000).toLocaleDateString();
                    }
                }
                const details = `
Complaint ID: ${complaintId}
Type: ${getComplaintTypeText(data.complaintType)}
Status: ${getStatusText(data.status)}
Date: ${date}
Description: ${data.complaintDescription || 'N/A'}
House Name: ${data.houseName || 'N/A'}
Room Number: ${data.roomNumber || 'N/A'}
Assigned To: ${data.assignedTo || 'Pending'}
                `;
                alert(details);
            } else {
                alert('Complaint not found');
            }
        })
        .catch((error) => {
            console.error('Error fetching complaint:', error);
            alert('Error loading complaint details');
        });
}

// Make viewComplaint available globally
window.viewComplaint = viewComplaint;

// Submit complaint
function submitComplaint() {
    console.log('submitComplaint called');
    
    // Try to initialize Firestore if not already initialized
    if (!db) {
        if (!initializeFirestore()) {
            alert('Error: Database not available. Please refresh the page and check your Firebase configuration.');
            return;
        }
    }
    
    if (!currentUser) {
        alert('Error: User not logged in. Please log in again.');
        window.location.href = 'student-login.html';
        return;
    }
    
    const houseName = document.getElementById('houseName').value.trim();
    const roomNumber = document.getElementById('roomNumber').value.trim();
    const complaintType = document.getElementById('complaintType').value;
    const complaintDescription = document.getElementById('complaintDescription').value.trim();
    
    // Validate required fields
    if (!complaintType || !complaintDescription) {
        alert('Please fill in all required fields (Complaint Type and Description are required)');
        return;
    }
    
    if (!houseName || !roomNumber) {
        alert('Please fill in House Name and Room Number');
        return;
    }
    
    // Show loading state
    const submitBtn = document.querySelector('#complaintForm button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...';
    submitBtn.disabled = true;
    
    // Prepare complaint data
    const complaintDataToSave = {
        studentId: currentUser.id,
        studentName: currentUser.name || 'Student',
        enrollmentNumber: currentUser.enrollmentNumber,
        houseName: houseName,
        roomNumber: roomNumber,
        complaintType: complaintType,
        complaintDescription: complaintDescription,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        assignedTo: getInitialAuthority(complaintType),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    console.log('Submitting complaint:', complaintDataToSave);
    
    // Save to Firestore
    db.collection('complaints').add(complaintDataToSave)
        .then((docRef) => {
            const complaintId = docRef.id;
            console.log('Complaint saved successfully with ID:', complaintId);
            
            alert(`Complaint submitted successfully!\n\nComplaint ID: ${complaintId}\n\nYour complaint has been saved and will be reviewed by the assigned authority.`);
            
            // Reset form
            document.getElementById('complaintForm').reset();
            
            // Re-populate student name and enrollment (they are readonly fields)
            if (currentUser.name) {
                document.getElementById('studentName').value = currentUser.name;
            }
            if (currentUser.enrollmentNumber) {
                document.getElementById('enrollmentNumber').value = currentUser.enrollmentNumber;
            }
            
            // Switch to dashboard view
            showView('dashboardView');
            
            // Refresh dashboard stats and recent complaints
            loadDashboardStats();
            loadRecentComplaints();
            
            // Reset button
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        })
        .catch((error) => {
            console.error('Error submitting complaint:', error);
            let errorMessage = 'Error submitting complaint. ';
            
            if (error.code === 'permission-denied') {
                errorMessage += 'You do not have permission to create complaints. Please check your Firebase security rules.';
            } else if (error.code === 'unavailable') {
                errorMessage += 'Firebase service is unavailable. Please check your internet connection.';
            } else {
                errorMessage += error.message || 'Please try again.';
            }
            
            alert(errorMessage);
            
            // Reset button
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        });
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
    
    // Add initial bot message with quick actions
    addBotMessage("Hi there! I'm your College Assistant. I can help you navigate the website and file complaints. What would you like to do?", [
        { text: "File Complaint", action: () => { showComplaintForm(); addBotMessage("I've opened the complaint form for you! Anything else?"); refocusChatbotInput(); } },
        { text: "My Complaints", action: () => { showView('myComplaintsView'); loadMyComplaints(); addBotMessage("Showing your complaints! Need anything else?"); refocusChatbotInput(); } },
        { text: "Dashboard", action: () => { showView('dashboardView'); loadDashboardStats(); loadRecentComplaints(); addBotMessage("Dashboard opened! What else can I help with?"); refocusChatbotInput(); } },
        { text: "Help", action: () => { showHelpMenu(); } }
    ]);
    
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
            // Refocus input after processing so user can continue typing
            setTimeout(() => {
                if (chatbotInput) {
                    chatbotInput.focus();
                }
            }, 100);
        }, 500);
    } else {
        // If empty, just focus the input
        chatbotInput.focus();
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
                    // Refocus input after button action
                    refocusChatbotInput();
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
    const originalMessage = message;
    message = message.toLowerCase();
    
    // Reset chatbot if user says "reset" or "start over"
    if (message.includes('reset') || message.includes('start over')) {
        chatbotState = 0;
        complaintData = {};
        chatHistory = [];
        addBotMessage("Okay, let's start over. How can I help you today?");
        return;
    }
    
    // Check for navigation/action commands FIRST - these should always work regardless of AI
    // This ensures "file complaint", "dashboard", etc. always work
    if (isNavigationCommand(message)) {
        // Process navigation command directly
        processUserMessageFallback(message);
        return;
    }
    
    // Check if AI is enabled and available
    const config = window.APP_CONFIG || { AI_API: { ENABLED: false, PROVIDER: 'none' } };
    
    console.log('AI Config:', config);
    
    if (config.AI_API.ENABLED && config.AI_API.PROVIDER !== 'none') {
        try {
            // Use AI to generate response
            console.log('Attempting to use AI for response');
            const aiResponse = await getAIResponse(originalMessage);
            if (aiResponse && aiResponse !== "undefined") {
                addBotMessage(aiResponse);
                // Refocus input after AI response
                refocusChatbotInput();
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

// Check if message is a navigation/action command
function isNavigationCommand(message) {
    const navCommands = [
        'dashboard', 'home', 'main',
        'my complaints', 'view complaints', 'complaint list', 'show complaints',
        'file complaint', 'file a complaint', 'lodge complaint', 'lodge a complaint', 
        'new complaint', 'create complaint', 'file new', 'submit complaint', 'submit a complaint',
        'i want to file', 'want to file', 'need to file', 'i need to file',
        'profile', 'my profile',
        'settings', 'preferences',
        'statistics', 'stats', 'summary', 'overview',
        'help', 'commands', 'what can you do', 'menu',
        'status', 'check', 'check status',
        'quick', 'options'
    ];
    
    return navCommands.some(cmd => message.includes(cmd));
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
        addBotMessage("Hello! I'm your College Assistant. I can help you with:\n• Filing complaints\n• Checking complaint status\n• Navigating the website\n• Viewing your profile\n• Getting help\n\nWhat would you like to do?", [
            { text: "File Complaint", action: () => { showComplaintForm(); addBotMessage("I've opened the complaint form for you! Please fill in the details."); } },
            { text: "My Complaints", action: () => { showView('myComplaintsView'); loadMyComplaints(); addBotMessage("Showing your complaints now!"); } },
            { text: "Dashboard", action: () => { showView('dashboardView'); loadDashboardStats(); loadRecentComplaints(); addBotMessage("Showing your dashboard now!"); } },
            { text: "Help", action: () => { showHelpMenu(); } }
        ]);
        return;
    }
    
    // Navigation commands
    if (message.includes('dashboard') || message.includes('home') || message.includes('main')) {
        showView('dashboardView');
        loadDashboardStats();
        loadRecentComplaints();
        addBotMessage("I've opened your dashboard for you! Is there anything else you'd like me to help you with?");
        refocusChatbotInput();
        return;
    }
    
    if (message.includes('my complaints') || message.includes('view complaints') || message.includes('complaint list') || message.includes('show complaints')) {
        showView('myComplaintsView');
        loadMyComplaints();
        addBotMessage("Showing all your complaints now! Anything else I can help with?");
        refocusChatbotInput();
        return;
    }
    
    // File complaint variations - must be checked before general "complaint" handler
    if (message.includes('file complaint') || message.includes('file a complaint') || message.includes('lodge complaint') || 
        message.includes('lodge a complaint') || message.includes('new complaint') || message.includes('create complaint') || 
        message.includes('file new') || message.includes('submit complaint') || message.includes('submit a complaint') ||
        message.includes('i want to file') || message.includes('want to file') || message.includes('need to file') ||
        message.includes('i need to file') || (message.includes('file') && message.includes('complaint'))) {
        showComplaintForm();
        addBotMessage("I've opened the complaint form for you! Please fill in all the details and submit. Need help with anything else?");
        refocusChatbotInput();
        return;
    }
    
    if (message.includes('profile') || message.includes('my profile')) {
        showView('profileView');
        addBotMessage("Showing your profile now! What else can I help you with?");
        refocusChatbotInput();
        return;
    }
    
    if (message.includes('settings') || message.includes('preferences')) {
        showView('settingsView');
        addBotMessage("Showing your settings now! Anything else?");
        refocusChatbotInput();
        return;
    }
    
    // Show complaint statistics
    if (message.includes('statistics') || message.includes('stats') || message.includes('summary') || message.includes('overview')) {
        if (db && currentUser) {
            db.collection('complaints')
                .where('enrollmentNumber', '==', currentUser.enrollmentNumber)
                .get()
                .then((querySnapshot) => {
                    let total = 0;
                    let pending = 0;
                    let resolved = 0;
                    let escalated = 0;
                    
                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        total++;
                        if (data.status === 'pending' || data.status === 'in-progress') {
                            pending++;
                        } else if (data.status === 'resolved') {
                            resolved++;
                        } else if (data.status === 'escalated') {
                            escalated++;
                        }
                    });
                    
                    addBotMessage(`Here's your complaint summary:\n\n📊 Total Complaints: ${total}\n⏳ Pending: ${pending}\n✅ Resolved: ${resolved}\n⬆️ Escalated: ${escalated}\n\nWould you like to view your complaints?`, [
                        { text: "View My Complaints", action: () => { showView('myComplaintsView'); loadMyComplaints(); refocusChatbotInput(); } },
                        { text: "File New Complaint", action: () => { showComplaintForm(); refocusChatbotInput(); } }
                    ]);
                    refocusChatbotInput();
                })
                .catch((error) => {
                    console.error('Error loading stats:', error);
                    addBotMessage("I couldn't fetch your statistics right now. Please try again later.");
                });
        } else {
            addBotMessage("I need to load your data first. Please wait a moment and try again.");
        }
        return;
    }
    
    // Help menu
    if (message.includes('help') || message.includes('commands') || message.includes('what can you do') || message.includes('menu')) {
        showHelpMenu();
        return;
    }
    
    if (message.includes('bye') || message.includes('goodbye')) {
        addBotMessage("Goodbye! Feel free to come back if you need any assistance.");
        return;
    }
    
    // Quick actions
    if (message.includes('quick') || message.includes('options') || message.includes('menu')) {
        addBotMessage("Here are some quick actions I can help you with:", [
            { text: "📋 File Complaint", action: () => { showComplaintForm(); addBotMessage("Complaint form opened!"); } },
            { text: "📊 My Complaints", action: () => { showView('myComplaintsView'); loadMyComplaints(); addBotMessage("Showing your complaints!"); } },
            { text: "🏠 Dashboard", action: () => { showView('dashboardView'); loadDashboardStats(); loadRecentComplaints(); addBotMessage("Dashboard opened!"); } },
            { text: "📈 Statistics", action: () => { 
                if (db && currentUser) {
                    db.collection('complaints').where('enrollmentNumber', '==', currentUser.enrollmentNumber).get()
                        .then((snapshot) => {
                            const stats = { total: 0, pending: 0, resolved: 0, escalated: 0 };
                            snapshot.forEach(doc => {
                                const data = doc.data();
                                stats.total++;
                                if (data.status === 'pending' || data.status === 'in-progress') stats.pending++;
                                else if (data.status === 'resolved') stats.resolved++;
                                else if (data.status === 'escalated') stats.escalated++;
                            });
                            addBotMessage(`Your Statistics:\nTotal: ${stats.total}\nPending: ${stats.pending}\nResolved: ${stats.resolved}\nEscalated: ${stats.escalated}`);
                        });
                }
            } }
        ]);
        return;
    }
    
    // General complaint/issue/problem - only if not already handled
    if ((message.includes('complaint') || message.includes('issue') || message.includes('problem')) && 
        !message.includes('file complaint') && !message.includes('my complaints') && !message.includes('view complaints')) {
        addBotMessage("I can help you file a complaint. What type of complaint do you have?", [
            { text: "Hostel/Mess", action: () => { complaintData.complaintType = 'hostel'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } },
            { text: "Academic", action: () => { complaintData.complaintType = 'academic'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } },
            { text: "Exam Related", action: () => { complaintData.complaintType = 'exam'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } },
            { text: "Disciplinary Issue", action: () => { complaintData.complaintType = 'disciplinary'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } },
            { text: "Other", action: () => { complaintData.complaintType = 'other'; chatbotState = 6; addBotMessage("Please describe your complaint in detail."); } }
        ]);
        return;
    }
    
    if (message.includes('status') || message.includes('check') || message.includes('check status')) {
        addBotMessage("I'll show you your complaint status now!", [
            { text: "View My Complaints", action: () => { showView('myComplaintsView'); loadMyComplaints(); addBotMessage("Here are all your complaints with their current status! Anything else?"); refocusChatbotInput(); } },
            { text: "View Dashboard", action: () => { showView('dashboardView'); loadDashboardStats(); loadRecentComplaints(); addBotMessage("Here's your dashboard with complaint statistics! Need anything else?"); refocusChatbotInput(); } }
        ]);
        return;
    }
    
    if (message.includes('contact') || message.includes('email') || message.includes('reach out')) {
        addBotMessage("You can reach out to the college administration through the following contacts:\n- Academic Issues: academic@college.edu\n- Hostel Issues: hostel@college.edu\n- General Enquiries: info@college.edu\n\nAnything else I can help with?");
        refocusChatbotInput();
        return;
    }
    
    // Generic "file" or "submit" - only if not already handled above
    if ((message.includes('file') || message.includes('submit')) && !message.includes('complaint')) {
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
        refocusChatbotInput();
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
            addBotMessage("I can help you with various tasks around the website. Here's what I can do:", [
                { text: "📋 File Complaint", action: () => { showComplaintForm(); addBotMessage("Complaint form opened!"); } },
                { text: "📊 My Complaints", action: () => { showView('myComplaintsView'); loadMyComplaints(); addBotMessage("Showing your complaints!"); } },
                { text: "🏠 Dashboard", action: () => { showView('dashboardView'); loadDashboardStats(); loadRecentComplaints(); addBotMessage("Dashboard opened!"); } },
                { text: "❓ Help", action: () => { showHelpMenu(); } }
            ]);
            chatbotState = 0;
    }
}

// Show help menu with all available commands
function showHelpMenu() {
    addBotMessage("Here are all the things I can help you with:\n\n📋 **Navigation**\n• 'Dashboard' or 'Home' - Go to dashboard\n• 'My Complaints' - View all your complaints\n• 'New Complaint' - File a new complaint\n• 'Profile' - View your profile\n• 'Settings' - Access settings\n\n📊 **Information**\n• 'Statistics' or 'Stats' - View complaint summary\n• 'Status' or 'Check Status' - Check complaint status\n• 'Help' or 'Menu' - Show this menu\n\n💬 **Complaints**\n• 'File Complaint' - Start filing a complaint\n• 'Complaint' - Get help with complaints\n\nWhat would you like to do?", [
        { text: "File Complaint", action: () => { showComplaintForm(); addBotMessage("Complaint form opened! Anything else?"); refocusChatbotInput(); } },
        { text: "My Complaints", action: () => { showView('myComplaintsView'); loadMyComplaints(); addBotMessage("Showing your complaints! Need anything else?"); refocusChatbotInput(); } },
        { text: "Dashboard", action: () => { showView('dashboardView'); loadDashboardStats(); loadRecentComplaints(); addBotMessage("Dashboard opened! What else can I help with?"); refocusChatbotInput(); } },
        { text: "Statistics", action: () => {
            if (db && currentUser) {
                db.collection('complaints').where('enrollmentNumber', '==', currentUser.enrollmentNumber).get()
                    .then((snapshot) => {
                        const stats = { total: 0, pending: 0, resolved: 0, escalated: 0 };
                        snapshot.forEach(doc => {
                            const data = doc.data();
                            stats.total++;
                            if (data.status === 'pending' || data.status === 'in-progress') stats.pending++;
                            else if (data.status === 'resolved') stats.resolved++;
                            else if (data.status === 'escalated') stats.escalated++;
                        });
                        addBotMessage(`📊 Your Complaint Statistics:\n\nTotal Complaints: ${stats.total}\n⏳ Pending: ${stats.pending}\n✅ Resolved: ${stats.resolved}\n⬆️ Escalated: ${stats.escalated}\n\nAnything else I can help with?`);
                        refocusChatbotInput();
                    });
            }
        } }
    ]);
    refocusChatbotInput();
}

// Helper function to refocus chatbot input after actions
function refocusChatbotInput() {
    setTimeout(() => {
        const chatbotInput = document.getElementById('chatbotInput');
        const chatbotWidget = document.getElementById('chatbotWidget');
        if (chatbotInput && chatbotWidget) {
            // Ensure chatbot widget is visible
            if (chatbotWidget.style.display === 'none') {
                chatbotWidget.style.display = 'flex';
            }
            // Focus the input
            chatbotInput.focus();
        }
    }, 200);
}

// Submit complaint from chatbot data
function submitComplaintFromChatbot() {
    if (!db || !currentUser) {
        addBotMessage('Sorry, there was an error submitting your complaint. Please try using the complaint form instead.');
        return;
    }
    
    // Prepare complaint data from chatbot
    const complaintDataToSave = {
        studentId: currentUser.id,
        studentName: complaintData.name || currentUser.name || 'Student',
        enrollmentNumber: complaintData.enrollmentNumber || currentUser.enrollmentNumber,
        houseName: complaintData.houseName || currentUser.houseName || '',
        roomNumber: complaintData.roomNumber || currentUser.roomNumber || '',
        complaintType: complaintData.complaintType || 'other',
        complaintDescription: complaintData.complaintDescription || '',
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        assignedTo: getInitialAuthority(complaintData.complaintType || 'other'),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        submittedVia: 'chatbot'
    };
    
    // Validate required fields
    if (!complaintDataToSave.complaintDescription) {
        addBotMessage('Please provide a description of your complaint.');
        return;
    }
    
    // Save to Firestore
    db.collection('complaints').add(complaintDataToSave)
        .then((docRef) => {
            const complaintId = docRef.id;
            
            // Prepare complaint details for display
    let complaintDetails = `Complaint ID: ${complaintId}\n`;
            complaintDetails += `Name: ${complaintDataToSave.studentName}\n`;
            complaintDetails += `Enrollment Number: ${complaintDataToSave.enrollmentNumber}\n`;
    
    if (complaintData.accommodationType === 'hosteller') {
        complaintDetails += `Accommodation: Hosteller\n`;
                complaintDetails += `House Name: ${complaintDataToSave.houseName}\n`;
                complaintDetails += `Room Number: ${complaintDataToSave.roomNumber}\n`;
            } else if (complaintData.accommodationType === 'dayScholar') {
        complaintDetails += `Accommodation: Day Scholar\n`;
                complaintDetails += `Address: ${complaintData.address || 'N/A'}\n`;
            }
            
            complaintDetails += `Complaint Type: ${getComplaintTypeText(complaintDataToSave.complaintType)}\n`;
            complaintDetails += `Description: ${complaintDataToSave.complaintDescription}`;
    
    addBotMessage(`Great! Your complaint has been submitted successfully with ID: ${complaintId}. We are working on it and the system will be updated recently. You can check the status of your complaint in the 'My Complaints' section of your dashboard.`);
    
    // Reset chatbot
    chatbotState = 0;
    complaintData = {};
    chatHistory = [];
    
    // Refresh dashboard stats
    loadDashboardStats();
    loadRecentComplaints();
        })
        .catch((error) => {
            console.error('Error submitting complaint from chatbot:', error);
            addBotMessage('Sorry, there was an error submitting your complaint. Please try again or use the complaint form.');
        });
}

// Show complaint form function - called by the "Lodge a Complaint" button
function showComplaintForm() {
    console.log('showComplaintForm called');
    
    try {
        // Hide all views
        const allViews = ['dashboardView', 'myComplaintsView', 'profileView', 'settingsView'];
        allViews.forEach(viewId => {
            const view = document.getElementById(viewId);
            if (view) {
                view.style.display = 'none';
                console.log('Hiding view:', viewId);
            } else {
                console.warn('View not found:', viewId);
            }
        });
        
        // Show the new complaint view
        const newComplaintView = document.getElementById('newComplaintView');
        if (newComplaintView) {
            newComplaintView.style.display = 'block';
            console.log('Complaint form displayed successfully');
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Ensure student name and enrollment are filled
            if (currentUser) {
                if (currentUser.name) {
                    const studentNameInput = document.getElementById('studentName');
                    if (studentNameInput) {
                        studentNameInput.value = currentUser.name;
                        console.log('Student name filled:', currentUser.name);
                    }
                }
                if (currentUser.enrollmentNumber) {
                    const enrollmentInput = document.getElementById('enrollmentNumber');
                    if (enrollmentInput) {
                        enrollmentInput.value = currentUser.enrollmentNumber;
                        console.log('Enrollment number filled:', currentUser.enrollmentNumber);
                    }
                }
            } else {
                console.warn('currentUser is not set');
            }
            
            // Focus on first input field after a short delay
            setTimeout(() => {
                const houseNameInput = document.getElementById('houseName');
                if (houseNameInput) {
                    houseNameInput.focus();
                    console.log('Focused on houseName input');
                } else {
                    console.warn('houseName input not found');
                }
            }, 100);
        } else {
            console.error('New Complaint view element not found!');
            alert('Error: Complaint form not found. Please refresh the page.');
        }
    } catch (error) {
        console.error('Error in showComplaintForm:', error);
        alert('An error occurred while opening the complaint form. Please check the console for details.');
    }
}

// Make showComplaintForm available globally
window.showComplaintForm = showComplaintForm;