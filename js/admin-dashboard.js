// Admin Dashboard functionality for College Complaint Management System

let currentUser = null;
// Note: db is declared in auth.js, so we don't redeclare it here

// Get the role-specific assignedTo value
function getAssignedToForRole(role) {
    const roleMap = {
        'warden': 'warden',
        'mentor': 'mentor',
        'examcell': 'examcell',
        'exam cell': 'examcell',
        'disciplinary': 'disciplinary',
        'registrar': 'registrar',
        'vc': 'vc',
        'vice chancellor': 'vc'
    };
    return roleMap[role.toLowerCase()] || null;
}

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    currentUser = getCurrentUser();
    if (!currentUser || currentUser.type !== 'admin') {
        window.location.href = 'index.html';
        return;
    }
    
    console.log('Admin logged in:', currentUser);
    
    // Load admin data
    loadAdminData(currentUser);
    setupEventListeners();
});

// Load admin data
function loadAdminData(userData) {
    // Update profile view
    document.getElementById('profileName').value = userData.name || '';
    document.getElementById('profileEmail').value = userData.email || '';
    document.getElementById('profileRole').value = userData.role || '';
    
    // Load dashboard stats
    loadDashboardStats();
    loadPendingComplaints();
}

// Load dashboard statistics
function loadDashboardStats() {
    if (!db || !currentUser) {
        document.getElementById('totalComplaints').textContent = '0';
        document.getElementById('pendingComplaints').textContent = '0';
        document.getElementById('resolvedComplaints').textContent = '0';
        document.getElementById('escalatedComplaints').textContent = '0';
        return;
    }
    
    const assignedTo = getAssignedToForRole(currentUser.role);
    if (!assignedTo) {
        console.warn('Unknown admin role:', currentUser.role);
        document.getElementById('totalComplaints').textContent = '0';
        document.getElementById('pendingComplaints').textContent = '0';
        document.getElementById('resolvedComplaints').textContent = '0';
        document.getElementById('escalatedComplaints').textContent = '0';
        return;
    }
    
    // Fetch complaints assigned to this admin's role
    db.collection('complaints')
        .where('assignedTo', '==', assignedTo)
        .get()
        .then((querySnapshot) => {
            let total = 0;
            let pending = 0;
            let resolved = 0;
            let escalated = 0;
            
            querySnapshot.forEach((doc) => {
                total++;
                const data = doc.data();
                if (data.status === 'pending' || data.status === 'in-progress') {
                    pending++;
                } else if (data.status === 'resolved') {
                    resolved++;
                } else if (data.status === 'escalated') {
                    escalated++;
                }
            });
            
            document.getElementById('totalComplaints').textContent = total;
            document.getElementById('pendingComplaints').textContent = pending;
            document.getElementById('resolvedComplaints').textContent = resolved;
            document.getElementById('escalatedComplaints').textContent = escalated;
        })
        .catch((error) => {
            console.error('Error loading dashboard stats:', error);
            document.getElementById('totalComplaints').textContent = '0';
            document.getElementById('pendingComplaints').textContent = '0';
            document.getElementById('resolvedComplaints').textContent = '0';
            document.getElementById('escalatedComplaints').textContent = '0';
        });
}

// Helper function to format date
function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString();
    } else if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleDateString();
    }
    return 'N/A';
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

// Load pending complaints
function loadPendingComplaints() {
    const tableBody = document.getElementById('pendingComplaintsTable');
    
    if (!db || !currentUser) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No complaints found</td></tr>';
        return;
    }
    
    const assignedTo = getAssignedToForRole(currentUser.role);
    if (!assignedTo) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Invalid admin role</td></tr>';
        return;
    }
    
    // Show loading
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Loading complaints...</td></tr>';
    
    // Fetch pending complaints assigned to this admin
    db.collection('complaints')
        .where('assignedTo', '==', assignedTo)
        .where('status', 'in', ['pending', 'in-progress'])
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No pending complaints found</td></tr>';
                return;
            }
            
            let html = '';
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const complaintId = doc.id;
                const date = formatDate(data.createdAt);
                const studentInfo = `${data.studentName || 'Student'} (${data.enrollmentNumber || 'N/A'})`;
                const typeText = getComplaintTypeText(data.complaintType);
                const description = (data.complaintDescription || '').length > 50 
                    ? data.complaintDescription.substring(0, 50) + '...' 
                    : data.complaintDescription;
                
                html += `
                    <tr>
                        <td>${complaintId}</td>
                        <td>${studentInfo}</td>
                        <td>${typeText}</td>
                        <td>${description}</td>
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
            console.error('Error loading pending complaints:', error);
            // If orderBy fails, try without it
            if (error.code === 'failed-precondition') {
                db.collection('complaints')
                    .where('assignedTo', '==', assignedTo)
                    .where('status', 'in', ['pending', 'in-progress'])
                    .get()
                    .then((querySnapshot) => {
                        if (querySnapshot.empty) {
                            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No pending complaints found</td></tr>';
                            return;
                        }
                        
                        let html = '';
                        const complaints = [];
                        querySnapshot.forEach((doc) => {
                            complaints.push({ id: doc.id, data: doc.data() });
                        });
                        complaints.sort((a, b) => {
                            const aTime = a.data.createdAt?.toDate ? a.data.createdAt.toDate().getTime() : 0;
                            const bTime = b.data.createdAt?.toDate ? b.data.createdAt.toDate().getTime() : 0;
                            return bTime - aTime;
                        });
                        
                        complaints.slice(0, 10).forEach(({ id, data }) => {
                            const date = formatDate(data.createdAt);
                            const studentInfo = `${data.studentName || 'Student'} (${data.enrollmentNumber || 'N/A'})`;
                            const typeText = getComplaintTypeText(data.complaintType);
                            const description = (data.complaintDescription || '').length > 50 
                                ? data.complaintDescription.substring(0, 50) + '...' 
                                : data.complaintDescription;
                            
                            html += `
                                <tr>
                                    <td>${id}</td>
                                    <td>${studentInfo}</td>
                                    <td>${typeText}</td>
                                    <td>${description}</td>
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

// Setup event listeners
function setupEventListeners() {
    // Navigation links (dropdown menu only now)
    document.getElementById('dashboardSystemLink').addEventListener('click', (e) => {
        e.preventDefault();
        showView('dashboardView');
    });
    
    document.getElementById('pendingComplaintsSystemLink').addEventListener('click', (e) => {
        e.preventDefault();
        showView('pendingComplaintsView');
        loadAllPendingComplaints();
    });
    
    document.getElementById('resolvedComplaintsSystemLink').addEventListener('click', (e) => {
        e.preventDefault();
        showView('resolvedComplaintsView');
        loadResolvedComplaints();
    });
    
    document.getElementById('escalatedComplaintsSystemLink').addEventListener('click', (e) => {
        e.preventDefault();
        showView('escalatedComplaintsView');
        loadEscalatedComplaints();
    });
    
    document.getElementById('allComplaintsSystemLink').addEventListener('click', (e) => {
        e.preventDefault();
        showView('allComplaintsView');
        loadAllComplaints();
    });
    
    document.getElementById('profileSystemLink').addEventListener('click', (e) => {
        e.preventDefault();
        showView('profileView');
    });
    
    document.getElementById('settingsSystemLink').addEventListener('click', (e) => {
        e.preventDefault();
        showView('settingsView');
    });
    
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
    document.getElementById('pendingComplaintsView').style.display = 'none';
    document.getElementById('resolvedComplaintsView').style.display = 'none';
    document.getElementById('escalatedComplaintsView').style.display = 'none';
    document.getElementById('allComplaintsView').style.display = 'none';
    document.getElementById('profileView').style.display = 'none';
    document.getElementById('settingsView').style.display = 'none';
    
    // Show selected view
    document.getElementById(viewId).style.display = 'block';
}

// Load all pending complaints
function loadAllPendingComplaints() {
    const tableBody = document.getElementById('allPendingComplaintsTable');
    
    if (!db || !currentUser) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No complaints found</td></tr>';
        return;
    }
    
    const assignedTo = getAssignedToForRole(currentUser.role);
    if (!assignedTo) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Invalid admin role</td></tr>';
        return;
    }
    
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Loading complaints...</td></tr>';
    
    // Fetch pending complaints assigned to this admin
    db.collection('complaints')
        .where('assignedTo', '==', assignedTo)
        .where('status', 'in', ['pending', 'in-progress'])
        .orderBy('createdAt', 'desc')
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No pending complaints found</td></tr>';
                return;
            }
            
            let html = '';
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const complaintId = doc.id;
                const date = formatDate(data.createdAt);
                const studentInfo = `${data.studentName || 'Student'} (${data.enrollmentNumber || 'N/A'})`;
                const typeText = getComplaintTypeText(data.complaintType);
                const description = (data.complaintDescription || '').length > 50 
                    ? data.complaintDescription.substring(0, 50) + '...' 
                    : data.complaintDescription;
                const statusClass = getStatusBadgeClass(data.status);
                const statusText = getStatusText(data.status);
                
                html += `
                    <tr>
                        <td>${complaintId}</td>
                        <td>${studentInfo}</td>
                        <td>${typeText}</td>
                        <td>${description}</td>
                        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                        <td>${date}</td>
                        <td>
                            <button class="btn btn-sm btn-success btn-action" onclick="resolveComplaint('${complaintId}')">Resolve</button>
                            <button class="btn btn-sm btn-warning btn-action" onclick="escalateComplaint('${complaintId}')">Escalate</button>
            </td>
        </tr>
    `;
            });
            
            tableBody.innerHTML = html;
        })
        .catch((error) => {
            console.error('Error loading pending complaints:', error);
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Error loading complaints</td></tr>';
        });
}

// Load resolved complaints
function loadResolvedComplaints() {
    const tableBody = document.getElementById('resolvedComplaintsTable');
    
    if (!db || !currentUser) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No complaints found</td></tr>';
        return;
    }
    
    const assignedTo = getAssignedToForRole(currentUser.role);
    if (!assignedTo) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Invalid admin role</td></tr>';
        return;
    }
    
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Loading complaints...</td></tr>';
    
    // Fetch resolved complaints assigned to this admin
    db.collection('complaints')
        .where('assignedTo', '==', assignedTo)
        .where('status', '==', 'resolved')
        .orderBy('createdAt', 'desc')
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No resolved complaints found</td></tr>';
                return;
            }
            
            let html = '';
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const complaintId = doc.id;
                const date = formatDate(data.createdAt);
                const studentInfo = `${data.studentName || 'Student'} (${data.enrollmentNumber || 'N/A'})`;
                const typeText = getComplaintTypeText(data.complaintType);
                const description = (data.complaintDescription || '').length > 50 
                    ? data.complaintDescription.substring(0, 50) + '...' 
                    : data.complaintDescription;
                
                html += `
                    <tr>
                        <td>${complaintId}</td>
                        <td>${studentInfo}</td>
                        <td>${typeText}</td>
                        <td>${description}</td>
            <td><span class="status-badge badge-resolved">Resolved</span></td>
                        <td>${date}</td>
                        <td>${currentUser.role || 'Admin'}</td>
        </tr>
    `;
            });
            
            tableBody.innerHTML = html;
        })
        .catch((error) => {
            console.error('Error loading resolved complaints:', error);
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Error loading complaints</td></tr>';
        });
}

// Load escalated complaints
function loadEscalatedComplaints() {
    const tableBody = document.getElementById('escalatedComplaintsTable');
    
    if (!db || !currentUser) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No complaints found</td></tr>';
        return;
    }
    
    const assignedTo = getAssignedToForRole(currentUser.role);
    if (!assignedTo) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Invalid admin role</td></tr>';
        return;
    }
    
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Loading complaints...</td></tr>';
    
    // Fetch escalated complaints assigned to this admin
    db.collection('complaints')
        .where('assignedTo', '==', assignedTo)
        .where('status', '==', 'escalated')
        .orderBy('createdAt', 'desc')
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No escalated complaints found</td></tr>';
                return;
            }
            
            let html = '';
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const complaintId = doc.id;
                const date = formatDate(data.createdAt);
                const studentInfo = `${data.studentName || 'Student'} (${data.enrollmentNumber || 'N/A'})`;
                const typeText = getComplaintTypeText(data.complaintType);
                const description = (data.complaintDescription || '').length > 50 
                    ? data.complaintDescription.substring(0, 50) + '...' 
                    : data.complaintDescription;
                
                html += `
                    <tr>
                        <td>${complaintId}</td>
                        <td>${studentInfo}</td>
                        <td>${typeText}</td>
                        <td>${description}</td>
                        <td><span class="status-badge badge-info">Escalated</span></td>
                        <td>${date}</td>
                        <td>${data.assignedTo || 'N/A'}</td>
        </tr>
    `;
            });
            
            tableBody.innerHTML = html;
        })
        .catch((error) => {
            console.error('Error loading escalated complaints:', error);
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Error loading complaints</td></tr>';
        });
}

// Load all complaints
function loadAllComplaints() {
    const tableBody = document.getElementById('allComplaintsTable');
    
    if (!db || !currentUser) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No complaints found</td></tr>';
        return;
    }
    
    const assignedTo = getAssignedToForRole(currentUser.role);
    if (!assignedTo) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Invalid admin role</td></tr>';
        return;
    }
    
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Loading complaints...</td></tr>';
    
    // Fetch all complaints assigned to this admin
    db.collection('complaints')
        .where('assignedTo', '==', assignedTo)
        .orderBy('createdAt', 'desc')
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No complaints found</td></tr>';
                return;
            }
            
            let html = '';
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const complaintId = doc.id;
                const date = formatDate(data.createdAt);
                const studentInfo = `${data.studentName || 'Student'} (${data.enrollmentNumber || 'N/A'})`;
                const typeText = getComplaintTypeText(data.complaintType);
                const description = (data.complaintDescription || '').length > 50 
                    ? data.complaintDescription.substring(0, 50) + '...' 
                    : data.complaintDescription;
                const statusClass = getStatusBadgeClass(data.status);
                const statusText = getStatusText(data.status);
                
                // Show action buttons based on status
                let actionButtons = '';
                if (data.status === 'pending' || data.status === 'in-progress') {
                    actionButtons = `
                        <button class="btn btn-sm btn-success btn-action" onclick="resolveComplaint('${complaintId}')">Resolve</button>
                        <button class="btn btn-sm btn-warning btn-action" onclick="escalateComplaint('${complaintId}')">Escalate</button>
                    `;
                } else {
                    actionButtons = `<button class="btn btn-sm btn-primary btn-action" onclick="viewComplaint('${complaintId}')">View</button>`;
                }
                
                html += `
                    <tr>
                        <td>${complaintId}</td>
                        <td>${studentInfo}</td>
                        <td>${typeText}</td>
                        <td>${description}</td>
                        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                        <td>${date}</td>
                        <td>${actionButtons}</td>
        </tr>
                `;
            });
            
            tableBody.innerHTML = html;
        })
        .catch((error) => {
            console.error('Error loading all complaints:', error);
            // If orderBy fails, try without it
            if (error.code === 'failed-precondition') {
                db.collection('complaints')
                    .where('assignedTo', '==', assignedTo)
                    .get()
                    .then((querySnapshot) => {
                        if (querySnapshot.empty) {
                            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No complaints found</td></tr>';
                            return;
                        }
                        
                        let html = '';
                        const complaints = [];
                        querySnapshot.forEach((doc) => {
                            complaints.push({ id: doc.id, data: doc.data() });
                        });
                        complaints.sort((a, b) => {
                            const aTime = a.data.createdAt?.toDate ? a.data.createdAt.toDate().getTime() : 0;
                            const bTime = b.data.createdAt?.toDate ? b.data.createdAt.toDate().getTime() : 0;
                            return bTime - aTime;
                        });
                        
                        complaints.forEach(({ id, data }) => {
                            const date = formatDate(data.createdAt);
                            const studentInfo = `${data.studentName || 'Student'} (${data.enrollmentNumber || 'N/A'})`;
                            const typeText = getComplaintTypeText(data.complaintType);
                            const description = (data.complaintDescription || '').length > 50 
                                ? data.complaintDescription.substring(0, 50) + '...' 
                                : data.complaintDescription;
                            const statusClass = getStatusBadgeClass(data.status);
                            const statusText = getStatusText(data.status);
                            
                            let actionButtons = '';
                            if (data.status === 'pending' || data.status === 'in-progress') {
                                actionButtons = `
                                    <button class="btn btn-sm btn-success btn-action" onclick="resolveComplaint('${id}')">Resolve</button>
                                    <button class="btn btn-sm btn-warning btn-action" onclick="escalateComplaint('${id}')">Escalate</button>
                                `;
                            } else {
                                actionButtons = `<button class="btn btn-sm btn-primary btn-action" onclick="viewComplaint('${id}')">View</button>`;
                            }
                            
                            html += `
                                <tr>
                                    <td>${id}</td>
                                    <td>${studentInfo}</td>
                                    <td>${typeText}</td>
                                    <td>${description}</td>
                                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                                    <td>${date}</td>
                                    <td>${actionButtons}</td>
        </tr>
    `;
                        });
                        
                        tableBody.innerHTML = html;
                    })
                    .catch((fallbackError) => {
                        console.error('Fallback error:', fallbackError);
                        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Error loading complaints</td></tr>';
                    });
            } else {
                tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Error loading complaints</td></tr>';
            }
        });
}

// View complaint details
function viewComplaint(complaintId) {
    if (!db) {
        alert('Database not available');
        return;
    }
    
    db.collection('complaints').doc(complaintId).get()
        .then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                const date = formatDate(data.createdAt);
                const updatedDate = formatDate(data.updatedAt);
                const resolvedDate = data.resolvedAt ? formatDate(data.resolvedAt) : 'N/A';
                const statusClass = getStatusBadgeClass(data.status);
                const statusText = getStatusText(data.status);
                
                // Build complaint details HTML
                const detailsHTML = `
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <strong><i class="fas fa-id-badge"></i> Complaint ID:</strong>
                            <p class="mb-0">${complaintId}</p>
                        </div>
                        <div class="col-md-6 mb-3">
                            <strong><i class="fas fa-info-circle"></i> Status:</strong>
                            <p class="mb-0"><span class="badge ${statusClass}">${statusText}</span></p>
                        </div>
                    </div>
                    <hr>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <strong><i class="fas fa-user"></i> Student Name:</strong>
                            <p class="mb-0">${data.studentName || 'N/A'}</p>
                        </div>
                        <div class="col-md-6 mb-3">
                            <strong><i class="fas fa-id-card"></i> Enrollment Number:</strong>
                            <p class="mb-0">${data.enrollmentNumber || 'N/A'}</p>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <strong><i class="fas fa-tag"></i> Complaint Type:</strong>
                            <p class="mb-0">${getComplaintTypeText(data.complaintType)}</p>
                        </div>
                        <div class="col-md-6 mb-3">
                            <strong><i class="fas fa-user-tie"></i> Assigned To:</strong>
                            <p class="mb-0">${data.assignedTo ? data.assignedTo.charAt(0).toUpperCase() + data.assignedTo.slice(1) : 'Pending'}</p>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <strong><i class="fas fa-home"></i> House Name:</strong>
                            <p class="mb-0">${data.houseName || 'N/A'}</p>
                        </div>
                        <div class="col-md-6 mb-3">
                            <strong><i class="fas fa-door-open"></i> Room Number:</strong>
                            <p class="mb-0">${data.roomNumber || 'N/A'}</p>
                        </div>
                    </div>
                    <hr>
                    <div class="mb-3">
                        <strong><i class="fas fa-align-left"></i> Description:</strong>
                        <p class="mt-2" style="white-space: pre-wrap;">${data.complaintDescription || 'N/A'}</p>
                    </div>
                    <hr>
                    <div class="row">
                        <div class="col-md-4 mb-3">
                            <strong><i class="fas fa-calendar-plus"></i> Created:</strong>
                            <p class="mb-0">${date}</p>
                        </div>
                        <div class="col-md-4 mb-3">
                            <strong><i class="fas fa-calendar-check"></i> Last Updated:</strong>
                            <p class="mb-0">${updatedDate}</p>
                        </div>
                        ${data.resolvedAt ? `
                        <div class="col-md-4 mb-3">
                            <strong><i class="fas fa-check-circle"></i> Resolved:</strong>
                            <p class="mb-0">${resolvedDate}</p>
                        </div>
                        ` : ''}
                        ${data.resolvedBy ? `
                        <div class="col-md-4 mb-3">
                            <strong><i class="fas fa-user-check"></i> Resolved By:</strong>
                            <p class="mb-0">${data.resolvedBy}</p>
                        </div>
                        ` : ''}
                    </div>
                `;
                
                // Set modal body content
                const modalBody = document.getElementById('complaintDetailsBody');
                if (modalBody) {
                    modalBody.innerHTML = detailsHTML;
                }
                
                // Build action buttons in footer
                const modalFooter = document.getElementById('complaintDetailsFooter');
                let footerHTML = '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>';
                
                // Show "Mark as Resolved" button only for pending or in-progress complaints
                if (data.status === 'pending' || data.status === 'in-progress') {
                    footerHTML = `
                        <button type="button" class="btn btn-success" onclick="resolveComplaintFromModal('${complaintId}')">
                            <i class="fas fa-check-circle"></i> Mark as Resolved
                        </button>
                        <button type="button" class="btn btn-warning" onclick="escalateComplaintFromModal('${complaintId}')">
                            <i class="fas fa-arrow-up"></i> Escalate
                        </button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    `;
                }
                
                if (modalFooter) {
                    modalFooter.innerHTML = footerHTML;
                }
                
                // Show the modal
                const modal = new bootstrap.Modal(document.getElementById('complaintDetailsModal'));
                modal.show();
            } else {
                alert('Complaint not found');
            }
        })
        .catch((error) => {
            console.error('Error fetching complaint:', error);
            alert('Error loading complaint details');
        });
}

// Resolve complaint (called from table button)
function resolveComplaint(complaintId) {
    if (!db) {
        alert('Database not available');
        return;
    }
    
    if (confirm(`Are you sure you want to mark complaint ${complaintId} as resolved?`)) {
        db.collection('complaints').doc(complaintId).update({
            status: 'resolved',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            resolvedBy: currentUser.email,
            resolvedAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            alert(`Complaint ${complaintId} has been marked as resolved.`);
            // Refresh all views
            loadDashboardStats();
            loadPendingComplaints();
            loadAllPendingComplaints();
            loadResolvedComplaints();
            loadAllComplaints();
        })
        .catch((error) => {
            console.error('Error resolving complaint:', error);
            alert('Error updating complaint. Please try again.');
        });
    }
}

// Resolve complaint from modal (closes modal after resolving)
function resolveComplaintFromModal(complaintId) {
    if (!db) {
        alert('Database not available');
        return;
    }
    
    if (confirm(`Are you sure you want to mark complaint ${complaintId} as resolved?`)) {
        db.collection('complaints').doc(complaintId).update({
            status: 'resolved',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            resolvedBy: currentUser.email,
            resolvedAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            // Close the modal
            const modalElement = document.getElementById('complaintDetailsModal');
            if (modalElement) {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) {
                    modal.hide();
                }
            }
            
            // Show success message
            alert(`Complaint ${complaintId} has been marked as resolved. The status will now be updated for both admin and student views.`);
            
            // Refresh all views
            loadDashboardStats();
            loadPendingComplaints();
            loadAllPendingComplaints();
            loadResolvedComplaints();
            loadAllComplaints();
        })
        .catch((error) => {
            console.error('Error resolving complaint:', error);
            alert('Error updating complaint. Please try again.');
        });
    }
}

// Escalate complaint from modal
function escalateComplaintFromModal(complaintId) {
    // Close modal first
    const modalElement = document.getElementById('complaintDetailsModal');
    if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        }
    }
    // Call the escalate function
    escalateComplaint(complaintId);
}

// Make functions globally available
window.resolveComplaintFromModal = resolveComplaintFromModal;
window.escalateComplaintFromModal = escalateComplaintFromModal;

// Escalate complaint
function escalateComplaint(complaintId) {
    if (!db) {
        alert('Database not available');
        return;
    }
    
    // Determine next authority based on current assignment
    if (confirm(`Are you sure you want to escalate complaint ${complaintId}?`)) {
        // Get current complaint to determine escalation path
        db.collection('complaints').doc(complaintId).get()
            .then((doc) => {
                if (!doc.exists) {
                    alert('Complaint not found');
                    return;
                }
                
                const data = doc.data();
                const currentAssignedTo = data.assignedTo;
                let nextAuthority = 'registrar'; // Default escalation
                
                // Escalation path
                if (currentAssignedTo === 'warden') {
                    nextAuthority = 'registrar';
                } else if (currentAssignedTo === 'mentor') {
                    nextAuthority = 'registrar';
                } else if (currentAssignedTo === 'examcell') {
                    nextAuthority = 'registrar';
                } else if (currentAssignedTo === 'disciplinary') {
                    nextAuthority = 'registrar';
                } else if (currentAssignedTo === 'registrar') {
                    nextAuthority = 'vc';
                }
                
                // Update complaint
                db.collection('complaints').doc(complaintId).update({
                    status: 'escalated',
                    assignedTo: nextAuthority,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    escalatedBy: currentUser.email,
                    escalatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    previousAuthority: currentAssignedTo
                })
                .then(() => {
                    alert(`Complaint ${complaintId} has been escalated to ${nextAuthority}.`);
                    // Refresh all views
                    loadDashboardStats();
                    loadPendingComplaints();
                    loadAllPendingComplaints();
                    loadEscalatedComplaints();
                    loadAllComplaints();
                })
                .catch((error) => {
                    console.error('Error escalating complaint:', error);
                    alert('Error updating complaint. Please try again.');
                });
            })
            .catch((error) => {
                console.error('Error fetching complaint:', error);
                alert('Error loading complaint. Please try again.');
            });
    }
}

// Make functions available globally
window.viewComplaint = viewComplaint;
window.resolveComplaint = resolveComplaint;
window.escalateComplaint = escalateComplaint;

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