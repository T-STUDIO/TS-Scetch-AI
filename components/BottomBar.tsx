
import React, { useState } from 'react';
import { IllustrationSettings, LineType, UserPreset } from '../types';
import { Icon } from './Icon';
import { useSpeechInput } from '../hooks/useSpeechInput';

interface BottomBarProps {
  language: 'ja' | 'en';
  settings: IllustrationSettings;
  onUpdateSettings: (settings: Partial<IllustrationSettings>) => void;
  onExecute: () => void;
  onExport: () => void;
  onSavePreset: (name: string) => void;
  onLoadPreset: (preset: UserPreset) => void;
  userPresets: UserPreset[];
  isProcessing: boolean;
  cooldown?: number;
}

export const BottomBar: React.FC<BottomBarProps> = ({ 
  language,
  settings, 
  onUpdateSettings, 
  onExecute, 
  onExport,
  onSavePreset,
  onLoadPreset,
  userPresets,
  isProcessing,
  cooldown = 0
}) => {
  const { isListening, startListening } = useSpeechInput();
  const [showPresetNameInput, setShowPresetNameInput] = useState(false);
  const [presetName, setPresetName] = useState('');

  const handleVoiceInput = () => {
    startListening((text) => {
      onUpdateSettings({ customPrompt: text });
    });
  };

  const handleSaveClick = () => {
    if (showPresetNameInput) {
      if (presetName.trim()) {
        onSavePreset(presetName.trim());
        setPresetName('');
        setShowPresetNameInput(false);
      }
    } else {
      setShowPresetNameInput(true);
    }
  };

  const t = {
    lineWidth: language === 'ja' ? '線の太さ' : 'Line Width',
    colorCount: language === 'ja' ? '色数' : 'Colors',
    intensity: language === 'ja' ? '強弱' : 'Weight',
    lineType: language === 'ja' ? 'ペン種' : 'Type',
    colorDensity: language === 'ja' ? '色の濃さ' : 'Density',
    lineFrayedness: language === 'ja' ? '線のカスレ' : 'Frayedness',
    promptLabel: language === 'ja' ? '追加指示' : 'Prompt',
    listening: language === 'ja' ? '聴取中' : 'Listening',
    promptPlaceholder: language === 'ja' ? '調整指示を入力...' : 'Enter prompt...',
    presetTitle: language === 'ja' ? '記憶' : 'Presets',
    emptyPresets: language === 'ja' ? 'なし' : 'None',
    presetSaveConfirm: language === 'ja' ? '保存' : 'Save',
    presetSave: language === 'ja' ? '記憶' : 'Store',
    presetNamePlaceholder: language === 'ja' ? '名' : 'Name',
    export: language === 'ja' ? 'SVG出力' : 'SVG Export',
    execute: language === 'ja' ? '実行' : 'Execute',
    wait: language === 'ja' ? '処理中' : 'Processing',
    cooling: language === 'ja' ? '冷却中' : 'Cooling',
  };

  const lineTypes: Record<LineType, string> = {
    'ペン': language === 'ja' ? 'ペン' : 'Pen',
    '筆': language === 'ja' ? '筆' : 'Brush',
    'マジック': language === 'ja' ? 'マ' : 'Marker',
  };

  return (
    <div className="h-[130px] bg-zinc-900 border-t border-zinc-800 flex flex-col px-6 py-4 z-20 shadow-[0_-5px_15px_rgba(0,0,0,0.7)] select-none">
      <div className="flex w-full gap-8 items-stretch h-full">
        
        <div className="flex-1 grid grid-cols-3 gap-x-8 gap-y-4 pr-8 border-r border-zinc-800">
          {[
            { key: 'lineWidth', label: t.lineWidth, val: settings.lineWidth, max: 20 },
            { key: 'colorCount', label: t.colorCount, val: settings.colorCount, max: 256 },
            { key: 'lineWeight', label: t.intensity, val: settings.lineWeight, max: 256 },
            { key: 'colorDensity', label: t.colorDensity, val: settings.colorDensity, max: 256 },
            { key: 'lineFrayedness', label: t.lineFrayedness, val: settings.lineFrayedness, max: 256 },
          ].map((item) => (
            <div key={item.key} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
                <span>{item.label}</span>
                <span className="text-zinc-300">{item.val}</span>
              </div>
              <input 
                type="range" min="1" max={item.max} value={item.val} 
                onChange={(e) => onUpdateSettings({ [item.key]: parseInt(e.target.value) })}
                className="w-full h-1 bg-zinc-800 rounded-none appearance-none cursor-pointer accent-zinc-500" 
              />
            </div>
          ))}
          
          <div className="flex flex-col gap-1.5">
            <div className="text-[8px] font-bold text-amber-700/70 uppercase tracking-widest">{t.lineType}</div>
            <div className="flex gap-1">
              {(['ペン', '筆', 'マジック'] as LineType[]).map(key => (
                <button
                  key={key}
                  onClick={() => onUpdateSettings({ lineType: key })}
                  className={`flex-1 py-1 text-[9px] font-bold border transition-all ${
                    settings.lineType === key 
                      ? 'bg-amber-900/20 border-amber-500/40 text-amber-200' 
                      : 'bg-zinc-800 border-zinc-800 text-zinc-600 hover:text-zinc-400'
                  }`}
                >
                  {lineTypes[key]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-[0.8] flex flex-col gap-3 justify-center">
          <div className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest flex justify-between">
            <span>{t.promptLabel}</span>
            {isListening && <span className="text-red-900 animate-pulse">{t.listening}</span>}
          </div>
          <div className="flex gap-2">
            <input 
              type="text" placeholder={t.promptPlaceholder} value={settings.customPrompt || ''}
              onChange={(e) => onUpdateSettings({ customPrompt: e.target.value })}
              className="flex-1 text-[10px] bg-zinc-950 border border-zinc-800 text-zinc-300 px-3 py-2 outline-none focus:border-zinc-700 font-bold placeholder:text-zinc-800" 
            />
            <button 
              onClick={handleVoiceInput}
              className={`p-2 border transition-all ${isListening ? 'bg-red-950 text-red-400 border-red-900 animate-pulse' : 'bg-zinc-800 text-zinc-600 border-zinc-700 hover:text-zinc-400'}`}
            >
              <Icon name="Mic" size={12} />
            </button>
          </div>
        </div>

        <div className="w-64 flex flex-col justify-between border-l border-zinc-800 pl-8">
          <div className="flex flex-wrap gap-1.5 overflow-y-auto max-h-[40px] custom-scrollbar">
            {userPresets.map(p => (
              <button 
                key={p.id} onClick={() => onLoadPreset(p)}
                className="px-2 py-0.5 bg-violet-950/20 text-violet-500 border border-violet-900/30 text-[8px] font-bold uppercase hover:border-violet-600 transition-all"
              >
                {p.name.slice(0, 6)}
              </button>
            ))}
            {userPresets.length === 0 && <span className="text-[8px] text-zinc-800 italic uppercase">{t.emptyPresets}</span>}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-auto">
            <div className="relative col-span-2">
              {showPresetNameInput && (
                <div className="absolute bottom-full mb-2 left-0 right-0 bg-zinc-900 border border-zinc-700 p-3 shadow-2xl z-50">
                  <input 
                    autoFocus type="text" placeholder={t.presetNamePlaceholder} 
                    className="w-full text-[10px] bg-zinc-950 border border-zinc-800 p-2 outline-none text-zinc-300 font-bold"
                    value={presetName} onChange={(e) => setPresetName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveClick()} 
                  />
                </div>
              )}
              <button 
                onClick={handleSaveClick}
                className="w-full flex items-center justify-center gap-2 py-1.5 bg-violet-900/20 text-violet-400 border border-violet-900/40 font-bold text-[9px] uppercase tracking-widest hover:bg-violet-900/30 transition-all"
              >
                <Icon name="Save" size={10} /> {showPresetNameInput ? t.presetSaveConfirm : t.presetSave}
              </button>
            </div>
            
            <button 
              onClick={onExport}
              className="flex items-center justify-center gap-2 py-2 bg-zinc-800 text-zinc-500 border border-zinc-700 font-bold text-[9px] uppercase hover:text-zinc-200 transition-all"
            >
              <Icon name="FileDown" size={12} /> {t.export}
            </button>
            
            <button 
              onClick={onExecute} disabled={isProcessing || cooldown > 0}
              className={`flex items-center justify-center gap-2 py-2 font-bold text-[9px] uppercase tracking-widest transition-all ${
                isProcessing || cooldown > 0 
                  ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-60' 
                  : 'bg-zinc-100 text-zinc-900 hover:bg-white shadow-[0_0_20px_rgba(255,255,255,0.1)]'
              }`}
            >
              <Icon name={isProcessing ? 'Loader2' : cooldown > 0 ? 'Clock' : 'Activity'} size={12} className={isProcessing ? 'animate-spin' : ''} />
              {isProcessing ? t.wait : cooldown > 0 ? `${t.cooling} ${cooldown}s` : t.execute}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
