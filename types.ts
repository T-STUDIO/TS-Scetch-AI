
export type ExtractionItem = 
  | '人物' | '動物' | '建物' | '木' | '空' | '海' | '車' | 'バイク' | '自転車' | '船';

export type DrawingStyle = 
  | '漫画風' | 'ファンシー' | 'カジュアル' | 'ポップ' | '劇画風' | 'ノスタルジー' | 'テクニカル' | '細密' | 'パース';

export type LineType = 'ペン' | '筆' | 'マジック';

export interface IllustrationSettings {
  extractionItems: string[];
  drawingStyles: string[];
  lineWidth: number;
  colorCount: number;
  lineWeight: number;
  lineType: LineType;
  colorDensity: number;
  lineFrayedness: number;
  customPrompt?: string;
}

export interface UserPreset {
  id: string;
  name: string;
  settings: IllustrationSettings;
}

export interface Layer {
  id: string;
  name: string;
  isVisible: boolean;
  type: 'image' | 'line' | 'color';
  dataUrl?: string;
}
