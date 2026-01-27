<?php
// List treatments for the logged-in user

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

try {
    $stmt = $pdo->prepare('SELECT id, user_id, external_id, date, type, clinic, notes, attachments, created_at FROM treatments WHERE user_id = :user_id ORDER BY date DESC, id DESC');
    $stmt->execute([':user_id' => $_SESSION['user_id']]);
    $rows = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'treatments' => $rows,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error loading treatments.',
    ]);
}
