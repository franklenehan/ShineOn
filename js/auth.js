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
    const registerTermsLink = document.getElementById('registerTermsLink');
    const registerLegalLink = document.getElementById('registerLegalLink');

    if (!loginForm || !registerForm) {
        // Header may not be loaded yet (components.js loads it asynchronously)
        setTimeout(waitForHeaderAndInitAuth, 100);
        return;
    }

    console.log('🔐 Auth initializing...');
    initLoginForm(loginForm);
    initRegisterForm(registerForm);

    // When terms/legal are opened from inside the registration tab, return to login modal afterwards
    const loginModalEl = document.getElementById('loginModal');
    const termsModalEl = document.getElementById('termsModal');
    const legalModalEl = document.getElementById('legalModal');
    let returnToLoginAfterPolicy = false;

    function wirePolicyLink(linkEl, targetModalEl) {
        if (!linkEl || !targetModalEl || !loginModalEl || !window.bootstrap || !bootstrap.Modal) return;

        linkEl.addEventListener('click', function (e) {
            e.preventDefault();
            returnToLoginAfterPolicy = true;

            const loginInstance = bootstrap.Modal.getOrCreateInstance(loginModalEl);
            loginInstance.hide();

            const targetInstance = bootstrap.Modal.getOrCreateInstance(targetModalEl);
            targetInstance.show();
        });

        targetModalEl.addEventListener('hidden.bs.modal', function () {
            if (!returnToLoginAfterPolicy) return;
            returnToLoginAfterPolicy = false;

            const loginInstance = bootstrap.Modal.getOrCreateInstance(loginModalEl);
            loginInstance.show();
        });
    }

    wirePolicyLink(registerTermsLink, termsModalEl);
    wirePolicyLink(registerLegalLink, legalModalEl);

    initCurrentUserState();
}

function initRegisterForm(registerForm) {
    const loginError = document.getElementById('loginError');
    const registerSubmitButton = document.getElementById('registerSubmitButton');
    const registerAgreeCheckbox = document.getElementById('registerAgree');

    if (!registerForm) return;

    registerForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        if (loginError) {
            loginError.classList.add('d-none');
            loginError.textContent = '';
        }

        // Require agreement to Terms & Conditions and Legal Disclaimer
        if (registerAgreeCheckbox && !registerAgreeCheckbox.checked) {
            if (loginError) {
                loginError.textContent = 'You must agree to the Terms and Conditions and Legal Disclaimer before creating an account.';
                loginError.classList.remove('d-none');
            }
            return;
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
    const navAccountButton = document.getElementById('navAccountButton');
    const navUserAvatar = document.getElementById('navUserAvatar');
    const navUserIcon = document.getElementById('navUserIcon');
    const navUserDropdown = document.getElementById('navUserDropdown');

    if (!navUserLabel || !navLoginButton) {
        return;
    }

    try {
        const response = await fetch('get_user.php', { method: 'GET' });
        if (!response.ok) {
            return; // silently ignore if endpoint not ready yet
        }

        const data = await response.json();

        // Expected structure: { logged_in: true, user: { firstname: 'Frank', avatar_url?: '...' } }
        if (data && data.logged_in && data.user) {
            const user = data.user;
            const firstName = user.firstname || 'User';
            navUserLabel.textContent = `Hi ${firstName}`;

            // If an avatar URL is available, show it and hide the default icon
            if (user.avatar_url && navUserAvatar && navUserIcon) {
                navUserAvatar.src = user.avatar_url;
                navUserAvatar.classList.remove('d-none');
                navUserIcon.classList.add('d-none');
            }

            // Switch button from opening the modal to acting as a dropdown toggle
            navLoginButton.removeAttribute('data-bs-target');
            navLoginButton.removeAttribute('data-bs-toggle');
            navLoginButton.classList.add('dropdown-toggle');

            // Manual dropdown toggle to avoid any Bootstrap data-API timing issues
            const navUserMenu = document.getElementById('navUserMenu');
            if (navUserMenu) {
                navLoginButton.addEventListener('click', function (event) {
                    event.preventDefault();
                    const isShown = navUserMenu.classList.contains('show');
                    navUserMenu.classList.toggle('show', !isShown);
                    navLoginButton.setAttribute('aria-expanded', String(!isShown));
                });

                // Hide the dropdown when clicking anywhere outside the user dropdown
                document.addEventListener('click', function (event) {
                    if (!navUserMenu.classList.contains('show')) return;
                    // If click is inside the dropdown toggle or menu, do nothing
                    if (navUserDropdown && navUserDropdown.contains(event.target)) {
                        return;
                    }
                    navUserMenu.classList.remove('show');
                    navLoginButton.setAttribute('aria-expanded', 'false');
                });
            }

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

            // Wire up Account button to navigate to the account page
            if (navAccountButton) {
                navAccountButton.addEventListener('click', function () {
                    window.location.href = 'account.html';
                });
            }
        }
    } catch (error) {
        console.warn('Could not fetch current user info yet:', error);
    }
}
