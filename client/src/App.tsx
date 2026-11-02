import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { PeerRadar } from './components/PeerRadar';
import { SelfBar } from './components/SelfBar';
import { FileTransferModal } from './components/FileTransferModal';
import { SendTextModal, ReceivedTextModal } from './components/TextShareModal';
import { AboutModal } from './components/AboutModal';
import { useSignaling } from './hooks/useSignaling';
import { useWebRTC } from './hooks/useWebRTC';
import { useI18n } from './i18n';
import type { Peer } from './types';

export const App: React.FC = () => {
  const { t } = useI18n();
  const [targetTextPeer, setTargetTextPeer] = useState<Peer | null>(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isGlobalDragging, setIsGlobalDragging] = useState(false);

  // Signaling setup
  const { self, peers, connected, sendSignal, updateName } = useSignaling((sender, payload) => {
    handleSignal(sender, payload);
  });

  // WebRTC setup
  const {
    activeTransfer,
    incomingText,
    handleSignal,
    sendFile,
    sendText,
    cancelTransfer,
    dismissTransfer,
    dismissText
  } = useWebRTC({
    self,
    sendSignal
  });

  const handleGlobalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsGlobalDragging(true);
  };

  const handleGlobalDragLeave = (e: React.DragEvent) => {
    if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
      setIsGlobalDragging(false);
    }
  };

  const handleGlobalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsGlobalDragging(false);

    if (peers.length === 1 && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      sendFile(peers[0], e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      onDragOver={handleGlobalDragOver}
      onDragLeave={handleGlobalDragLeave}
      onDrop={handleGlobalDrop}
      className="min-h-screen flex flex-col justify-between selection:bg-cyan-500/20 selection:text-cyan-200 relative overflow-hidden"
    >
      <Navbar
        connected={connected}
        peerCount={peers.length}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      <main className="flex-1 flex flex-col items-center justify-center w-full">
        <PeerRadar
          peers={peers}
          onSendFile={sendFile}
          onRequestTextSend={(peer) => setTargetTextPeer(peer)}
        />
      </main>

      <SelfBar self={self} onUpdateName={updateName} />

      {/* Global Drag Overlay */}
      {isGlobalDragging && peers.length > 0 && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md border-4 border-dashed border-cyan-500 flex flex-col items-center justify-center pointer-events-none animate-fade-in">
          <div className="text-center p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">{t.globalDropTitle}</h3>
            <p className="text-sm text-cyan-400">
              {peers.length === 1
                ? t.globalDropSingle(peers[0].name)
                : t.globalDropMulti}
            </p>
          </div>
        </div>
      )}

      {/* Modals */}
      <FileTransferModal
        transfer={activeTransfer}
        onCancel={cancelTransfer}
        onDismiss={dismissTransfer}
      />

      <SendTextModal
        targetPeer={targetTextPeer}
        onSend={sendText}
        onClose={() => setTargetTextPeer(null)}
      />

      <ReceivedTextModal
        message={incomingText}
        onClose={dismissText}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
    </div>
  );
};
