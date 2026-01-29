<?php
// Get a single daily reflection for the logged-in user by date

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

$date = isset($_GET['date']) ? trim($_GET['date']) : '';
if ($date === '') {
    $date = (new DateTimeImmutable('today'))->format('Y-m-d');
}

try {
    $stmt = $pdo->prepare('SELECT id, user_id, date, content, created_at, updated_at
                            FROM reflections
                            WHERE user_id = :uid AND date = :date
                            LIMIT 1');
    $stmt->execute([
        ':uid'  => $userId,
        ':date' => $date,
    ]);

    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success'    => true,
        'date'       => $date,
        'reflection' => $row ? [
            'id'      => (int)$row['id'],
            'content' => $row['content'],
            'date'    => $row['date'],
        ] : null,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error loading reflection.',
    ]);
}
