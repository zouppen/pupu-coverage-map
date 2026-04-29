window.PUPU_COVERAGE_CONFIG = {
  project: "pupu-coverage-map",
  title: "Kuuluvuushavainnot",
  logoUrl: "assets/logo.example.svg",
  themeColor: "#b91c1c",
  reportEndpoint: "api/reports",
  stations: [
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
  ],
  mapDefaults: {
    center: {
      lat: 62.2426,
      lng: 25.7473,
    },
    initialZoom: 11,
  },
};
