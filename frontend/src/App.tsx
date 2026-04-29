import { useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Mail, MapPin, Plus, Radio, Send, Trash2 } from "lucide-react";
import { mapDefaults, project, reportEndpoint, stations } from "./config/runtime";
import type { HeardMap, ListenerSubmission, ReceptionReport, StationId } from "./types";
import { submissionSchema } from "./validation";

const emptyHeard: HeardMap = {
  a: false,
  b: false,
};

type DraftReport = {
  lat: number;
  lng: number;
  heard: HeardMap;
  observedAt: string;
  comment: string;
};

type ListenerFields = {
  nick: string;
  email: string;
  feedback: string;
};

type SubmitStatus = {
  tone: "error" | "success";
  message: string;
};

function currentLocalDateTime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

function toPayloadDateTime(value: string) {
  return value.length === 16 ? `${value}:00` : value;
}

function createReportId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function makeMarkerIcon(report: ReceptionReport) {
  const heardStations = stations.filter((station) => report.heard[station.id]);
  const color =
    heardStations.length === 1
      ? heardStations[0].color
      : heardStations.length === 2
        ? "#7c3aed"
        : "#374151";

  const label =
    heardStations.length === 0
      ? "C"
      : heardStations.map((station) => station.id.toUpperCase()).join("");

  return L.divIcon({
    className: "coverage-marker",
    html: `<span style="background:${color}">${label}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -32],
  });
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

export function App() {
  const [listener, setListener] = useState<ListenerFields>({
    nick: "",
    email: "",
    feedback: "",
  });
  const [reports, setReports] = useState<ReceptionReport[]>([]);
  const [draft, setDraft] = useState<DraftReport | null>(null);
  const [status, setStatus] = useState<SubmitStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastObservedAt, setLastObservedAt] = useState(currentLocalDateTime());
  const isSubmitDisabled = isSubmitting || draft !== null;

  const payload = useMemo<ListenerSubmission>(
    () => ({
      project,
      nick: listener.nick.trim(),
      email: listener.email.trim(),
      feedback: listener.feedback.trim() || undefined,
      reports: reports.map((report) => ({
        lat: report.lat,
        lng: report.lng,
        heard: report.heard,
        observedAt: toPayloadDateTime(report.observedAt),
        comment: report.comment?.trim() || undefined,
      })),
    }),
    [listener, reports],
  );

  function beginDraft(lat: number, lng: number) {
    setDraft({
      lat,
      lng,
      heard: { ...emptyHeard },
      observedAt: lastObservedAt,
      comment: "",
    });
    setStatus(null);
  }

  function addDraft() {
    if (!draft) return;

    const report: ReceptionReport = {
      id: createReportId(),
      lat: draft.lat,
      lng: draft.lng,
      heard: { ...draft.heard },
      observedAt: draft.observedAt,
      comment: draft.comment.trim() || undefined,
    };

    setReports((current) => [...current, report]);
    setLastObservedAt(draft.observedAt);
    setDraft(null);
    setStatus(null);
  }

  function updateDraftHeard(stationId: StationId, checked: boolean) {
    setDraft((current) =>
      current
        ? {
            ...current,
            heard: {
              ...current.heard,
              [stationId]: checked,
            },
          }
        : current,
    );
  }

  async function submitReports() {
    setStatus(null);

    const parsed = submissionSchema.safeParse(payload);
    if (!parsed.success) {
      setStatus({
        tone: "error",
        message: parsed.error.issues[0]?.message ?? "Tarkista tiedot.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(reportEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        throw new Error(`Lähetys epäonnistui (${response.status})`);
      }

      setStatus({ tone: "success", message: "Havainnot lähetetty." });
      setReports([]);
      setListener({ nick: "", email: "", feedback: "" });
    } catch (error) {
      setStatus({
        tone: "error",
        message: error instanceof Error ? error.message : "Lähetys epäonnistui.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="map-area" aria-label="Kuuluvuuskartta">
        <MapContainer
          center={[mapDefaults.center.lat, mapDefaults.center.lng]}
          zoom={mapDefaults.initialZoom}
          scrollWheelZoom
          className="map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={beginDraft} />
          {reports.map((report) => (
            <Marker
              key={report.id}
              position={[report.lat, report.lng]}
              icon={makeMarkerIcon(report)}
            >
              <Popup>
                <strong>{formatHeard(report.heard)}</strong>
                <br />
                {formatDateTime(report.observedAt)}
                {report.comment ? (
                  <>
                    <br />
                    {report.comment}
                  </>
                ) : null}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </section>

      <aside className="side-panel">
        <header className="panel-header">
          <div>
            <p className="eyebrow">Pupu Coverage Map</p>
            <h1>Kuuluvuushavainnot</h1>
	    <p>Täällä voit raportoida asemamme kuuluvuuden yhdessä tai useammassa paikassa. Voit myös raportoida katvealueen.</p>
          </div>
          <Radio aria-hidden="true" />
        </header>

        <section className="panel-section">
          <h2>Uusi piste</h2>
          {draft ? (
            <div className="draft-form">
              <div className="location-row">
                <MapPin size={18} aria-hidden="true" />
                <span>
                  {draft.lat.toFixed(5)}, {draft.lng.toFixed(5)}
                </span>
              </div>

              <div className="check-list">
                {stations.map((station) => (
                  <label key={station.id} className="check-row">
                    <input
                      type="checkbox"
                      checked={draft.heard[station.id]}
                      onChange={(event) => updateDraftHeard(station.id, event.target.checked)}
                    />
                    <span className="station-dot" style={{ background: station.color }} />
                    {station.name} kuului
                  </label>
                ))}
              </div>

              <label className="field">
                <span>Päivä ja kellonaika</span>
                <input
                  type="datetime-local"
                  value={draft.observedAt}
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, observedAt: event.target.value } : current,
                    )
                  }
                />
                <small>Ei tarvitse olla minuutin tarkkuudella.</small>
              </label>

              <label className="field">
                <span>Kommentti pisteeseen</span>
                <textarea
                  rows={3}
                  value={draft.comment}
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, comment: event.target.value } : current,
                    )
                  }
                />
              </label>

              <div className="button-row">
                <button type="button" className="secondary" onClick={() => setDraft(null)}>
                  Peruuta
                </button>
                <button type="button" onClick={addDraft}>
                  <Plus size={18} aria-hidden="true" />
                  Lisää piste
                </button>
              </div>
            </div>
          ) : (
            <p className="empty-state">Klikkaa karttaa lisätäksesi havaintopisteen.</p>
          )}
        </section>

        <section className="panel-section">
          <h2>Pisteet</h2>
          {reports.length > 0 ? (
            <ol className="report-list">
              {reports.map((report) => (
                <li key={report.id}>
                  <div>
                    <strong>{formatHeard(report.heard)}</strong>
                    <span>{formatDateTime(report.observedAt)}</span>
                  </div>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Poista piste"
                    onClick={() =>
                      setReports((current) => current.filter((item) => item.id !== report.id))
                    }
                  >
                    <Trash2 size={17} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="empty-state">Ei lisättyjä pisteitä.</p>
          )}
        </section>

        <section className="panel-section">
          <h2>Lähettäjän tiedot</h2>
          <label className="field">
            <span>Nimi tai nimimerkki</span>
            <input
              type="text"
              value={listener.nick}
              onChange={(event) => setListener({ ...listener, nick: event.target.value })}
              required
            />
          </label>
          <label className="field">
            <span>Sähköposti</span>
            <input
              type="email"
              value={listener.email}
              onChange={(event) => setListener({ ...listener, email: event.target.value })}
              required
            />
          </label>
          <label className="field">
            <span>Yleinen palaute asemalle</span>
            <textarea
              rows={4}
              value={listener.feedback}
              onChange={(event) => setListener({ ...listener, feedback: event.target.value })}
            />
          </label>
        </section>

        {status ? (
          <p className={`status ${status.tone}`} role={status.tone === "error" ? "alert" : "status"}>
            <Mail size={17} aria-hidden="true" />
            {status.message}
          </p>
        ) : null}

        {draft ? (
          <p className="submit-hint">Lisää tai peruuta keskeneräinen piste ennen lähettämistä.</p>
        ) : null}

        <button
          type="button"
          className="submit-button"
          onClick={submitReports}
          disabled={isSubmitDisabled}
        >
          {isSubmitting ? (
            "Lähetetään..."
          ) : (
            <>
              <Send size={18} aria-hidden="true" />
              Lähetä havainnot
            </>
          )}
        </button>

        <a
          className="source-link"
          href="https://github.com/zouppen/pupu-coverage-map"
          rel="noreferrer"
          target="_blank"
        >
          Lähdekoodit GitHubissa
        </a>
      </aside>
    </main>
  );
}

function formatHeard(heard: HeardMap) {
  const names = stations.filter((station) => heard[station.id]).map((station) => station.name);
  return names.length > 0 ? `${names.join(" ja ")} kuului` : "Katvepiste";
}

function formatDateTime(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("fi-FI", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
