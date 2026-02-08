<?php
// Ensure we only ever output JSON (no HTML/PHP warnings)
ini_set('display_errors', '0');
header('Content-Type: application/json');

// 🔐 Put your NewsAPI key here (or load from env)
$apiKey = 'dfab1468d40b4780972dafa5a6c3fb80';

if (!$apiKey) {
    http_response_code(500);
    echo json_encode(['error' => 'Missing NewsAPI key']);
    exit;
}

// Build query
$query = '(cancer AND (survivor OR remission OR "successful treatment" OR breakthrough OR recovery))';
$url = 'https://newsapi.org/v2/everything?q=' . urlencode($query) . '&language=en&sortBy=publishedAt&pageSize=20&apiKey=' . urlencode($apiKey);

// Helper to fetch URL using cURL with safe fallback
function fetch_url(string $url): array
{
    // Prefer cURL if available for better error handling
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_HTTPHEADER => [
                'User-Agent: ShineOnApp/1.0 (+http://localhost/ShineOn)'
            ],
        ]);
        $body = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err = curl_error($ch);
        curl_close($ch);

        // Always return the body if we got one, even on HTTP 4xx/5xx,
        // so the caller can inspect the NewsAPI error payload.
        if ($body === false) {
            return [null, $err ?: ('HTTP error ' . $httpCode)];
        }
        return [$body, null];
    }

    // Fallback to file_get_contents if cURL is not available
    $ctx = stream_context_create([
        'http' => [
            'timeout' => 10,
            'header'  => "User-Agent: ShineOnApp/1.0 (+http://localhost/ShineOn)\r\n",
        ],
        'ssl' => [
            'verify_peer' => true,
            'verify_peer_name' => true,
        ],
    ]);

    $body = @file_get_contents($url, false, $ctx);
    if ($body === false) {
        return [null, 'Failed to fetch remote content'];
    }
    return [$body, null];
}

[$response, $error] = fetch_url($url);

if ($error !== null || $response === null) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch news', 'details' => $error]);
    exit;
}

$data = json_decode($response, true);
// If NewsAPI returned an error payload, pass it through so the client can see the message
if (is_array($data) && isset($data['status']) && $data['status'] !== 'ok') {
    // Preserve the upstream status code if present in our response headers
    http_response_code(400);
    echo json_encode($data);
    exit;
}

if (!is_array($data) || !isset($data['articles']) || !is_array($data['articles'])) {
    http_response_code(500);
    echo json_encode(['error' => 'Unexpected response from NewsAPI']);
    exit;
}

// Positive keyword filter
$positiveKeywords = [
    'survivor',
    'remission',
    'recovery',
    'breakthrough',
    'hope',
    'cured',
    'successful',
    'thriving',
];

$filteredArticles = [];

foreach ($data['articles'] as $article) {
    $text = strtolower(($article['title'] ?? '') . ' ' . ($article['description'] ?? ''));
    foreach ($positiveKeywords as $word) {
        if (strpos($text, $word) !== false) {
            $filteredArticles[] = $article;
            break;
        }
    }
}

echo json_encode($filteredArticles);
