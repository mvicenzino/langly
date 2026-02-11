export interface CpuInfo {
  percent: number;
  cores: number;
  threads: number;
  freq?: number;
  loadAvg?: number[];
}

export interface MemoryInfo {
  total: number;
  used: number;
  available: number;
  percent: number;
}

export interface DiskInfo {
  total: number;
  used: number;
  free: number;
  percent: number;
}

export interface NetworkInfo {
  bytesSent: number;
  bytesRecv: number;
  packetsSent: number;
  packetsRecv: number;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
}

export interface SystemInfo {
  hostname: string;
  os: string;
  arch: string;
  python: string;
  uptime: string;
  cpu: CpuInfo;
  memory: MemoryInfo;
  disk: DiskInfo;
  network: NetworkInfo;
  topProcesses: ProcessInfo[];
}

export interface RecentFile {
  name: string;
  path: string;
  dir: string;
  isDir: boolean;
  size: number;
  modified: number;
}

export interface RunningService {
  port: number;
  name: string;
  kind: string;
  status: string;
}
