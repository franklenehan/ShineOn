<?php
// Get last 7 days of wellbeing ratings (progress) for the logged-in user

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


// Determine date range: today and previous 6 days
$today     = new DateTimeImmutable('today');
$startDate = $today->sub(new DateInterval('P6D'));

$start = $startDate->format('Y-m-d');
$end   = $today->format('Y-m-d');

try {
    $stmt = $pdo->prepare('SELECT date,
                                   overall_wellbeing,
                                   mood_emotional,
                                   energy_fatigue,
                                   pain_discomfort,
                                   mental_clarity,
                                   sleep_quality,
                                   feeling_supported,
                                   hope_meaning
                            FROM wellbeing_ratings
                            WHERE user_id = :user_id
                              AND date BETWEEN :start_date AND :end_date
                            ORDER BY date');
    $stmt->execute([
        ':user_id'    => $userId,
        ':start_date' => $start,
        ':end_date'   => $end,
    ]);

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Build a complete 7-day sequence so the chart always has 7 labels
    $labels = [];
    $map    = [];

    for ($i = 0; $i < 7; $i++) {
        $d = $startDate->add(new DateInterval('P' . $i . 'D'))->format('Y-m-d');
        $labels[]   = $d;
        $map[$d] = null;
    }

foreach ($rows as $row) {
    // Normalise to YYYY-MM-DD so it matches the keys in $map
    $dateRaw  = $row['date'];
    $date     = substr($dateRaw, 0, 10);
    // error_log('WEEKLY row date_raw=' . $dateRaw . ' date_norm=' . $date);

    if (!array_key_exists($date, $map)) {
        continue; // date outside the 7-day window (defensive)
    }

    $map[$date] = [
        'overall_wellbeing' => (int)$row['overall_wellbeing'],
        'mood_emotional'    => (int)$row['mood_emotional'],
        'energy_fatigue'    => (int)$row['energy_fatigue'],
        'pain_discomfort'   => (int)$row['pain_discomfort'],
        'mental_clarity'    => (int)$row['mental_clarity'],
        'sleep_quality'     => (int)$row['sleep_quality'],
        'feeling_supported' => (int)$row['feeling_supported'],
        'hope_meaning'      => (int)$row['hope_meaning'],
    ];
}
    // Build series arrays in label order; use null for missing days so Chart.js can gap
    $keys = [
        'overall_wellbeing',
        'mood_emotional',
        'energy_fatigue',
        'pain_discomfort',
        'mental_clarity',
        'sleep_quality',
        'feeling_supported',
        'hope_meaning',
    ];

    $series = [];
    foreach ($keys as $key) {
        $series[$key] = [];
    }

    foreach ($labels as $d) {
        $values = $map[$d];
        foreach ($keys as $key) {
            $series[$key][] = $values ? (int)$values[$key] : null;
        }
    }
// after the for ($i = 0; $i < 7; $i++) { ... }
    echo json_encode([
        'success' => true,
        'labels'  => $labels,
        'series'  => $series,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error loading weekly progress.',
    ]);
}
