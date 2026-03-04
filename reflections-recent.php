<?php
// List recent daily reflections for the logged-in user, with optional wellbeing summary

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

// How many days to return (default 14, capped at 30)
$limit = 14;
if (isset($_GET['limit']) && ctype_digit($_GET['limit'])) {
    $limit = (int) $_GET['limit'];
    if ($limit < 1)  $limit = 1;
    if ($limit > 30) $limit = 30;
}

try {
    $stmt = $pdo->prepare(
        'SELECT r.date,
                r.content,
                w.overall_wellbeing
         FROM reflections r
         LEFT JOIN wellbeing_ratings w
           ON w.user_id = r.user_id
          AND w.date    = r.date
         WHERE r.user_id = :uid
         ORDER BY r.date DESC
         LIMIT :lim'
    );
    $stmt->bindValue(':uid', $userId, PDO::PARAM_INT);
    $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'items'   => array_map(static function(array $row): array {
            return [
                'date'    => substr($row['date'], 0, 10),
                'content' => (string)($row['content'] ?? ''),
                'overall_wellbeing' => $row['overall_wellbeing'] !== null
                    ? (int) $row['overall_wellbeing']
                    : null,
            ];
        }, $rows),
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error loading recent reflections.',
    ]);
}
