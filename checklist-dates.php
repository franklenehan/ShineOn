<?php
// List all dates that have a saved checklist for the logged-in user.

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
    $stmt = $pdo->prepare('SELECT date FROM checklists WHERE user_id = :user_id ORDER BY date DESC');
    $stmt->execute([':user_id' => $userId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $dates = array_map(static function ($row) {
        return $row['date'];
    }, $rows);

    echo json_encode([
        'success' => true,
        'dates'   => $dates,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error loading checklist dates.',
    ]);
}
