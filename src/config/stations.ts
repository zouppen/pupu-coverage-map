export const stations = [
  {
    id: "a",
    name: "Asema A",
    color: "#2563eb",
  },
  {
    id: "b",
    name: "Asema B",
    color: "#dc2626",
  },
] as const;

export const mapDefaults = {
  center: {
    lat: 62.2426,
    lng: 25.7473,
  },
  initialZoom: 11,
} as const;

export const reportEndpoint = "/api/reports";
