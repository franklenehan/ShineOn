<?php
// Avatar upload endpoint for ShineOn

header('Content-Type: application/json');

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'You must be logged in to upload a profile picture.',
    ]);
    exit;
}

require_once __DIR__ . '/db.php';

if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode([
        'success' => false,
        'message' => 'Please choose an image to upload.',
    ]);
    exit;
}

$file      = $_FILES['avatar'];
$tmpPath   = $file['tmp_name'];
$fileName  = $file['name'];
$fileSize  = $file['size'];
$fileError = $file['error'];

// Basic validation
if ($fileError !== UPLOAD_ERR_OK) {
    echo json_encode([
        'success' => false,
        'message' => 'Error uploading file. Please try again.',
    ]);
    exit;
}

// Limit to ~2MB
$maxSize = 2 * 1024 * 1024;
if ($fileSize > $maxSize) {
    echo json_encode([
        'success' => false,
        'message' => 'File is too large. Please upload an image up to 2MB.',
    ]);
    exit;
}

// Validate file type by MIME
$finfo    = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($tmpPath);
$allowed  = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/gif'  => 'gif',
    'image/webp' => 'webp',
];

if (!isset($allowed[$mimeType])) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid file type. Please upload a JPG, PNG, GIF, or WEBP image.',
    ]);
    exit;
}

$extension = $allowed[$mimeType];
$userId    = (int) $_SESSION['user_id'];

// Ensure uploads/avatars directory exists
$uploadDir = __DIR__ . '/uploads/avatars';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0775, true);
}

// Use deterministic file name per user
$targetFile = $uploadDir . '/user-' . $userId . '.' . $extension;

if (!move_uploaded_file($tmpPath, $targetFile)) {
    echo json_encode([
        'success' => false,
        'message' => 'Could not save uploaded file. Please try again.',
    ]);
    exit;
}

// Build URL/path used by the frontend (relative to web root)
$publicPath = 'uploads/avatars/user-' . $userId . '.' . $extension;

try {
    $stmt = $pdo->prepare('UPDATE users SET avatar_url = :avatar_url, updated_at = NOW() WHERE id = :id');
    $stmt->execute([
        ':avatar_url' => $publicPath,
        ':id'         => $userId,
    ]);

    echo json_encode([
        'success'    => true,
        'message'    => 'Profile picture updated successfully.',
        'avatar_url' => $publicPath,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while saving your profile picture.',
    ]);
}
