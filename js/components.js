// Component Loader for Frank's Cancer Journey
// Loads reusable header and footer components

// Load component from file
async function loadComponent(elementId, componentPath) {
    try {
        const response = await fetch(componentPath);
        if (!response.ok) {
            throw new Error(`Failed to load ${componentPath}`);
        }
        const html = await response.text();
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = html;
        }
    } catch (error) {
        console.error('Error loading component:', error);
        // Fallback: Load inline components if fetch fails (e.g., when opening file directly)
        loadInlineComponent(elementId, componentPath);
    }
}

// Fallback inline components for when fetch doesn't work
function loadInlineComponent(elementId, componentPath) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (componentPath.includes('header.html')) {
        element.innerHTML = `
<nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
    <div class="container">
        <a class="navbar-brand fw-bold" href="index.html">
            <img src="images/soLogoNew1.png" alt="Shine On" height="60" class="d-inline-block align-text-top">
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav ms-auto">
                <li class="nav-item">
                    <a class="nav-link" href="tracker.html" data-page="tracker.html">
                        <i class="bi bi-clipboard-data me-1"></i>Tracker
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="treatments.html" data-page="treatments.html">
                        <i class="bi bi-capsule me-1"></i>Treatments
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="nutrition.html" data-page="nutrition.html">
                        <i class="bi bi-egg me-1"></i>Nutrition
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="investigations.html" data-page="investigations.html">
                        <i class="bi bi-journal-medical me-1"></i>Investigations
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="future.html" data-page="future.html">
                        <i class="bi bi-stars me-1"></i>Future Plans
                    </a>
                </li>
                <li class="nav-item dropdown" id="navUserDropdown">
                    <button class="nav-link d-flex align-items-center" type="button" data-bs-toggle="modal" data-bs-target="#loginModal" id="navLoginButton">
                        <i class="bi bi-person-circle me-1"></i>
                        <span id="navUserLabel">Login</span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navLoginButton" id="navUserMenu">
                        <li><button class="dropdown-item" type="button" id="navAccountButton">Account</button></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><button class="dropdown-item" type="button" id="navLogoutButton">Logout</button></li>
                    </ul>
                </li>
            </ul>
        </div>
    </div>
</nav>

<!-- Login / Register Modal -->
<div class="modal fade" id="loginModal" tabindex="-1" aria-labelledby="loginModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="loginModalLabel">
                    <i class="bi bi-person-circle me-2"></i>User Login
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div id="loginError" class="alert alert-danger d-none" role="alert"></div>

                <!-- Mode toggle -->
                <ul class="nav nav-tabs mb-3" id="authTab" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="login-tab" data-bs-toggle="tab" data-bs-target="#login-panel" type="button" role="tab" aria-controls="login-panel" aria-selected="true">Login</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="register-tab" data-bs-toggle="tab" data-bs-target="#register-panel" type="button" role="tab" aria-controls="register-panel" aria-selected="false">Register</button>
                    </li>
                </ul>

                <div class="tab-content">
                    <!-- Login panel -->
                    <div class="tab-pane fade show active" id="login-panel" role="tabpanel" aria-labelledby="login-tab">
                        <form id="loginForm" novalidate>
                            <div class="mb-3">
                                <label for="loginUsername" class="form-label">Username</label>
                                <input type="text" class="form-control" id="loginUsername" name="username" required autocomplete="username">
                            </div>
                            <div class="mb-3">
                                <label for="loginPassword" class="form-label">Password</label>
                                <input type="password" class="form-control" id="loginPassword" name="password" required autocomplete="current-password">
                            </div>
                            <button type="submit" class="btn btn-primary w-100" id="loginSubmitButton">
                                <i class="bi bi-box-arrow-in-right me-1"></i>Login
                            </button>
                        </form>
                    </div>

                    <!-- Register panel -->
                    <div class="tab-pane fade" id="register-panel" role="tabpanel" aria-labelledby="register-tab">
                        <form id="registerForm" novalidate>
                            <div class="mb-3">
                                <label for="registerFirstname" class="form-label">First name</label>
                                <input type="text" class="form-control" id="registerFirstname" name="firstname" required>
                            </div>
                            <div class="mb-3">
                                <label for="registerSurname" class="form-label">Surname</label>
                                <input type="text" class="form-control" id="registerSurname" name="surname" required>
                            </div>
                            <div class="mb-3">
                                <label for="registerUsername" class="form-label">Username</label>
                                <input type="text" class="form-control" id="registerUsername" name="username" required autocomplete="username">
                            </div>
                            <div class="mb-3">
                                <label for="registerPassword" class="form-label">Password</label>
                                <input type="password" class="form-control" id="registerPassword" name="password" required autocomplete="new-password">
                            </div>
                            <button type="submit" class="btn btn-success w-100" id="registerSubmitButton">
                                <i class="bi bi-person-plus me-1"></i>Register
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
    `;} else if (componentPath.includes('footer.html')) {
        element.innerHTML = `
<footer class="footer mt-auto py-4 bg-light border-top">
    <div class="container">
        <div class="row align-items-center">
            <div class="col-md-6 text-center text-md-start mb-3 mb-md-0">
                <p class="text-muted mb-2">
                    <small>
                        <i class="bi bi-shield-lock me-1"></i>
                        <strong>Privacy Note:</strong> All data is stored locally in your browser. 
                        No information is sent to any server or third party.
                    </small>
                </p>
                <p class="text-muted mb-0">
                    <small>&copy; 2025 ShineOn. All rights reserved.</small>
                </p>
            </div>
            <div class="col-md-6 text-center text-md-end">
                <button id="downloadDataBtn" class="btn btn-outline-primary btn-sm me-2" title="Download your data as JSON">
                    <i class="bi bi-download me-1"></i>Download Data
                </button>
                <button id="clearDataBtn" class="btn btn-outline-danger btn-sm me-2" title="Clear all stored data">
                    <i class="bi bi-trash me-1"></i>Clear Data
                </button>
                <a href="settings.html" class="btn btn-outline-secondary btn-sm" title="Open Settings & Data Management">
                    <i class="bi bi-gear me-1"></i>Settings
                </a>
            </div>
        </div>
    </div>
</footer>`;
    }
}

// Set active navigation link based on current page
function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link[data-page]');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('data-page');
        if (linkPage === currentPage) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        } else {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
        }
    });
}

// Download all data as JSON
async function downloadData() {
    console.log('📥 Starting data export...');
    
    try {
        // Use StorageAPI.exportAll() to get all data
        const allData = await StorageAPI.exportAll();
        console.log('✅ Data exported successfully:', allData);
        
        const dataStr = JSON.stringify(allData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `cancer-journey-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('✅ Download triggered');
        
        if (typeof showAlert === 'function') {
            showAlert('Data downloaded successfully!', 'success');
        }
    } catch (error) {
        console.error('❌ Export failed:', error);
        if (typeof showAlert === 'function') {
            showAlert('Error exporting data. Check console for details.', 'danger');
        }
    }
}

// Clear all data with confirmation
function clearAllData() {
    if (confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
        if (confirm('This will permanently delete all treatments, check-ins, and goals. Are you absolutely sure?')) {
            Storage.clearAll();
            if (typeof showAlert === 'function') {
                showAlert('All data has been cleared.', 'warning');
            }
            // Reload page after a short delay
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        }
    }
}

// Initialize components when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Load header and footer
    await loadComponent('header-placeholder', 'components/header.html');
    await loadComponent('footer-placeholder', 'components/footer.html');
    
    // Set active nav link after header is loaded
    setTimeout(setActiveNavLink, 100);
    
    // Add event listeners for footer buttons
    setTimeout(() => {
        const downloadBtn = document.getElementById('downloadDataBtn');
        const clearBtn = document.getElementById('clearDataBtn');
        
        if (downloadBtn) {
            downloadBtn.addEventListener('click', downloadData);
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', clearAllData);
        }
    }, 200);
});
