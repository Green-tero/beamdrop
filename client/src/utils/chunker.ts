import type { FileMetadata } from '../types';

export const CHUNK_SIZE = 64 * 1024; // 64KB chunks match WebRTC SCTP packet sweet spot
export const BUFFER_THRESHOLD = 512 * 1024; // 512KB backpressure threshold to prevent buffer bloat

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatSpeed(bytesPerSec: number): string {
  return `${formatBytes(bytesPerSec)}/s`;
}

export function createFileMetadata(file: File, transferId = crypto.randomUUID()): FileMetadata {
  return {
    transferId,
    name: file.name,
    size: file.size,
    mimeType: file.type || 'application/octet-stream',
    totalChunks: Math.ceil(file.size / CHUNK_SIZE) || 1
  };
}

export function triggerDownload(chunks: BlobPart[], metadata: FileMetadata): void {
  const blob = new Blob(chunks, { type: metadata.mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = metadata.name;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();

  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 1000);
}
