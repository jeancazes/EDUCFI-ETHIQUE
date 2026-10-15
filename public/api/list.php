<?php
// Espace enseignant : lecture, export, suppression. POST JSON {password, action, classe?, pseudo?}
require __DIR__ . '/lib.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(405, ['error' => 'POST uniquement']);
$in = json_decode(file_get_contents('php://input') ?: '', true) ?: [];
require_teacher($in);
$action = (string)($in['action'] ?? 'classes');

if ($action === 'classes') {
    $res = [];
    foreach (glob(data_dir() . '/*.jsonl') ?: [] as $f) {
        $ev = read_events($f);
        $res[] = ['classe' => basename($f, '.jsonl'), 'events' => count($ev),
                  'last' => $ev ? max(array_column($ev, 'ts')) : 0,
                  'eleves' => count(array_unique(array_column($ev, 'pseudo')))];
    }
    out(200, ['classes' => $res]);
}

$f = class_file(strtoupper((string)($in['classe'] ?? '')));

if ($action === 'list') {
    out(200, ['events' => read_events($f)]);
}
if ($action === 'purge_class') {
    if (is_file($f)) unlink($f);
    out(200, ['ok' => true]);
}
if ($action === 'purge_pseudo') {
    $p = (string)($in['pseudo'] ?? '');
    $keep = array_filter(read_events($f), fn($e) => ($e['pseudo'] ?? '') !== $p);
    $fh = fopen($f, 'cb');
    if (!$fh) out(500, ['error' => 'écriture impossible']);
    flock($fh, LOCK_EX); ftruncate($fh, 0);
    foreach ($keep as $e) fwrite($fh, json_encode($e, JSON_UNESCAPED_UNICODE) . "\n");
    flock($fh, LOCK_UN); fclose($fh);
    out(200, ['ok' => true]);
}
out(400, ['error' => 'action inconnue']);
