<?php
// Delete a supplement from the master list for the logged-in user

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

if ($_SERVER['REQUEST_METHOD'] === 'POST' && empty($_POST)) {
    $rawBody = file_get_contents('php://input');
    if ($rawBody !== false) {
        parse_str($rawBody, $_POST);
    }
}

$id = isset($_POST['id']) ? trim($_POST['id']) : '';

if ($id === '' || !ctype_digit($id) || (int)$id <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Valid supplement id is required.',
    ]);
    exit;
}

$normalizedId = (int)$id;

try {
    $stmt = $pdo->prepare('DELETE FROM supplements WHERE id = :id AND user_id = :user_id');
    $stmt->execute([
        ':id'      => $normalizedId,
        ':user_id' => $userId,
    ]);

    echo json_encode([
        'success' => true,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error deleting supplement.',
    ]);
}
