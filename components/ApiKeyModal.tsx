
import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [hasEnvironmentKey, setHasEnvironmentKey] = useState(false);

  useEffect(() => {
    // 既存のキーをロード
    const stored = localStorage.getItem('tssketch_api_key') || '';
    setApiKey(stored);

    // サーバー環境変数等にあらかじめ設定があるか確認（あればBYOKなしでも動くが、BYOK設定可能であることを示す）
    // クライアント側では直接読めない可能性があるが、一般的なフォールバックとして
    const envKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
    if (envKey && envKey.trim()) {
      setHasEnvironmentKey(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = apiKey.trim();
    if (cleanKey) {
      localStorage.setItem('tssketch_api_key', cleanKey);
      onSave(cleanKey);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1000);
    } else {
      handleDelete();
    }
  };

  const handleDelete = () => {
    localStorage.removeItem('tssketch_api_key');
    setApiKey('');
    onSave('');
    alert('APIキーを削除しました。');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        id="api-key-modal-card" 
        className="w-full max-w-lg bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="bg-amber-950/40 p-2 rounded-lg border border-amber-500/30 text-amber-500">
              <Icon name="Key" size={18} />
            </div>
            <div>
              <h2 className="font-bold text-base tracking-wide">Gemini API キー設定</h2>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">Bring Your Own Key (BYOK)</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm flex-1">
          <div className="space-y-2">
            <p className="text-zinc-300 leading-relaxed">
              TS-Scetch-AIの実装機能（AIイラストの高精度再構成・描画生成）をご自身のAPI制限枠、あるいは無料枠で直接GitHub Pages等から稼働させることができます。
            </p>
            <p className="text-zinc-400 text-xs leading-relaxed">
              ご入力いただいたAPIキーは、外部サーバーに一切送信されず、お使いのブラウザの <code className="bg-zinc-950 text-amber-500 px-1 py-0.5 rounded text-xs font-mono">localStorage</code> に安全に暗号化されずに直接格納され、GoogleのGenAI APIに直通で使用されます。
            </p>
          </div>

          {/* 登録支援ガイド（3ステップ説明） */}
          <div className="p-4 bg-zinc-950/60 rounded-lg border border-zinc-800/80 space-y-3">
            <h3 className="font-bold text-xs text-amber-500 flex items-center gap-2">
              <Icon name="HelpCircle" size={14} />
              APIキーの無料作成・取得手順（約1分）
            </h3>
            <ol className="text-xs space-y-2.5 text-zinc-300 list-decimal pl-4">
              <li>
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1"
                >
                  「Google AI Studio Key 発行所」
                  <Icon name="ExternalLink" size={12} className="inline" />
                </a>
                へアクセスします（※無料枠対応、Googleアカウントが必要）。
              </li>
              <li>
                画面上の <span className="font-semibold text-zinc-100 bg-zinc-800 px-1.5 py-0.5 rounded">Create API key</span> ボタンを押し、任意のプロジェクト、またはキーの作成規約に同意してキーを発行・コピーします。
              </li>
              <li>
                コピーしたキー（<span className="font-mono text-[10px] text-zinc-500">AIzaSy...</span>から始まる文字列）を、以下のフォームへ貼り付けて保存します。
              </li>
            </ol>
          </div>

          {/* フォーム */}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Gemini API キー
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg py-2.5 pl-3 pr-10 text-xs text-zinc-200 font-mono transition-all placeholder-zinc-700 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  <Icon name={showKey ? "EyeOff" : "Eye"} size={16} />
                </button>
              </div>
            </div>

            {hasEnvironmentKey && !apiKey && (
              <div className="flex items-center gap-2 text-xs text-emerald-500 bg-emerald-950/20 border border-emerald-500/20 p-3 rounded-lg">
                <Icon name="Check" size={14} className="flex-shrink-0" />
                <span>ビルド環境にあらかじめデフォルトAPIキーが設定されています。ご自身のキーを入力しない場合は、その共有キーが使用されます。</span>
              </div>
            )}

            {!apiKey && !hasEnvironmentKey && (
              <div className="flex items-start gap-2.5 text-xs text-amber-500 bg-amber-950/20 border border-amber-500/20 p-3 rounded-lg">
                <Icon name="AlertTriangle" size={14} className="flex-shrink-0 mt-0.5" />
                <span>APIキーが設定されていません。GitHub Pages 等、静的ウェブ上で動作させる場合、キーの個別入力（BYOK）が必須です。</span>
              </div>
            )}

            {/* ボタン群 */}
            <div className="flex gap-3 pt-2">
              {apiKey && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center justify-center gap-2 px-3 py-2 border border-red-900 bg-red-950/20 text-red-500 hover:bg-red-950/50 transition-all rounded-lg text-xs"
                >
                  <Icon name="Trash2" size={14} />
                  削除
                </button>
              )}
              <button
                type="submit"
                disabled={savedSuccess}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all border ${
                  savedSuccess 
                    ? 'bg-emerald-600 border-emerald-500 text-white' 
                    : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 border-amber-500 text-zinc-950 active:scale-[0.98]'
                }`}
              >
                {savedSuccess ? (
                  <>
                    <Icon name="Check" size={14} />
                    保存完了！
                  </>
                ) : (
                  <>
                    <Icon name="Save" size={14} />
                    APIキーを保存
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

