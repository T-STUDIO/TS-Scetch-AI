
/**
 * Artistic Image Processing: Enhancing Stroke & Color Separation
 */

/**
 * 完成イラストから黒い線のみを抽出し、背景を透明化。
 */
export async function extractLines(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);

      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i+1], b = data[i+2];
        // 輝度計算
        const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
        
        // 閾値処理: 黒に近い部分のみを線として残す
        if (brightness < 120) {
          // 線画として抽出（完全に黒にする）
          data[i] = 0; data[i+1] = 0; data[i+2] = 0;
          // 濃さに応じたアルファ
          data[i + 3] = Math.min(255, (255 - brightness) * 2); 
        } else {
          // それ以外は透明
          data[i + 3] = 0; 
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = dataUrl;
  });
}

/**
 * 完成イラストから線を除去し、色面のみを抽出（25レイヤー分割用）。
 */
export async function extractColorPlanes(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i+1], b = data[i+2];
        const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
        
        // 黒い線に近い部分は透明化して色レイヤーから除外
        if (brightness < 100) {
          data[i + 3] = 0;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = dataUrl;
  });
}

export async function compressImage(dataUrl: string, maxWidth: number = 1024): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > maxWidth || h > maxWidth) {
        const ratio = Math.min(maxWidth/w, maxWidth/h);
        w *= ratio; h *= ratio;
      }
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);
      }
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = dataUrl;
  });
}

/**
 * 近似色をグループ化し、最大25レイヤーに分割。
 */
export async function splitImageByColor(dataUrl: string, maxLayers: number = 25): Promise<{ dataUrl: string }[]> {
  const colorSource = await extractColorPlanes(dataUrl);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve([]);
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      const colorGroups: Record<string, number> = {};
      const q = 90; // 量子化を強くして近似色を統合
      for (let i = 0; i < data.length; i += 4) {
        if (data[i+3] < 50) continue;
        const qr = Math.floor(data[i]/q)*q;
        const qg = Math.floor(data[i+1]/q)*q;
        const qb = Math.floor(data[i+2]/q)*q;
        const hex = `${qr},${qg},${qb}`;
        colorGroups[hex] = (colorGroups[hex] || 0) + 1;
      }

      const limit = Math.min(maxLayers, 25);
      const sortedColors = Object.entries(colorGroups)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(e => e[0].split(',').map(Number));

      const results = sortedColors.map(([tr, tg, tb]) => {
        const c = document.createElement('canvas');
        c.width = canvas.width; c.height = canvas.height;
        const x = c.getContext('2d')!;
        const id = x.createImageData(c.width, c.height);
        const d = id.data;
        
        const threshold = 140; 
        for (let i = 0; i < data.length; i += 4) {
          if (data[i+3] < 50) continue;
          const diff = Math.abs(data[i]-tr) + Math.abs(data[i+1]-tg) + Math.abs(data[i+2]-tb);
          if (diff < threshold) {
            d[i]=data[i]; d[i+1]=data[i+1]; d[i+2]=data[i+2]; d[i+3]=255;
            data[i+3] = 0; // 処理済みとして消す
          }
        }
        x.putImageData(id, 0, 0);
        return { dataUrl: c.toDataURL('image/png') };
      });
      resolve(results.filter(r => r !== null));
    };
    img.src = colorSource;
  });
}
