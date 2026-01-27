<?php
// Delete a treatment for the logged-in user

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
$id     = isset($_POST['id']) ? trim($_POST['id']) : '';

if ($id === '') {
    echo json_encode([
        'success' => false,
        'message' => 'Missing treatment id.',
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare('DELETE FROM treatments WHERE id = :id AND user_id = :user_id');
    $stmt->execute([
        ':id'      => $id,
        ':user_id' => $userId,
    ]);

    echo json_encode([
        'success' => true,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error deleting treatment.',
    ]);
}
