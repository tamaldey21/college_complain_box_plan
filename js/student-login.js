// Student Login functionality for College Complaint Management System

document.addEventListener('DOMContentLoaded', () => {
    const studentLoginForm = document.getElementById('studentLoginForm');
    
    if (studentLoginForm) {
        studentLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const enrollmentNumber = document.getElementById('enrollmentNumber').value.trim();
            const password = document.getElementById('password').value;
            
            if (!enrollmentNumber || !password) {
                alert('Please fill in all fields');
                return;
            }
            
            // Show loading state
            const submitBtn = studentLoginForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging in...';
            submitBtn.disabled = true;
            
            // Attempt login
            studentLogin(enrollmentNumber, password)
                .then(user => {
                    // Login successful
                    window.location.href = 'student-dashboard.html';
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
    
    // Check if user is already logged in
    checkAuthState();
});