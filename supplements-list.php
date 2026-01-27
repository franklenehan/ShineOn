<?php
// List all supplements for the logged-in user

header('Content-Type: application/json');

session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Not authenticated.',
    ]);
    exit;
}

require_once __DIR__ . '/db.php';

$userId = $_SESSION['user_id'];

try {
    $stmt = $pdo->prepare('SELECT id, name, dosage, notes, created_at, updated_at FROM supplements WHERE user_id = :user_id ORDER BY created_at ASC');
    $stmt->execute([':user_id' => $userId]);
    $supplements = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'supplements' => $supplements,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error loading supplements.',
    ]);
}
