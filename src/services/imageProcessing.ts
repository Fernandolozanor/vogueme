import { removeBackground } from '@imgly/background-removal';
import type { FacialAnalysisResult, FaceShape, FacialContrast, ColorSeason } from '../types';

/**
 * On-Device Image Processing & Privacy-First Feature Extraction
 * None of the pixel data ever leaves the user's browser.
 */

export interface ProcessedGarmentResult {
  dataUrl: string;
  originalDataUrl: string;
  whiteStudioDataUrl: string;
  dominantColorHex: string;
  dominantColorName: string;
  suggestedCategory: 'top' | 'bottom' | 'shoes' | 'outerwear' | 'accessory' | 'dress';
  hasCutout: boolean;
}

// Map of common fashion color hexes to friendly Spanish names
const FASHION_COLORS: { name: string; hex: string; r: number; g: number; b: number }[] = [
  { name: 'Negro azabache', hex: '#1A1A1A', r: 26, g: 26, b: 26 },
  { name: 'Blanco roto / Crudo', hex: '#F6F5F2', r: 246, g: 245, b: 242 },
  { name: 'Gris melange', hex: '#9E9E9E', r: 158, g: 158, b: 158 },
  { name: 'Beige arena / Camel', hex: '#D8C7B5', r: 216, g: 199, b: 181 },
  { name: 'Marrón chocolate', hex: '#4A2E1B', r: 74, g: 46, b: 27 },
  { name: 'Azul denim / Marino', hex: '#2A4365', r: 42, g: 67, b: 101 },
  { name: 'Azul cielo / Pastel', hex: '#B8D4E3', r: 184, g: 212, b: 227 },
  { name: 'Rojo cereza / Burdeos', hex: '#801323', r: 128, g: 19, b: 35 },
  { name: 'Terracota / Teja', hex: '#C3684B', r: 195, g: 104, b: 75 },
  { name: 'Rosa empolvado', hex: '#E8B4B8', r: 232, g: 180, b: 184 },
  { name: 'Verde oliva / Salvia', hex: '#708238', r: 112, g: 130, b: 56 },
  { name: 'Verde esmeralda', hex: '#0B6623', r: 11, g: 102, b: 35 },
  { name: 'Dorado / Mostaza', hex: '#C5A059', r: 197, g: 160, b: 89 },
  { name: 'Lila / Lavanda', hex: '#BDB0D0', r: 189, g: 176, b: 208 }
];

const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Error al convertir blob'));
    reader.readAsDataURL(blob);
  });
};

export const processGarmentImage = async (
  file: File,
  removeBackgroundMode: boolean = true,
  thresholdSensitivity: number = 38
): Promise<ProcessedGarmentResult> => {
  return new Promise(async (resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      const img = new Image();
      img.onload = async () => {
        try {
          // Normalize max dimension for fast local processing
          const maxDim = 900;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const originalDataUrl = canvas.toDataURL('image/jpeg', 0.92);

          // Sample center region for dominant garment color
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          const colorSamples: { r: number; g: number; b: number }[] = [];

          for (let i = 0; i < data.length; i += 16) {
            const pixelIdx = i / 4;
            const px = pixelIdx % width;
            const py = Math.floor(pixelIdx / width);
            // Center 40% box
            if (px > width * 0.3 && px < width * 0.7 && py > height * 0.3 && py < height * 0.7) {
              colorSamples.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
            }
          }

          let avgR = 150, avgG = 150, avgB = 150;
          if (colorSamples.length > 0) {
            const sum = colorSamples.reduce(
              (acc, c) => ({ r: acc.r + c.r, g: acc.g + c.g, b: acc.b + c.b }),
              { r: 0, g: 0, b: 0 }
            );
            avgR = Math.round(sum.r / colorSamples.length);
            avgG = Math.round(sum.g / colorSamples.length);
            avgB = Math.round(sum.b / colorSamples.length);
          }

          // Closest fashion color
          let minDistance = Infinity;
          let bestMatch = FASHION_COLORS[0];
          FASHION_COLORS.forEach((fc) => {
            const d = Math.sqrt(
              Math.pow(fc.r - avgR, 2) +
              Math.pow(fc.g - avgG, 2) +
              Math.pow(fc.b - avgB, 2)
            );
            if (d < minDistance) {
              minDistance = d;
              bestMatch = fc;
            }
          });

          // Suggest category by aspect ratio
          const aspectRatio = height / width;
          let suggestedCat: 'top' | 'bottom' | 'shoes' | 'outerwear' | 'accessory' | 'dress' = 'top';
          if (aspectRatio > 1.45) {
            suggestedCat = 'dress';
          } else if (aspectRatio > 1.15) {
            suggestedCat = 'bottom';
          } else if (aspectRatio < 0.85) {
            suggestedCat = 'shoes';
          }

          let cutoutDataUrl = originalDataUrl;
          let whiteStudioDataUrl = originalDataUrl;
          let hasCutout = false;

          if (removeBackgroundMode) {
            try {
              // 1. Intento con motor neuronal on-device (con timeout de 4s para no congelar la app si falla CDN)
              const aiPromise = removeBackground(file, {
                model: 'isnet_fp16',
                output: { format: 'image/png', quality: 0.95 }
              });
              const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('AI timeout')), 4000)
              );
              const blob = await Promise.race([aiPromise, timeoutPromise]);
              cutoutDataUrl = await blobToDataUrl(blob);
              hasCutout = true;

              // Generar versión estudio blanco a partir del cutout IA
              whiteStudioDataUrl = await generateWhiteStudioFromCutout(cutoutDataUrl, width, height);
            } catch {
              // 2. Motor de Segmentación Adaptativa Local de alto rendimiento (100% fiable, sin depender de red externa)
              const segResult = runAdaptiveSegmentation(canvas, ctx, width, height, thresholdSensitivity);
              cutoutDataUrl = segResult.cutoutDataUrl;
              whiteStudioDataUrl = segResult.whiteStudioDataUrl;
              hasCutout = segResult.hasCutout;
            }
          }

          resolve({
            dataUrl: cutoutDataUrl,
            originalDataUrl,
            whiteStudioDataUrl,
            dominantColorHex: bestMatch.hex,
            dominantColorName: bestMatch.name,
            suggestedCategory: suggestedCat,
            hasCutout
          });
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
      img.src = event.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Error al leer el archivo en local'));
    reader.readAsDataURL(file);
  });
};

/**
 * Re-procesa el recorte con una sensibilidad específica o un punto de fondo tocado por el usuario.
 */
export const applyCustomCutout = async (
  originalDataUrl: string,
  options: {
    sensitivity?: number;
    clickPoint?: { x: number; y: number };
  } = {}
): Promise<{ cutoutDataUrl: string; whiteStudioDataUrl: string; hasCutout: boolean }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ cutoutDataUrl: originalDataUrl, whiteStudioDataUrl: originalDataUrl, hasCutout: false });
          return;
        }
        ctx.drawImage(img, 0, 0);
        const res = runAdaptiveSegmentation(
          canvas,
          ctx,
          img.width,
          img.height,
          options.sensitivity || 48,
          options.clickPoint
        );
        resolve(res);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('No se pudo cargar la imagen original'));
    img.src = originalDataUrl;
  });
};

interface ColorCluster {
  r: number;
  g: number;
  b: number;
  count: number;
}

/**
 * Motor de Segmentación Adaptativa Local para prendas:
 * 1. Muestreo multi-punto del marco y clustering de fondos (pared, cama, suelo, sombras).
 * 2. Inundación BFS espacial guiada por gradiente de borde (no salta costuras ni bordes de prenda).
 * 3. Protección de zona central y suavizado de bordes (anti-aliasing).
 * 4. Generación simultánea de recorte transparente y estudio blanco impecable.
 */
function runAdaptiveSegmentation(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  sensitivity: number = 48,
  clickPoint?: { x: number; y: number }
): { cutoutDataUrl: string; whiteStudioDataUrl: string; hasCutout: boolean } {
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // 1. Recolección de muestras de color del marco exterior
    const borderSamples: { r: number; g: number; b: number }[] = [];
    const step = Math.max(2, Math.floor(Math.min(width, height) / 100));

    // Bordes horizontales
    for (let x = 0; x < width; x += step) {
      const topIdx = x * 4;
      borderSamples.push({ r: data[topIdx], g: data[topIdx + 1], b: data[topIdx + 2] });
      const botIdx = ((height - 1) * width + x) * 4;
      borderSamples.push({ r: data[botIdx], g: data[botIdx + 1], b: data[botIdx + 2] });
    }
    // Bordes verticales
    for (let y = 0; y < height; y += step) {
      const leftIdx = y * width * 4;
      borderSamples.push({ r: data[leftIdx], g: data[leftIdx + 1], b: data[leftIdx + 2] });
      const rightIdx = (y * width + (width - 1)) * 4;
      borderSamples.push({ r: data[rightIdx], g: data[rightIdx + 1], b: data[rightIdx + 2] });
    }

    // 2. Agrupar en clusters de color de fondo representativos (ej. pared, colcha, sombra)
    const clusters: ColorCluster[] = [];
    const mergeThreshold = 35; // Distancia para agrupar colores similares

    for (const sample of borderSamples) {
      let matched = false;
      for (const cl of clusters) {
        const dist = Math.sqrt(
          Math.pow(sample.r - cl.r, 2) +
          Math.pow(sample.g - cl.g, 2) +
          Math.pow(sample.b - cl.b, 2)
        );
        if (dist < mergeThreshold) {
          cl.r = (cl.r * cl.count + sample.r) / (cl.count + 1);
          cl.g = (cl.g * cl.count + sample.g) / (cl.count + 1);
          cl.b = (cl.b * cl.count + sample.b) / (cl.count + 1);
          cl.count++;
          matched = true;
          break;
        }
      }
      if (!matched && clusters.length < 8) {
        clusters.push({ ...sample, count: 1 });
      }
    }

    // Si el usuario hizo clic en un punto de fondo concreto, añadirlo con máxima prioridad
    if (clickPoint && clickPoint.x >= 0 && clickPoint.x < width && clickPoint.y >= 0 && clickPoint.y < height) {
      const cpIdx = (Math.floor(clickPoint.y) * width + Math.floor(clickPoint.x)) * 4;
      clusters.unshift({
        r: data[cpIdx],
        g: data[cpIdx + 1],
        b: data[cpIdx + 2],
        count: 9999
      });
    }

    // Distancia perceptual rápida
    const colorDist = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) => {
      const dr = r1 - r2;
      const dg = g1 - g2;
      const db = b1 - b2;
      return Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db) * 0.7;
    };

    const isBgColor = (r: number, g: number, b: number, customLimit: number) => {
      // Fondos casi blancos/claros universales
      if (r > 235 && g > 235 && b > 235) return true;
      for (const cl of clusters) {
        if (colorDist(r, g, b, cl.r, cl.g, cl.b) < customLimit) {
          return true;
        }
      }
      return false;
    };

    // 3. Cola BFS desde los bordes y detección de contornos
    const visited = new Uint8Array(width * height);
    const queue: number[] = [];
    let removedCount = 0;

    const pushBorder = (x: number, y: number) => {
      const idx = y * width + x;
      if (visited[idx]) return;
      visited[idx] = 1;
      const p = idx * 4;
      if (isBgColor(data[p], data[p + 1], data[p + 2], sensitivity * 1.15)) {
        queue.push(idx);
        data[p + 3] = 0; // Transparente
        removedCount++;
      }
    };

    // Iniciar con todo el contorno perimetral
    for (let x = 0; x < width; x++) { pushBorder(x, 0); pushBorder(x, height - 1); }
    for (let y = 0; y < height; y++) { pushBorder(0, y); pushBorder(width - 1, y); }

    // Si el usuario pulsó un punto, añadirlo también a la semilla
    if (clickPoint) {
      const pIdx = Math.floor(clickPoint.y) * width + Math.floor(clickPoint.x);
      if (!visited[pIdx]) {
        visited[pIdx] = 1;
        queue.push(pIdx);
        data[pIdx * 4 + 3] = 0;
        removedCount++;
      }
    }

    let head = 0;
    const maxQueue = width * height;
    const neighbors = [-1, 1, -width, width];

    while (head < queue.length && head < maxQueue) {
      const curr = queue[head++];
      const cx = curr % width;
      const cy = Math.floor(curr / width);
      const currP = curr * 4;
      const cr = data[currP], cg = data[currP + 1], cb = data[currP + 2];

      // Zona central protegida donde se aloja la prenda
      const isCenter = (cx > width * 0.22 && cx < width * 0.78 && cy > height * 0.20 && cy < height * 0.82);
      const allowedSens = isCenter ? sensitivity * 0.78 : sensitivity;

      for (let i = 0; i < 4; i++) {
        const offset = neighbors[i];
        const nIdx = curr + offset;
        const nx = nIdx % width;
        const ny = Math.floor(nIdx / width);

        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          if (!visited[nIdx]) {
            visited[nIdx] = 1;
            const np = nIdx * 4;
            const nr = data[np], ng = data[np + 1], nb = data[np + 2];

            // Gradiente con el píxel padre: si hay un contraste fuerte (borde de prenda), frenamos
            const stepDiff = Math.abs(nr - cr) + Math.abs(ng - cg) + Math.abs(nb - cb);
            const isEdgeBoundary = stepDiff > (allowedSens * 1.35);

            if (!isEdgeBoundary && isBgColor(nr, ng, nb, allowedSens)) {
              data[np + 3] = 0; // Transparente
              queue.push(nIdx);
              removedCount++;
            }
          }
        }
      }
    }

    // 4. Suavizado de bordes (Feathering anti-aliasing)
    // Evita el efecto pixelado/dentado en la silueta de la prenda
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const p = idx * 4;
        if (data[p + 3] !== 0) {
          // Si es un píxel opaco que toca un píxel transparente, suavizamos su alfa
          const isEdge = (
            data[((y - 1) * width + x) * 4 + 3] === 0 ||
            data[((y + 1) * width + x) * 4 + 3] === 0 ||
            data[(y * width + (x - 1)) * 4 + 3] === 0 ||
            data[(y * width + (x + 1)) * 4 + 3] === 0
          );
          if (isEdge) {
            data[p + 3] = 175; // Borde semi-translúcido natural
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const cutoutDataUrl = canvas.toDataURL('image/png');

    // 5. Generar Fondo Blanco Estudio (Estilo E-commerce Zara/Vogue)
    const studioCanvas = document.createElement('canvas');
    studioCanvas.width = width;
    studioCanvas.height = height;
    const sCtx = studioCanvas.getContext('2d');
    let whiteStudioDataUrl = cutoutDataUrl;

    if (sCtx) {
      // Fondo blanco puro con luminosidad de estudio
      sCtx.fillStyle = '#FFFFFF';
      sCtx.fillRect(0, 0, width, height);

      // Sombra de contacto suave en la base
      const grad = sCtx.createRadialGradient(
        width / 2, height * 0.90, width * 0.05,
        width / 2, height * 0.90, width * 0.45
      );
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.06)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, height * 0.75, width, height * 0.25);

      // Dibujar la prenda recortada sobre el fondo blanco
      sCtx.drawImage(canvas, 0, 0);
      whiteStudioDataUrl = studioCanvas.toDataURL('image/jpeg', 0.94);
    }

    const removedRatio = removedCount / (width * height);
    const hasCutout = removedRatio >= 0.03;

    return {
      cutoutDataUrl,
      whiteStudioDataUrl,
      hasCutout
    };
  } catch (err) {
    console.error('Error en segmentación adaptativa:', err);
    return {
      cutoutDataUrl: canvas.toDataURL('image/png'),
      whiteStudioDataUrl: canvas.toDataURL('image/jpeg', 0.9),
      hasCutout: false
    };
  }
}

/**
 * Genera una versión con fondo blanco estilo estudio a partir de una imagen recortada con transparencia
 */
async function generateWhiteStudioFromCutout(cutoutUrl: string, width: number, height: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(cutoutUrl);
        return;
      }
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.94));
    };
    img.onerror = () => resolve(cutoutUrl);
    img.src = cutoutUrl;
  });
}

/**
 * Local extraction of face/skin tone, eye color, hair tone and face shape for Zero-Biometric styling.
 * Converts user photo into an anonymous string profile in local memory without sending images anywhere.
 */
export const extractLocalBiometricFeatures = async (
  file: File
): Promise<FacialAnalysisResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // 1. Conservar relación de aspecto original de la foto para guardado en local
        const origWidth = img.naturalWidth || img.width || 600;
        const origHeight = img.naturalHeight || img.height || 800;
        const maxDim = 900;
        let saveW = origWidth;
        let saveH = origHeight;
        if (saveW > maxDim || saveH > maxDim) {
          if (saveW > saveH) {
            saveH = Math.round((saveH * maxDim) / saveW);
            saveW = maxDim;
          } else {
            saveW = Math.round((saveW * maxDim) / saveH);
            saveH = maxDim;
          }
        }

        const saveCanvas = document.createElement('canvas');
        saveCanvas.width = saveW;
        saveCanvas.height = saveH;
        const sCtx = saveCanvas.getContext('2d');
        if (sCtx) {
          sCtx.drawImage(img, 0, 0, saveW, saveH);
        }
        // Foto de alta calidad en formato y relación de aspecto original
        const facePhotoDataUrl = saveCanvas.toDataURL('image/jpeg', 0.92);

        // 2. Canvas de medición normalizado (recorte centrado proporcional sin aplastar píxeles)
        const canvas = document.createElement('canvas');
        canvas.width = 240;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ ...getDefaultAnalysis(), facePhotoDataUrl });
          return;
        }

        const scale = Math.max(240 / origWidth, 240 / origHeight);
        const cropX = (origWidth - 240 / scale) / 2;
        const cropY = (origHeight - 240 / scale) / 2;
        ctx.drawImage(img, cropX, cropY, 240 / scale, 240 / scale, 0, 0, 240, 240);

        // 1. ZONA MEJILLAS & PUENTE NASAL (Piel y subtono)
        const skinData = ctx.getImageData(80, 100, 80, 50).data;
        let sR = 0, sG = 0, sB = 0, sCount = 0;
        for (let i = 0; i < skinData.length; i += 4) {
          sR += skinData[i];
          sG += skinData[i + 1];
          sB += skinData[i + 2];
          sCount++;
        }
        const avgSkinR = sCount > 0 ? sR / sCount : 205;
        const avgSkinG = sCount > 0 ? sG / sCount : 175;
        const avgSkinB = sCount > 0 ? sB / sCount : 155;
        const skinBrightness = (avgSkinR + avgSkinG + avgSkinB) / 3;

        // Subtono de piel
        let undertone: 'calido' | 'frio' | 'neutro' = 'neutro';
        if (avgSkinR > avgSkinB * 1.22) {
          undertone = 'calido';
        } else if (avgSkinB > avgSkinG * 0.96 || Math.abs(avgSkinR - avgSkinB) < 18) {
          undertone = 'frio';
        }

        // Tono / Luminosidad de piel
        let skinTone: 'muy_claro' | 'claro' | 'medio' | 'bronceado' | 'oscuro' = 'medio';
        if (skinBrightness > 215) skinTone = 'muy_claro';
        else if (skinBrightness > 175) skinTone = 'claro';
        else if (skinBrightness > 135) skinTone = 'medio';
        else if (skinBrightness > 95) skinTone = 'bronceado';
        else skinTone = 'oscuro';

        // 2. ZONA CABELLO / NACIMIENTO (y: 15-50, x: 60-180)
        const hairData = ctx.getImageData(60, 15, 120, 35).data;
        let hR = 0, hG = 0, hB = 0, hCount = 0;
        for (let i = 0; i < hairData.length; i += 4) {
          hR += hairData[i];
          hG += hairData[i + 1];
          hB += hairData[i + 2];
          hCount++;
        }
        const avgHairR = hCount > 0 ? hR / hCount : 70;
        const avgHairG = hCount > 0 ? hG / hCount : 50;
        const avgHairB = hCount > 0 ? hB / hCount : 40;
        const hairBrightness = (avgHairR + avgHairG + avgHairB) / 3;

        let detectedHair = 'Castaño oscuro';
        if (hairBrightness < 55) {
          detectedHair = 'Negro azabache';
        } else if (avgHairR > avgHairG * 1.3 && avgHairR > avgHairB * 1.4 && avgHairR > 90) {
          detectedHair = 'Pelirrojo / Cobrizo cálido';
        } else if (hairBrightness > 135) {
          detectedHair = undertone === 'calido' ? 'Rubio dorado luminoso' : 'Rubio ceniza / Platino';
        } else if (avgHairR > avgHairB * 1.2) {
          detectedHair = 'Castaño avellana / Miel';
        } else {
          detectedHair = 'Castaño chocolate';
        }

        // 3. ZONA OCULAR & IRIS (y: 75-105, x: 65-100 y x: 140-175)
        const eyeLeftData = ctx.getImageData(65, 75, 35, 30).data;
        const eyeRightData = ctx.getImageData(140, 75, 35, 30).data;
        let irisPixels: { r: number; g: number; b: number }[] = [];

        const collectIris = (data: Uint8ClampedArray) => {
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const br = (r + g + b) / 3;
            // Filtrar esclerótica blanca (br > 210) y sombras extremas (br < 25)
            if (br > 30 && br < 160) {
              irisPixels.push({ r, g, b });
            }
          }
        };
        collectIris(eyeLeftData);
        collectIris(eyeRightData);

        let detectedEyes = 'Miel / Marrón cálido';
        if (irisPixels.length > 0) {
          const sumI = irisPixels.reduce((acc, p) => ({ r: acc.r + p.r, g: acc.g + p.g, b: acc.b + p.b }), { r: 0, g: 0, b: 0 });
          const irR = sumI.r / irisPixels.length;
          const irG = sumI.g / irisPixels.length;
          const irB = sumI.b / irisPixels.length;
          const eyeBr = (irR + irG + irB) / 3;

          if (irB > irR * 1.15 && irB > 65) {
            detectedEyes = 'Azul zafiro / Gris azulado';
          } else if (irG > irB * 1.1 && irG > irR * 0.95 && eyeBr > 65) {
            detectedEyes = 'Verde oliva / Avellana';
          } else if (irR > irB * 1.3 && eyeBr > 70) {
            detectedEyes = 'Miel / Ámbar dorado';
          } else if (eyeBr < 60) {
            detectedEyes = 'Marrón café profundo';
          } else {
            detectedEyes = 'Marrón castaño suave';
          }
        }

        // 4. FORMA DE CARA & VISAGISMO (Proporciones ancho / alto)
        // Estimación por silueta y contorno facial
        const imgAspect = img.naturalHeight / (img.naturalWidth || 1);
        let faceShape: FaceShape = 'ovalada';
        
        // Medir ancho facial a distintos niveles
        const widthTop = estimateSkinWidthAtY(ctx, 70);
        const widthMiddle = estimateSkinWidthAtY(ctx, 120);
        const widthJaw = estimateSkinWidthAtY(ctx, 170);

        const jawToCheekRatio = widthMiddle > 0 ? widthJaw / widthMiddle : 0.75;
        const foreheadToCheekRatio = widthMiddle > 0 ? widthTop / widthMiddle : 0.85;

        if (jawToCheekRatio > 0.88 && imgAspect < 1.15) {
          faceShape = 'cuadrada';
        } else if (jawToCheekRatio > 0.82 && imgAspect < 1.18) {
          faceShape = 'redonda';
        } else if (jawToCheekRatio < 0.65 && foreheadToCheekRatio > 0.85) {
          faceShape = 'corazon';
        } else if (foreheadToCheekRatio < 0.75 && jawToCheekRatio < 0.75) {
          faceShape = 'diamante';
        } else if (imgAspect > 1.35 || (widthMiddle > 0 && 200 / widthMiddle > 1.5)) {
          faceShape = 'alargada';
        } else {
          faceShape = 'ovalada';
        }

        // 5. CONTRASTE FACIAL
        const contrastDelta = Math.abs(skinBrightness - hairBrightness);
        let facialContrast: FacialContrast = 'medio';
        if (contrastDelta > 95) facialContrast = 'alto';
        else if (contrastDelta < 50) facialContrast = 'suave';

        // 6. ARMONÍA CROMÁTICA PERSONAL
        const colorSeason: ColorSeason = calculateColorSeason({
          skinUndertone: undertone,
          skinTone,
          facialContrast,
          eyeColor: detectedEyes,
          hairColor: detectedHair
        });

        // 7. CONSEJOS DE VISAGISMO PERSONALIZADOS
        const jewelryTip = getJewelryTip(faceShape, undertone);
        const necklineTip = getNecklineTip(faceShape);
        const eyewearTip = getEyewearTip(faceShape);

        const summaryText = `Análisis Facial completado: Rostro ${faceShape.toUpperCase()} con contraste ${facialContrast}. Piel de subtono ${undertone} (${skinTone}), ojos ${detectedEyes} y cabello ${detectedHair}. Tu Armonía Cromática Personal ideal es ${colorSeason}.`;

        resolve({
          skinTone,
          skinUndertone: undertone,
          eyeColor: detectedEyes,
          hairColor: detectedHair,
          faceShape,
          facialContrast,
          colorSeason,
          summaryText,
          jewelryTip,
          necklineTip,
          eyewearTip,
          facePhotoDataUrl
        });
      };
      img.onerror = () => resolve(getDefaultAnalysis());
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(getDefaultAnalysis());
    reader.readAsDataURL(file);
  });
};

function estimateSkinWidthAtY(ctx: CanvasRenderingContext2D, y: number): number {
  try {
    const row = ctx.getImageData(20, y, 200, 1).data;
    let firstSkin = -1;
    let lastSkin = -1;
    for (let i = 0; i < row.length; i += 4) {
      const r = row[i], g = row[i + 1], b = row[i + 2];
      // Típico criterio de piel humana en espacio RGB
      if (r > 60 && g > 40 && b > 20 && r > b && (r - g) > 10) {
        const x = i / 4;
        if (firstSkin === -1) firstSkin = x;
        lastSkin = x;
      }
    }
    return firstSkin !== -1 && lastSkin !== -1 ? lastSkin - firstSkin : 100;
  } catch {
    return 100;
  }
}

export const getJewelryTip = (shape: FaceShape, undertone: 'calido' | 'frio' | 'neutro'): string => {
  const metal = undertone === 'calido' ? 'dorados cálidos y oro amarillo' : undertone === 'frio' ? 'plata pulida, platino u oro blanco' : 'oro rosa o plata brillante';
  switch (shape) {
    case 'redonda':
      return `Apuesta por pendientes largos, lineales o geométricos en ${metal}. Alargan visualmente el cuello y afinan las mejillas. Evita aros circulares grandes.`;
    case 'cuadrada':
      return `Te favorecen pendientes con curvas suaves, aros medianos y formas ovaladas en ${metal}. Suavizan los ángulos de la mandíbula.`;
    case 'corazon':
      return `Ideales los pendientes tipo lágrima, candelabro o con volumen en la parte inferior en ${metal}. Equilibran la barbilla afinada.`;
    case 'diamante':
      return `Pendientes pegados al lóbulo o formas curvas que ensanchen la zona de la mandíbula en ${metal}. Evita piezas excesivamente anchas a la altura de los pómulos.`;
    case 'alargada':
      return `Pendientes con volumen horizontal, aros anchos o botones vistosos en ${metal}. Aportan anchura armónica y rompen la verticalidad.`;
    case 'ovalada':
    default:
      return `Tienes la proporción más versátil. Cualquier diseño en ${metal} te sienta fenomenal, especialmente pendientes colgantes articulados.`;
  }
};

export const getNecklineTip = (shape: FaceShape): string => {
  switch (shape) {
    case 'redonda':
      return 'Escotes en V, pico o corazón que generen líneas verticales y despejen la clavícula.';
    case 'cuadrada':
      return 'Escotes redondos, escote barco fluido o cuchara para suavizar la estructura ósea.';
    case 'corazon':
      return 'Escotes cuadrados, barco o cuello cisne suave que compensen la amplitud de la frente.';
    case 'diamante':
      return 'Escote drapeado, escote en V suave o cuello halter que enmarque los hombros.';
    case 'alargada':
      return 'Escotes barco, cuello vuelto, redondos altos o cuellos tipo polo para acortar visualmente.';
    case 'ovalada':
    default:
      return 'Cualquier escote: desde palabra de honor y halter hasta asimétricos o cuellos camisa.';
  }
};

export interface ColorSeasonCalculationParams {
  skinUndertone: 'calido' | 'frio' | 'neutro';
  skinTone: 'muy_claro' | 'claro' | 'medio' | 'bronceado' | 'oscuro';
  facialContrast: FacialContrast;
  eyeColor?: string;
  hairColor?: string;
}

/**
 * Calcula con precisión la Armonía Cromática Personal óptima según el sistema de 12 armonías
 * a partir de las 4 variables fisonómicas esenciales: subtono, tono, contraste facial y matiz de ojos/pelo.
 */
export function calculateColorSeason(params: ColorSeasonCalculationParams): ColorSeason {
  const { skinUndertone, skinTone, facialContrast, eyeColor = '', hairColor = '' } = params;

  const isLightSkin = skinTone === 'muy_claro' || skinTone === 'claro';
  const isDeepSkin = skinTone === 'bronceado' || skinTone === 'oscuro';

  const hasLightEyes = eyeColor.includes('Azul') || eyeColor.includes('Verde') || eyeColor.includes('Gris');
  const hasWarmEyes = eyeColor.includes('Miel') || eyeColor.includes('Ámbar') || eyeColor.includes('dorado');
  const hasDeepEyes = eyeColor.includes('profundo') || eyeColor.includes('café') || eyeColor.includes('Negro');

  const hasDarkHair = hairColor.includes('Negro') || hairColor.includes('oscuro') || hairColor.includes('chocolate');
  const hasLightHair = hairColor.includes('Rubio') || hairColor.includes('Platino');
  const hasRedHair = hairColor.includes('Pelirrojo') || hairColor.includes('Cobrizo');
  const hasWarmHair = hasRedHair || hairColor.includes('dorado') || hairColor.includes('Miel') || hairColor.includes('avellana');
  const hasCoolHair = hairColor.includes('ceniza') || hairColor.includes('Platino') || hairColor.includes('azabache');

  // 1. SUBTONO CÁLIDO
  if (skinUndertone === 'calido') {
    // Alto contraste y brillo luminoso -> Cálida Vibrante
    if (facialContrast === 'alto') {
      return 'Cálida Vibrante';
    }

    // Piel clara + ojos claros o pelo rubio -> Cálida Luminosa
    if (isLightSkin && (hasLightHair || hasLightEyes)) {
      return 'Cálida Luminosa';
    }

    // Cabello cobrizo / pelirrojo o reflejos dorados con ojos ámbar -> Cálida Terrosa
    if (hasRedHair || (hasWarmEyes && hasWarmHair)) {
      return 'Cálida Terrosa';
    }

    // Piel profunda o cabello castaño muy oscuro / café con piel cálida -> Cálida Profunda
    if (isDeepSkin || (hasDarkHair && !isLightSkin)) {
      return 'Cálida Profunda';
    }

    // Contraste suave / tonos tierra aterciopelados -> Cálida Suave
    if (facialContrast === 'suave') {
      return 'Cálida Suave';
    }

    // Piel clara/media con tonos dorados vivos -> Cálida Dorada
    if (hasWarmHair || hasWarmEyes || isLightSkin) {
      return 'Cálida Dorada';
    }

    return 'Cálida Suave';
  }

  // 2. SUBTONO FRÍO
  if (skinUndertone === 'frio') {
    // Alto contraste o pelo negro azabache -> Familia Fría Intensa / Cristalina / Profunda
    if (facialContrast === 'alto' || hairColor.includes('azabache') || (hasDarkHair && isLightSkin)) {
      if (hasLightEyes) {
        return 'Fría Intensa';
      }
      if (isDeepSkin || hasDeepEyes) {
        return 'Fría Profunda';
      }
      return 'Fría Cristalina';
    }

    // Piel clara con cabello rubio ceniza o claro -> Fría Clara
    if (isLightSkin && (hasLightHair || hasLightEyes)) {
      return 'Fría Clara';
    }

    // Piel profunda o pelo muy oscuro frío -> Fría Profunda
    if (isDeepSkin || hasDarkHair) {
      return 'Fría Profunda';
    }

    // Rasgos fríos predominantes (ojos azules/grises o pelo ceniza) -> Fría Serena
    if (hasLightEyes || hasCoolHair) {
      return 'Fría Serena';
    }

    // Contraste suave / empolvado -> Fría Empolvada
    return 'Fría Empolvada';
  }

  // 3. SUBTONO NEUTRO
  // En neutro, el contraste facial y la luminosidad de piel/ojos guían la elección
  if (facialContrast === 'alto') {
    return hasLightEyes ? 'Fría Cristalina' : 'Cálida Vibrante';
  }

  if (isDeepSkin || (hasDarkHair && hasDeepEyes)) {
    return 'Cálida Profunda';
  }

  if (isLightSkin && (hasLightHair || hasLightEyes)) {
    return 'Fría Clara';
  }

  if (facialContrast === 'suave') {
    return (hasWarmEyes || hasWarmHair) ? 'Cálida Suave' : 'Fría Empolvada';
  }

  return 'Cálida Suave';
}

export const getEyewearTip = (shape: FaceShape): string => {
  switch (shape) {
    case 'redonda':
      return 'Gafas cuadradas, rectangulares o estilo cat-eye angular. Rompen la redondez facial.';
    case 'cuadrada':
      return 'Gafas redondeadas, ovaladas o de líneas curvas suaves. Aportan fluidez a la mandíbula.';
    case 'corazon':
      return 'Monturas finas metálicas, estilo aviador o cat-eye suave más anchas que la frente.';
    case 'diamante':
      return 'Gafas ovaladas o rectangulares sin montura inferior que resalten la línea de los ojos.';
    case 'alargada':
      return 'Gafas oversize cuadradas o wayfarer con patillas llamativas que aporten anchura.';
    case 'ovalada':
    default:
      return 'Wayfarer, cat-eye, aviador o geométricas: cualquier montura proporcionada a tu rostro te quedará impecable.';
  }
};

const getDefaultAnalysis = (): FacialAnalysisResult => ({
  skinTone: 'claro',
  skinUndertone: 'calido',
  eyeColor: 'Miel / Marrón cálido',
  hairColor: 'Castaño iluminado / Avellana',
  faceShape: 'ovalada',
  facialContrast: 'medio',
  colorSeason: 'Cálida Suave',
  summaryText: 'Perfil calibrado en Armonía Cromática Personal Cálida Suave. Rostro ovalado equilibrado con ojos color miel y cabello castaño avellana.',
  jewelryTip: 'Apuesta por pendientes y detalles en oro amarillo cálido o tonos bronce.',
  necklineTip: 'Los escotes en V y cuellos fluidos favorecen la proporción natural de tu cuello.',
  eyewearTip: 'Gafas de sol cat-eye o rectangulares de pasta carey o marrón cálido.'
});
