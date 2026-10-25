import type { ClothingItem, UserProfile } from '../types';

export type ClimateType = 'calido' | 'templado' | 'fresco' | 'frio';
export type EnvironmentType = 'urbano' | 'playa' | 'rural' | 'nieve' | 'relax';
export type TripActivity = 
  | 'turismo' 
  | 'cenas' 
  | 'playa' 
  | 'trabajo' 
  | 'senderismo' 
  | 'cultura' 
  | 'relax';

export interface TripConfig {
  destination: string;
  customDestination?: string;
  startDate: string; // YYYY-MM-DD
  days: number;
  climate: ClimateType;
  environment: EnvironmentType;
  activities: TripActivity[];
}

export interface LuggagePreset {
  name: string;
  icon: string;
  country: string;
  avgTemp: string;
  vibe: string;
  defaultClimate: ClimateType;
  defaultEnvironment: EnvironmentType;
  defaultActivities: TripActivity[];
}

export const TRIP_PRESETS: LuggagePreset[] = [
  { 
    name: 'París', 
    icon: '🥐', 
    country: 'Francia',
    avgTemp: '18°C', 
    vibe: 'Chic, cafés en terraza & museos icónicos',
    defaultClimate: 'templado',
    defaultEnvironment: 'urbano',
    defaultActivities: ['turismo', 'cultura', 'cenas']
  },
  { 
    name: 'Ibiza / Costa', 
    icon: '🌊', 
    country: 'España',
    avgTemp: '27°C', 
    vibe: 'Playa, tardeo, lino & cenas frente al mar',
    defaultClimate: 'calido',
    defaultEnvironment: 'playa',
    defaultActivities: ['playa', 'cenas', 'relax']
  },
  { 
    name: 'Londres', 
    icon: '🌧️', 
    country: 'Reino Unido',
    avgTemp: '14°C', 
    vibe: 'Layering, trench coats & paseos cosmopolitas',
    defaultClimate: 'fresco',
    defaultEnvironment: 'urbano',
    defaultActivities: ['turismo', 'cultura', 'cenas']
  },
  { 
    name: 'Roma', 
    icon: '🏛️', 
    country: 'Italia',
    avgTemp: '22°C', 
    vibe: 'Comfy chic para caminar 20.000 pasos & trattorias',
    defaultClimate: 'templado',
    defaultEnvironment: 'urbano',
    defaultActivities: ['turismo', 'cultura', 'cenas']
  },
  { 
    name: 'Escapada Rural', 
    icon: '🌲', 
    country: 'Naturaleza',
    avgTemp: '15°C', 
    vibe: 'Botas, prendas de punto & comodidad total',
    defaultClimate: 'fresco',
    defaultEnvironment: 'rural',
    defaultActivities: ['senderismo', 'relax']
  },
  { 
    name: 'Milán', 
    icon: '✨', 
    country: 'Italia',
    avgTemp: '19°C', 
    vibe: 'Sastrería impecable, aperitivos chic & moda',
    defaultClimate: 'templado',
    defaultEnvironment: 'urbano',
    defaultActivities: ['turismo', 'cenas', 'cultura']
  },
  { 
    name: 'Sierra / Nieve', 
    icon: '❄️', 
    country: 'Montaña',
    avgTemp: '3°C', 
    vibe: 'Plumas térmico, punto grueso & après-ski',
    defaultClimate: 'frio',
    defaultEnvironment: 'nieve',
    defaultActivities: ['senderismo', 'relax']
  }
];

export interface LuggageRecommendationItem {
  item: ClothingItem;
  roleReason: string;
  categoryGroup: 'top' | 'bottom' | 'shoes' | 'outerwear' | 'dress' | 'accessory';
  matchScore: number;
}

export interface LuggageCapsuleResult {
  items: LuggageRecommendationItem[];
  totalOutfitsCount: number;
  packingFormula: {
    tops: number;
    bottoms: number;
    shoes: number;
    outerwear: number;
    dresses: number;
    accessories: number;
  };
  paletteHarmonyDescription: string;
  stylingAdvice: string;
}

// Neutral base colors that easily combine
const NEUTRAL_COLORS = ['blanco', 'negro', 'beige', 'arena', 'camel', 'gris', 'marino', 'denim', 'crudo', 'marron', 'taupe'];

/**
 * Calculates optimal category quotas based on trip duration, climate, and activities
 */
function getCapsuleQuotas(config: TripConfig, hasDressesInWardrobe: boolean) {
  const { days, climate, activities } = config;
  
  let topsCount = 3;
  let bottomsCount = 2;
  let shoesCount = 2;
  let outerwearCount = 1;
  let dressesCount = hasDressesInWardrobe ? 1 : 0;
  let accessoriesCount = 2;

  if (days <= 2) {
    topsCount = 2;
    bottomsCount = 2;
    shoesCount = 1;
    outerwearCount = climate === 'calido' ? 0 : 1;
    dressesCount = hasDressesInWardrobe && (activities.includes('cenas') || activities.includes('playa')) ? 1 : 0;
    accessoriesCount = 1;
  } else if (days === 3) {
    topsCount = 3;
    bottomsCount = 2;
    shoesCount = 2;
    outerwearCount = climate === 'calido' ? 1 : 1;
    dressesCount = hasDressesInWardrobe ? 1 : 0;
    accessoriesCount = 2;
  } else if (days <= 5) {
    topsCount = 4;
    bottomsCount = 3;
    shoesCount = 2;
    outerwearCount = climate === 'frio' ? 2 : 1;
    dressesCount = hasDressesInWardrobe ? 1 : 0;
    accessoriesCount = 2;
  } else if (days <= 7) {
    topsCount = 5;
    bottomsCount = 3;
    shoesCount = 2;
    outerwearCount = climate === 'frio' ? 2 : (climate === 'calido' ? 1 : 1);
    dressesCount = hasDressesInWardrobe ? 2 : 0;
    accessoriesCount = 3;
  } else {
    // 8+ days
    topsCount = Math.min(days, 7);
    bottomsCount = 4;
    shoesCount = 3;
    outerwearCount = 2;
    dressesCount = hasDressesInWardrobe ? 2 : 0;
    accessoriesCount = 3;
  }

  // Clima caliente: menos abrigos, más vestidos/tops
  if (climate === 'calido') {
    outerwearCount = Math.min(outerwearCount, 1);
  } else if (climate === 'frio') {
    outerwearCount = Math.max(outerwearCount, 2);
  }

  return {
    topsCount,
    bottomsCount,
    shoesCount,
    outerwearCount,
    dressesCount,
    accessoriesCount
  };
}

/**
 * Scores an individual wardrobe item based on weather, environment, activities, and color harmony
 */
function scoreItemForTrip(
  item: ClothingItem, 
  config: TripConfig, 
  profile: UserProfile
): { score: number; reason: string } {
  let score = 50;
  const reasons: string[] = [];

  const nameLower = (item.name + ' ' + (item.subCategory || '')).toLowerCase();
  const colorLower = (item.colorName || '').toLowerCase();

  // 1. CLIMA & ESTACIÓN
  if (config.climate === 'calido') {
    if (item.seasons.includes('verano') || item.seasons.includes('primavera') || item.seasons.includes('todas')) {
      score += 25;
    }
    if (item.seasons.includes('invierno')) {
      score -= 35;
    }
    if (nameLower.includes('lino') || nameLower.includes('tirantes') || nameLower.includes('sandalia') || nameLower.includes('falda') || nameLower.includes('short')) {
      score += 25;
      reasons.push('Tejido fresco ideal para clima cálido (>24°C)');
    }
    if (nameLower.includes('lana') || nameLower.includes('abrigo') || nameLower.includes('plumas') || nameLower.includes('polar') || nameLower.includes('bota')) {
      score -= 50;
    }
  } else if (config.climate === 'frio') {
    if (item.seasons.includes('invierno') || item.seasons.includes('otono')) {
      score += 30;
      reasons.push('Aislante térmico perfecto para clima frío (<10°C)');
    }
    if (nameLower.includes('lana') || nameLower.includes('punto') || nameLower.includes('cuello alto') || nameLower.includes('bota') || nameLower.includes('abrigo') || nameLower.includes('plumas')) {
      score += 30;
      reasons.push('Capa cálida imprescindible contra el frío');
    }
    if (nameLower.includes('tirantes') || nameLower.includes('lino') || nameLower.includes('sandalia') || nameLower.includes('short')) {
      score -= 60;
    }
  } else if (config.climate === 'fresco') {
    if (item.seasons.includes('otono') || item.seasons.includes('primavera') || item.seasons.includes('todas')) {
      score += 20;
    }
    if (nameLower.includes('trench') || nameLower.includes('blazer') || nameLower.includes('cardigan') || nameLower.includes('cazadora') || nameLower.includes('chaqueta')) {
      score += 25;
      reasons.push('Capa de entretiempo versátil para clima fresco (10-15°C)');
    }
    if (nameLower.includes('sandalia') || nameLower.includes('bañador')) {
      score -= 40;
    }
  } else {
    // templado (16-23°C)
    if (item.seasons.includes('primavera') || item.seasons.includes('otono') || item.seasons.includes('todas')) {
      score += 20;
    }
    if (nameLower.includes('camisa') || nameLower.includes('vaquero') || nameLower.includes('sneaker') || nameLower.includes('blazer')) {
      score += 15;
      reasons.push('Pieza equilibrada perfecta para 18-22°C');
    }
  }

  // 2. ENTORNO
  if (config.environment === 'playa') {
    if (item.styles.includes('casual') || item.styles.includes('clean girl') || item.category === 'dress') {
      score += 20;
      reasons.push('Estilo costero relajado');
    }
    if (item.category === 'outerwear' && !nameLower.includes('lino') && !nameLower.includes('sobrecamisa')) {
      score -= 20;
    }
  } else if (config.environment === 'rural' || config.environment === 'nieve') {
    if (item.styles.includes('comfy') || item.styles.includes('deportivo') || item.styles.includes('casual')) {
      score += 25;
      reasons.push('Comodidad y resistencia para entorno rural/montaña');
    }
    if (nameLower.includes('tacon') || item.styles.includes('fiesta')) {
      score -= 40;
    }
  } else if (config.environment === 'urbano') {
    if (item.styles.includes('chic') || item.styles.includes('old money') || item.styles.includes('streetwear') || item.styles.includes('clean girl')) {
      score += 20;
      reasons.push('Estética urbana sofisticada');
    }
  }

  // 3. ACTIVIDADES
  if (config.activities.includes('turismo')) {
    if (item.category === 'shoes' && (nameLower.includes('sneaker') || nameLower.includes('zapatilla') || nameLower.includes('plana') || item.styles.includes('casual') || item.styles.includes('comfy'))) {
      score += 35;
      reasons.push('Calzado ergonómico para largas caminatas');
    }
    if (item.styles.includes('comfy') || item.styles.includes('casual')) {
      score += 15;
    }
  }

  if (config.activities.includes('cenas')) {
    if (item.styles.includes('elegante') || item.styles.includes('chic') || item.styles.includes('fiesta') || item.styles.includes('old money')) {
      score += 35;
      reasons.push('Elegancia asegurada para cenas y planes de noche');
    }
    if (item.category === 'dress') {
      score += 25;
      reasons.push('Prenda única resuelta para salir a cenar');
    }
  }

  if (config.activities.includes('trabajo')) {
    if (nameLower.includes('blazer') || nameLower.includes('camisa') || item.styles.includes('old money') || item.styles.includes('elegante')) {
      score += 35;
      reasons.push('Sastrería y presencia profesional');
    }
  }

  if (config.activities.includes('senderismo')) {
    if (item.styles.includes('deportivo') || item.styles.includes('comfy') || nameLower.includes('bota')) {
      score += 30;
      reasons.push('Confort técnico para rutas');
    }
  }

  if (config.activities.includes('cultura')) {
    if (item.styles.includes('chic') || item.styles.includes('clean girl') || nameLower.includes('trench')) {
      score += 20;
      reasons.push('Vibe editorial para galerías y museos');
    }
  }

  // 4. COLOR SEASON & ARMONÍA PERSONAL
  const isNeutral = NEUTRAL_COLORS.some(n => colorLower.includes(n));
  if (isNeutral) {
    score += 15;
    reasons.push('Tono neutro altamente combinable con toda la cápsula');
  }

  // Estilos preferidos del perfil
  if (profile.preferredStyles && profile.preferredStyles.some(s => item.styles.includes(s))) {
    score += 10;
  }

  // Armonía con la estación cromática del usuario
  if (profile.colorSeason) {
    const isWarmSeason = profile.colorSeason.includes('Cálid') || profile.colorSeason.includes('Otoño') || profile.colorSeason.includes('Primavera');
    const isWarmColor = colorLower.includes('marron') || colorLower.includes('beige') || colorLower.includes('dorado') || colorLower.includes('naranja') || colorLower.includes('camel') || colorLower.includes('oliva');
    if (isWarmSeason && isWarmColor) {
      score += 12;
      reasons.push(`Favorece tu paleta ${profile.colorSeason}`);
    }
  }

  if (item.isFavorite) {
    score += 10;
  }

  // Formulate a crisp, engaging reason
  let finalReason = reasons[0] || 'Básico versátil para tu viaje';
  if (reasons.length > 1) {
    finalReason = `${reasons[0]} y ${reasons[1].toLowerCase()}`;
  }

  return { score, reason: finalReason };
}

/**
 * Main function: Generates a cohesive capsule wardrobe for the trip
 */
export function recommendLuggageCapsule(
  wardrobe: ClothingItem[],
  profile: UserProfile,
  config: TripConfig
): LuggageCapsuleResult {
  if (!wardrobe || wardrobe.length === 0) {
    return {
      items: [],
      totalOutfitsCount: 0,
      packingFormula: { tops: 0, bottoms: 0, shoes: 0, outerwear: 0, dresses: 0, accessories: 0 },
      paletteHarmonyDescription: 'Armario vacío',
      stylingAdvice: 'Añade prendas a tu armario para crear tu maleta.'
    };
  }

  // Category splits
  const allTops = wardrobe.filter(i => i.category === 'top');
  const allBottoms = wardrobe.filter(i => i.category === 'bottom');
  const allShoes = wardrobe.filter(i => i.category === 'shoes');
  const allOuterwear = wardrobe.filter(i => i.category === 'outerwear');
  const allDresses = wardrobe.filter(i => i.category === 'dress');
  const allAccessories = wardrobe.filter(i => i.category === 'accessory');

  // Quotas
  const quotas = getCapsuleQuotas(config, allDresses.length > 0);

  // Score each pool
  const scoreAndSort = (items: ClothingItem[]) => {
    return items
      .map(item => {
        const { score, reason } = scoreItemForTrip(item, config, profile);
        return { item, score, reason };
      })
      .sort((a, b) => b.score - a.score);
  };

  const scoredTops = scoreAndSort(allTops);
  const scoredBottoms = scoreAndSort(allBottoms);
  const scoredShoes = scoreAndSort(allShoes);
  const scoredOuterwear = scoreAndSort(allOuterwear);
  const scoredDresses = scoreAndSort(allDresses);
  const scoredAccessories = scoreAndSort(allAccessories);

  // Pick items respecting variety
  const pickedTops = scoredTops.slice(0, Math.min(quotas.topsCount, scoredTops.length));
  const pickedBottoms = scoredBottoms.slice(0, Math.min(quotas.bottomsCount, scoredBottoms.length));
  
  // For shoes, if 'cenas' is active and we have multiple shoes, ensure at least 1 comfy and 1 smart if possible
  let pickedShoes = scoredShoes.slice(0, Math.min(quotas.shoesCount, scoredShoes.length));
  if (config.activities.includes('cenas') && scoredShoes.length >= 2) {
    const smartShoe = scoredShoes.find(s => s.item.styles.includes('elegante') || s.item.styles.includes('chic') || (s.item.subCategory || '').toLowerCase().includes('tacon') || (s.item.subCategory || '').toLowerCase().includes('mocasin'));
    const comfyShoe = scoredShoes.find(s => s.item.styles.includes('casual') || s.item.styles.includes('comfy') || (s.item.name || '').toLowerCase().includes('sneaker'));
    if (smartShoe && comfyShoe && smartShoe.item.id !== comfyShoe.item.id) {
      pickedShoes = [comfyShoe, smartShoe];
    }
  }

  const pickedOuterwear = scoredOuterwear.slice(0, Math.min(quotas.outerwearCount, scoredOuterwear.length));
  const pickedDresses = scoredDresses.slice(0, Math.min(quotas.dressesCount, scoredDresses.length));
  const pickedAccessories = scoredAccessories.slice(0, Math.min(quotas.accessoriesCount, scoredAccessories.length));

  // Map to recommendation items
  const resultItems: LuggageRecommendationItem[] = [
    ...pickedTops.map(t => ({
      item: t.item,
      roleReason: t.reason,
      categoryGroup: 'top' as const,
      matchScore: t.score
    })),
    ...pickedBottoms.map(b => ({
      item: b.item,
      roleReason: b.reason,
      categoryGroup: 'bottom' as const,
      matchScore: b.score
    })),
    ...pickedDresses.map(d => ({
      item: d.item,
      roleReason: d.reason,
      categoryGroup: 'dress' as const,
      matchScore: d.score
    })),
    ...pickedOuterwear.map(o => ({
      item: o.item,
      roleReason: o.reason,
      categoryGroup: 'outerwear' as const,
      matchScore: o.score
    })),
    ...pickedShoes.map(s => ({
      item: s.item,
      roleReason: s.reason,
      categoryGroup: 'shoes' as const,
      matchScore: s.score
    })),
    ...pickedAccessories.map(a => ({
      item: a.item,
      roleReason: a.reason,
      categoryGroup: 'accessory' as const,
      matchScore: a.score
    }))
  ];

  // Calculate combinations: (tops * bottoms) + (dresses * layers)
  const topsN = pickedTops.length;
  const bottomsN = pickedBottoms.length;
  const dressesN = pickedDresses.length;
  const outerN = pickedOuterwear.length;

  let outfitCount = (topsN * bottomsN) + dressesN;
  if (outerN > 0) {
    // Outfits can be worn with or without jacket
    outfitCount = outfitCount * 2;
  }
  // Ensure realistic bounds
  outfitCount = Math.max(outfitCount, config.days * 2);

  // Palette summary
  const colorsInCapsule = Array.from(new Set(resultItems.map(i => i.item.colorName))).slice(0, 4);
  const paletteHarmonyDescription = `Cápsula articulada en tonos ${colorsInCapsule.join(', ')}, calibrada para tu armonía ${profile.colorSeason}.`;

  const stylingAdvice = `Con esta fórmula matemática de ${resultItems.length} prendas, multiplicas hasta ${outfitCount} looks únicos sin sobrecargar la maleta para tus ${config.days} días en ${config.destination}.`;

  return {
    items: resultItems,
    totalOutfitsCount: outfitCount,
    packingFormula: {
      tops: pickedTops.length,
      bottoms: pickedBottoms.length,
      shoes: pickedShoes.length,
      outerwear: pickedOuterwear.length,
      dresses: pickedDresses.length,
      accessories: pickedAccessories.length
    },
    paletteHarmonyDescription,
    stylingAdvice
  };
}
