// Authentication module for College Complaint Management System

// Check if user is logged in
function checkAuthState() {
    // In a real implementation, this would check actual authentication state
    // For now, we'll use localStorage to simulate authentication
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        // If user is not logged in and trying to access protected pages
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage !== 'index.html' && 
            currentPage !== 'student-login.html' && 
            currentPage !== 'admin-login.html' &&
            currentPage !== '') {
            window.location.href = 'index.html';
        }
    } else {
        // If user is logged in, redirect from login pages
        const currentPage = window.location.pathname.split('/').pop();
        const userData = JSON.parse(currentUser);
        
        if (userData.type === 'student' && currentPage === 'student-login.html') {
            window.location.href = 'student-dashboard.html';
        } else if (userData.type === 'admin' && currentPage === 'admin-login.html') {
            window.location.href = 'admin-dashboard.html';
        }
    }
}

// Student login function
function studentLogin(enrollmentNumber, password) {
    // In a real implementation, this would verify against a database
    // For now, we'll simulate with localStorage
    return new Promise((resolve, reject) => {
        // Simulate API delay
        setTimeout(() => {
            // For demo purposes, accept any non-empty enrollment number and password
            if (enrollmentNumber && password) {
                const studentData = {
                    id: enrollmentNumber,
                    type: 'student',
                    name: 'Student Name', // This would come from database
                    enrollmentNumber: enrollmentNumber,
                    houseName: 'House A', // This would come from database
                    roomNumber: '101' // This would come from database
                };
                
                localStorage.setItem('currentUser', JSON.stringify(studentData));
                resolve(studentData);
            } else {
                reject(new Error('Invalid credentials'));
            }
        }, 500);
    });
}

// Admin login function
function adminLogin(email, password, role) {
    return new Promise((resolve, reject) => {
        // Simulate API delay
        setTimeout(() => {
            // For demo purposes, accept any non-empty email, password, and role
            if (email && password && role) {
                const adminData = {
                    id: email,
                    type: 'admin',
                    name: 'Admin Name', // This would come from database
                    email: email,
                    role: role
                };
                
                localStorage.setItem('currentUser', JSON.stringify(adminData));
                resolve(adminData);
            } else {
                reject(new Error('Invalid credentials'));
            }
        }, 500);
    });
}

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Get current user data
function getCurrentUser() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        return JSON.parse(currentUser);
    }
    return null;
}

// Initialize auth state checker
document.addEventListener('DOMContentLoaded', () => {
    checkAuthState();
    
    // Attach logout event listener if logout button exists
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
});