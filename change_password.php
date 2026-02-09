<?php
// Change password endpoint for ShineOn

header('Content-Type: application/json');

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'You must be logged in to change your password.',
    ]);
    exit;
}

require_once __DIR__ . '/db.php';

$currentPassword = isset($_POST['current_password']) ? $_POST['current_password'] : '';
$newPassword     = isset($_POST['new_password']) ? $_POST['new_password'] : '';
$confirmPassword = isset($_POST['confirm_password']) ? $_POST['confirm_password'] : '';

if ($currentPassword === '' || $newPassword === '' || $confirmPassword === '') {
    echo json_encode([
        'success' => false,
        'message' => 'Please fill in all password fields.',
    ]);
    exit;
}

if ($newPassword !== $confirmPassword) {
    echo json_encode([
        'success' => false,
        'message' => 'New passwords do not match.',
    ]);
    exit;
}

// Optional: enforce a minimum length
if (strlen($newPassword) < 8) {
    echo json_encode([
        'success' => false,
        'message' => 'New password should be at least 8 characters long.',
    ]);
    exit;
}

try {
    $userId = $_SESSION['user_id'];

    // Load current password hash
    $stmt = $pdo->prepare('SELECT password_hash FROM users WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'User not found.',
        ]);
        exit;
    }

    // Verify current password
    if (!password_verify($currentPassword, $user['password_hash'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Current password is incorrect.',
        ]);
        exit;
    }

    // Update to new password
    $newHash = password_hash($newPassword, PASSWORD_DEFAULT);

    $update = $pdo->prepare('UPDATE users SET password_hash = :hash, updated_at = NOW() WHERE id = :id');
    $update->execute([
        ':hash' => $newHash,
        ':id'   => $userId,
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Password updated successfully.',
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while updating your password.',
    ]);
}
