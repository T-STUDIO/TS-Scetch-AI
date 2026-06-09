
import React from 'react';
import { Icon } from './Icon';

interface ProcessingOverlayProps {
  title: string;
  message: string;
}

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ title, message }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center">
      <div className="bg-zinc-900 p-12 rounded border border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center gap-8 max-w-sm text-center">
        <div className="relative">
          <div className="w-16 h-16 border-2 border-zinc-800 border-t-zinc-400 rounded-full animate-spin" />
          <Icon name="Cpu" size={24} className="absolute inset-0 m-auto text-zinc-600" />
        </div>
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-zinc-100 uppercase tracking-[0.4em]">{title}</h3>
          <p className="text-[10px] text-zinc-500 leading-relaxed uppercase tracking-[0.2em]">{message}</p>
        </div>
      </div>
    </div>
  );
};
