// Authentication module for College Complaint Management System

// Initialize Firebase
let auth = null;
var db = null; // Use var instead of let to make it globally accessible

// Initialize Firebase if config is available
if (typeof window !== 'undefined' && window.APP_CONFIG && window.APP_CONFIG.FIREBASE) {
    try {
        // Initialize Firebase App
        if (!firebase.apps.length) {
            firebase.initializeApp(window.APP_CONFIG.FIREBASE);
        }
        auth = firebase.auth();
        
        // Initialize Firestore if needed
        if (typeof firebase.firestore !== 'undefined') {
            db = firebase.firestore();
        }
    } catch (error) {
        console.error('Firebase initialization error:', error);
    }
}

// Check if user is logged in
function checkAuthState() {
    if (!auth) {
        // Fallback to localStorage if Firebase is not initialized
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) {
            const currentPage = window.location.pathname.split('/').pop();
            if (currentPage !== 'index.html' && 
                currentPage !== 'student-login.html' && 
                currentPage !== 'admin-login.html' &&
                currentPage !== '') {
                window.location.href = 'index.html';
            }
        } else {
            const currentPage = window.location.pathname.split('/').pop();
            const userData = JSON.parse(currentUser);
            
            if (userData.type === 'student' && currentPage === 'student-login.html') {
                window.location.href = 'student-dashboard.html';
            } else if (userData.type === 'admin' && currentPage === 'admin-login.html') {
                window.location.href = 'admin-dashboard.html';
            }
        }
        return;
    }
    
    // Use Firebase auth state listener
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in
            const currentPage = window.location.pathname.split('/').pop();
            
            // Get user data from localStorage (set during login)
            const currentUser = localStorage.getItem('currentUser');
            if (currentUser) {
                const userData = JSON.parse(currentUser);
                
                if (userData.type === 'student' && currentPage === 'student-login.html') {
                    window.location.href = 'student-dashboard.html';
                } else if (userData.type === 'admin' && currentPage === 'admin-login.html') {
                    window.location.href = 'admin-dashboard.html';
                }
            }
        } else {
            // User is signed out
            const currentPage = window.location.pathname.split('/').pop();
            if (currentPage !== 'index.html' && 
                currentPage !== 'student-login.html' && 
                currentPage !== 'admin-login.html' &&
                currentPage !== '') {
                window.location.href = 'index.html';
            }
        }
    });
}

// Student login function using Firebase Authentication
function studentLogin(enrollmentNumber, password) {
    return new Promise((resolve, reject) => {
        if (!auth) {
            reject(new Error('Firebase is not initialized. Please check your configuration.'));
            return;
        }
        
        // Use enrollment number as email (Firebase requires email format)
        // Format: enrollmentNumber@student.college.edu
        // Or you can use enrollment number directly if it's in email format
        const email = `${enrollmentNumber}@student.college.edu`;
        
        // Sign in with email and password (no sign-up, only login)
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Login successful
                const user = userCredential.user;
                
                // Get additional user data from Firestore if available
                if (db) {
                    db.collection('students').doc(enrollmentNumber).get()
                        .then((doc) => {
                            if (doc.exists) {
                                const studentData = doc.data();
                                const userData = {
                                    id: user.uid,
                                    type: 'student',
                                    name: studentData.name || 'Student',
                                    enrollmentNumber: enrollmentNumber,
                                    email: user.email,
                                    houseName: studentData.houseName || '',
                                    roomNumber: studentData.roomNumber || ''
                                };
                                
                                localStorage.setItem('currentUser', JSON.stringify(userData));
                                resolve(userData);
                            } else {
                                // If no Firestore document, create basic user data
                                const userData = {
                                    id: user.uid,
                                    type: 'student',
                                    name: 'Student',
                                    enrollmentNumber: enrollmentNumber,
                                    email: user.email,
                                    houseName: '',
                                    roomNumber: ''
                                };
                                
                                localStorage.setItem('currentUser', JSON.stringify(userData));
                                resolve(userData);
                            }
                        })
                        .catch((error) => {
                            console.error('Error fetching student data:', error);
                            // Continue with basic user data even if Firestore fetch fails
                            const userData = {
                                id: user.uid,
                                type: 'student',
                                name: 'Student',
                                enrollmentNumber: enrollmentNumber,
                                email: user.email,
                                houseName: '',
                                roomNumber: ''
                            };
                            
                            localStorage.setItem('currentUser', JSON.stringify(userData));
                            resolve(userData);
                        });
                } else {
                    // If Firestore is not available, create basic user data
                    const userData = {
                        id: user.uid,
                        type: 'student',
                        name: 'Student',
                        enrollmentNumber: enrollmentNumber,
                        email: user.email,
                        houseName: '',
                        roomNumber: ''
                    };
                    
                    localStorage.setItem('currentUser', JSON.stringify(userData));
                    resolve(userData);
                }
            })
            .catch((error) => {
                // Handle login errors
                let errorMessage = 'Login failed. ';
                
                switch (error.code) {
                    case 'auth/user-not-found':
                        errorMessage += 'No account found with this enrollment number.';
                        break;
                    case 'auth/wrong-password':
                        errorMessage += 'Incorrect password.';
                        break;
                    case 'auth/invalid-email':
                        errorMessage += 'Invalid enrollment number format.';
                        break;
                    case 'auth/user-disabled':
                        errorMessage += 'This account has been disabled.';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage += 'Too many failed login attempts. Please try again later.';
                        break;
                    case 'auth/network-request-failed':
                        errorMessage += 'Network error. Please check your connection.';
                        break;
                    default:
                        errorMessage += error.message || 'Invalid credentials.';
                }
                
                reject(new Error(errorMessage));
            });
    });
}

// Admin login function using Firebase Authentication
function adminLogin(email, password, role) {
    return new Promise((resolve, reject) => {
        if (!auth) {
            reject(new Error('Firebase is not initialized. Please check your configuration.'));
            return;
        }
        
        // SECURITY: Prevent students from using admin login
        // Block any email that ends with @student.college.edu (student email format)
        if (email.toLowerCase().endsWith('@student.college.edu')) {
            reject(new Error('Access denied. Students cannot use admin login. Please use student login.'));
            return;
        }
        
        // Sign in with email and password (only accounts created in Firebase can log in)
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Login successful - verify this is an admin account
                const user = userCredential.user;
                
                // Additional security: Check if this email is registered as an admin in Firestore
                if (db) {
                    db.collection('admins').doc(email).get()
                        .then((doc) => {
                            if (doc.exists) {
                                // Admin account found in Firestore
                                const adminData = doc.data();
                                const userData = {
                                    id: user.uid,
                                    type: 'admin',
                                    name: adminData.name || 'Admin',
                                    email: email,
                                    role: adminData.role || role // Use role from Firestore or submitted role
                                };
                                
                                localStorage.setItem('currentUser', JSON.stringify(userData));
                                resolve(userData);
                            } else {
                                // Account exists in Firebase but not in admins collection
                                // This means it's not a registered admin account
                                // Sign out the user and reject
                                auth.signOut();
                                reject(new Error('Access denied. This account is not authorized for admin access.'));
                            }
                        })
                        .catch((error) => {
                            console.error('Error checking admin status:', error);
                            // If Firestore check fails, we can either:
                            // Option 1: Allow login if account exists in Firebase (less secure)
                            // Option 2: Deny access (more secure) - We'll do this
                            auth.signOut();
                            reject(new Error('Unable to verify admin access. Please contact system administrator.'));
                        });
                } else {
                    // Firestore not available - still allow login if account exists in Firebase
                    // But at least we've blocked student emails above
                    const userData = {
                        id: user.uid,
                        type: 'admin',
                        name: 'Admin',
                        email: email,
                        role: role
                    };
                    
                    localStorage.setItem('currentUser', JSON.stringify(userData));
                    resolve(userData);
                }
            })
            .catch((error) => {
                // Handle login errors
                let errorMessage = 'Login failed. ';
                
                switch (error.code) {
                    case 'auth/user-not-found':
                        errorMessage += 'No admin account found with this email.';
                        break;
                    case 'auth/wrong-password':
                        errorMessage += 'Incorrect password.';
                        break;
                    case 'auth/invalid-email':
                        errorMessage += 'Invalid email format.';
                        break;
                    case 'auth/user-disabled':
                        errorMessage += 'This admin account has been disabled.';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage += 'Too many failed login attempts. Please try again later.';
                        break;
                    case 'auth/network-request-failed':
                        errorMessage += 'Network error. Please check your connection.';
                        break;
                    default:
                        errorMessage += error.message || 'Invalid credentials.';
                }
                
                reject(new Error(errorMessage));
            });
    });
}

// Logout function
function logout() {
    if (auth) {
        auth.signOut()
            .then(() => {
                localStorage.removeItem('currentUser');
                window.location.href = 'index.html';
            })
            .catch((error) => {
                console.error('Logout error:', error);
                // Still clear localStorage and redirect even if Firebase logout fails
                localStorage.removeItem('currentUser');
                window.location.href = 'index.html';
            });
    } else {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
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