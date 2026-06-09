
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from './Icon';
import { Layer } from '../types';
import { useSpeechInput } from '../hooks/useSpeechInput';

interface MainCanvasProps {
  language: 'ja' | 'en';
  layers: Layer[];
  onUpload: (file: File) => void;
  onReset: () => void;
  onToggleLayer: (id: string) => void;
  onGenerateImage: (prompt: string) => void;
}

export const MainCanvas: React.FC<MainCanvasProps> = ({ language, layers, onUpload, onReset, onToggleLayer, onGenerateImage }) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [tool, setTool] = useState<'move' | 'pan'>('move');
  const [showLayers, setShowLayers] = useState(false);
  const [manualText, setManualText] = useState('');
  const { isListening, startListening } = useSpeechInput();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const startPanRef = useRef({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      setZoom(prev => Math.min(Math.max(0.1, prev - e.deltaY * 0.001), 10));
    }
  };

  const startPanning = (e: React.MouseEvent) => {
    if (tool === 'pan') {
      setIsPanning(true);
      startPanRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handlePanning = useCallback((e: MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPanRef.current.x,
        y: e.clientY - startPanRef.current.y
      });
    }
  }, [isPanning]);

  const stopPanning = () => setIsPanning(false);

  useEffect(() => {
    if (isPanning) {
      window.addEventListener('mousemove', handlePanning);
      window.addEventListener('mouseup', stopPanning);
    }
    return () => {
      window.removeEventListener('mousemove', handlePanning);
      window.removeEventListener('mouseup', stopPanning);
    };
  }, [isPanning, handlePanning]);

  const handleFitToScreen = () => {
    if (!containerRef.current || !canvasWrapperRef.current) return;
    const img = canvasWrapperRef.current.querySelector('img');
    if (img && img.naturalWidth && img.naturalHeight) {
      const container = containerRef.current;
      const padding = 64;
      const availableWidth = container.clientWidth - padding;
      const availableHeight = container.clientHeight - padding;
      const scaleX = availableWidth / img.naturalWidth;
      const scaleY = availableHeight / img.naturalHeight;
      const fitZoom = Math.min(scaleX, scaleY);
      setZoom(fitZoom);
      setPan({ x: 0, y: 0 });
    } else {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  };

  const handleVoiceInput = () => {
    startListening((text) => {
      onGenerateImage(text);
    });
  };

  const handleManualGenerate = () => {
    if (manualText.trim()) {
      onGenerateImage(manualText.trim());
      setManualText('');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      // 入力値をリセットして、同じファイルを選んだ場合でもonChangeが走るようにする
      e.target.value = '';
    }
  };

  const triggerUpload = () => {
    if (fileInputRef.current) {
      // 念のため以前の状態をクリアしてからクリックをトリガー
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleResetWorkspace = () => {
    onReset();
    triggerUpload();
  };

  const t = {
    upload: language === 'ja' ? '画像を読み込む' : 'Import Image',
    or: language === 'ja' ? 'または' : 'OR',
    describe: language === 'ja' ? '指示に基づいて画像を新規生成' : 'Generate new image from description',
    describePlaceholder: language === 'ja' ? '描画したい項目や情景を入力...' : 'Describe what you want to generate...',
    standby: language === 'ja' ? 'ニューラルエンジン待機中' : 'Neural Engine Standby',
    supported: language === 'ja' ? '対応形式: 画像データ' : 'Format: JPEG/PNG/BMP/GIF',
    layerTitle: language === 'ja' ? 'レイヤー一覧' : 'Layer Stack',
    noLayer: language === 'ja' ? 'レイヤーなし' : 'Empty Stack',
    zoomLabel: language === 'ja' ? '倍率' : 'Zoom',
    layerStatus: language === 'ja' ? 'レイヤー表示中' : 'Layers Visible',
    generate: language === 'ja' ? '生成' : 'Generate',
    newImage: language === 'ja' ? '別の画像を読み込む' : 'Import New Image',
  };

  const hasProcessedLayers = layers.some(l => l.type === 'line' || l.type === 'color');

  return (
    <div 
      ref={containerRef}
      className="flex-1 relative bg-zinc-950 overflow-hidden flex items-center justify-center"
      onWheel={handleWheel}
      onMouseDown={startPanning}
    >
      <div className="absolute top-8 right-8 flex flex-col gap-1.5 z-20">
        <button onClick={() => setZoom(z => z * 1.2)} className="p-3 bg-zinc-900/60 backdrop-blur-md border border-zinc-800 shadow-xl hover:bg-zinc-800 transition-all text-zinc-500 hover:text-zinc-200">
          <Icon name="Plus" size={16} />
        </button>
        <button onClick={() => setZoom(z => z / 1.2)} className="p-3 bg-zinc-900/60 backdrop-blur-md border border-zinc-800 shadow-xl hover:bg-zinc-800 transition-all text-zinc-500 hover:text-zinc-200">
          <Icon name="Minus" size={16} />
        </button>
        <button onClick={handleFitToScreen} className="p-3 bg-zinc-900/60 backdrop-blur-md border border-zinc-800 shadow-xl hover:bg-zinc-800 transition-all text-zinc-500 hover:text-zinc-200" title="Fit to Screen">
          <Icon name="Maximize" size={16} />
        </button>
        <div className="h-px bg-zinc-800 my-2 mx-2" />
        <button 
          onClick={() => setTool(t => t === 'move' ? 'pan' : 'move')} 
          className={`p-3 border shadow-xl transition-all ${tool === 'pan' ? 'bg-zinc-100 border-white text-zinc-900' : 'bg-zinc-900/60 backdrop-blur-md border-zinc-800 text-zinc-500 hover:text-zinc-200'}`}
        >
          <Icon name="Hand" size={16} />
        </button>
        <button 
          onClick={() => setShowLayers(!showLayers)} 
          className={`p-3 border shadow-xl transition-all ${showLayers ? 'bg-zinc-500 border-zinc-400 text-zinc-950' : 'bg-zinc-900/60 backdrop-blur-md border-zinc-800 text-zinc-500 hover:text-zinc-200'}`}
        >
          <Icon name="Layers" size={16} />
        </button>
      </div>

      {layers.length === 0 && (
        <div className="flex flex-col items-center gap-8 text-zinc-700 bg-zinc-900/10 p-12 border border-zinc-900/30 backdrop-blur-[2px] w-full max-w-xl">
          <Icon name="Focus" size={48} className="opacity-10" />
          
          <div className="flex flex-col items-center gap-6 w-full">
            <button 
              onClick={triggerUpload}
              className="px-12 py-4 bg-zinc-800 text-zinc-300 border border-zinc-700 font-bold text-[10px] uppercase tracking-[0.5em] hover:bg-zinc-100 hover:text-zinc-900 hover:border-white shadow-[0_0_100px_rgba(0,0,0,0.5)] transition-all w-full max-w-xs"
            >
              {t.upload}
            </button>

            <div className="flex items-center gap-4 w-full max-w-xs">
              <div className="h-px bg-zinc-800 flex-1" />
              <span className="text-[8px] font-bold text-zinc-700 tracking-[0.2em]">{t.or}</span>
              <div className="h-px bg-zinc-800 flex-1" />
            </div>

            <div className="w-full flex flex-col gap-3">
              <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.3em] text-center">{t.describe}</p>
              <div className="flex gap-2 w-full">
                <input 
                  type="text"
                  placeholder={t.describePlaceholder}
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualGenerate()}
                  className="flex-1 bg-zinc-900/50 border border-zinc-800 text-zinc-300 text-[11px] px-4 py-3 outline-none focus:border-indigo-700 transition-all font-bold placeholder:text-zinc-800"
                />
                <button 
                  onClick={handleVoiceInput}
                  className={`p-3 border transition-all ${isListening ? 'bg-red-950 text-red-400 border-red-900 animate-pulse' : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:bg-indigo-900/30 hover:border-indigo-800/50 hover:text-indigo-300'}`}
                >
                  <Icon name="Mic" size={16} />
                </button>
                <button 
                  onClick={handleManualGenerate}
                  className="px-4 bg-zinc-800 text-zinc-500 border border-zinc-700 hover:bg-indigo-900/30 hover:border-indigo-800/50 hover:text-indigo-300 font-bold text-[9px] uppercase tracking-widest transition-all"
                >
                  {t.generate}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 opacity-30 mt-4">
             <p className="text-[8px] font-bold uppercase tracking-[0.3em]">{t.standby}</p>
             <p className="text-[8px] font-bold uppercase tracking-[0.2em]">{t.supported}</p>
          </div>
        </div>
      )}

      <div 
        ref={canvasWrapperRef}
        className="relative transition-transform duration-100 cursor-default"
        style={{ 
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          cursor: tool === 'pan' ? (isPanning ? 'grabbing' : 'grab') : 'default'
        }}
      >
        {layers.map(layer => layer.isVisible && layer.dataUrl && (
          <img 
            key={layer.id}
            src={layer.dataUrl}
            alt={layer.name}
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-none shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] transition-opacity duration-300 ${layer.type === 'image' ? 'z-0 opacity-100' : layer.type === 'color' ? 'z-10' : 'z-20'}`}
            style={{ 
              pointerEvents: 'none',
              filter: 'none'
            }}
          />
        ))}
      </div>

      {hasProcessedLayers && (
        <div className="absolute bottom-8 right-8 z-30">
          <button 
            onClick={handleResetWorkspace}
            className="group flex items-center gap-4 pl-6 pr-8 py-4 bg-zinc-900/90 backdrop-blur-xl border border-zinc-100/10 text-zinc-100 font-bold text-[11px] uppercase tracking-[0.4em] hover:bg-zinc-100 hover:text-zinc-950 transition-all shadow-[0_20px_60px_-10px_rgba(0,0,0,0.7)]"
          >
            <div className="bg-zinc-800 group-hover:bg-zinc-200 p-2 rounded-sm transition-colors">
              <Icon name="ImagePlus" size={16} className="text-zinc-400 group-hover:text-zinc-900" />
            </div>
            {t.newImage}
          </button>
        </div>
      )}

      {showLayers && (
        <div className="absolute top-8 left-8 w-64 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 shadow-[0_20px_60px_rgba(0,0,0,0.8)] p-5 z-30">
          <div className="flex justify-between items-center mb-6 px-1">
            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em]">{t.layerTitle}</span>
            <button onClick={() => setShowLayers(false)} className="text-zinc-700 hover:text-zinc-100 transition-colors"><Icon name="X" size={14}/></button>
          </div>
          <div className="space-y-2 custom-scrollbar max-h-72 overflow-y-auto pr-2">
            {layers.map(layer => (
              <div 
                key={layer.id} 
                className={`flex items-center gap-4 px-4 py-3 transition-all border ${layer.isVisible ? 'bg-zinc-800/80 border-zinc-700 text-zinc-200 shadow-md' : 'opacity-20 border-transparent grayscale'}`}
              >
                <button onClick={() => onToggleLayer(layer.id)} className="text-zinc-500 hover:text-zinc-100 transition-colors">
                  <Icon name={layer.isVisible ? 'Eye' : 'EyeOff'} size={14} />
                </button>
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest truncate flex-1">{layer.name}</span>
              </div>
            ))}
            {layers.length === 0 && <p className="text-[8px] text-zinc-700 text-center py-10 uppercase tracking-[0.5em] italic">{t.noLayer}</p>}
          </div>
        </div>
      )}

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/jpeg,image/png,image/bmp,image/gif"
        onChange={handleFileInputChange}
      />

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-zinc-900/40 text-zinc-500 px-8 py-2.5 rounded shadow-2xl text-[8px] font-bold uppercase tracking-[0.4em] backdrop-blur-md border border-zinc-800/30">
        <span className="flex items-center gap-3"><Icon name="Crosshair" size={12}/> {Math.round(zoom * 100)}% {t.zoomLabel}</span>
        <div className="w-px h-3 bg-zinc-800" />
        <span className="flex items-center gap-3 tracking-[0.2em]">{layers.filter(l => l.isVisible).length} {t.layerStatus}</span>
      </div>
    </div>
  );
};
