import React, { useState } from 'react';
import { Monitor, Smartphone, Tablet, Laptop, Send, MessageSquare, HardDriveDownload } from 'lucide-react';
import type { Peer } from '../types';
import { useI18n } from '../i18n';

interface PeerCardProps {
  peer: Peer;
  onSendFile: (peer: Peer, file: File) => void;
  onRequestTextSend: (peer: Peer) => void;
}

export const PeerCard: React.FC<PeerCardProps> = ({ peer, onSendFile, onRequestTextSend }) => {
  const { t } = useI18n();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const getDeviceIcon = () => {
    switch (peer.device.type) {
      case 'mobile':
        return <Smartphone className="h-6 w-6 text-cyan-400" />;
      case 'tablet':
        return <Tablet className="h-6 w-6 text-violet-400" />;
      default:
        return peer.device.os.includes('mac') ? (
          <Laptop className="h-6 w-6 text-sky-400" />
        ) : (
          <Monitor className="h-6 w-6 text-cyan-400" />
        );
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onSendFile(peer, e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onSendFile(peer, e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`group relative flex flex-col items-center justify-between p-5 rounded-2xl border transition-all duration-300 w-64 bg-slate-900/60 backdrop-blur-xl ${
        isDragOver
          ? 'border-cyan-400 bg-cyan-950/40 scale-105 shadow-xl shadow-cyan-500/20'
          : 'border-slate-800/80 hover:border-slate-700 hover:shadow-lg hover:shadow-cyan-500/5 hover:-translate-y-1'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Pulsing indicator when hovering or dropping */}
      <div className="relative mb-3 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-md group-hover:bg-cyan-500/30 transition-all" />
        <div className="relative h-16 w-16 rounded-full bg-slate-800/80 border border-slate-700/80 flex items-center justify-center shadow-inner">
          {getDeviceIcon()}
        </div>
      </div>

      <div className="text-center w-full mb-4">
        <h3 className="font-semibold text-slate-100 text-base tracking-wide truncate max-w-full">
          {peer.name}
        </h3>
        <p className="text-xs text-slate-400 mt-0.5 truncate dir-ltr">
          {peer.device.os} · {peer.device.browser}
        </p>
      </div>

      <div className="flex items-center gap-2 w-full">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-300 text-xs font-medium transition-colors"
          title={t.sendFile}
        >
          <Send className="h-3.5 w-3.5" />
          <span>{t.sendFile}</span>
        </button>

        <button
          onClick={() => onRequestTextSend(peer)}
          className="flex items-center justify-center p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
          title={t.sendText}
          aria-label={t.sendText}
        >
          <MessageSquare className="h-4 w-4" />
        </button>
      </div>

      {isDragOver && (
        <div className="absolute inset-0 rounded-2xl bg-cyan-950/80 border-2 border-dashed border-cyan-400 flex flex-col items-center justify-center text-cyan-200 z-10 animate-fade-in pointer-events-none">
          <HardDriveDownload className="h-8 w-8 mb-2 animate-bounce" />
          <span className="text-xs font-semibold">{t.dropToSend}</span>
        </div>
      )}
    </div>
  );
};
