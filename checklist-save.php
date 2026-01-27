<?php
// Save daily supplement checklist for a given date for the logged-in user.

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

$date  = isset($_POST['date']) ? trim($_POST['date']) : '';
$itemsJson = isset($_POST['items']) ? $_POST['items'] : '';

if ($date === '') {
    echo json_encode([
        'success' => false,
        'message' => 'Date is required.',
    ]);
    exit;
}

// items is expected to be a JSON-encoded array
$items = [];
if ($itemsJson !== '') {
    $decoded = json_decode($itemsJson, true);
    if (is_array($decoded)) {
        $items = $decoded;
    }
}

try {
    $supplementsJson = json_encode($items, JSON_UNESCAPED_UNICODE);

    // Check if a row already exists
    $stmt = $pdo->prepare('SELECT id FROM checklists WHERE user_id = :user_id AND date = :date LIMIT 1');
    $stmt->execute([
        ':user_id' => $userId,
        ':date'    => $date,
    ]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        // Update existing
        $stmtUpdate = $pdo->prepare('UPDATE checklists SET supplements = :supplements, updated_at = CURRENT_TIMESTAMP WHERE id = :id');
        $stmtUpdate->execute([
            ':supplements' => $supplementsJson,
            ':id'          => $row['id'],
        ]);
    } else {
        // Insert new
        $stmtInsert = $pdo->prepare('INSERT INTO checklists (user_id, date, supplements, notes) VALUES (:user_id, :date, :supplements, NULL)');
        $stmtInsert->execute([
            ':user_id'     => $userId,
            ':date'        => $date,
            ':supplements' => $supplementsJson,
        ]);
    }

    echo json_encode([
        'success' => true,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error saving checklist.',
    ]);
}
