export interface SessionState {
  sessionActive: boolean;
  sessionStartTime: string | null;
  targetAll: boolean;
  targetClients: string[];
}

export interface ClientPC {
  pcName: string;
  ip: string;
  lastSeen: number;
  status: 'Online' | 'Offline' | 'Blocked';
  isSimulated?: boolean;
  studentName?: string;
  isTargeted?: boolean;
}

export interface DatabaseState {
  session: SessionState;
  blacklist: string[];
  realClients: Record<string, { pcName: string; ip: string; lastSeen: number; status: string }>;
  useSimulation: boolean;
}
