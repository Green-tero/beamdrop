import React from 'react';
import { Github, Info, Zap } from 'lucide-react';

interface NavbarProps {
  connected: boolean;
  peerCount: number;
  onOpenAbout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ connected, peerCount, onOpenAbout }) => {
  return (
    <header className="w-full max-w-6xl mx-auto px-4 py-4 flex items-center justify-between z-20 relative">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Zap className="h-5 w-5 text-white fill-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-white">BeamDrop</span>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              P2P
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">Instant peer-to-peer sharing</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 backdrop-blur-md text-xs">
          <span className="relative flex h-2 w-2">
            {connected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                connected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
              }`}
            ></span>
          </span>
          <span className="text-slate-300 font-medium">
            {connected ? `${peerCount} ${peerCount === 1 ? 'peer' : 'peers'} online` : 'Connecting...'}
          </span>
        </div>

        <button
          onClick={onOpenAbout}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          title="About BeamDrop"
          aria-label="About"
        >
          <Info className="h-5 w-5" />
        </button>

        <a
          href="https://github.com/Green-tero/beamdrop"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          title="View GitHub Repository"
          aria-label="GitHub"
        >
          <Github className="h-5 w-5" />
        </a>
      </div>
    </header>
  );
};
