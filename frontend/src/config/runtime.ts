import type { StationId } from "../types";

export type AppConfig = {
  project: string;
  title: string;
  logoUrl: string;
  themeColor: string;
  reportEndpoint: string;
  stations: Array<{
    id: StationId;
    name: string;
    color: string;
  }>;
  mapDefaults: {
    center: {
      lat: number;
      lng: number;
    };
    initialZoom: number;
  };
};

declare global {
  interface Window {
    PUPU_COVERAGE_CONFIG?: AppConfig;
  }
}

export const appConfig = readRuntimeConfig();
export const { logoUrl, mapDefaults, project, reportEndpoint, stations, themeColor, title } = appConfig;

function readRuntimeConfig(): AppConfig {
  const config = window.PUPU_COVERAGE_CONFIG;

  if (!config) {
    throw new Error("Missing runtime config: window.PUPU_COVERAGE_CONFIG");
  }

  validateConfig(config);

  return config;
}

function validateConfig(config: AppConfig) {
  requireNonEmptyString(config.project, "project");
  requireNonEmptyString(config.title, "title");
  requireNonEmptyString(config.logoUrl, "logoUrl");
  requireNonEmptyString(config.themeColor, "themeColor");
  requireNonEmptyString(config.reportEndpoint, "reportEndpoint");

  if (!Array.isArray(config.stations) || config.stations.length !== 2) {
    throw new Error("Runtime config must define exactly two stations");
  }

  for (const station of config.stations) {
    if (station.id !== "a" && station.id !== "b") {
      throw new Error("Station id must be 'a' or 'b'");
    }

    requireNonEmptyString(station.name, `station ${station.id} name`);
    requireNonEmptyString(station.color, `station ${station.id} color`);
  }

  requireNumber(config.mapDefaults?.center?.lat, "mapDefaults.center.lat");
  requireNumber(config.mapDefaults?.center?.lng, "mapDefaults.center.lng");
  requireNumber(config.mapDefaults?.initialZoom, "mapDefaults.initialZoom");
}

function requireNonEmptyString(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Runtime config field ${field} must be a non-empty string`);
  }
}

function requireNumber(value: unknown, field: string) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`Runtime config field ${field} must be a number`);
  }
}
