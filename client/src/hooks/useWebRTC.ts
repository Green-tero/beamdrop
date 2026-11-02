import { useRef, useCallback, useState, useEffect } from 'react';
import type { FileMetadata, FileTransferProgress, Peer, TextShareMessage } from '../types';
import { CHUNK_SIZE, BUFFER_THRESHOLD, createFileMetadata, triggerDownload } from '../utils/chunker';
import { playCompleteSound, playMessageSound } from '../utils/sound';

interface SignalPayload {
  description?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

interface WebRTCOptions {
  self: Peer | null;
  sendSignal: (target: string, payload: unknown) => void;
  onTextReceived?: (msg: TextShareMessage) => void;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ]
};

export function useWebRTC({ self, sendSignal, onTextReceived }: WebRTCOptions) {
  const [activeTransfer, setActiveTransfer] = useState<FileTransferProgress | null>(null);
  const [incomingText, setIncomingText] = useState<TextShareMessage | null>(null);

  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const dataChannels = useRef<Map<string, RTCDataChannel>>(new Map());
  const iceCandidateQueues = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  // Buffer incoming chunks for active receiver transfers
  const receivingFileRef = useRef<{
    metadata: FileMetadata;
    peerId: string;
    peerName: string;
    chunks: ArrayBuffer[];
    bytesReceived: number;
    startTime: number;
    lastTickTime: number;
    lastTickBytes: number;
  } | null>(null);

  // Cancellation controller for sending transfers
  const abortSendRef = useRef<boolean>(false);

  const cleanPeerConnection = useCallback((peerId: string) => {
    const dc = dataChannels.current.get(peerId);
    if (dc) {
      dc.close();
      dataChannels.current.delete(peerId);
    }

    const pc = peerConnections.current.get(peerId);
    if (pc) {
      pc.close();
      peerConnections.current.delete(peerId);
    }

    iceCandidateQueues.current.delete(peerId);
  }, []);

  const setupDataChannelEvents = useCallback((peerId: string, channel: RTCDataChannel) => {
    channel.binaryType = 'arraybuffer';
    // Backpressure event threshold
    channel.bufferedAmountLowThreshold = BUFFER_THRESHOLD / 2;

    channel.onmessage = (event) => {
      // Text / Control messages are stringified JSON
      if (typeof event.data === 'string') {
        try {
          const payload = JSON.parse(event.data);

          if (payload.type === 'file-start') {
            const meta = payload.metadata as FileMetadata;
            receivingFileRef.current = {
              metadata: meta,
              peerId,
              peerName: payload.senderName || 'Peer',
              chunks: [],
              bytesReceived: 0,
              startTime: performance.now(),
              lastTickTime: performance.now(),
              lastTickBytes: 0
            };

            setActiveTransfer({
              transferId: meta.transferId,
              fileName: meta.name,
              fileSize: meta.size,
              direction: 'receive',
              peerId,
              peerName: payload.senderName || 'Peer',
              bytesTransferred: 0,
              percentage: 0,
              status: 'transferring',
              speed: 0
            });
          } else if (payload.type === 'text') {
            const textMsg: TextShareMessage = {
              id: payload.id || crypto.randomUUID(),
              text: payload.text,
              peerId,
              peerName: payload.senderName || 'Peer',
              timestamp: payload.timestamp || Date.now()
            };
            playMessageSound();
            setIncomingText(textMsg);
            if (onTextReceived) onTextReceived(textMsg);
          } else if (payload.type === 'cancel-transfer') {
            receivingFileRef.current = null;
            setActiveTransfer((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
          }
        } catch {
          // Ignore invalid JSON payloads
        }
        return;
      }

      // Binary payload: incoming file chunk
      if (event.data instanceof ArrayBuffer && receivingFileRef.current) {
        const state = receivingFileRef.current;
        state.chunks.push(event.data);
        state.bytesReceived += event.data.byteLength;

        const now = performance.now();
        const timeDiff = (now - state.lastTickTime) / 1000;
        let currentSpeed = 0;

        if (timeDiff >= 0.3) {
          currentSpeed = (state.bytesReceived - state.lastTickBytes) / timeDiff;
          state.lastTickTime = now;
          state.lastTickBytes = state.bytesReceived;
        }

        const percentage = Math.min(100, Math.round((state.bytesReceived / state.metadata.size) * 100));

        setActiveTransfer((prev) =>
          prev
            ? {
                ...prev,
                bytesTransferred: state.bytesReceived,
                percentage,
                speed: currentSpeed || prev.speed
              }
            : null
        );

        if (state.bytesReceived >= state.metadata.size) {
          triggerDownload(state.chunks, state.metadata);
          playCompleteSound();
          playCompleteSound();
      setActiveTransfer((prev) => (prev ? { ...prev, percentage: 100, status: 'completed' } : null));
          receivingFileRef.current = null;
        }
      }
    };

    channel.onclose = () => {
      dataChannels.current.delete(peerId);
    };

    channel.onerror = () => {
      setActiveTransfer((prev) =>
        prev && prev.peerId === peerId
          ? { ...prev, status: 'error', errorMessage: 'Data channel error' }
          : prev
      );
    };
  }, [onTextReceived]);

  const getOrCreatePeerConnection = useCallback((peerId: string): RTCPeerConnection => {
    let pc = peerConnections.current.get(peerId);
    if (pc && pc.connectionState !== 'closed' && pc.connectionState !== 'failed') {
      return pc;
    }

    pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnections.current.set(peerId, pc);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal(peerId, { candidate: event.candidate.toJSON() });
      }
    };

    pc.ondatachannel = (event) => {
      const channel = event.channel;
      dataChannels.current.set(peerId, channel);
      setupDataChannelEvents(peerId, channel);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        cleanPeerConnection(peerId);
      }
    };

    return pc;
  }, [sendSignal, setupDataChannelEvents, cleanPeerConnection]);

  const handleSignal = useCallback(async (senderId: string, rawPayload: unknown) => {
    const payload = rawPayload as SignalPayload;
    const pc = getOrCreatePeerConnection(senderId);

    if (payload.description) {
      await pc.setRemoteDescription(new RTCSessionDescription(payload.description));

      // Flush queued ICE candidates after setting remote description
      const queue = iceCandidateQueues.current.get(senderId) || [];
      for (const cand of queue) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch {
          // Ignore stale candidate
        }
      }
      iceCandidateQueues.current.delete(senderId);

      if (payload.description.type === 'offer') {
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendSignal(senderId, { description: pc.localDescription?.toJSON() });
      }
    } else if (payload.candidate) {
      if (pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch {
          // Ignore stale candidate
        }
      } else {
        const queue = iceCandidateQueues.current.get(senderId) || [];
        queue.push(payload.candidate);
        iceCandidateQueues.current.set(senderId, queue);
      }
    }
  }, [getOrCreatePeerConnection, sendSignal]);

  const ensureDataChannel = useCallback(async (targetPeer: Peer): Promise<RTCDataChannel> => {
    const existing = dataChannels.current.get(targetPeer.id);
    if (existing && existing.readyState === 'open') {
      return existing;
    }

    const pc = getOrCreatePeerConnection(targetPeer.id);
    const channel = pc.createDataChannel('beamdrop-data', { ordered: true });
    dataChannels.current.set(targetPeer.id, channel);
    setupDataChannelEvents(targetPeer.id, channel);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendSignal(targetPeer.id, { description: pc.localDescription?.toJSON() });

    return new Promise((resolve, reject) => {
      if (channel.readyState === 'open') {
        resolve(channel);
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Connection timed out while opening data channel'));
      }, 10000);

      channel.onopen = () => {
        clearTimeout(timeout);
        resolve(channel);
      };

      channel.onerror = (err) => {
        clearTimeout(timeout);
        reject(err);
      };
    });
  }, [getOrCreatePeerConnection, setupDataChannelEvents, sendSignal]);

  const sendFile = useCallback(async (targetPeer: Peer, file: File) => {
    try {
      abortSendRef.current = false;
      const metadata = createFileMetadata(file);

      setActiveTransfer({
        transferId: metadata.transferId,
        fileName: metadata.name,
        fileSize: metadata.size,
        direction: 'send',
        peerId: targetPeer.id,
        peerName: targetPeer.name,
        bytesTransferred: 0,
        percentage: 0,
        status: 'pending',
        speed: 0
      });

      const channel = await ensureDataChannel(targetPeer);

      // Announce transfer start
      channel.send(JSON.stringify({
        type: 'file-start',
        metadata,
        senderName: self?.name || 'Peer'
      }));

      setActiveTransfer((prev) => (prev ? { ...prev, status: 'transferring' } : null));

      let offset = 0;
      let lastTickTime = performance.now();
      let lastTickBytes = 0;

      while (offset < file.size) {
        if (abortSendRef.current) {
          channel.send(JSON.stringify({ type: 'cancel-transfer' }));
          setActiveTransfer((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
          return;
        }

        // WebRTC backpressure check: wait if the internal SCTP buffer is saturated
        if (channel.bufferedAmount > BUFFER_THRESHOLD) {
          await new Promise<void>((resolve) => {
            const onLow = () => {
              channel.removeEventListener('bufferedamountlow', onLow);
              resolve();
            };
            channel.addEventListener('bufferedamountlow', onLow);
          });
        }

        const slice = file.slice(offset, offset + CHUNK_SIZE);
        const buffer = await slice.arrayBuffer();
        channel.send(buffer);

        offset += buffer.byteLength;

        const now = performance.now();
        const elapsedSec = (now - lastTickTime) / 1000;
        let speed = 0;

        if (elapsedSec >= 0.25) {
          speed = (offset - lastTickBytes) / elapsedSec;
          lastTickTime = now;
          lastTickBytes = offset;
        }

        const percentage = Math.min(100, Math.round((offset / file.size) * 100));

        setActiveTransfer((prev) =>
          prev
            ? {
                ...prev,
                bytesTransferred: offset,
                percentage,
                speed: speed || prev.speed
              }
            : null
        );
      }

      playCompleteSound();
      setActiveTransfer((prev) => (prev ? { ...prev, percentage: 100, status: 'completed' } : null));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Transfer failed';
      setActiveTransfer((prev) => (prev ? { ...prev, status: 'error', errorMessage: msg } : null));
    }
  }, [ensureDataChannel, self]);

  const sendText = useCallback(async (targetPeer: Peer, text: string) => {
    const channel = await ensureDataChannel(targetPeer);
    const msg: TextShareMessage = {
      id: crypto.randomUUID(),
      text,
      peerId: self?.id || '',
      peerName: self?.name || 'Peer',
      timestamp: Date.now()
    };

    channel.send(JSON.stringify({
      type: 'text',
      ...msg
    }));
  }, [ensureDataChannel, self]);

  const cancelTransfer = useCallback(() => {
    abortSendRef.current = true;
    setActiveTransfer((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
  }, []);

  const dismissTransfer = useCallback(() => {
    setActiveTransfer(null);
  }, []);

  const dismissText = useCallback(() => {
    setIncomingText(null);
  }, []);

  useEffect(() => {
    return () => {
      peerConnections.current.forEach((pc) => pc.close());
      peerConnections.current.clear();
      dataChannels.current.clear();
    };
  }, []);

  return {
    activeTransfer,
    incomingText,
    handleSignal,
    sendFile,
    sendText,
    cancelTransfer,
    dismissTransfer,
    dismissText
  };
}
