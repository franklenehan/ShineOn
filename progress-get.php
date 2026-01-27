<?php
// Get daily wellbeing ratings (progress) for a given date for the logged-in user

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
    $stmt = $pdo->prepare('SELECT * FROM wellbeing_ratings WHERE user_id = :user_id AND date = :date LIMIT 1');
    $stmt->execute([
        ':user_id' => $userId,
        ':date'    => $date,
    ]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        echo json_encode([
            'success' => true,
            'date'    => $date,
            'ratings' => [
                'overall_wellbeing' => (int)$row['overall_wellbeing'],
                'mood_emotional'    => (int)$row['mood_emotional'],
                'energy_fatigue'    => (int)$row['energy_fatigue'],
                'pain_discomfort'   => (int)$row['pain_discomfort'],
                'mental_clarity'    => (int)$row['mental_clarity'],
                'sleep_quality'     => (int)$row['sleep_quality'],
                'feeling_supported' => (int)$row['feeling_supported'],
                'hope_meaning'      => (int)$row['hope_meaning'],
            ],
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'date'    => $date,
            'ratings' => null,
        ]);
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error loading progress.',
    ]);
}
