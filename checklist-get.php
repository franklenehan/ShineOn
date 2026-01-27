<?php
// Get daily supplement checklist for a given date for the logged-in user.
// If none exists yet, build a default checklist from the user's master supplements list.

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
$date   = isset($_GET['date']) ? trim($_GET['date']) : '';

if ($date === '') {
    echo json_encode([
        'success' => false,
        'message' => 'Date is required.',
    ]);
    exit;
}

try {
    // Try to load an existing checklist row
    $stmt = $pdo->prepare('SELECT id, supplements FROM checklists WHERE user_id = :user_id AND date = :date LIMIT 1');
    $stmt->execute([
        ':user_id' => $userId,
        ':date'    => $date,
    ]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        $items = [];
        if (!empty($row['supplements'])) {
            $decoded = json_decode($row['supplements'], true);
            if (is_array($decoded)) {
                $items = $decoded;
            }
        }

        echo json_encode([
            'success' => true,
            'date'    => $date,
            'items'   => $items,
        ]);
        exit;
    }

    // No checklist yet for this date: build default from master supplements list
    $stmtSup = $pdo->prepare('SELECT id, name, dosage, notes FROM supplements WHERE user_id = :user_id ORDER BY created_at ASC');
    $stmtSup->execute([':user_id' => $userId]);
    $supRows = $stmtSup->fetchAll(PDO::FETCH_ASSOC);

    $items = [];
    foreach ($supRows as $sup) {
        $items[] = [
            'supplement_id' => (int)$sup['id'],
            'name'          => $sup['name'],
            'dosage'        => $sup['dosage'],
            'notes'         => $sup['notes'] ?? '',
            'completed'     => false,
        ];
    }

    echo json_encode([
        'success' => true,
        'date'    => $date,
        'items'   => $items,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error loading checklist.',
    ]);
}
