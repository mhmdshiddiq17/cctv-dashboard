// --- Existing types (tetap) ---
export type CCTVStatus = "ONLINE" | "OFFLINE" | "MAINTENANCE";
export type CCTVProtocol = "RTSP" | "HTTP" | "ONVIF" | "MQTT";

export interface IpCctv {
  id: string;
  ipAddress: string;
  port: number;
  protocol: CCTVProtocol;
  username: string | null;
  password: string | null;
  streamPath: string | null;
  isActive: boolean;
  assignedAt: string; // ISO 8601
  deactivatedAt: string | null;
  notes: string | null;
  changedBy: string | null;
  changeReason: string | null;
  cctvId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CCTV {
  id: string;
  label: string;
  location: string;
  status: CCTVStatus;
  resolution: string | null;
  brand: string | null;
  installedAt: string;
  activeIpCctvId: string | null;
  koperasiId: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations (populated conditionally)
  ipCctvs?: IpCctv[];
  activeIpCctv?: IpCctv | null;
}

export interface Koperasi {
  onlineCCTV: number;
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  latitude: number;
  longitude: number;
  cctvs?: CCTV[];
  _count?: { cctvs: number };
}

// --- Baru: Recording types ---
export type RecordingStatus = "RECORDING" | "STOPPED" | "CORRUPTED" | "SCHEDULED";
export type RecordingType   = "CONTINUOUS" | "MOTION_DETECTED" | "MANUAL" | "SCHEDULED";

export interface CCTVRecording {
  recordingId:   string;
  cctvId:        string;
  cctvLabel:     string;
  koperasiId:    string;
  startTime:     string;   // ISO 8601
  endTime:       string | null;
  durationSec:   number | null;
  status:        RecordingStatus;
  type:          RecordingType;
  fileSizeMB:    number | null;
  resolution:    string;
  fps:           number;
  thumbnailUrl:  string | null;
  streamUrl:     string | null;
  storageNode:   string;   // e.g. "node-01.storage.internal"
  createdAt:     string;
}

export interface CCTVRecordingResponse {
  success:    boolean;
  cctvId:     string;
  koperasiId: string;
  total:      number;
  page:       number;
  perPage:    number;
  data:       CCTVRecording[];
  fetchedAt:  string;
}

export interface KoperasiSummary {
  id: string;
  name: string;
  city: string;
  province: string;
  onlineCCTV: number;
  totalCCTV: number;
  lat: number;
  lng: number;
};

export interface CCTVTableEntry {
  id: string;
  label: string;
  location: string;
  status: CCTVStatus;
  resolution: string;
  brand: string;
  fps: number;
};

export interface CCTVItem {
  id: string;
  label: string;
  location: string;
  status: CCTVStatus;
  resolution: string;
  brand: string;
  fps: number;
  hasStream?: boolean;
  streamUrl?: string | null;
  webrtcUrl?: string | null;
  ipCctvs?: IpCctv[];
  activeIpCctv?: IpCctv | null;
};

export type StatColor = "red" | "green" | "yellow" | "gray";
export type CCTVFilter = "ALL" | CCTVStatus;
export type CCTVSortKey = "label" | "location" | "status" | "resolution" | "brand" | "fps";
