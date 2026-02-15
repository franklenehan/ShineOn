<?php
// Ensure we only ever output JSON (no HTML/PHP warnings)
ini_set('display_errors', '0');
header('Content-Type: application/json');

// 🔐 Load NewsAPI key from environment for security, with optional local config fallback
$apiKey = getenv('NEWSAPI_KEY') ?: null;

// Optional local config file (not committed) can define $NEWSAPI_KEY
if (!$apiKey) {
    $localConfig = __DIR__ . '/config-local.php';
    if (is_readable($localConfig)) {
        require $localConfig; // should define $NEWSAPI_KEY
        if (!empty($NEWSAPI_KEY)) {
            $apiKey = $NEWSAPI_KEY;
        }
    }
}

if (!$apiKey) {
    http_response_code(500);
    echo json_encode(['error' => 'Missing NewsAPI key']);
    exit;
}

// Build query
// Focus on cancer-related, uplifting content: survivors, remission, successful treatments,
// breakthrough research and clinical/drug trials with positive outcomes.
$query = 'cancer AND (survivor OR remission OR "successful treatment" OR breakthrough OR "clinical trial" OR "drug trial" OR immunotherapy OR "positive results" OR "no evidence of disease")';

// Lightly de-emphasise obviously negative headlines by excluding some harsh terms
$query .= ' NOT death NOT died NOT fatal NOT killing NOT killed NOT lawsuit';

// Limit to articles from the last 7 days
$fromDate = date('Y-m-d', strtotime('-7 days'));

// We ask NewsAPI for up to 20 recent matches, then further trim to 3 positive ones below.
$url = 'https://newsapi.org/v2/everything?q=' . urlencode($query)
     . '&language=en&sortBy=publishedAt&pageSize=20&from=' . urlencode($fromDate)
     . '&apiKey=' . urlencode($apiKey);

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

// Positive keyword filter (applied to title + description)
// These terms are chosen to favour survivor stories, remission, successful treatments,
// and promising research / clinical trials while still being fairly broad.
$positiveKeywords = [
    'survivor',
    'remission',
    'recovery',
    'breakthrough',
    'hope',
    'cured',
    'successful',
    'thriving',
    'clinical trial',
    'drug trial',
    'phase 2',
    'phase ii',
    'phase 3',
    'phase iii',
    'positive results',
    'promising results',
    'promising data',
    'no evidence of disease',
    'ned',
    'long-term survival',
    'survival rate',
    'immunotherapy',
    'approved',
    'approval',
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
// Return at most 3 positively filtered articles for the homepage newsfeed
$limited = array_slice($filteredArticles, 0, 3);

echo json_encode($limited);
