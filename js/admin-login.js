// Admin Login functionality for College Complaint Management System

document.addEventListener('DOMContentLoaded', () => {
    const adminLoginForm = document.getElementById('adminLoginForm');
    
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('adminEmail').value.trim();
            const password = document.getElementById('adminPassword').value;
            const role = document.getElementById('adminRole').value;
            
            if (!email || !password || !role) {
                alert('Please fill in all fields');
                return;
            }
            
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Please enter a valid email address');
                return;
            }
            
            // Show loading state
            const submitBtn = adminLoginForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging in...';
            submitBtn.disabled = true;
            
            // Attempt login
            adminLogin(email, password, role)
                .then(user => {
                    // Login successful
                    window.location.href = 'admin-dashboard.html';
                })
                .catch(error => {
                    // Login failed
                    console.error('Login error:', error);
                    alert('Login failed: ' + (error.message || 'Invalid credentials'));
                    
                    // Reset button
                    submitBtn.textContent = originalBtnText;
                    submitBtn.disabled = false;
                });
        });
    }
});