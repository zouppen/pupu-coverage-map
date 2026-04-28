# Pupu Coverage Map

Pupu Coverage Map is a web frontend for collecting radio reception reports from listeners.
The application UI is in Finnish.

Listeners can place one or more points on a map and mark whether station A, station B, both
stations, or neither station was heard at that location. Each point includes an observation
date and time, plus an optional comment. The listener also submits a required nickname or
radio amateur callsign, a required email address, and optional general feedback for the
station.

This project was created with AI assistance.

## Tech Stack

- Vite
- React
- TypeScript
- React-Leaflet
- Leaflet
- Zod

## Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local development URL shown by Vite, usually:

```txt
http://localhost:5173/
```

## Build

Run a production build:

```bash
npm run build
```

Run linting:

```bash
npm run lint
```

## Configuration

Station names and colors are configured in:

```txt
src/config/stations.ts
```

The backend endpoint is also currently configured there:

```ts
export const reportEndpoint = "/api/reports";
```

## Submission Format

The frontend sends JSON to the configured backend endpoint.

Example payload:

```json
{
  "nick": "OH2ABC",
  "email": "listener@example.com",
  "feedback": "Good reception near the summer cottage.",
  "reports": [
    {
      "lat": 60.1699,
      "lng": 24.9384,
      "heard": {
        "a": true,
        "b": false
      },
      "observedAt": "2026-04-28T18:30:00",
      "comment": "Station A was clear, station B was not heard."
    },
    {
      "lat": 60.2055,
      "lng": 24.6559,
      "heard": {
        "a": false,
        "b": false
      },
      "observedAt": "2026-04-28T19:00:00"
    }
  ]
}
```

## Notes

A shadow area report is represented by a point where both `heard.a` and `heard.b` are
`false`. Comments are optional for individual points.
