import type { ClothingItem, UserProfile, OccasionQuery, OutfitRecommendation } from '../types';

export const generateOutfitRecommendation = (
  query: OccasionQuery,
  profile: UserProfile,
  wardrobe: ClothingItem[]
): OutfitRecommendation => {
  if (!wardrobe || wardrobe.length === 0) {
    throw new Error('No hay prendas en el armario');
  }

  // 1. Filter out items suitable for season or all-season
  const seasonEligible = wardrobe.filter(
    (item) => item.seasons.includes(query.season) || item.seasons.includes('todas')
  );

  const pool = seasonEligible.length >= 3 ? seasonEligible : wardrobe;

  // Split into categories
  const tops = pool.filter((i) => i.category === 'top');
  const bottoms = pool.filter((i) => i.category === 'bottom');
  const dresses = pool.filter((i) => i.category === 'dress');
  const outerwears = pool.filter((i) => i.category === 'outerwear');
  const shoes = pool.filter((i) => i.category === 'shoes');
  const accessories = pool.filter((i) => i.category === 'accessory');

  // Decide if dress look or top+bottom
  const isNightOrParty = query.timeOfDay === 'noche' || query.activity.toLowerCase().includes('fiesta') || query.activity.toLowerCase().includes('cena');
  const chooseDress = dresses.length > 0 && (isNightOrParty ? Math.random() > 0.4 : Math.random() > 0.7);

  let selectedTop: ClothingItem | undefined;
  let selectedBottom: ClothingItem | undefined;
  let selectedDress: ClothingItem | undefined;
  let selectedOuterwear: ClothingItem | undefined;
  let selectedShoes: ClothingItem | undefined;
  let selectedAccessory: ClothingItem | undefined;

  if (chooseDress) {
    selectedDress = pickBestItem(dresses, query, profile);
  } else {
    selectedTop = pickBestItem(tops, query, profile);
    selectedBottom = pickBestItem(bottoms, query, profile);
  }

  // Shoes
  if (shoes.length > 0) {
    if (isNightOrParty) {
      selectedShoes = shoes.find(s => s.styles.includes('fiesta') || s.styles.includes('chic') || s.styles.includes('elegante')) || shoes[0];
    } else {
      selectedShoes = shoes.find(s => s.styles.includes('casual') || s.styles.includes('clean girl') || s.styles.includes('comfy')) || shoes[0];
    }
  }

  // Outerwear
  const needsLayer = query.season === 'invierno' || query.season === 'otono' || query.timeOfDay === 'noche' || (query.weatherTemp && query.weatherTemp < 20);
  if (needsLayer && outerwears.length > 0) {
    selectedOuterwear = pickBestItem(outerwears, query, profile);
  }

  // Accessory
  if (accessories.length > 0) {
    selectedAccessory = pickBestItem(accessories, query, profile);
  }

  // Generate Titles & Advice in "Amiga Experta" tone
  const outfitTitle = generateEditorialTitle(query);
  const adviceText = generateAmigaExpertaAdvice(query, profile, {
    top: selectedTop,
    bottom: selectedBottom,
    dress: selectedDress,
    outerwear: selectedOuterwear,
    shoes: selectedShoes,
    accessory: selectedAccessory
  });

  const tips = generateStylingTips(profile, {
    top: selectedTop,
    bottom: selectedBottom,
    dress: selectedDress,
    outerwear: selectedOuterwear,
    shoes: selectedShoes,
    accessory: selectedAccessory
  });

  // Color harmony palette
  const allPicked = [selectedTop, selectedBottom, selectedDress, selectedOuterwear, selectedShoes, selectedAccessory].filter(Boolean) as ClothingItem[];
  const palette = allPicked.map(i => i.colorHex);

  return {
    id: 'outfit-' + Date.now(),
    title: outfitTitle,
    vibeSummary: `${query.activity} • ${query.timeOfDay.toUpperCase()} • ${query.location}`,
    items: {
      top: selectedTop,
      bottom: selectedBottom,
      dress: selectedDress,
      outerwear: selectedOuterwear,
      shoes: selectedShoes,
      accessory: selectedAccessory
    },
    friendAdvice: adviceText,
    stylingTips: tips,
    colorHarmony: {
      name: 'Equilibrio ' + profile.colorSeason,
      description: 'Combinación armónica de contrastes equilibrados para tu tono de piel y morfología.',
      palette: palette.length > 0 ? palette : ['#1A1A1A', '#FAF8F5', '#D8C7B5']
    },
    occasionMatchScore: 98
  };
};

function pickBestItem(items: ClothingItem[], query: OccasionQuery, profile: UserProfile): ClothingItem {
  if (items.length === 0) return {} as ClothingItem;

  const scored = items.map(item => {
    let score = 0;
    if (item.isFavorite) score += 3;
    profile.preferredStyles.forEach(pref => {
      if (item.styles.includes(pref)) score += 2;
    });
    if (item.seasons.includes(query.season)) score += 2;
    return { item, score: score + Math.random() * 2 };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].item;
}

function generateEditorialTitle(query: OccasionQuery): string {
  const act = query.activity.toLowerCase();
  if (act.includes('café') || act.includes('cafe')) {
    return 'Effortless Coffee Date Aesthetic';
  } else if (act.includes('cine') || act.includes('novio') || act.includes('cita')) {
    return 'Romantic Glow: Casual Chic & Cuddle Ready';
  } else if (act.includes('fiesta') || act.includes('noche') || act.includes('copas')) {
    return 'Statement Night Out: Slay Mode Activado';
  } else if (act.includes('universidad') || act.includes('clase') || act.includes('examen')) {
    return 'Campus Muse: Comfy, Aesthetic & 100% Cool';
  } else if (act.includes('brunch') || act.includes('domingo')) {
    return 'Sunday Soft Luxe: Brunch con las Chicas';
  }
  return `Vogue Look: ${query.activity} en ${query.location}`;
}

function generateAmigaExpertaAdvice(
  query: OccasionQuery,
  profile: UserProfile,
  items: {
    top?: ClothingItem;
    bottom?: ClothingItem;
    dress?: ClothingItem;
    outerwear?: ClothingItem;
    shoes?: ClothingItem;
    accessory?: ClothingItem;
  }
): string {
  const name = profile.name || 'chica';
  const introPhrases = [
    `¡Tía, prepárate porque este look es un auténtico 10 de 10!`,
    `¡Ojo a este combo, ${name}! Es literalmente el vibe exacto que necesitabas.`,
    `No busques más: con esta combinación vas a ir monísima sin que parezca que te has pasado 2 horas pensando qué ponerte.`,
    `¡Vas a devorar con este look! Tiene ese punto *effortless* de chica que tiene estilazo innato.`
  ];

  const intro = introPhrases[Math.floor(Math.random() * introPhrases.length)];

  let middle = '';
  if (items.dress) {
    middle = `El ${items.dress.name} es la pieza estrella indiscutible. Con tu silueta ${profile.bodyShape.replace('_', ' ')} cae con una soltura preciosa y no aprieta nada.`;
  } else if (items.top && items.bottom) {
    middle = `La clave aquí es la proporción: al combinar ${items.top.name} con ${items.bottom.name}, consigues estilizar la figura un montón sin renunciar a estar comodísima.`;
  }

  let layerPhrase = '';
  if (items.outerwear) {
    layerPhrase = ` Para el toque maestro (y por si refresca en ${query.location}), ponte por encima ${items.outerwear.name}; dale el rollo llevándolo suelto o sobre los hombros estilo editora de moda.`;
  }

  let shoePhrase = '';
  if (items.shoes) {
    shoePhrase = ` En los pies, ${items.shoes.name} remata el look con matrícula de honor.`;
  }

  const outro = ` Resultado: vas sofisticada, juvenil y perfecta para tu plan de "${query.activity}". Confía en mí, te van a preguntar de dónde es todo. ✨`;

  return `${intro} ${middle}${layerPhrase}${shoePhrase}${outro}`;
}

function generateStylingTips(
  profile: UserProfile,
  items: {
    top?: ClothingItem;
    bottom?: ClothingItem;
    dress?: ClothingItem;
    outerwear?: ClothingItem;
    shoes?: ClothingItem;
    accessory?: ClothingItem;
  }
): string[] {
  const tips: string[] = [];

  if (items.bottom?.subCategory?.toLowerCase().includes('vaquero') || items.bottom?.styles.includes('casual')) {
    tips.push('💡 Truco de talle: mete solo la parte delantera del top ligeramente por dentro del pantalón ("french tuck") para marcar cintura y alargar ópticamente las piernas.');
  } else {
    tips.push('💡 Proporción visual: Mantén la silueta equilibrada dejando visible la línea de cintura.');
  }

  if (profile.faceShape) {
    const shapeTips: Record<string, string> = {
      redonda: '💎 Visagismo: Apuesta por pendientes alargados o lineales que estilicen el cuello y afinen el rostro.',
      cuadrada: '💎 Visagismo: Pendientes de aro o curvas suaves para equilibrar la mandíbula estructurada.',
      corazon: '💎 Visagismo: Pendientes tipo lágrima con volumen en la base para compensar la barbilla fina.',
      diamante: '💎 Visagismo: Pendientes curvos de tamaño medio para armonizar los pómulos prominentes.',
      alargada: '💎 Visagismo: Pendientes vistosos con volumen horizontal que rompan la verticalidad.',
      ovalada: '💎 Visagismo: Cualquier pendiente colgante o aro te queda perfecto por tu proporción armónica.'
    };
    if (shapeTips[profile.faceShape]) {
      tips.push(shapeTips[profile.faceShape]);
    }
  } else if (items.accessory) {
    tips.push(`✨ Joyería: Tus facciones resaltan con pendientes y collares en tono dorado cálido. Llévalos finos pero con presencia.`);
  }

  if (profile.eyeColor) {
    tips.push(`👁️ Mirada: La paleta seleccionada hace resaltar el brillo natural de tus ojos (${profile.eyeColor}).`);
  }

  if (items.outerwear) {
    tips.push('🧥 El truco del blazer: súbete ligeramente las mangas hasta el antebrazo para que se vean tus pulseras o reloj; ese detalle hace que el outfit parezca sacado de Pinterest.');
  }

  tips.push(`🎨 Armonía ${profile.colorSeason}: Estos tonos crean un contraste armónico con tu color de pelo y luminosidad de piel.`);

  return tips;
}
