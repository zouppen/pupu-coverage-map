# Backend

Plain PHP backend for receiving reception reports and storing them in PostgreSQL.

## Requirements

- PHP with PDO PostgreSQL support enabled
- PostgreSQL

## Configuration

The backend reads the PDO PostgreSQL DSN from `DATABASE_DSN`.

```bash
export DATABASE_DSN="pgsql:host=/var/run/postgresql;dbname=pupu_coverage_map"
```

For a TCP connection:

```bash
export DATABASE_DSN="pgsql:host=localhost;port=5432;dbname=pupu_coverage_map;user=pupu;password=secret"
```

## Database

Apply the migration:

```bash
psql pupu_coverage_map -f migrations/001_create_report_tables.sql
```

The schema stores `project` on `reception_reports`. Individual rows in `reception_entries`
refer to their parent report and do not duplicate the project value.

For Grafana, use `reception_entries_view`, which exposes `project`, `lat`, `lng`,
`observed_at`, and derived `heard_status` in one queryable relation.

## Endpoint

```txt
POST /api/reports
Content-Type: application/json
```

Successful response:

```json
{
  "id": 1
}
```

The `id` is the created reception report ID.

## Local Development

From this directory:

```bash
php -S localhost:8080 -t public
```

The PHP built-in server does not rewrite `/api/reports` to `/api/reports.php`. For local
direct testing, call:

```txt
http://localhost:8080/api/reports.php
```

In production, configure Nginx to route `/api/reports` to `backend/public/api/reports.php`
through PHP-FPM.
