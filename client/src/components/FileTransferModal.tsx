import React from 'react';
import { ArrowUpRight, ArrowDownLeft, FileText, CheckCircle2, AlertCircle, XCircle, X } from 'lucide-react';
import type { FileTransferProgress } from '../types';
import { formatBytes, formatSpeed } from '../utils/chunker';
import { useI18n } from '../i18n';

interface FileTransferModalProps {
  transfer: FileTransferProgress | null;
  onCancel: () => void;
  onDismiss: () => void;
}

export const FileTransferModal: React.FC<FileTransferModalProps> = ({
  transfer,
  onCancel,
  onDismiss
}) => {
  const { t } = useI18n();

  if (!transfer) return null;

  const isSending = transfer.direction === 'send';
  const isFinished = transfer.status === 'completed' || transfer.status === 'cancelled' || transfer.status === 'error';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div
          className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
            transfer.status === 'completed'
              ? 'bg-emerald-500/20'
              : transfer.status === 'error'
              ? 'bg-red-500/20'
              : 'bg-cyan-500/20'
          }`}
        />

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                isSending ? 'bg-cyan-500/10 text-cyan-400' : 'bg-blue-500/10 text-blue-400'
              }`}
            >
              {isSending ? (
                <ArrowUpRight className="h-5 w-5" />
              ) : (
                <ArrowDownLeft className="h-5 w-5" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">
                {isSending ? t.sendingFile : t.receivingFile}
              </h3>
              <p className="text-xs text-slate-400">
                {isSending ? t.toPeer(transfer.peerName) : t.fromPeer(transfer.peerName)}
              </p>
            </div>
          </div>

          {isFinished && (
            <button
              onClick={onDismiss}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* File Card Info */}
        <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 mb-5">
          <div className="p-2.5 rounded-xl bg-slate-700/60 text-slate-300">
            <FileText className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-slate-200 text-sm truncate dir-ltr text-left" title={transfer.fileName}>
              {transfer.fileName}
            </div>
            <div className="text-xs text-slate-400 mt-0.5 dir-ltr text-left">
              {formatBytes(transfer.bytesTransferred)} / {formatBytes(transfer.fileSize)}
            </div>
          </div>
        </div>

        {/* Progress and status */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              {transfer.status === 'transferring' && (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                  <span>{t.transferringAt} {formatSpeed(transfer.speed)}</span>
                </>
              )}
              {transfer.status === 'pending' && t.connectingToPeer}
              {transfer.status === 'completed' && (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {t.transferComplete}
                </span>
              )}
              {transfer.status === 'cancelled' && (
                <span className="text-amber-400 flex items-center gap-1">
                  <XCircle className="h-3.5 w-3.5" /> {t.transferCancelled}
                </span>
              )}
              {transfer.status === 'error' && (
                <span className="text-rose-400 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> {transfer.errorMessage || t.transferError}
                </span>
              )}
            </span>
            <span className="font-mono font-semibold text-slate-200 text-sm dir-ltr">
              {transfer.percentage}%
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-200 ${
                transfer.status === 'completed'
                  ? 'bg-emerald-500'
                  : transfer.status === 'error'
                  ? 'bg-rose-500'
                  : transfer.status === 'cancelled'
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500'
              }`}
              style={{ width: `${Math.max(2, transfer.percentage)}%` }}
            />
          </div>
        </div>

        {/* Action button */}
        <div className="flex justify-end gap-3">
          {!isFinished ? (
            <button
              onClick={onCancel}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
            >
              {t.cancelTransfer}
            </button>
          ) : (
            <button
              onClick={onDismiss}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors shadow-lg shadow-cyan-500/20"
            >
              {t.done}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
