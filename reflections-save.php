<?php
// Save a daily reflection for the logged-in user.
// Enforces one reflection per user per date.

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

$date = isset($_POST['date']) ? trim($_POST['date']) : '';
$content = isset($_POST['content']) ? trim($_POST['content']) : '';

if ($date === '') {
    $date = (new DateTimeImmutable('today'))->format('Y-m-d');
}

if ($content === '') {
    echo json_encode([
        'success' => false,
        'message' => 'Reflection cannot be empty.',
    ]);
    exit;
}

try {
    // Check if a reflection already exists for this user/date
    $check = $pdo->prepare('SELECT id FROM reflections WHERE user_id = :uid AND date = :date LIMIT 1');
    $check->execute([
        ':uid'  => $userId,
        ':date' => $date,
    ]);

    $existing = $check->fetch(PDO::FETCH_ASSOC);
    if ($existing) {
        echo json_encode([
            'success' => false,
            'message' => 'You already saved a reflection for this date. Only one reflection per day is allowed.',
        ]);
        exit;
    }

    // Insert new reflection
    $insert = $pdo->prepare('INSERT INTO reflections (user_id, date, content, created_at, updated_at)
                             VALUES (:uid, :date, :content, NOW(), NOW())');
    $insert->execute([
        ':uid'     => $userId,
        ':date'    => $date,
        ':content' => $content,
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Reflection saved.',
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error saving reflection.',
    ]);
}
