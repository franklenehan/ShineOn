<?php
// Return quick stats counts for the logged-in user

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
    // 1. Checklists complete: total rows in checklists table per user
    $stmt = $pdo->prepare('SELECT COUNT(*) AS cnt FROM checklists WHERE user_id = :uid');
    $stmt->execute([':uid' => $userId]);
    $checklistsCount = (int)$stmt->fetchColumn();

    // 2. Total check-ins: total rows in reflections table per user
    $stmt = $pdo->prepare('SELECT COUNT(*) AS cnt FROM reflections WHERE user_id = :uid');
    $stmt->execute([':uid' => $userId]);
    $reflectionsCount = (int)$stmt->fetchColumn();

    // 3. Active treatments: total rows in treatments table per user
    $stmt = $pdo->prepare('SELECT COUNT(*) AS cnt FROM treatments WHERE user_id = :uid');
    $stmt->execute([':uid' => $userId]);
    $treatmentsCount = (int)$stmt->fetchColumn();

    // 4. Days tracked: total rows in wellbeing_ratings per user
    $stmt = $pdo->prepare('SELECT COUNT(*) AS cnt FROM wellbeing_ratings WHERE user_id = :uid');
    $stmt->execute([':uid' => $userId]);
    $daysTrackedCount = (int)$stmt->fetchColumn();

    echo json_encode([
        'success' => true,
        'data' => [
            'checklists_complete' => $checklistsCount,
            'total_check_ins'     => $reflectionsCount,
            'active_treatments'   => $treatmentsCount,
            'days_tracked'        => $daysTrackedCount,
        ],
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error loading stats.',
    ]);
}
