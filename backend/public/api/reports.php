<?php

declare(strict_types=1);

require_once __DIR__ . '/../../src/Database.php';
require_once __DIR__ . '/../../src/Http.php';
require_once __DIR__ . '/../../src/ReportRepository.php';
require_once __DIR__ . '/../../src/Validation.php';

use PupuCoverageMap\Database;
use PupuCoverageMap\Http;
use PupuCoverageMap\ReportRepository;
use PupuCoverageMap\ValidationException;
use PupuCoverageMap\Validator;

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    Http::json(null, 204);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Http::json(['error' => 'Method not allowed'], 405);
}

$rawBody = file_get_contents('php://input');
if ($rawBody === false || trim($rawBody) === '') {
    Http::json(['error' => 'Request body is required'], 400);
}

try {
    $decoded = json_decode($rawBody, true, 512, JSON_THROW_ON_ERROR);
    $submission = Validator::submission($decoded);

    $repository = new ReportRepository(Database::connect());
    $id = $repository->save($submission);

    Http::json(['id' => $id], 201);
} catch (JsonException) {
    Http::json(['error' => 'Malformed JSON'], 400);
} catch (ValidationException $error) {
    Http::json(['error' => $error->getMessage()], 422);
} catch (Throwable $error) {
    error_log((string) $error);
    Http::json(['error' => 'Internal server error'], 500);
}
