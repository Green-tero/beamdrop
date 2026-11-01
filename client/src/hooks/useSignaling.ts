import { useState, useEffect, useRef, useCallback } from 'react';
import type { Peer } from '../types';

interface ServerMessage {
  type: string;
  peer?: Peer;
  peers?: Peer[];
  peerId?: string;
  sender?: string;
  payload?: unknown;
  message?: string;
}

export function useSignaling(onSignalReceived?: (sender: string, payload: unknown) => void) {
  const [self, setSelf] = useState<Peer | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [connected, setConnected] = useState<boolean>(false);

  const socketRef = useRef<WebSocket | null>(null);
  const signalCallbackRef = useRef(onSignalReceived);
  const reconnectTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    signalCallbackRef.current = onSignalReceived;
  }, [onSignalReceived]);

  const connect = useCallback(() => {
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // In dev mode with Vite proxy or direct port 3000
    const host = window.location.port === '5173'
      ? `${window.location.hostname}:3000`
      : window.location.host;

    const ws = new WebSocket(`${protocol}//${host}`);
    socketRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as ServerMessage;

        switch (msg.type) {
          case 'init':
            if (msg.peer) setSelf(msg.peer);
            if (msg.peers) setPeers(msg.peers);
            break;

          case 'peer-joined':
            if (msg.peer) {
              setPeers((prev) => {
                const exists = prev.some((p) => p.id === msg.peer!.id);
                return exists ? prev : [...prev, msg.peer!];
              });
            }
            break;

          case 'peer-left':
            if (msg.peerId) {
              setPeers((prev) => prev.filter((p) => p.id !== msg.peerId));
            }
            break;

          case 'peer-updated':
            if (msg.peer) {
              setPeers((prev) => prev.map((p) => (p.id === msg.peer!.id ? msg.peer! : p)));
            }
            break;

          case 'signal':
            if (msg.sender && msg.payload && signalCallbackRef.current) {
              signalCallbackRef.current(msg.sender, msg.payload);
            }
            break;

          default:
            break;
        }
      } catch {
        // Discard malformed signaling frames
      }
    };

    ws.onclose = () => {
      setConnected(false);
      socketRef.current = null;
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connect();
      }, 2500);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const sendSignal = useCallback((target: string, payload: unknown) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'signal',
        target,
        payload
      }));
    }
  }, []);

  const updateName = useCallback((newName: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'rename',
        name: newName
      }));
      setSelf((prev) => (prev ? { ...prev, name: newName } : null));
    }
  }, []);

  return {
    self,
    peers,
    connected,
    sendSignal,
    updateName
  };
}
