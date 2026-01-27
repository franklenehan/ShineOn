<?php
// Simple DB connectivity test for Shine On

require __DIR__ . '/db.php';

try {
    $stmt = $pdo->query('SELECT COUNT(*) AS cnt FROM users');
    $row = $stmt->fetch();
    header('Content-Type: text/plain');
    echo 'DB OK, users count = ' . (int)$row['cnt'];
} catch (Throwable $e) {
    header('Content-Type: text/plain', true, 500);
    echo 'DB ERROR: ' . $e->getMessage();
}
