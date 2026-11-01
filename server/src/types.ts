import type { WebSocket } from 'ws';

export interface DeviceInfo {
  os: string;
  type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
}

export interface Peer {
  id: string;
  name: string;
  device: DeviceInfo;
  room: string;
  joinedAt: number;
}

export type ClientMessage =
  | { type: 'signal'; target: string; payload: unknown }
  | { type: 'ping' }
  | { type: 'rename'; name: string };

export type ServerMessage =
  | { type: 'init'; peer: Peer; peers: Peer[] }
  | { type: 'peer-joined'; peer: Peer }
  | { type: 'peer-left'; peerId: string }
  | { type: 'peer-updated'; peer: Peer }
  | { type: 'signal'; sender: string; payload: unknown }
  | { type: 'pong' }
  | { type: 'error'; message: string };

export interface ExtendedWebSocket extends WebSocket {
  peerId?: string;
  isAlive?: boolean;
}
