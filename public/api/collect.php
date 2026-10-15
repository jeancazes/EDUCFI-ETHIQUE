<?php
// Réception des événements élèves (anonymes : code classe + pseudo).
require __DIR__ . '/lib.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(405, ['error' => 'POST uniquement']);
$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw) > 65536) out(413, ['error' => 'trop volumineux']);
$in = json_decode($raw, true);
$events = is_array($in['events'] ?? null) ? $in['events'] : [];
if (count($events) > 60) out(413, ['error' => 'trop d\'événements']);

$stored = 0;
$byFile = [];
foreach ($events as $e) {
    if (!is_array($e)) continue;
    $classe = strtoupper((string)($e['classe'] ?? ''));
    $pseudo = trim(strip_tags((string)($e['pseudo'] ?? '')));
    $sid = (string)($e['sid'] ?? '');
    $game = (string)($e['game'] ?? '');
    $type = (string)($e['type'] ?? '');
    if (!preg_match('/^[A-Z0-9-]{2,20}$/', $classe)) continue;
    if (mb_strlen($pseudo) < 1 || mb_strlen($pseudo) > 24) continue;
    if (!preg_match('/^[A-Za-z0-9-]{8,64}$/', $sid)) continue;
    if (!in_array($game, GAMES, true)) continue;
    if (!preg_match('/^[a-z_]{1,24}$/', $type)) continue;
    $d = is_array($e['d'] ?? null) ? $e['d'] : [];
    $d = json_decode(json_encode($d, JSON_UNESCAPED_UNICODE), true);
    $dj = json_encode($d, JSON_UNESCAPED_UNICODE);
    if (strlen($dj) > 4096) continue;
    $byFile[$classe][] = json_encode([
        'ts' => (int)round(microtime(true) * 1000),
        't' => (int)($e['t'] ?? 0),
        'classe' => $classe, 'pseudo' => $pseudo, 'sid' => $sid,
        'game' => $game, 'type' => $type, 'd' => $d,
    ], JSON_UNESCAPED_UNICODE) . "\n";
}
foreach ($byFile as $classe => $lines) {
    $f = class_file($classe);
    if (is_file($f) && filesize($f) > 20 * 1024 * 1024) continue; // garde-fou
    $fh = fopen($f, 'ab');
    if (!$fh) out(500, ['error' => 'écriture impossible']);
    flock($fh, LOCK_EX);
    foreach ($lines as $l) { fwrite($fh, $l); $stored++; }
    flock($fh, LOCK_UN);
    fclose($fh);
}
out(200, ['ok' => true, 'stored' => $stored]);
