<?php
// Register endpoint: creates a new user with firstname, surname, username, password

header('Content-Type: application/json');

session_start();

require_once __DIR__ . '/db.php';

$firstname = isset($_POST['firstname']) ? trim($_POST['firstname']) : '';
$surname   = isset($_POST['surname']) ? trim($_POST['surname']) : '';
$username  = isset($_POST['username']) ? trim($_POST['username']) : '';
$password  = isset($_POST['password']) ? $_POST['password'] : '';

if ($firstname === '' || $surname === '' || $username === '' || $password === '') {
    echo json_encode([
        'success' => false,
        'message' => 'Please fill in all fields.',
    ]);
    exit;
}

try {
    // Check if username already exists
    $check = $pdo->prepare('SELECT id FROM users WHERE username = :username LIMIT 1');
    $check->execute([':username' => $username]);
    if ($check->fetch()) {
        echo json_encode([
            'success' => false,
            'message' => 'That username is already taken. Please choose another.',
        ]);
        exit;
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare('INSERT INTO users (firstname, surname, username, password_hash) VALUES (:firstname, :surname, :username, :password_hash)');
    $stmt->execute([
        ':firstname'     => $firstname,
        ':surname'       => $surname,
        ':username'      => $username,
        ':password_hash' => $passwordHash,
    ]);

    $userId = $pdo->lastInsertId();

    // Auto-login new user if you want that behaviour
    $_SESSION['user_id'] = $userId;

    echo json_encode([
        'success' => true,
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while registering. Please try again.',
    ]);
}
