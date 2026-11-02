import React from 'react';
import { Github, Info, Zap, Languages } from 'lucide-react';
import { useI18n } from '../i18n';

interface NavbarProps {
  connected: boolean;
  peerCount: number;
  onOpenAbout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ connected, peerCount, onOpenAbout }) => {
  const { lang, toggleLang, t } = useI18n();

  return (
    <header className="w-full max-w-6xl mx-auto px-4 py-4 flex items-center justify-between z-20 relative">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Zap className="h-5 w-5 text-white fill-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-white">{t.appTitle}</span>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {t.p2pBadge}
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">{t.tagline}</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Status pill */}
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
            {connected ? t.peersOnline(peerCount) : t.connecting}
          </span>
        </div>

        {/* Language switcher button */}
        <button
          onClick={toggleLang}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-cyan-400 transition-colors"
          title={lang === 'en' ? 'تغییر زبان به فارسی' : 'Switch to English'}
        >
          <Languages className="h-3.5 w-3.5 text-cyan-400" />
          <span className="uppercase text-[11px] tracking-wider">{lang === 'en' ? 'FA' : 'EN'}</span>
        </button>

        {/* About button */}
        <button
          onClick={onOpenAbout}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          title={t.about}
          aria-label={t.about}
        >
          <Info className="h-5 w-5" />
        </button>

        {/* GitHub link */}
        <a
          href="https://github.com/Green-tero/beamdrop"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          title={t.viewGithub}
          aria-label="GitHub"
        >
          <Github className="h-5 w-5" />
        </a>
      </div>
    </header>
  );
};
