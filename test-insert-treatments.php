<?php
// Test script to verify treatments INSERT works

require __DIR__ . '/db.php';

// Adjust this if your user IDs are different
$userId = 1; // existing user id from users table

try {
    $stmt = $pdo->prepare(
        'INSERT INTO treatments (user_id, external_id, date, type, clinic, notes, attachments)
         VALUES (:user_id, :external_id, :date, :type, :clinic, :notes, :attachments)'
    );

    $result = $stmt->execute([
        ':user_id'    => $userId,
        ':external_id'=> 'test-' . time(),
        ':date'       => date('Y-m-d'),
        ':type'       => 'Test Treatment',
        ':clinic'     => 'Test Clinic',
        ':notes'      => 'Inserted via test-insert-treatments.php',
        ':attachments'=> null,
    ]);

    header('Content-Type: text/plain');

    if ($result) {
        echo 'OK, new treatment id = ' . $pdo->lastInsertId();
    } else {
        echo 'INSERT did not succeed (no exception but execute() returned false).';
    }
} catch (Throwable $e) {
    header('Content-Type: text/plain', true, 500);
    echo 'DB ERROR: ' . $e->getMessage();
}
