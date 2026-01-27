<?php
// Login endpoint for ShineOn

header('Content-Type: application/json');

session_start();

require_once __DIR__ . '/db.php';

// Login is done with username + password
$username = isset($_POST['username']) ? trim($_POST['username']) : '';
$password = isset($_POST['password']) ? $_POST['password'] : '';

if ($username === '' || $password === '') {
    echo json_encode([
        'success' => false,
        'message' => 'Please enter both username and password.',
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare('SELECT id, firstname, surname, username, password_hash FROM users WHERE username = :username LIMIT 1');
    $stmt->execute([':username' => $username]);
    $user = $stmt->fetch();

    if (!$user) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid username or password.',
        ]);
        exit;
    }

    if (!password_verify($password, $user['password_hash'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid username or password.',
        ]);
        exit;
    }

    // Password OK, store user id in session
    $_SESSION['user_id'] = $user['id'];

    echo json_encode([
        'success' => true,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while logging in.',
    ]);
}
