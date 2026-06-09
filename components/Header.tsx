
import React from 'react';
import { Icon } from './Icon';

interface HeaderProps {
  language: 'ja' | 'en';
  statusLabel: string;
  workspaceLabel: string;
  onToggleLanguage: () => void;
  onOpenApiKeyModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  language, 
  statusLabel, 
  workspaceLabel, 
  onToggleLanguage,
  onOpenApiKeyModal
}) => {
  return (
    <header className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6 z-30 shadow-md">
      <div className="flex items-center gap-3">
        <div className="bg-zinc-800 p-1.5 rounded border border-zinc-700 text-zinc-400 shadow-inner">
          <Icon name="PencilLine" size={18} />
        </div>
        <h1 className="font-bold text-base tracking-[0.3em] text-zinc-100">TS-Scetch-AI</h1>
      </div>
      <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
        <button 
          onClick={onOpenApiKeyModal}
          className="flex items-center gap-2 px-3 py-1 bg-amber-950/20 border border-amber-900/30 text-amber-500 hover:text-amber-400 hover:border-amber-500 hover:bg-amber-950/40 transition-all rounded-sm"
          title="API Key Settings"
        >
          <Icon name="Key" size={12} />
          <span>API KEY</span>
        </button>
        <button 
          onClick={onToggleLanguage}
          className="flex items-center gap-2 px-3 py-1 bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors rounded-sm"
        >
          <Icon name="Languages" size={14} />
          <span className="font-bold">{language === 'ja' ? 'ENGLISH' : '日本語'}</span>
        </button>
        <div className="h-3 w-px bg-zinc-800" />
        <span className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-900/50 border border-emerald-500/30 animate-pulse"/> {statusLabel}
        </span>
        <div className="h-3 w-px bg-zinc-800" />
        <button className="hover:text-zinc-200 transition-colors uppercase">{workspaceLabel}</button>
      </div>
    </header>
  );
};
