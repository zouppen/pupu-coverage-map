<?php

declare(strict_types=1);

namespace PupuCoverageMap;

final class ValidationException extends \RuntimeException
{
}

final class Validator
{
    /**
     * @return array{
     *   project: string,
     *   nick: string,
     *   email: string,
     *   receiver: string|null,
     *   feedback: string|null,
     *   reports: list<array{
     *     lat: float,
     *     lng: float,
     *     heard: array{a: bool, b: bool},
     *     observedAt: string,
     *     comment: string|null
     *   }>
     * }
     */
    public static function submission(mixed $payload): array
    {
        if (!is_array($payload)) {
            throw new ValidationException('JSON object is required');
        }

        $reports = $payload['reports'] ?? null;
        if (!is_array($reports) || count($reports) < 1) {
            throw new ValidationException('At least one report is required');
        }

        if (count($reports) > 100) {
            throw new ValidationException('Too many reports');
        }

        return [
            'project' => self::requiredString($payload, 'project', 100),
            'nick' => self::requiredString($payload, 'nick', 200),
            'email' => self::email($payload['email'] ?? null),
            'receiver' => self::optionalString($payload, 'receiver', 500),
            'feedback' => self::optionalString($payload, 'feedback', 5000),
            'reports' => array_map([self::class, 'report'], array_values($reports)),
        ];
    }

    /**
     * @return array{
     *   lat: float,
     *   lng: float,
     *   heard: array{a: bool, b: bool},
     *   observedAt: string,
     *   comment: string|null
     * }
     */
    private static function report(mixed $payload): array
    {
        if (!is_array($payload)) {
            throw new ValidationException('Report must be an object');
        }

        $heard = $payload['heard'] ?? null;
        if (!is_array($heard)) {
            throw new ValidationException('Report heard field is required');
        }

        return [
            'lat' => self::coordinate($payload['lat'] ?? null, -90, 90, 'lat'),
            'lng' => self::coordinate($payload['lng'] ?? null, -180, 180, 'lng'),
            'heard' => [
                'a' => self::boolean($heard['a'] ?? null, 'heard.a'),
                'b' => self::boolean($heard['b'] ?? null, 'heard.b'),
            ],
            'observedAt' => self::dateTime($payload['observedAt'] ?? null),
            'comment' => self::optionalString($payload, 'comment', 2000),
        ];
    }

    private static function requiredString(array $payload, string $field, int $maxLength): string
    {
        $value = $payload[$field] ?? null;
        if (!is_string($value)) {
            throw new ValidationException("{$field} is required");
        }

        $trimmed = trim($value);
        if ($trimmed === '') {
            throw new ValidationException("{$field} is required");
        }

        if (strlen($trimmed) > $maxLength) {
            throw new ValidationException("{$field} is too long");
        }

        return $trimmed;
    }

    private static function optionalString(array $payload, string $field, int $maxLength): ?string
    {
        $value = $payload[$field] ?? null;
        if ($value === null) {
            return null;
        }

        if (!is_string($value)) {
            throw new ValidationException("{$field} must be a string");
        }

        $trimmed = trim($value);
        if ($trimmed === '') {
            return null;
        }

        if (strlen($trimmed) > $maxLength) {
            throw new ValidationException("{$field} is too long");
        }

        return $trimmed;
    }

    private static function email(mixed $value): string
    {
        if (!is_string($value)) {
            throw new ValidationException('email is required');
        }

        $trimmed = trim($value);
        if (!filter_var($trimmed, FILTER_VALIDATE_EMAIL)) {
            throw new ValidationException('email must be valid');
        }

        return $trimmed;
    }

    private static function coordinate(mixed $value, float $min, float $max, string $field): float
    {
        if (!is_int($value) && !is_float($value)) {
            throw new ValidationException("{$field} must be a number");
        }

        $coordinate = (float) $value;
        if ($coordinate < $min || $coordinate > $max) {
            throw new ValidationException("{$field} is out of range");
        }

        return $coordinate;
    }

    private static function boolean(mixed $value, string $field): bool
    {
        if (!is_bool($value)) {
            throw new ValidationException("{$field} must be a boolean");
        }

        return $value;
    }

    private static function dateTime(mixed $value): string
    {
        if (!is_string($value) || trim($value) === '') {
            throw new ValidationException('observedAt is required');
        }

        $trimmed = trim($value);
        $dateTime = self::parseDateTime($trimmed, '!Y-m-d\TH:i:s')
            ?: self::parseDateTime($trimmed, '!Y-m-d\TH:i');

        if ($dateTime === false) {
            throw new ValidationException('observedAt must be a valid date and time');
        }

        return $dateTime->format('Y-m-d H:i:s');
    }

    private static function parseDateTime(string $value, string $format): \DateTimeImmutable|false
    {
        $dateTime = \DateTimeImmutable::createFromFormat($format, $value);
        $errors = \DateTimeImmutable::getLastErrors();

        if ($dateTime === false) {
            return false;
        }

        if ($errors !== false && ($errors['warning_count'] > 0 || $errors['error_count'] > 0)) {
            return false;
        }

        return $dateTime;
    }
}
