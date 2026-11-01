import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import type { ExtendedWebSocket, ClientMessage, Peer } from './types.js';
import { RoomManager } from './rooms.js';
import { generateAlias } from './utils/names.js';
import { parseUserAgent } from './utils/ua.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

const app = express();
app.use(cors());
app.use(express.json());

const roomManager = new RoomManager();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Serve frontend build if present
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));
app.get('*', (_req, res, next) => {
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) next();
  });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: ExtendedWebSocket, req) => {
  const peerId = crypto.randomUUID();
  const roomId = roomManager.extractRoomId(req);
  const device = parseUserAgent(req.headers['user-agent']);
  const name = generateAlias();

  const peer: Peer = {
    id: peerId,
    name,
    device,
    room: roomId,
    joinedAt: Date.now()
  };

  ws.isAlive = true;
  roomManager.addPeer(ws, peer);

  // Send current state and peer list to newly joined peer
  const existingPeers = roomManager.getPeersInRoom(roomId, peerId);
  ws.send(JSON.stringify({
    type: 'init',
    peer,
    peers: existingPeers
  }));

  // Notify everyone else in the room
  roomManager.broadcastToRoom(roomId, {
    type: 'peer-joined',
    peer
  }, peerId);

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (raw) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw.toString()) as ClientMessage;
    } catch {
      return;
    }

    if (msg.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong' }));
      return;
    }

    if (msg.type === 'rename' && typeof msg.name === 'string') {
      const sanitized = msg.name.trim().slice(0, 32);
      if (sanitized && sanitized !== peer.name) {
        peer.name = sanitized;
        roomManager.broadcastToRoom(roomId, {
          type: 'peer-updated',
          peer
        });
      }
      return;
    }

    if (msg.type === 'signal') {
      const targetSocket = roomManager.getSocket(msg.target);
      if (targetSocket) {
        targetSocket.send(JSON.stringify({
          type: 'signal',
          sender: peerId,
          payload: msg.payload
        }));
      }
    }
  });

  ws.on('close', () => {
    const removed = roomManager.removePeer(peerId);
    if (removed) {
      roomManager.broadcastToRoom(roomId, {
        type: 'peer-left',
        peerId
      });
    }
  });

  ws.on('error', () => {
    ws.close();
  });
});

// Periodic heartbeat to clean dead sockets
const interval = setInterval(() => {
  wss.clients.forEach((client) => {
    const extWs = client as ExtendedWebSocket;
    if (extWs.isAlive === false) {
      extWs.terminate();
      return;
    }
    extWs.isAlive = false;
    extWs.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
});

server.listen(PORT, HOST, () => {
  console.log(`[beamdrop] signaling server listening on http://${HOST}:${PORT}`);
});
