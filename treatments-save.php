<?php
// Create or update a treatment for the logged-in user

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

// Some server configurations don't populate $_POST for certain fetch requests.
// If $_POST is empty but we have a POST request, parse the raw input manually.
if ($_SERVER['REQUEST_METHOD'] === 'POST' && empty($_POST)) {
    $rawBody = file_get_contents('php://input');
    if ($rawBody !== false) {
        parse_str($rawBody, $_POST);
    }
}

$id         = isset($_POST['id']) ? trim($_POST['id']) : '';
$date       = isset($_POST['date']) ? trim($_POST['date']) : '';
$type       = isset($_POST['type']) ? trim($_POST['type']) : '';
$clinic     = isset($_POST['clinic']) ? trim($_POST['clinic']) : '';
$notes      = isset($_POST['notes']) ? trim($_POST['notes']) : '';
$attachments= isset($_POST['attachments']) ? trim($_POST['attachments']) : '';

if ($date === '' || $type === '') {
    echo json_encode([
        'success' => false,
        'message' => 'Date and treatment type are required.',
        'debug'   => [
            'raw_post' => $_POST,
            'date'     => $date,
            'type'     => $type,
        ],
    ]);
    exit;
}

// Normalize id: only a positive integer is considered an existing record
$normalizedId = null;
if ($id !== '' && ctype_digit($id) && (int)$id > 0) {
    $normalizedId = (int)$id;
}

try {
    if ($normalizedId === null) {
        // Insert new treatment
        $stmt = $pdo->prepare('INSERT INTO treatments (user_id, external_id, date, type, clinic, notes, attachments) VALUES (:user_id, :external_id, :date, :type, :clinic, :notes, :attachments)');
        $stmt->execute([
            ':user_id'     => $userId,
            ':external_id' => 'app-' . time(),
            ':date'        => $date,
            ':type'        => $type,
            ':clinic'      => $clinic !== '' ? $clinic : null,
            ':notes'       => $notes !== '' ? $notes : null,
            ':attachments' => $attachments !== '' ? $attachments : null,
        ]);
        $newId = $pdo->lastInsertId();
        echo json_encode([
            'success' => true,
            'id'      => $newId,
        ]);
    } else {
        // Update existing treatment; ensure it belongs to this user
        $stmt = $pdo->prepare('UPDATE treatments SET date = :date, type = :type, clinic = :clinic, notes = :notes, attachments = :attachments WHERE id = :id AND user_id = :user_id');
        $stmt->execute([
            ':date'        => $date,
            ':type'        => $type,
            ':clinic'      => $clinic !== '' ? $clinic : null,
            ':notes'       => $notes !== '' ? $notes : null,
            ':attachments' => $attachments !== '' ? $attachments : null,
            ':id'          => $normalizedId,
            ':user_id'     => $userId,
        ]);

        echo json_encode([
            'success' => true,
            'id'      => $normalizedId,
        ]);
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error saving treatment.',
    ]);
}
