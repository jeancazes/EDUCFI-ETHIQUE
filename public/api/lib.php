<?php
// Fonctions communes de l'API de suivi EDUCFI critique.
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

const GAMES = ['frais', 'arnaque'];

function out(int $code, array $body): never {
    http_response_code($code);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

function data_dir(): string {
    $d = __DIR__ . '/data';
    if (!is_dir($d)) {
        @mkdir($d, 0750, true);
        @file_put_contents($d . '/.htaccess', "Require all denied\nDeny from all\n");
        @file_put_contents($d . '/index.html', '');
    }
    return $d;
}

function class_file(string $classe): string {
    if (!preg_match('/^[A-Z0-9-]{2,20}$/', $classe)) out(400, ['error' => 'classe invalide']);
    return data_dir() . '/' . $classe . '.jsonl';
}

function require_teacher(array $in): void {
    $cfg = __DIR__ . '/config.php';
    if (!is_file($cfg)) out(503, ['error' => 'config.php manquant (voir docs/DEPLOIEMENT.md)']);
    require_once $cfg;
    $pwd = (string)($in['password'] ?? '');
    if (!defined('TEACHER_SHA256') || !hash_equals(TEACHER_SHA256, hash('sha256', $pwd))) {
        sleep(1);
        out(401, ['error' => 'mot de passe incorrect']);
    }
}

function read_events(string $file): array {
    if (!is_file($file)) return [];
    $res = [];
    $fh = fopen($file, 'rb');
    if (!$fh) return [];
    flock($fh, LOCK_SH);
    while (($line = fgets($fh)) !== false) {
        $e = json_decode($line, true);
        if (is_array($e)) $res[] = $e;
    }
    flock($fh, LOCK_UN);
    fclose($fh);
    return $res;
}
