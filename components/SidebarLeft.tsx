
import React, { useState } from 'react';
import { Icon } from './Icon.tsx';
import { useSpeechInput } from '../hooks/useSpeechInput.ts';

interface SidebarLeftProps {
  language: 'ja' | 'en';
  selectedItems: string[];
  onToggleItem: (item: string) => void;
  onAddItem: (item: string) => void;
}

const PRESET_MAP: Record<string, { ja: string; en: string }> = {
  '人物': { ja: '人物', en: 'Person' },
  '動物': { ja: '動物', en: 'Animal' },
  '建物': { ja: '建物', en: 'Building' },
  '木': { ja: '木', en: 'Tree' },
  '空': { ja: '空', en: 'Sky' },
  '海': { ja: '海', en: 'Sea' },
  '車': { ja: '車', en: 'Car' },
  'バイク': { ja: 'バイク', en: 'Motorcycle' },
  '自転車': { ja: '自転車', en: 'Bicycle' },
  '船': { ja: '船', en: 'Boat' },
};

const PRESETS = Object.keys(PRESET_MAP);

export const SidebarLeft: React.FC<SidebarLeftProps> = ({ language, selectedItems, onToggleItem, onAddItem }) => {
  const { isListening, startListening } = useSpeechInput();
  const [manualText, setManualText] = useState('');

  const handleVoiceInput = () => {
    startListening((text) => {
      onAddItem(text);
    });
  };

  const handleAddManual = () => {
    if (manualText.trim()) {
      onAddItem(manualText.trim());
      setManualText('');
    }
  };

  const labels = {
    title: language === 'ja' ? '抽出項目' : 'Extraction Area',
    placeholder: language === 'ja' ? '項目を追加...' : 'Add custom item...',
    voice: language === 'ja' ? '音声入力' : 'Voice Input',
    listening: language === 'ja' ? '聴取中' : 'Listening',
  };

  return (
    <div className="w-64 bg-zinc-900 border-r border-zinc-800 h-full flex flex-col p-6 z-10">
      <h2 className="text-[10px] font-bold text-indigo-500/80 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
        <Icon name="Target" size={12} className="opacity-60" /> {labels.title}
      </h2>
      
      <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {PRESETS.map((key) => {
          const item = PRESET_MAP[key];
          const isSelected = selectedItems.includes(key);
          return (
            <button
              key={key}
              onClick={() => onToggleItem(key)}
              className={`w-full text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-all border ${
                isSelected
                  ? 'bg-indigo-900/50 border-indigo-500/40 text-indigo-100 shadow-[0_0_15px_rgba(99,102,241,0.2)] translate-x-1'
                  : 'bg-zinc-800/40 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
              }`}
            >
              {item[language]}
            </button>
          );
        })}
        
        {selectedItems.filter(i => !PRESETS.includes(i)).map((item) => (
          <button
            key={item}
            onClick={() => onToggleItem(item)}
            className="w-full text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-all border bg-indigo-950/40 border-indigo-800 text-indigo-300 flex justify-between items-center group"
          >
            {item}
            <Icon name="X" size={12} className="opacity-30 group-hover:opacity-100 text-indigo-400" />
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
            className="flex-1 text-[10px] bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-none px-3 py-2.5 focus:border-indigo-700 outline-none transition-all placeholder:text-zinc-800 font-bold uppercase"
          />
          <button 
            onClick={handleAddManual}
            className="p-2 bg-zinc-800 text-zinc-400 hover:bg-indigo-900/50 hover:text-indigo-200 transition-colors"
          >
            <Icon name="Plus" size={14} />
          </button>
        </div>
        <button
          onClick={handleVoiceInput}
          className={`w-full py-3 rounded-none flex items-center justify-center gap-3 transition-all border font-bold uppercase tracking-[0.2em] ${
            isListening ? 'bg-red-950 text-red-400 border-red-900 animate-pulse' : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:bg-indigo-900/30 hover:border-indigo-800/50 hover:text-indigo-300 shadow-sm'
          }`}
        >
          <Icon name="Mic" size={14} />
          <span className="text-[9px] tracking-widest">{isListening ? labels.listening : labels.voice}</span>
        </button>
      </div>
    </div>
  );
};
