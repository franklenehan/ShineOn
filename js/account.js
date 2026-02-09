// Account page logic for ShineOn
// Handles loading basic user info, changing password, and uploading avatar

document.addEventListener('DOMContentLoaded', function () {
    initAccountPage();
});

async function initAccountPage() {
    await loadAccountUserInfo();
    initChangePasswordForm();
    initAvatarUploadForm();
}

async function loadAccountUserInfo() {
    const nameSpan = document.getElementById('account-name');
    const usernameSpan = document.getElementById('account-username');
    const avatarPreview = document.getElementById('account-avatar-preview');

    if (!nameSpan || !usernameSpan) return;

    try {
        const response = await fetch('get_user.php', { method: 'GET' });
        if (!response.ok) return;

        const data = await response.json();
        if (!data || !data.logged_in || !data.user) return;

        const user = data.user;
        const fullName = [user.firstname, user.surname].filter(Boolean).join(' ') || 'User';

        nameSpan.textContent = fullName;
        usernameSpan.textContent = user.username || '';

        // If backend later returns an avatar URL, show it here
        if (user.avatar_url && avatarPreview) {
            avatarPreview.src = user.avatar_url;
            avatarPreview.classList.remove('d-none');
        }
    } catch (error) {
        console.warn('Error loading account user info:', error);
    }
}

function initChangePasswordForm() {
    const form = document.getElementById('change-password-form');
    const alertBox = document.getElementById('password-alert');
    const submitBtn = document.getElementById('change-password-submit');
    const currentPasswordInput = document.getElementById('currentPassword');
    const currentPasswordToggle = document.getElementById('showCurrentPassword');

    if (!form) return;

    // Optional: show/hide current password
    if (currentPasswordInput && currentPasswordToggle) {
        currentPasswordToggle.addEventListener('change', function () {
            currentPasswordInput.type = this.checked ? 'text' : 'password';
        });
    }

    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        const current = document.getElementById('currentPassword');
        const next = document.getElementById('newPassword');
        const confirm = document.getElementById('confirmPassword');

        if (!current || !next || !confirm) return;

        if (next.value !== confirm.value) {
            showInlineAlert(alertBox, 'New passwords do not match. Please check and try again.', 'danger');
            return;
        }

        const formData = new FormData(form);

        if (submitBtn) {
            submitBtn.disabled = true;
        }

        try {
            const response = await fetch('change_password.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json().catch(() => null);

            if (response.ok && data && data.success) {
                showInlineAlert(alertBox, data.message || 'Password updated successfully.', 'success');
                form.reset();
            } else {
                const message = (data && data.message) || 'Could not update password. Please try again.';
                showInlineAlert(alertBox, message, 'danger');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            showInlineAlert(alertBox, 'An error occurred while updating your password. Please try again.', 'danger');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
            }
        }
    });
}

function initAvatarUploadForm() {
    const form = document.getElementById('avatar-upload-form');
    const fileInput = document.getElementById('avatarFile');
    const alertBox = document.getElementById('avatar-alert');
    const submitBtn = document.getElementById('avatar-upload-submit');
    const avatarPreview = document.getElementById('account-avatar-preview');

    if (!form || !fileInput) return;

    // Local preview when a file is chosen
    fileInput.addEventListener('change', function () {
        const file = fileInput.files && fileInput.files[0];
        if (!file || !avatarPreview) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            avatarPreview.src = e.target.result;
            avatarPreview.classList.remove('d-none');
        };
        reader.readAsDataURL(file);
    });

    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        const file = fileInput.files && fileInput.files[0];
        if (!file) {
            showInlineAlert(alertBox, 'Please choose an image to upload.', 'warning');
            return;
        }

        const formData = new FormData(form);

        if (submitBtn) {
            submitBtn.disabled = true;
        }

        try {
            const response = await fetch('upload_avatar.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json().catch(() => null);

            if (response.ok && data && data.success) {
                showInlineAlert(alertBox, data.message || 'Profile picture updated successfully.', 'success');

                // If backend returns avatar_url, update preview and header avatar
                if (data.avatar_url && avatarPreview) {
                    avatarPreview.src = data.avatar_url;
                    avatarPreview.classList.remove('d-none');
                }

                // Refresh header user state so avatar appears in navbar
                if (typeof initCurrentUserState === 'function') {
                    initCurrentUserState();
                }
            } else {
                const message = (data && data.message) || 'Could not upload profile picture. Please try again.';
                showInlineAlert(alertBox, message, 'danger');
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
            showInlineAlert(alertBox, 'An error occurred while uploading your picture. Please try again.', 'danger');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
            }
        }
    });
}

function showInlineAlert(element, message, type) {
    if (!element) return;

    element.textContent = message;
    element.classList.remove('d-none', 'alert-success', 'alert-danger', 'alert-warning', 'alert-info');
    element.classList.add('alert', `alert-${type}`);
}
