<?php
// Save daily wellbeing ratings (progress) for a given date for the logged-in user

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

// Support both application/x-www-form-urlencoded and JSON
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method.',
    ]);
    exit;
}

$rawInput = file_get_contents('php://input');
if (empty($_POST) && !empty($rawInput)) {
    $json = json_decode($rawInput, true);
    if (is_array($json)) {
        $_POST = $json;
    }
}

$userId = $_SESSION['user_id'];
$date   = isset($_POST['date']) ? trim($_POST['date']) : '';

if ($date === '') {
    echo json_encode([
        'success' => false,
        'message' => 'Date is required.',
    ]);
    exit;
}

$fields = [
    'overall_wellbeing',
    'mood_emotional',
    'energy_fatigue',
    'pain_discomfort',
    'mental_clarity',
    'sleep_quality',
    'feeling_supported',
    'hope_meaning',
];

$values = [];
foreach ($fields as $field) {
    $val = isset($_POST[$field]) ? (int)$_POST[$field] : 0;
    if ($val < 1 || $val > 5) {
        echo json_encode([
            'success' => false,
            'message' => 'All ratings must be between 1 and 5.',
        ]);
        exit;
    }
    $values[$field] = $val;
}

try {
    // Check if a row already exists
    $stmt = $pdo->prepare('SELECT id FROM wellbeing_ratings WHERE user_id = :user_id AND date = :date LIMIT 1');
    $stmt->execute([
        ':user_id' => $userId,
        ':date'    => $date,
    ]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        $update = $pdo->prepare('UPDATE wellbeing_ratings
            SET overall_wellbeing = :overall_wellbeing,
                mood_emotional    = :mood_emotional,
                energy_fatigue    = :energy_fatigue,
                pain_discomfort   = :pain_discomfort,
                mental_clarity    = :mental_clarity,
                sleep_quality     = :sleep_quality,
                feeling_supported = :feeling_supported,
                hope_meaning      = :hope_meaning
            WHERE id = :id');

        $update->execute([
            ':overall_wellbeing' => $values['overall_wellbeing'],
            ':mood_emotional'    => $values['mood_emotional'],
            ':energy_fatigue'    => $values['energy_fatigue'],
            ':pain_discomfort'   => $values['pain_discomfort'],
            ':mental_clarity'    => $values['mental_clarity'],
            ':sleep_quality'     => $values['sleep_quality'],
            ':feeling_supported' => $values['feeling_supported'],
            ':hope_meaning'      => $values['hope_meaning'],
            ':id'                => $existing['id'],
        ]);
    } else {
        $insert = $pdo->prepare('INSERT INTO wellbeing_ratings
            (user_id, date, overall_wellbeing, mood_emotional, energy_fatigue, pain_discomfort, mental_clarity, sleep_quality, feeling_supported, hope_meaning)
            VALUES
            (:user_id, :date, :overall_wellbeing, :mood_emotional, :energy_fatigue, :pain_discomfort, :mental_clarity, :sleep_quality, :feeling_supported, :hope_meaning)');

        $insert->execute([
            ':user_id'           => $userId,
            ':date'              => $date,
            ':overall_wellbeing' => $values['overall_wellbeing'],
            ':mood_emotional'    => $values['mood_emotional'],
            ':energy_fatigue'    => $values['energy_fatigue'],
            ':pain_discomfort'   => $values['pain_discomfort'],
            ':mental_clarity'    => $values['mental_clarity'],
            ':sleep_quality'     => $values['sleep_quality'],
            ':feeling_supported' => $values['feeling_supported'],
            ':hope_meaning'      => $values['hope_meaning'],
        ]);
    }

    echo json_encode([
        'success' => true,
        'message' => 'Progress saved.',
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error saving progress.',
    ]);
}
