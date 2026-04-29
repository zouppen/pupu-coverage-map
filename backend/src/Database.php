<?php

declare(strict_types=1);

namespace PupuCoverageMap;

use PDO;

final class Database
{
    public static function connect(): PDO
    {
        $dsn = getenv('DATABASE_DSN');

        if ($dsn === false || trim($dsn) === '') {
            throw new \RuntimeException('DATABASE_DSN is required');
        }

        return new PDO($dsn, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }
}
