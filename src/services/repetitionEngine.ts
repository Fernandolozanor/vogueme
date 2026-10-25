import type { ClothingItem, Category } from '../types';
import type { LoggedWear } from './storage';

export interface GarmentVisualWeight {
  category: Category;
  baseWeight: number; // Percentage contribution to overall look visual perception
}

// Pesos visuales por categoría según impacto en la memoria visual
const VISUAL_WEIGHTS: Record<Category, number> = {
  dress: 50,      // Un vestido o mono cubre casi todo el cuerpo y define el look
  outerwear: 40,  // Abrigo, blazer o chaqueta: lo primero que se ve
  top: 35,        // Camisa, blusa, jersey: zona frontal superior
  bottom: 25,     // Vaquero, pantalón o falda: base inferior
  shoes: 15,      // Calzado: detalle perceptivo
  accessory: 10   // Bolsos, bufandas, joyas: complementos secundarios
};

// Familias de colores para detectar similitud de tonalidad
const COLOR_FAMILIES: Record<string, string[]> = {
  blancos: ['blanco', 'blanco roto', 'crudo', 'marfil', 'hueso', 'perla'],
  negros_grises: ['negro', 'gris marengo', 'antracita', 'gris carbón', 'gris plomo', 'gris'],
  tierras_camel: ['beige', 'beige arena', 'camel', 'topo', 'tostado', 'marron', 'chocolate', 'arena', 'visón'],
  azules: ['azul marino', 'azul noche', 'celeste', 'azul cielo', 'azul indigo', 'denim'],
  rojos_burdeos: ['burdeos', 'granate', 'vino', 'rojo carmín', 'rojo cereza', 'frambuesa'],
  verdes: ['verde esmeralda', 'verde caqui', 'oliva', 'verde bosque', 'verde botella', 'musgo']
};

/**
 * Determina si dos prendas pertenecen a la misma familia tonal o tienen un color muy similar
 */
export const areColorsVisuallySimilar = (colorA: string, colorB: string): boolean => {
  const normA = (colorA || '').toLowerCase().trim();
  const normB = (colorB || '').toLowerCase().trim();

  if (normA === normB) return true;

  for (const family of Object.values(COLOR_FAMILIES)) {
    const hasA = family.some(c => normA.includes(c) || c.includes(normA));
    const hasB = family.some(c => normB.includes(c) || c.includes(normB));
    if (hasA && hasB) return true;
  }

  return false;
};

/**
 * Calcula la similitud visual perceptiva entre dos prendas (0 a 1)
 */
export const calculateGarmentSimilarity = (
  itemA: ClothingItem,
  itemB: ClothingItem
): { score: number; reason?: string } => {
  // Prenda idéntica
  if (itemA.id === itemB.id) {
    return { score: 1.0, reason: `Misma prenda: ${itemA.name}` };
  }

  // Distinta categoría no se consideran la misma pieza
  if (itemA.category !== itemB.category) {
    return { score: 0.0 };
  }

  let similarity = 0;
  const reasons: string[] = [];

  // Mismo subgénero (ej. blazer vs blazer, jersey vs jersey, vaquero vs vaquero)
  if (itemA.subCategory && itemB.subCategory && itemA.subCategory.toLowerCase() === itemB.subCategory.toLowerCase()) {
    similarity += 0.35;
    reasons.push(`Mismo tipo (${itemA.subCategory})`);
  }

  // Similitud de color / tono visual
  if (areColorsVisuallySimilar(itemA.colorName, itemB.colorName)) {
    similarity += 0.35;
    reasons.push(`Color muy similar (${itemA.colorName} vs ${itemB.colorName})`);
  }

  // Coincidencia de estilos
  const stylesA = new Set(itemA.styles || []);
  const sharedStyles = (itemB.styles || []).filter(s => stylesA.has(s));
  if (sharedStyles.length > 0) {
    similarity += Math.min(0.15, sharedStyles.length * 0.05);
  }

  // Si dos prendas son del mismo tipo y color (ej: 2 jerséis crudos o 2 camisas blancas),
  // para los demás son prácticamente el mismo look (hasta 0.85 de similitud).
  const finalScore = Math.min(0.85, similarity);

  return {
    score: finalScore,
    reason: reasons.length > 0 ? reasons.join(' y ') : undefined
  };
};

export interface OutfitComparisonResult {
  similarityScore: number; // 0 to 100
  dominantSharedItem?: ClothingItem;
  sharedReasons: string[];
  exactGarmentsCount: number;
  totalGarmentsCompared: number;
}

/**
 * Compara dos outfits completos y calcula el % de similitud visual percibida
 */
export const calculateOutfitSimilarity = (
  itemsA: ClothingItem[],
  itemsB: ClothingItem[]
): OutfitComparisonResult => {
  if (itemsA.length === 0 || itemsB.length === 0) {
    return {
      similarityScore: 0,
      sharedReasons: [],
      exactGarmentsCount: 0,
      totalGarmentsCompared: 0
    };
  }

  const byCategoryA = new Map<Category, ClothingItem>();
  const byCategoryB = new Map<Category, ClothingItem>();

  itemsA.forEach(i => byCategoryA.set(i.category, i));
  itemsB.forEach(i => byCategoryB.set(i.category, i));

  let totalWeightedScore = 0;
  let totalApplicableWeights = 0;
  let dominantSharedItem: ClothingItem | undefined;
  let maxItemImpact = 0;
  const sharedReasons: string[] = [];
  let exactGarmentsCount = 0;

  // Si uno de los dos lleva vestido, se ignora top y bottom
  const hasDressA = byCategoryA.has('dress');
  const hasDressB = byCategoryB.has('dress');

  const categoriesToCheck: Category[] = (hasDressA || hasDressB)
    ? ['dress', 'outerwear', 'shoes', 'accessory']
    : ['outerwear', 'top', 'bottom', 'shoes', 'accessory'];

  for (const cat of categoriesToCheck) {
    const itemA = byCategoryA.get(cat);
    const itemB = byCategoryB.get(cat);

    const baseWeight = VISUAL_WEIGHTS[cat] || 20;

    if (itemA && itemB) {
      totalApplicableWeights += baseWeight;
      const { score, reason } = calculateGarmentSimilarity(itemA, itemB);

      totalWeightedScore += score * baseWeight;

      if (score >= 0.7) {
        if (baseWeight > maxItemImpact) {
          maxItemImpact = baseWeight;
          dominantSharedItem = itemA;
        }
        if (reason) sharedReasons.push(reason);
      }

      if (itemA.id === itemB.id) {
        exactGarmentsCount++;
      }
    } else if (itemA || itemB) {
      // Uno de los outfits tiene esta prenda y el otro no
      // Añade penalización de diferencia pero suma peso base
      totalApplicableWeights += baseWeight * 0.7;
    }
  }

  const normalizedScore = totalApplicableWeights > 0
    ? Math.round((totalWeightedScore / totalApplicableWeights) * 100)
    : 0;

  return {
    similarityScore: Math.min(100, Math.max(0, normalizedScore)),
    dominantSharedItem,
    sharedReasons,
    exactGarmentsCount,
    totalGarmentsCompared: Math.max(itemsA.length, itemsB.length)
  };
};

export type RepetitionLevel = 'fresh' | 'moderate' | 'high';

export interface RepetitionDiagnosis {
  level: RepetitionLevel;
  score: number; // 0 to 100 del look más similar
  headline: string;
  detail: string;
  badgeText: string;
  daysAgo?: number;
  lastWornDate?: string;
  lastWornOccasion?: string;
  dominantPieceName?: string;
  tips: string[];
}

/**
 * Analiza un look propuesto frente al historial registrado de outfits
 */
export const analyzeOutfitAgainstHistory = (
  currentItems: ClothingItem[],
  history: LoggedWear[],
  wardrobe: ClothingItem[]
): RepetitionDiagnosis => {
  if (currentItems.length === 0) {
    return {
      level: 'fresh',
      score: 0,
      headline: 'Sin prendas seleccionadas',
      detail: 'Elige prendas para evaluar el nivel de repetición.',
      badgeText: 'Sin datos',
      tips: []
    };
  }

  if (history.length === 0) {
    return {
      level: 'fresh',
      score: 0,
      headline: 'Look 100% Fresco y Novedoso',
      detail: 'Primer look registrado en tu calendario. ¡Sin repeticiones previas!',
      badgeText: '✨ 100% Fresco',
      tips: ['Registra tus looks a diario para que tu estilista IA aprenda tus patrones de uso.']
    };
  }

  const wardrobeMap = new Map(wardrobe.map(i => [i.id, i]));
  const now = new Date().getTime();

  let highestSimilarity = 0;
  let mostSimilarPastLog: LoggedWear | null = null;
  let mostSimilarDaysAgo = 999;
  let mostSimilarComparison: OutfitComparisonResult | null = null;

  for (const log of history) {
    const pastItems = log.itemIds
      .map(id => wardrobeMap.get(id))
      .filter((i): i is ClothingItem => Boolean(i));

    if (pastItems.length === 0) continue;

    const logDate = new Date(log.date).getTime();
    const daysAgo = Math.max(0, Math.floor((now - logDate) / (1000 * 60 * 60 * 24)));

    const comp = calculateOutfitSimilarity(currentItems, pastItems);

    // Damos más peso al look más similar si ocurrió en los últimos 14 días
    const recencyWeight = daysAgo <= 3 ? 1.2 : daysAgo <= 7 ? 1.0 : daysAgo <= 14 ? 0.8 : 0.6;
    const effectiveScore = comp.similarityScore * recencyWeight;

    if (effectiveScore > highestSimilarity) {
      highestSimilarity = effectiveScore;
      mostSimilarPastLog = log;
      mostSimilarDaysAgo = daysAgo;
      mostSimilarComparison = comp;
    }
  }

  const rawScore = mostSimilarComparison?.similarityScore || 0;

  // 1. REPETICIÓN ALTA: Similitud muy elevada y usado hace menos de 5 días
  if (rawScore >= 70 && mostSimilarDaysAgo <= 4) {
    const dayLabel = mostSimilarDaysAgo === 0 
      ? 'hoy mismo' 
      : mostSimilarDaysAgo === 1 
      ? 'ayer' 
      : `hace ${mostSimilarDaysAgo} días`;

    return {
      level: 'high',
      score: rawScore,
      headline: 'Alerta de Repetición Visual Alta',
      detail: `Este look tiene un ${rawScore}% de coincidencia visual con el conjunto que llevaste ${dayLabel} (${mostSimilarPastLog?.occasion || 'Casual'}).`,
      badgeText: `⚠️ Look casi repetido (${dayLabel})`,
      daysAgo: mostSimilarDaysAgo,
      lastWornDate: mostSimilarPastLog?.date,
      lastWornOccasion: mostSimilarPastLog?.occasion,
      dominantPieceName: mostSimilarComparison?.dominantSharedItem?.name,
      tips: [
        'Cambia la chaqueta exterior o el blazer por otra capa para transformar el impacto visual.',
        'Sustituye la prenda inferior por un color o silueta diferente para que no parezca el mismo look.',
        'Añade un accesorio de acento o cambia de calzado para alterar las proporciones.'
      ]
    };
  }

  // 2. REPETICIÓN MODERADA: Prenda protagonista repetida recientemente
  if ((rawScore >= 45 && mostSimilarDaysAgo <= 6) || (mostSimilarComparison?.dominantSharedItem && mostSimilarDaysAgo <= 3)) {
    const dayLabel = mostSimilarDaysAgo === 0 
      ? 'hoy' 
      : mostSimilarDaysAgo === 1 
      ? 'ayer' 
      : `hace ${mostSimilarDaysAgo} días`;

    const pieceName = mostSimilarComparison?.dominantSharedItem?.name || 'prenda protagonista';

    return {
      level: 'moderate',
      score: rawScore,
      headline: 'Prenda Protagonista Reciente',
      detail: `Compartes la ${pieceName} con el look de ${dayLabel}. El resto del outfit aporta novedad.`,
      badgeText: `⚡ Prenda clave usada ${dayLabel}`,
      daysAgo: mostSimilarDaysAgo,
      lastWornDate: mostSimilarPastLog?.date,
      lastWornOccasion: mostSimilarPastLog?.occasion,
      dominantPieceName: pieceName,
      tips: [
        `Si quieres distanciarte del look de ${dayLabel}, combina la ${pieceName} con colores opuestos.`,
        'Los complementos neutros te permiten reutilizar prendas clave sin saturar.'
      ]
    };
  }

  // 3. LOOK FRESCO
  return {
    level: 'fresh',
    score: rawScore,
    headline: 'Look Fresco & Diferenciado',
    detail: mostSimilarPastLog
      ? `Buena rotación de armario: ninguna prenda principal coincide con los últimos ${Math.min(mostSimilarDaysAgo, 14)} días.`
      : 'Look completamente fresco sin coincidencias visuales recientes.',
    badgeText: '✨ Look 100% Fresco',
    daysAgo: mostSimilarDaysAgo,
    lastWornDate: mostSimilarPastLog?.date,
    lastWornOccasion: mostSimilarPastLog?.occasion,
    tips: [
      '¡Combinación óptima! Estás rotando tus prendas de forma equilibrada y sostenible.'
    ]
  };
};

/**
 * Métricas mensuales de uso y repetición para el Calendario
 */
export interface MonthlyCalendarStats {
  totalOutfitsLogged: number;
  uniqueGarmentsWornCount: number;
  rotationPercentage: number;
  mostRepeatedItems: Array<{ item: ClothingItem; wearCountMonth: number }>;
  currentStreakDays: number;
}

export const calculateMonthlyStats = (
  history: LoggedWear[],
  wardrobe: ClothingItem[],
  currentMonth: Date = new Date()
): MonthlyCalendarStats => {
  const month = currentMonth.getMonth();
  const year = currentMonth.getFullYear();

  const monthLogs = history.filter(log => {
    const d = new Date(log.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const wardrobeMap = new Map(wardrobe.map(i => [i.id, i]));
  const itemCounts: Record<string, number> = {};

  monthLogs.forEach(log => {
    log.itemIds.forEach(id => {
      itemCounts[id] = (itemCounts[id] || 0) + 1;
    });
  });

  const uniqueGarmentIds = Object.keys(itemCounts);
  const totalWardrobe = wardrobe.length || 1;
  const rotationPercentage = Math.min(100, Math.round((uniqueGarmentIds.length / totalWardrobe) * 100));

  const mostRepeatedItems = uniqueGarmentIds
    .map(id => ({
      item: wardrobeMap.get(id)!,
      wearCountMonth: itemCounts[id]
    }))
    .filter(entry => Boolean(entry.item))
    .sort((a, b) => b.wearCountMonth - a.wearCountMonth)
    .slice(0, 3);

  // Racha de días seguidos con registro
  let streak = 0;
  const todayStr = new Date().toISOString().split('T')[0];
  const loggedDates = new Set(history.map(l => l.date.split('T')[0]));

  let checkDate = new Date();
  if (!loggedDates.has(todayStr)) {
    // Si no ha registrado hoy, comprobar desde ayer
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (loggedDates.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    totalOutfitsLogged: monthLogs.length,
    uniqueGarmentsWornCount: uniqueGarmentIds.length,
    rotationPercentage,
    mostRepeatedItems,
    currentStreakDays: streak
  };
};
