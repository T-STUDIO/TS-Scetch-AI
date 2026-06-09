
import React, { useState } from 'react';
import { Icon } from './Icon.tsx';
import { useSpeechInput } from '../hooks/useSpeechInput.ts';

interface SidebarRightProps {
  language: 'ja' | 'en';
  selectedStyles: string[];
  onToggleStyle: (style: string) => void;
  onAddStyle: (style: string) => void;
}

const STYLE_MAP: Record<string, { ja: string; en: string }> = {
  '漫画風': { ja: '漫画風', en: 'Manga' },
  'ファンシー': { ja: 'ファンシー', en: 'Fancy' },
  'カジュアル': { ja: 'カジュアル', en: 'Casual' },
  'ポップ': { ja: 'ポップ', en: 'Pop' },
  '劇画風': { ja: '劇画風', en: 'Gekiga' },
  'ノスタルジー': { ja: 'ノスタルジー', en: 'Nostalgic' },
  'テクニカル': { ja: 'テクニカル', en: 'Technical' },
  '細密': { ja: '細密', en: 'Detailed' },
  'パース': { ja: 'パース', en: 'Perspective' },
};

const STYLES = Object.keys(STYLE_MAP);

export const SidebarRight: React.FC<SidebarRightProps> = ({ language, selectedStyles, onToggleStyle, onAddStyle }) => {
  const { isListening, startListening } = useSpeechInput();
  const [manualText, setManualText] = useState('');

  const handleVoiceInput = () => {
    startListening((text) => {
      onAddStyle(text);
    });
  };

  const handleAddManual = () => {
    if (manualText.trim()) {
      onAddStyle(manualText.trim());
      setManualText('');
    }
  };

  const labels = {
    title: language === 'ja' ? '作画タッチ' : 'Artistic Styles',
    placeholder: language === 'ja' ? 'タッチを追加...' : 'Add custom style...',
    voice: language === 'ja' ? '音声入力' : 'Voice Input',
    listening: language === 'ja' ? '聴取中' : 'Listening',
  };

  return (
    <div className="w-64 bg-zinc-900 border-l border-zinc-800 h-full flex flex-col p-6 z-10">
      <h2 className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
        <Icon name="Palette" size={12} className="opacity-60" /> {labels.title}
      </h2>
      
      <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {STYLES.map((key) => {
          const item = STYLE_MAP[key];
          const isSelected = selectedStyles.includes(key);
          return (
            <button
              key={key}
              onClick={() => onToggleStyle(key)}
              className={`w-full text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-all border ${
                isSelected
                  ? 'bg-emerald-900/40 border-emerald-500/40 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.15)] -translate-x-1'
                  : 'bg-zinc-800/40 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
              }`}
            >
              {item[language]}
            </button>
          );
        })}

        {selectedStyles.filter(i => !STYLES.includes(i)).map((style) => (
          <button
            key={style}
            onClick={() => onToggleStyle(style)}
            className="w-full text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-all border bg-emerald-950/40 border-emerald-800 text-emerald-300 flex justify-between items-center group"
          >
            {style}
            <Icon name="X" size={12} className="opacity-30 group-hover:opacity-100 text-emerald-400" />
          </button>
        ))}
      </div>

      <div className="mt-8 pt-8 border-t border-zinc-800 space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={labels.placeholder}
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddManual()}
            className="flex-1 text-[10px] bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-none px-3 py-2.5 focus:border-emerald-700 outline-none transition-all placeholder:text-zinc-800 font-bold uppercase"
          />
          <button 
            onClick={handleAddManual}
            className="p-2 bg-zinc-800 text-zinc-400 hover:bg-emerald-900/50 hover:text-emerald-200 transition-colors"
          >
            <Icon name="Plus" size={14} />
          </button>
        </div>
        <button
          onClick={handleVoiceInput}
          className={`w-full py-3 rounded-none flex items-center justify-center gap-3 transition-all border font-bold uppercase tracking-[0.2em] ${
            isListening ? 'bg-red-950 text-red-400 border-red-900 animate-pulse' : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:bg-emerald-900/30 hover:border-emerald-800/50 hover:text-emerald-300 shadow-sm'
          }`}
        >
          <Icon name="Mic" size={14} />
          <span className="text-[9px] tracking-widest">{isListening ? labels.listening : labels.voice}</span>
        </button>
      </div>
    </div>
  );
};
