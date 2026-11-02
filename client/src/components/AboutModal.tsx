import React from 'react';
import { X, ShieldCheck, Zap, Lock, Network } from 'lucide-react';
import { useI18n } from '../i18n';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const { t } = useI18n();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">{t.aboutTitle}</h3>
              <p className="text-xs text-slate-400">{t.aboutSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs leading-relaxed text-slate-300">
          <p>{t.aboutIntro}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center gap-2 text-cyan-400 font-medium mb-1.5">
                <Network className="h-4 w-4" />
                <span>{t.featureZeroStorageTitle}</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {t.featureZeroStorageDesc}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center gap-2 text-emerald-400 font-medium mb-1.5">
                <Lock className="h-4 w-4" />
                <span>{t.featureE2ETitle}</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {t.featureE2EDesc}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center gap-2 text-violet-400 font-medium mb-1.5">
                <Zap className="h-4 w-4" />
                <span>{t.featureChunkingTitle}</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {t.featureChunkingDesc}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center gap-2 text-sky-400 font-medium mb-1.5">
                <ShieldCheck className="h-4 w-4" />
                <span>{t.featureDiscoveryTitle}</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {t.featureDiscoveryDesc}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            {t.gotIt}
          </button>
        </div>
      </div>
    </div>
  );
};
