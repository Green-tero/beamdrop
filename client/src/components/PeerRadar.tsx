import React from 'react';
import { Wifi, Radio, Laptop } from 'lucide-react';
import type { Peer } from '../types';
import { PeerCard } from './PeerCard';
import { useI18n } from '../i18n';

interface PeerRadarProps {
  peers: Peer[];
  onSendFile: (peer: Peer, file: File) => void;
  onRequestTextSend: (peer: Peer) => void;
}

export const PeerRadar: React.FC<PeerRadarProps> = ({ peers, onSendFile, onRequestTextSend }) => {
  const { t } = useI18n();

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center p-6 relative min-h-[460px]">
      {/* Background ambient radar glow rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="w-[320px] h-[320px] sm:w-[500px] sm:h-[500px] rounded-full border border-slate-800/60 opacity-40" />
        <div className="w-[500px] h-[500px] sm:w-[750px] sm:h-[750px] rounded-full border border-slate-800/40 opacity-30" />
        <div className="w-[700px] h-[700px] sm:w-[1000px] sm:h-[1000px] rounded-full border border-slate-800/20 opacity-20" />
        <div className="absolute w-96 h-96 bg-cyan-600/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {peers.length === 0 ? (
        <div className="relative flex flex-col items-center justify-center text-center max-w-sm z-10">
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center relative shadow-2xl">
              <div className="absolute inset-0 rounded-full border border-cyan-500/30 animate-ping opacity-30" />
              <Radio className="h-10 w-10 text-cyan-400" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-slate-100 tracking-tight">
            {t.scanningTitle}
          </h2>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            {t.scanningDesc}
          </p>

          <div className="mt-8 flex items-center gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <Wifi className="h-3.5 w-3.5 text-slate-400" />
              <span>{t.sameWifi}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Laptop className="h-3.5 w-3.5 text-slate-400" />
              <span>{t.noInstall}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">
          <div className="mb-6 text-center">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              {t.discoveredDevices(peers.length)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 place-items-center w-full">
            {peers.map((peer) => (
              <PeerCard
                key={peer.id}
                peer={peer}
                onSendFile={onSendFile}
                onRequestTextSend={onRequestTextSend}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
