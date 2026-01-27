// Authentication helper for ShineOn
// Handles login modal submission and navbar user label updates

console.log('🔐 Auth module loading...');

// Wait until DOM is ready and header component has been injected
document.addEventListener('DOMContentLoaded', function () {
    console.log('🔐 Auth DOMContentLoaded');
    waitForHeaderAndInitAuth();
});

function waitForHeaderAndInitAuth() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (!loginForm || !registerForm) {
        // Header may not be loaded yet (components.js loads it asynchronously)
        setTimeout(waitForHeaderAndInitAuth, 100);
        return;
    }

    console.log('🔐 Auth initializing...');
    initLoginForm(loginForm);
    initRegisterForm(registerForm);
    initCurrentUserState();
}

function initRegisterForm(registerForm) {
    const loginError = document.getElementById('loginError');
    const registerSubmitButton = document.getElementById('registerSubmitButton');

    if (!registerForm) return;

    registerForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        if (loginError) {
            loginError.classList.add('d-none');
            loginError.textContent = '';
        }

        if (registerSubmitButton) {
            registerSubmitButton.disabled = true;
        }

        try {
            const formData = new FormData(registerForm);

            const response = await fetch('register.php', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            if (data && data.success) {
                // Registration successful - user is auto-logged-in in register.php
                hideLoginModal();
                window.location.reload();
            } else {
                const message = (data && data.message) || 'Registration failed. Please check your details and try again.';
                if (loginError) {
                    loginError.textContent = message;
                    loginError.classList.remove('d-none');
                }
            }
        } catch (error) {
            console.error('Registration error:', error);
            if (loginError) {
                loginError.textContent = 'An error occurred while trying to register. Please try again.';
                loginError.classList.remove('d-none');
            }
        } finally {
            if (registerSubmitButton) {
                registerSubmitButton.disabled = false;
            }
        }
    });
}

function initLoginForm(loginForm) {
    const loginError = document.getElementById('loginError');
    const loginSubmitButton = document.getElementById('loginSubmitButton');

    if (!loginForm) return;

    loginForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        if (loginError) {
            loginError.classList.add('d-none');
            loginError.textContent = '';
        }

        if (loginSubmitButton) {
            loginSubmitButton.disabled = true;
        }

        try {
            const formData = new FormData(loginForm);

            const response = await fetch('login.php', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            if (data && data.success) {
                // Login successful: close modal and refresh UI
                hideLoginModal();
                // Simplest approach: reload page so any server-side user state can be used
                window.location.reload();
            } else {
                const message = (data && data.message) || 'Login failed. Please check your details and try again.';
                if (loginError) {
                    loginError.textContent = message;
                    loginError.classList.remove('d-none');
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            if (loginError) {
                loginError.textContent = 'An error occurred while trying to log in. Please try again.';
                loginError.classList.remove('d-none');
            }
        } finally {
            if (loginSubmitButton) {
                loginSubmitButton.disabled = false;
            }
        }
    });
}

function hideLoginModal() {
    const modalElement = document.getElementById('loginModal');
    if (!modalElement) return;

    // Use Bootstrap 5 modal API if available
    if (window.bootstrap && bootstrap.Modal) {
        let modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (!modalInstance) {
            modalInstance = new bootstrap.Modal(modalElement);
        }
        modalInstance.hide();
    } else {
        // Fallback: manually hide
        modalElement.classList.remove('show');
        modalElement.style.display = 'none';
        modalElement.setAttribute('aria-hidden', 'true');
    }
}

// Fetch current user info (from future get_user.php) and update navbar label
async function initCurrentUserState() {
    const navUserLabel = document.getElementById('navUserLabel');
    const navLoginButton = document.getElementById('navLoginButton');
    const navLogoutButton = document.getElementById('navLogoutButton');

    if (!navUserLabel || !navLoginButton) {
        return;
    }

    try {
        const response = await fetch('get_user.php', { method: 'GET' });
        if (!response.ok) {
            return; // silently ignore if endpoint not ready yet
        }

        const data = await response.json();

        // Expected structure: { logged_in: true, user: { firstname: 'Frank', ... } }
        if (data && data.logged_in && data.user) {
            const user = data.user;
            const firstName = user.firstname || 'User';
            navUserLabel.textContent = `Hi ${firstName}`;

            // Switch button from opening the modal to acting as a dropdown toggle
            navLoginButton.removeAttribute('data-bs-target');
            navLoginButton.setAttribute('data-bs-toggle', 'dropdown');
            navLoginButton.classList.add('dropdown-toggle');

            // Wire up logout button
            if (navLogoutButton) {
                navLogoutButton.addEventListener('click', async function () {
                    try {
                        const res = await fetch('logout.php', { method: 'POST' });
                        // Ignore response body; just reload
                    } catch (e) {
                        console.error('Logout error:', e);
                    } finally {
                        window.location.reload();
                    }
                });
            }
        }
    } catch (error) {
        console.warn('Could not fetch current user info yet:', error);
    }
}
