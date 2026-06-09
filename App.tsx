
import React, { useState, useEffect, useRef } from 'react';
import { SidebarLeft } from './components/SidebarLeft.tsx';
import { SidebarRight } from './components/SidebarRight.tsx';
import { MainCanvas } from './components/MainCanvas.tsx';
import { BottomBar } from './components/BottomBar.tsx';
import { Header } from './components/Header.tsx';
import { ProcessingOverlay } from './components/ProcessingOverlay.tsx';
import { ApiKeyModal } from './components/ApiKeyModal.tsx';
import { IllustrationSettings, UserPreset, Layer } from './types.ts';
import { generateIllustrationBase, generateBaseImage } from './services/geminiService.ts';
import { splitImageByColor, compressImage, extractLines } from './services/imageService.ts';

const INITIAL_SETTINGS: IllustrationSettings = {
  extractionItems: [],
  drawingStyles: ['漫画風'],
  lineWidth: 8,
  colorCount: 12,
  lineWeight: 128,
  lineType: 'ペン',
  colorDensity: 128,
  lineFrayedness: 64,
  customPrompt: ''
};

const TRANSLATIONS = {
  ja: {
    status: 'AIエンジン稼働中 (Gemini 3.5 Flash & 3.1 Image)',
    workspace: 'ワークスペース',
    processing: 'イラスト再構成中...',
    generating: '1. AIによる再描画...\n2. プログラムによる線画と色レイヤーの分離...\n※無料枠の上限により、リトライが発生する場合があります。',
    errorProcess: 'APIリクエストに失敗しました。時間を空けて再度お試しください。',
    errorQuota: 'クォータ上限（1分間に2回、または1日の生成枚数上限）に達した可能性があります。しばらく待機が必要です。',
    errorNoImage: 'まず画像を選択するか、生成してください。',
  },
  en: {
    status: 'AI Engine Active (Gemini 3.5 Flash & 3.1 Image)',
    workspace: 'Canvas',
    processing: 'Reconstructing...',
    generating: '1. AI Redrawing...\n2. Line/Color separation...\n*Processing with retry logic due to free tier limits.',
    errorProcess: 'API request failed. Please try again after a long break.',
    errorQuota: 'Quota limit (2 RPM or Daily Limit) reached. Please wait a while.',
    errorNoImage: 'Please select or generate an image first.',
  }
};

const COOLDOWN_SECONDS = 45; // 45秒に延長して確実にRPM制限を回避

export default function App() {
  const [language, setLanguage] = useState<'ja' | 'en'>('ja');
  const [settings, setSettings] = useState<IllustrationSettings>(INITIAL_SETTINGS);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userPresets, setUserPresets] = useState<UserPreset[]>([]);
  const [cooldown, setCooldown] = useState(0);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const cooldownTimerRef = useRef<number | null>(null);

  const t = TRANSLATIONS[language];

  const startCooldownTimer = (seconds: number) => {
    if (seconds <= 0) return;
    setCooldown(seconds);
    if (cooldownTimerRef.current) window.clearInterval(cooldownTimerRef.current);
    cooldownTimerRef.current = window.setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          if (cooldownTimerRef.current) window.clearInterval(cooldownTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    const savedPresets = localStorage.getItem('tssketch_presets');
    if (savedPresets) {
      try { setUserPresets(JSON.parse(savedPresets)); } catch (e) {}
    }

    const lastExec = localStorage.getItem('tssketch_last_exec');
    if (lastExec) {
      const diff = Date.now() - parseInt(lastExec, 10);
      const remaining = Math.ceil((COOLDOWN_SECONDS * 1000 - diff) / 1000);
      if (remaining > 0) startCooldownTimer(remaining);
    }

    // 初回起動時のAPIキー未登録チェック（自動ポップアップ表示）
    const storedApiKey = localStorage.getItem('tssketch_api_key');
    const defaultEnvKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
    if (!storedApiKey && !defaultEnvKey.trim()) {
      // ユーザーの利便性を高めるため、初回はAPIキーが必要なことをガイダンスするモーダルを表示
      setTimeout(() => {
        setIsApiKeyModalOpen(true);
      }, 500);
    }

    return () => { if (cooldownTimerRef.current) window.clearInterval(cooldownTimerRef.current); };
  }, []);

  const handleUpdateSettings = (updates: Partial<IllustrationSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const handleToggleExtraction = (item: string) => {
    setSettings(prev => ({
      ...prev,
      extractionItems: prev.extractionItems.includes(item)
        ? prev.extractionItems.filter(i => i !== item)
        : [...prev.extractionItems, item]
    }));
  };

  const handleAddExtractionItem = (item: string) => {
    if (!settings.extractionItems.includes(item)) {
      setSettings(prev => ({ ...prev, extractionItems: [...prev.extractionItems, item] }));
    }
  };

  const handleToggleStyle = (style: string) => {
    setSettings(prev => ({
      ...prev,
      drawingStyles: prev.drawingStyles.includes(style)
        ? prev.drawingStyles.filter(s => s !== style)
        : [...prev.drawingStyles, style]
    }));
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setLayers([{ id: 'source_' + Date.now(), name: language === 'ja' ? '元画像' : 'Source', isVisible: true, type: 'image', dataUrl }]);
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => setLayers([]);

  const handleGenerateImage = async (prompt: string) => {
    if (!prompt.trim() || cooldown > 0) return;
    setIsProcessing(true);
    try {
      const imageUrl = await generateBaseImage(prompt);
      setLayers([{ id: 'source_' + Date.now(), name: language === 'ja' ? 'AI生成ソース' : 'AI Source', isVisible: true, type: 'image', dataUrl: imageUrl }]);
      startCooldownTimer(COOLDOWN_SECONDS);
    } catch (error: any) {
      console.error(error);
      alert(error.message?.includes('QUOTA') || error.message?.includes('429') ? t.errorQuota : t.errorProcess);
      startCooldownTimer(COOLDOWN_SECONDS);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecute = async () => {
    const sourceLayer = layers.find(l => l.id.startsWith('source_'));
    if (!sourceLayer || !sourceLayer.dataUrl) return alert(t.errorNoImage);
    if (cooldown > 0) return;

    setIsProcessing(true);
    try {
      const compressedImage = await compressImage(sourceLayer.dataUrl, 1024);
      const rawArtUrl = await generateIllustrationBase(compressedImage, settings);
      
      const lineArt = await extractLines(rawArtUrl);
      const newLineLayer: Layer = { id: 'line_' + Date.now(), name: language === 'ja' ? 'リドロー線画' : 'Redrawn Lines', isVisible: true, type: 'line', dataUrl: lineArt };
      
      const maxColorLayers = Math.min(settings.colorCount, 25);
      const colorSplitResult = await splitImageByColor(rawArtUrl, maxColorLayers);
      const newColorLayers: Layer[] = colorSplitResult.map((res, index) => ({
        id: `color_${Date.now()}_${index}`, name: (language === 'ja' ? '着色面 ' : 'Color ') + (index + 1), isVisible: true, type: 'color', dataUrl: res.dataUrl
      }));

      setLayers(prev => {
        const originalSource = prev.find(l => l.id.startsWith('source_'));
        if (!originalSource) return prev;
        return [{ ...originalSource, isVisible: false }, ...newColorLayers, newLineLayer];
      });
      startCooldownTimer(COOLDOWN_SECONDS);
    } catch (error: any) {
      console.error(error);
      alert(error.message?.includes('QUOTA') || error.message?.includes('429') ? t.errorQuota : t.errorProcess);
      startCooldownTimer(COOLDOWN_SECONDS);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = () => {
    const visibleLayers = layers.filter(l => l.isVisible && l.dataUrl);
    if (visibleLayers.length === 0) return;
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">${visibleLayers.map(l => `<image href="${l.dataUrl}" width="1024" height="1024" />`).join('\n')}</svg>`.trim();
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `illust_${Date.now()}.svg`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleSavePreset = (name: string) => {
    const newPreset = { id: 'p_' + Date.now(), name, settings: { ...settings } };
    const updated = [...userPresets, newPreset];
    setUserPresets(updated);
    localStorage.setItem('tssketch_presets', JSON.stringify(updated));
  };

  const handleLoadPreset = (preset: UserPreset) => setSettings(preset.settings);
  const handleToggleLayerVisibility = (id: string) => setLayers(prev => prev.map(l => l.id === id ? { ...l, isVisible: !l.isVisible } : l));

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-950 text-zinc-300 font-['Inter','Noto_Sans_JP']">
      <Header 
        language={language} 
        statusLabel={t.status} 
        workspaceLabel={t.workspace} 
        onToggleLanguage={() => setLanguage(l => l==='ja'?'en':'ja')} 
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
      />
      <div className="flex flex-1 overflow-hidden">
        <SidebarLeft language={language} selectedItems={settings.extractionItems} onToggleItem={handleToggleExtraction} onAddItem={handleAddExtractionItem} />
        <MainCanvas language={language} layers={layers} onUpload={handleImageUpload} onReset={handleReset} onToggleLayer={handleToggleLayerVisibility} onGenerateImage={handleGenerateImage} />
        <SidebarRight language={language} selectedStyles={settings.drawingStyles} onToggleStyle={handleToggleStyle} onAddStyle={(style) => handleUpdateSettings({ drawingStyles: [...settings.drawingStyles, style] })} />
      </div>
      <BottomBar 
        language={language} settings={settings} onUpdateSettings={handleUpdateSettings} 
        onExecute={handleExecute} onExport={handleExport} onSavePreset={handleSavePreset} 
        onLoadPreset={handleLoadPreset} userPresets={userPresets} isProcessing={isProcessing}
        cooldown={cooldown} 
      />
      {isProcessing && <ProcessingOverlay title={t.processing} message={t.generating} />}
      <ApiKeyModal isOpen={isApiKeyModalOpen} onClose={() => setIsApiKeyModalOpen(false)} onSave={(key) => console.log('BYOK Gemini Key Configured:', key)} />
    </div>
  );
}
