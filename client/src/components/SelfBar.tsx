import React, { useState } from 'react';
import { Edit2, Check, Monitor, Smartphone, Tablet, Laptop } from 'lucide-react';
import type { Peer } from '../types';
import { useI18n } from '../i18n';

interface SelfBarProps {
  self: Peer | null;
  onUpdateName: (name: string) => void;
}

export const SelfBar: React.FC<SelfBarProps> = ({ self, onUpdateName }) => {
  const { t } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');

  if (!self) return null;

  const handleStartEdit = () => {
    setNameInput(self.name);
    setIsEditing(true);
  };

  const handleSave = () => {
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== self.name) {
      onUpdateName(trimmed);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') setIsEditing(false);
  };

  const getDeviceIcon = () => {
    switch (self.device.type) {
      case 'mobile':
        return <Smartphone className="h-4 w-4 text-cyan-400" />;
      case 'tablet':
        return <Tablet className="h-4 w-4 text-violet-400" />;
      default:
        return self.device.os.includes('mac') ? (
          <Laptop className="h-4 w-4 text-sky-400" />
        ) : (
          <Monitor className="h-4 w-4 text-cyan-400" />
        );
    }
  };

  return (
    <footer className="w-full max-w-lg mx-auto pb-6 px-4 z-20">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
            {getDeviceIcon()}
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">
              {t.youAreKnownAs}
            </span>

            {isEditing ? (
              <div className="flex items-center gap-2 mt-0.5">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={32}
                  autoFocus
                  className="bg-slate-800 border border-cyan-500/50 rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
                <button
                  onClick={handleSave}
                  className="p-1 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30"
                >
                  <Check className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-100">{self.name}</span>
                <button
                  onClick={handleStartEdit}
                  className="text-slate-500 hover:text-slate-300 transition-colors p-0.5"
                  title={t.rename}
                >
                  <Edit2 className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="text-right sm:text-right">
          <span className="text-xs text-slate-400 block font-medium dir-ltr">
            {self.device.os}
          </span>
          <span className="text-[11px] text-slate-500 dir-ltr">
            {self.device.browser}
          </span>
        </div>
      </div>
    </footer>
  );
};
