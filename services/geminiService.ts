
import { GoogleGenAI } from "@google/genai";
import { IllustrationSettings } from "../types.ts";

const STORAGE_KEY = 'tssketch_last_exec';
const RETRY_DELAY = 10000; // リトライ待機時間 (10秒)

/**
 * BYOK用のAPIキー取得関数 (localStorageを最優先し、環境変数にフォールバック)
 */
function getApiKey(): string {
  const localKey = localStorage.getItem('tssketch_api_key');
  if (localKey && localKey.trim()) {
    return localKey.trim();
  }
  // 環境変数
  return (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();
}

function getLastExecTime(): number {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? parseInt(saved, 10) : 0;
}

function setLastExecTime(time: number) {
  localStorage.setItem(STORAGE_KEY, time.toString());
}

/**
 * 指数バックオフ付きのリトライ機能
 */
async function callApiWithRetry(fn: () => Promise<any>, retries = 2): Promise<any> {
  try {
    return await fn();
  } catch (error: any) {
    if (error?.message?.includes('429') && retries > 0) {
      console.warn(`[API Quota] Rate limited. Retrying in ${RETRY_DELAY/1000}s... (${retries} left)`);
      await new Promise(r => setTimeout(r, RETRY_DELAY));
      return callApiWithRetry(fn, retries - 1);
    }
    throw error;
  }
}

const STYLE_DIRECTIVES: Record<string, string> = {
  '漫画風': 'MASTER MANGA ARTIST style: Dynamic G-pen lines, professional 2D shading. Redraw as a clean manga panel.',
  'ファンシー': 'KAWAII STORYBOOK: Redraw with soft rounded shapes and bold smooth outlines. Minimalist fairytale aesthetic.',
  'カジュアル': 'DIGITAL SKETCH: Redraw as professional concept art with simplified 2D strokes. Confident and clean.',
  'ポップ': 'VIBRANT POP ART: Perfectly smooth thick outlines and flat high-saturation colors. Redraw as a vector graphic.',
  '劇画風': 'INTENSE SEINEN MANGA: Powerful structural lines and dramatic heavy shadows. Detailed anatomy focus.',
  'ノスタルジー': 'VINTAGE ETCHING: Redraw as an old-world book illustration with delicate fine lines and artistic hatching.',
  'テクニカル': 'ISO-STRUCTURAL DRAFTING: Redraw as a sharp, clean, stylized 2D schematic blueprint with geometric precision.',
  '細密': 'GRAPHIC PATTERN MASTERY: High-density patterns of intentional lines. Redraw with intricate artistic choices.',
  'パース': 'ARCHITECTURAL PERSPECTIVE: Exaggerated 2D perspective geometry. Sharp, clean, completely redrawn structural lines.',
};

/**
 * 3.5フラッシュ (gemini-3.5-flash) を使って、
 * イラスト設定パラメータを最高のアートディレクション英語プロンプトに最適化・拡張するプロンプトオプティマイザ
 */
async function optimizePromptWith35Flash(
  apiKey: string,
  settings: IllustrationSettings,
  userPrompt?: string
): Promise<string> {
  const styleStr = settings.drawingStyles.join(', ');
  const extractionStr = settings.extractionItems.length > 0
    ? `Subject components to extract/focus: ${settings.extractionItems.join(', ')}`
    : `Focus: entire scene`;
  
  const systemInstruction = `
    You are an expert anime and manga art director. 
    Your goal is to optimize parameters and turn them into a pristine, highly descriptive, vivid 2D illustration prompt in English, perfect for an advanced text-to-image/image-editing generator model.
    Do not output any conversational text. Output ONLY the raw optimized prompt in English.
  `;

  const inputPrompt = `
    Create a highly refined 2D illustration prompt based on the following specific settings:
    - Base User Subject: ${userPrompt || 'the provided base image'}
    - Target Styles: ${styleStr}
    - Line Width (Density): ${settings.lineWidth} (1-20 scale)
    - Colors: Flat cel-shading under 2D palette limit of ${settings.colorCount} colors.
    - Drawing line aesthetic: Traditional 2D line-art, ${settings.lineType} stroke type.
    - Line weight intensity: ${settings.lineWeight}/255
    - Color density: ${settings.colorDensity}/255
    - Line frayedness (roughness/hand-drawn texture): ${settings.lineFrayedness}/64
    - Specific Subjects: ${extractionStr}
    - Custom Prompt: ${settings.customPrompt || 'None'}

    Requirements:
    1. Translate styling words accurately to professional art terms.
    2. Explicitly specify "Solid, pure black, flawless 2D outlines (#000000)".
    3. Output ONLY the optimized, continuous descriptive prompt in English. Do not add any intros like "Here is the prompt:".
  `;

  try {
    const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: inputPrompt,
      config: {
        systemInstruction,
        temperature: 0.1,
      }
    });
    return response.text?.trim() || "";
  } catch (e) {
    console.warn("Failed to optimize prompt with gemini-3.5-flash, using fallback template.", e);
    return "";
  }
}

export async function generateIllustrationBase(
  imageBase64: string, 
  settings: IllustrationSettings
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY_REQUIRED");

  // 1. gemini-3.5-flashで最高の作画指示プロンプトを作成（不具合：指示の実現度を劇的に向上）
  let optimizedPrompt = await optimizePromptWith35Flash(apiKey, settings);
  if (!optimizedPrompt) {
    const styleStr = settings.drawingStyles.map(s => STYLE_DIRECTIVES[s] || s).join(' ');
    const extractionTarget = settings.extractionItems.length > 0 
      ? `SUBJECT FOCUS: Redraw ONLY these items in detail: [${settings.extractionItems.join(', ')}].`
      : `SUBJECT FOCUS: Redraw the entire scene.`;
    optimizedPrompt = `TASK: REDRAW AS PROFESSIONAL 2D ILLUSTRATION.\n1. ${extractionTarget}\n2. STYLE: ${styleStr}\n3. LINE: Pure black lines (#000000).\n4. COLOR: Flat cel-shading.\n5. OUTPUT: One clean illustration.`;
  } else {
    optimizedPrompt += ` Pure black line-art outlines (#000000). Flat cel-shading coloring, no photorealism. Single complete 2D drawing vector-like illustration.`;
  }

  // 2. gemini-3.1-flash-image (Nano Banana 2) もしくは gemini-2.5-flash-image で再構成
  return callApiWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image',
        contents: {
          parts: [
            { inlineData: { data: imageBase64.split(',')[1], mimeType: 'image/jpeg' } },
            { text: optimizedPrompt }
          ]
        },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (part?.inlineData) {
        setLastExecTime(Date.now());
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    } catch (err: any) {
      console.warn("gemini-3.1-flash-image call failed, falling back to gemini-2.5-flash-image", err);
    }

    // エラー時は gemini-2.5-flash-image
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: imageBase64.split(',')[1], mimeType: 'image/jpeg' } },
          { text: optimizedPrompt }
        ]
      },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });

    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!part?.inlineData) throw new Error("NO_IMAGE_RETURNED");
    
    setLastExecTime(Date.now());
    return `data:image/png;base64,${part.inlineData.data}`;
  });
}

export async function generateBaseImage(prompt: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY_REQUIRED");

  // プロンプトを 3.5-flash で画像特化に最適化
  const systemInstruction = "You are an AI generator expert. Transform the user input prompt into a highly detailed 2D illustration prompt in English, specifying clean pure black manga outline-art and flat colors. Output ONLY the optimized prompt.";
  let optimizedPrompt = prompt;
  try {
    const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
    const optRes = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Transform this: "${prompt}" into a detailed 2D professional illustration description with black solid ink outlines and clean flat cel-shading color style. Continuous English sentence. Only outputs the optimized description, no intro or quotes.`,
      config: { systemInstruction, temperature: 0.2 }
    });
    if (optRes.text?.trim()) {
      optimizedPrompt = optRes.text.trim();
    }
  } catch (e) {
    console.warn("Failed to optimize base prompt with 3.5-flash, fallback to raw user prompt", e);
  }

  return callApiWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image',
        contents: {
          parts: [{ text: optimizedPrompt }]
        },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });
      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (part?.inlineData) {
        setLastExecTime(Date.now());
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    } catch (err) {
      console.warn("gemini-3.1-flash-image failed for BaseImage, trial with 2.5-flash-image", err);
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: optimizedPrompt }]
      },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!part?.inlineData) throw new Error("GENERATION_FAILED");
    
    setLastExecTime(Date.now());
    return `data:image/png;base64,${part.inlineData.data}`;
  });
}
