<?php
// Returns the currently logged-in user (for JS fetch)

header('Content-Type: application/json');

session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'logged_in' => false,
    ]);
    exit;
}

require_once __DIR__ . '/db.php';

try {
    $stmt = $pdo->prepare('SELECT id, firstname, surname, username, created_at, updated_at FROM users WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $_SESSION['user_id']]);
    $user = $stmt->fetch();

    if (!$user) {
        echo json_encode([
            'logged_in' => false,
        ]);
        exit;
    }

    echo json_encode([
        'logged_in' => true,
        'user' => $user,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'logged_in' => false,
        'message' => 'Error loading user information.',
    ]);
}
