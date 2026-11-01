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

export interface FileMetadata {
  transferId: string;
  name: string;
  size: number;
  mimeType: string;
  totalChunks: number;
}

export type FileTransferStatus = 'pending' | 'transferring' | 'completed' | 'cancelled' | 'error';

export interface FileTransferProgress {
  transferId: string;
  fileName: string;
  fileSize: number;
  direction: 'send' | 'receive';
  peerId: string;
  peerName: string;
  bytesTransferred: number;
  percentage: number;
  status: FileTransferStatus;
  speed: number; // bytes per second
  errorMessage?: string;
}

export interface TextShareMessage {
  id: string;
  text: string;
  peerId: string;
  peerName: string;
  timestamp: number;
}
