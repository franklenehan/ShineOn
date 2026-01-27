<?php
// Create or update a supplement in the master list for the logged-in user

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

// Normalize POST input (for fetch with URL-encoded or form-data)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && empty($_POST)) {
    $rawBody = file_get_contents('php://input');
    if ($rawBody !== false) {
        parse_str($rawBody, $_POST);
    }
}

$id    = isset($_POST['id']) ? trim($_POST['id']) : '';
$name  = isset($_POST['name']) ? trim($_POST['name']) : '';
$dosage = isset($_POST['dosage']) ? trim($_POST['dosage']) : '';
$notes = isset($_POST['notes']) ? trim($_POST['notes']) : '';

if ($name === '' || $dosage === '') {
    echo json_encode([
        'success' => false,
        'message' => 'Name and dosage are required.',
    ]);
    exit;
}

// Normalize id: only a positive integer represents an existing record
$normalizedId = null;
if ($id !== '' && ctype_digit($id) && (int)$id > 0) {
    $normalizedId = (int)$id;
}

try {
    if ($normalizedId === null) {
        // Insert new supplement
        $stmt = $pdo->prepare('INSERT INTO supplements (user_id, name, dosage, notes) VALUES (:user_id, :name, :dosage, :notes)');
        $stmt->execute([
            ':user_id' => $userId,
            ':name'    => $name,
            ':dosage'  => $dosage,
            ':notes'   => $notes !== '' ? $notes : null,
        ]);

        $newId = $pdo->lastInsertId();

        echo json_encode([
            'success' => true,
            'id'      => $newId,
        ]);
    } else {
        // Update existing supplement for this user
        $stmt = $pdo->prepare('UPDATE supplements SET name = :name, dosage = :dosage, notes = :notes WHERE id = :id AND user_id = :user_id');
        $stmt->execute([
            ':name'   => $name,
            ':dosage' => $dosage,
            ':notes'  => $notes !== '' ? $notes : null,
            ':id'     => $normalizedId,
            ':user_id'=> $userId,
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
        'message' => 'Error saving supplement.',
    ]);
}
