// Admin Dashboard functionality for College Complaint Management System

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    currentUser = getCurrentUser();
    if (!currentUser || currentUser.type !== 'admin') {
        window.location.href = 'index.html';
        return;
    }
    
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
    // In a real implementation, this would fetch from a database
    // For now, we'll simulate with sample data
    document.getElementById('totalComplaints').textContent = '24';
    document.getElementById('pendingComplaints').textContent = '8';
    document.getElementById('resolvedComplaints').textContent = '12';
    document.getElementById('escalatedComplaints').textContent = '4';
}

// Load pending complaints
function loadPendingComplaints() {
    // In a real implementation, this would fetch from a database
    // For now, we'll simulate with sample data
    const tableBody = document.getElementById('pendingComplaintsTable');
    tableBody.innerHTML = `
        <tr>
            <td>CMPL-003</td>
            <td>Rajesh Kumar (EN-54321)</td>
            <td>Academic</td>
            <td>Issue with course material</td>
            <td>2025-10-28</td>
            <td>
                <button class="btn btn-sm btn-primary btn-action" onclick="viewComplaint('CMPL-003')">View</button>
            </td>
        </tr>
        <tr>
            <td>CMPL-006</td>
            <td>Priya Sharma (EN-98765)</td>
            <td>Hostel/Mess</td>
            <td>Broken window in room</td>
            <td>2025-10-30</td>
            <td>
                <button class="btn btn-sm btn-primary btn-action" onclick="viewComplaint('CMPL-006')">View</button>
            </td>
        </tr>
        <tr>
            <td>CMPL-007</td>
            <td>Amit Patel (EN-11223)</td>
            <td>Exam Related</td>
            <td>Exam center allocation</td>
            <td>2025-10-30</td>
            <td>
                <button class="btn btn-sm btn-primary btn-action" onclick="viewComplaint('CMPL-007')">View</button>
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
    // In a real implementation, this would fetch from a database
    // For now, we'll simulate with sample data
    const tableBody = document.getElementById('allPendingComplaintsTable');
    tableBody.innerHTML = `
        <tr>
            <td>CMPL-003</td>
            <td>Rajesh Kumar (EN-54321)</td>
            <td>Academic</td>
            <td>Issue with course material</td>
            <td><span class="status-badge badge-pending">Pending</span></td>
            <td>2025-10-28</td>
            <td>
                <button class="btn btn-sm btn-success btn-action" onclick="resolveComplaint('CMPL-003')">Resolve</button>
                <button class="btn btn-sm btn-warning btn-action" onclick="escalateComplaint('CMPL-003')">Escalate</button>
            </td>
        </tr>
        <tr>
            <td>CMPL-006</td>
            <td>Priya Sharma (EN-98765)</td>
            <td>Hostel/Mess</td>
            <td>Broken window in room</td>
            <td><span class="status-badge badge-pending">Pending</span></td>
            <td>2025-10-30</td>
            <td>
                <button class="btn btn-sm btn-success btn-action" onclick="resolveComplaint('CMPL-006')">Resolve</button>
                <button class="btn btn-sm btn-warning btn-action" onclick="escalateComplaint('CMPL-006')">Escalate</button>
            </td>
        </tr>
        <tr>
            <td>CMPL-007</td>
            <td>Amit Patel (EN-11223)</td>
            <td>Exam Related</td>
            <td>Exam center allocation</td>
            <td><span class="status-badge badge-pending">Pending</span></td>
            <td>2025-10-30</td>
            <td>
                <button class="btn btn-sm btn-success btn-action" onclick="resolveComplaint('CMPL-007')">Resolve</button>
                <button class="btn btn-sm btn-warning btn-action" onclick="escalateComplaint('CMPL-007')">Escalate</button>
            </td>
        </tr>
        <tr>
            <td>CMPL-009</td>
            <td>Sneha Reddy (EN-44556)</td>
            <td>Other</td>
            <td>Library book missing</td>
            <td><span class="status-badge badge-pending">Pending</span></td>
            <td>2025-10-30</td>
            <td>
                <button class="btn btn-sm btn-success btn-action" onclick="resolveComplaint('CMPL-009')">Resolve</button>
                <button class="btn btn-sm btn-warning btn-action" onclick="escalateComplaint('CMPL-009')">Escalate</button>
            </td>
        </tr>
        <tr>
            <td>CMPL-011</td>
            <td>Vikram Singh (EN-77889)</td>
            <td>Disciplinary</td>
            <td>Parking violation</td>
            <td><span class="status-badge badge-pending">Pending</span></td>
            <td>2025-10-30</td>
            <td>
                <button class="btn btn-sm btn-success btn-action" onclick="resolveComplaint('CMPL-011')">Resolve</button>
                <button class="btn btn-sm btn-warning btn-action" onclick="escalateComplaint('CMPL-011')">Escalate</button>
            </td>
        </tr>
    `;
}

// Load resolved complaints
function loadResolvedComplaints() {
    // In a real implementation, this would fetch from a database
    // For now, we'll simulate with sample data
    const tableBody = document.getElementById('resolvedComplaintsTable');
    tableBody.innerHTML = `
        <tr>
            <td>CMPL-001</td>
            <td>Ankit Verma (EN-12345)</td>
            <td>Hostel/Mess</td>
            <td>No hot water in hostel</td>
            <td><span class="status-badge badge-resolved">Resolved</span></td>
            <td>2025-10-25</td>
            <td>Warden</td>
        </tr>
        <tr>
            <td>CMPL-002</td>
            <td>Pooja Desai (EN-67890)</td>
            <td>Exam Related</td>
            <td>Exam schedule conflict</td>
            <td><span class="status-badge badge-resolved">Resolved</span></td>
            <td>2025-10-26</td>
            <td>Exam Cell</td>
        </tr>
        <tr>
            <td>CMPL-004</td>
            <td>Rahul Mehta (EN-24680)</td>
            <td>Disciplinary</td>
            <td>Library noise complaint</td>
            <td><span class="status-badge badge-resolved">Resolved</span></td>
            <td>2025-10-29</td>
            <td>Disciplinary Committee</td>
        </tr>
        <tr>
            <td>CMPL-005</td>
            <td>Neha Gupta (EN-13579)</td>
            <td>Other</td>
            <td>Wi-Fi connectivity issue</td>
            <td><span class="status-badge badge-resolved">Resolved</span></td>
            <td>2025-10-30</td>
            <td>Registrar</td>
        </tr>
        <tr>
            <td>CMPL-008</td>
            <td>Karan Joshi (EN-97531)</td>
            <td>Academic</td>
            <td>Assignment deadline extension</td>
            <td><span class="status-badge badge-resolved">Resolved</span></td>
            <td>2025-10-30</td>
            <td>Mentor</td>
        </tr>
        <tr>
            <td>CMPL-010</td>
            <td>Shreya Bhat (EN-86420)</td>
            <td>Hostel/Mess</td>
            <td>Mess food quality</td>
            <td><span class="status-badge badge-resolved">Resolved</span></td>
            <td>2025-10-30</td>
            <td>Warden</td>
        </tr>
    `;
}

// Load escalated complaints
function loadEscalatedComplaints() {
    // In a real implementation, this would fetch from a database
    // For now, we'll simulate with sample data
    const tableBody = document.getElementById('escalatedComplaintsTable');
    tableBody.innerHTML = `
        <tr>
            <td>CMPL-003</td>
            <td>Rajesh Kumar (EN-54321)</td>
            <td>Academic</td>
            <td>Issue with course material</td>
            <td><span class="status-badge badge-escalated">Escalated</span></td>
            <td>2025-10-29</td>
            <td>Dean</td>
        </tr>
        <tr>
            <td>CMPL-006</td>
            <td>Priya Sharma (EN-98765)</td>
            <td>Hostel/Mess</td>
            <td>Broken window in room</td>
            <td><span class="status-badge badge-escalated">Escalated</span></td>
            <td>2025-10-30</td>
            <td>Chief Warden</td>
        </tr>
        <tr>
            <td>CMPL-009</td>
            <td>Sneha Reddy (EN-44556)</td>
            <td>Other</td>
            <td>Library book missing</td>
            <td><span class="status-badge badge-escalated">Escalated</span></td>
            <td>2025-10-30</td>
            <td>Registrar</td>
        </tr>
        <tr>
            <td>CMPL-011</td>
            <td>Vikram Singh (EN-77889)</td>
            <td>Disciplinary</td>
            <td>Parking violation</td>
            <td><span class="status-badge badge-escalated">Escalated</span></td>
            <td>2025-10-30</td>
            <td>Registrar</td>
        </tr>
    `;
}

// Load all complaints
function loadAllComplaints() {
    // In a real implementation, this would fetch from a database
    // For now, we'll simulate with sample data
    const tableBody = document.getElementById('allComplaintsTable');
    tableBody.innerHTML = `
        <tr>
            <td>CMPL-001</td>
            <td>Ankit Verma (EN-12345)</td>
            <td>Hostel/Mess</td>
            <td>No hot water in hostel</td>
            <td><span class="status-badge badge-resolved">Resolved</span></td>
            <td>2025-10-25</td>
            <td>
                <button class="btn btn-sm btn-primary btn-action" onclick="viewComplaint('CMPL-001')">View</button>
            </td>
        </tr>
        <tr>
            <td>CMPL-002</td>
            <td>Pooja Desai (EN-67890)</td>
            <td>Exam Related</td>
            <td>Exam schedule conflict</td>
            <td><span class="status-badge badge-resolved">Resolved</span></td>
            <td>2025-10-26</td>
            <td>
                <button class="btn btn-sm btn-primary btn-action" onclick="viewComplaint('CMPL-002')">View</button>
            </td>
        </tr>
        <tr>
            <td>CMPL-003</td>
            <td>Rajesh Kumar (EN-54321)</td>
            <td>Academic</td>
            <td>Issue with course material</td>
            <td><span class="status-badge badge-escalated">Escalated</span></td>
            <td>2025-10-29</td>
            <td>
                <button class="btn btn-sm btn-primary btn-action" onclick="viewComplaint('CMPL-003')">View</button>
            </td>
        </tr>
        <tr>
            <td>CMPL-004</td>
            <td>Rahul Mehta (EN-24680)</td>
            <td>Disciplinary</td>
            <td>Library noise complaint</td>
            <td><span class="status-badge badge-resolved">Resolved</span></td>
            <td>2025-10-29</td>
            <td>
                <button class="btn btn-sm btn-primary btn-action" onclick="viewComplaint('CMPL-004')">View</button>
            </td>
        </tr>
        <tr>
            <td>CMPL-005</td>
            <td>Neha Gupta (EN-13579)</td>
            <td>Other</td>
            <td>Wi-Fi connectivity issue</td>
            <td><span class="status-badge badge-resolved">Resolved</span></td>
            <td>2025-10-30</td>
            <td>
                <button class="btn btn-sm btn-primary btn-action" onclick="viewComplaint('CMPL-005')">View</button>
            </td>
        </tr>
        <tr>
            <td>CMPL-006</td>
            <td>Priya Sharma (EN-98765)</td>
            <td>Hostel/Mess</td>
            <td>Broken window in room</td>
            <td><span class="status-badge badge-escalated">Escalated</span></td>
            <td>2025-10-30</td>
            <td>
                <button class="btn btn-sm btn-primary btn-action" onclick="viewComplaint('CMPL-006')">View</button>
            </td>
        </tr>
        <tr>
            <td>CMPL-007</td>
            <td>Amit Patel (EN-11223)</td>
            <td>Exam Related</td>
            <td>Exam center allocation</td>
            <td><span class="status-badge badge-pending">Pending</span></td>
            <td>2025-10-30</td>
            <td>
                <button class="btn btn-sm btn-success btn-action" onclick="resolveComplaint('CMPL-007')">Resolve</button>
                <button class="btn btn-sm btn-warning btn-action" onclick="escalateComplaint('CMPL-007')">Escalate</button>
            </td>
        </tr>
        <tr>
            <td>CMPL-008</td>
            <td>Karan Joshi (EN-97531)</td>
            <td>Academic</td>
            <td>Assignment deadline extension</td>
            <td><span class="status-badge badge-resolved">Resolved</span></td>
            <td>2025-10-30</td>
            <td>
                <button class="btn btn-sm btn-primary btn-action" onclick="viewComplaint('CMPL-008')">View</button>
            </td>
        </tr>
        <tr>
            <td>CMPL-009</td>
            <td>Sneha Reddy (EN-44556)</td>
            <td>Other</td>
            <td>Library book missing</td>
            <td><span class="status-badge badge-escalated">Escalated</span></td>
            <td>2025-10-30</td>
            <td>
                <button class="btn btn-sm btn-primary btn-action" onclick="viewComplaint('CMPL-009')">View</button>
            </td>
        </tr>
        <tr>
            <td>CMPL-010</td>
            <td>Shreya Bhat (EN-86420)</td>
            <td>Hostel/Mess</td>
            <td>Mess food quality</td>
            <td><span class="status-badge badge-resolved">Resolved</span></td>
            <td>2025-10-30</td>
            <td>
                <button class="btn btn-sm btn-primary btn-action" onclick="viewComplaint('CMPL-010')">View</button>
            </td>
        </tr>
        <tr>
            <td>CMPL-011</td>
            <td>Vikram Singh (EN-77889)</td>
            <td>Disciplinary</td>
            <td>Parking violation</td>
            <td><span class="status-badge badge-escalated">Escalated</span></td>
            <td>2025-10-30</td>
            <td>
                <button class="btn btn-sm btn-primary btn-action" onclick="viewComplaint('CMPL-011')">View</button>
            </td>
        </tr>
    `;
}

// View complaint details
function viewComplaint(complaintId) {
    alert(`Viewing details for complaint ${complaintId}\n\nIn a real implementation, this would show the full complaint details.`);
}

// Resolve complaint
function resolveComplaint(complaintId) {
    if (confirm(`Are you sure you want to mark complaint ${complaintId} as resolved?`)) {
        alert(`Complaint ${complaintId} has been marked as resolved.`);
        // In a real implementation, this would update the complaint status in the database
        loadAllPendingComplaints(); // Refresh the view
    }
}

// Escalate complaint
function escalateComplaint(complaintId) {
    if (confirm(`Are you sure you want to escalate complaint ${complaintId}?`)) {
        alert(`Complaint ${complaintId} has been escalated to the next authority.`);
        // In a real implementation, this would update the complaint status in the database
        loadAllPendingComplaints(); // Refresh the view
    }
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