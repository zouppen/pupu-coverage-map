<?php

declare(strict_types=1);

namespace PupuCoverageMap;

final class Http
{
    public static function json(mixed $payload, int $status): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');

        if ($status !== 204) {
            echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        }

        exit;
    }
}
