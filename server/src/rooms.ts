import crypto from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { ExtendedWebSocket, Peer, ServerMessage } from './types.js';

export class RoomManager {
  private peers = new Map<string, Peer>();
  private sockets = new Map<string, ExtendedWebSocket>();
  private rooms = new Map<string, Set<string>>();

  extractRoomId(req: IncomingMessage): string {
    const forwarded = req.headers['x-forwarded-for'];
    let ip = '';

    if (typeof forwarded === 'string') {
      ip = forwarded.split(',')[0].trim();
    } else if (Array.isArray(forwarded) && forwarded.length > 0) {
      ip = forwarded[0].trim();
    } else {
      ip = req.socket.remoteAddress || '';
    }

    // Strip IPv4-mapped IPv6 prefix (::ffff:)
    if (ip.startsWith('::ffff:')) {
      ip = ip.substring(7);
    }

    // Treat localhost / private loopbacks as the same development room
    if (!ip || ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
      return 'local-dev';
    }

    // Hash the IP to avoid storing raw client IP addresses
    return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
  }

  addPeer(ws: ExtendedWebSocket, peer: Peer): void {
    this.peers.set(peer.id, peer);
    this.sockets.set(peer.id, ws);
    ws.peerId = peer.id;

    if (!this.rooms.has(peer.room)) {
      this.rooms.set(peer.room, new Set());
    }
    this.rooms.get(peer.room)!.add(peer.id);
  }

  removePeer(peerId: string): Peer | null {
    const peer = this.peers.get(peerId);
    if (!peer) return null;

    this.peers.delete(peerId);
    this.sockets.delete(peerId);

    const roomSet = this.rooms.get(peer.room);
    if (roomSet) {
      roomSet.delete(peerId);
      if (roomSet.size === 0) {
        this.rooms.delete(peer.room);
      }
    }

    return peer;
  }

  getPeer(peerId: string): Peer | undefined {
    return this.peers.get(peerId);
  }

  getSocket(peerId: string): ExtendedWebSocket | undefined {
    return this.sockets.get(peerId);
  }

  getPeersInRoom(roomId: string, excludeId?: string): Peer[] {
    const ids = this.rooms.get(roomId);
    if (!ids) return [];

    const list: Peer[] = [];
    for (const id of ids) {
      if (id === excludeId) continue;
      const p = this.peers.get(id);
      if (p) list.push(p);
    }
    return list;
  }

  broadcastToRoom(roomId: string, message: ServerMessage, excludeId?: string): void {
    const ids = this.rooms.get(roomId);
    if (!ids) return;

    const data = JSON.stringify(message);
    for (const id of ids) {
      if (id === excludeId) continue;
      const ws = this.sockets.get(id);
      if (ws && ws.readyState === ws.OPEN) {
        ws.send(data);
      }
    }
  }

  send(peerId: string, message: ServerMessage): boolean {
    const ws = this.sockets.get(peerId);
    if (ws && ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }
}
