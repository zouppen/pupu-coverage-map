export type StationId = "a" | "b";

export type HeardMap = Record<StationId, boolean>;

export type ReceptionReport = {
  id: string;
  lat: number;
  lng: number;
  heard: HeardMap;
  observedAt: string;
  comment?: string;
};

export type ListenerSubmission = {
  project: string;
  nick: string;
  email: string;
  feedback?: string;
  reports: Omit<ReceptionReport, "id">[];
};
