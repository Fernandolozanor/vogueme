import type { 
  ClothingItem, 
  UserProfile, 
  ShoppingGapItem, 
  Category, 
  BodyShape, 
  FaceShape, 
  ColorSeason 
} from '../types';

interface SeasonPaletteInfo {
  bestColorName: string;
  bestHex: string;
  paletteDescription: string;
}

const SEASON_COLOR_RECOMMENDATIONS: Record<ColorSeason, SeasonPaletteInfo> = {
  'Otoño Suave': {
    bestColorName: 'Beige arena cálido / Terracota suave',
    bestHex: '#D8C7B5',
    paletteDescription: 'Tonos tierra cálidos y empolvados que aportan luz natural a tu tez suave.'
  },
  'Otoño Cálido': {
    bestColorName: 'Caldera / Mostaza tostado',
    bestHex: '#B3541E',
    paletteDescription: 'Matices dorados profundos que realzan el matiz dorado de tus ojos y cabello.'
  },
  'Otoño Profundo': {
    bestColorName: 'Granate oscuro / Café chocolate',
    bestHex: '#4A0E17',
    paletteDescription: 'Colores intensos y saturados con base cálida para máximo impacto.'
  },
  'Invierno Frío': {
    bestColorName: 'Blanco puro óptico / Azul marino noche',
    bestHex: '#FFFFFF',
    paletteDescription: 'Contrastes gélidos y limpios que hacen resaltar tu mirada y contraste natural.'
  },
  'Invierno Brillante': {
    bestColorName: 'Rojo rubí / Fucsia esmeralda',
    bestHex: '#BE123C',
    paletteDescription: 'Tonos joya cristalinos que multiplican el magnetismo de tus facciones.'
  },
  'Invierno Profundo': {
    bestColorName: 'Cereza oscuro / Negro carbón satinado',
    bestHex: '#450A0A',
    paletteDescription: 'Intensidad dramática con base fría que aporta sofisticación inmediata.'
  },
  'Primavera Clara': {
    bestColorName: 'Melocotón luminoso / Marfil cremoso',
    bestHex: '#FED7AA',
    paletteDescription: 'Tonos pastel cálidos y radiantes que iluminan tu piel fresca.'
  },
  'Primavera Cálida': {
    bestColorName: 'Coral radiante / Verde lima suave',
    bestHex: '#FB923C',
    paletteDescription: 'Colores vivos y dorados que dan un aspecto saludable e hiperfavorecedor.'
  },
  'Primavera Brillante': {
    bestColorName: 'Rojo amapola / Aguamarina vibrante',
    bestHex: '#EF4444',
    paletteDescription: 'Tonos nítidos y alegres que potencian tu luz y vitalidad.'
  },
  'Verano Claro': {
    bestColorName: 'Azul cielo pastel / Rosa empolvado',
    bestHex: '#BAE6FD',
    paletteDescription: 'Colores etéreos y sutiles con matiz frío que aportan serenidad.'
  },
  'Verano Suave': {
    bestColorName: 'Verde salvia apagado / Malva grisáceo',
    bestHex: '#94A3B8',
    paletteDescription: 'Tonos empolvados y neutros fríos que armonizan con tus rasgos delicados.'
  },
  'Verano Frío': {
    bestColorName: 'Azul lavanda gélido / Frambuesa suave',
    bestHex: '#38BDF8',
    paletteDescription: 'Gama fría y rosácea sin rastro de dorado para resaltar tu tez.'
  }
};

interface VisagismoFaceGuidance {
  necklineSuggestion: string;
  necklineExplanation: string;
  accessorySuggestion: string;
  accessoryExplanation: string;
}

const FACE_SHAPE_VISAGISMO: Record<FaceShape, VisagismoFaceGuidance> = {
  ovalada: {
    necklineSuggestion: 'Cuello halter, asimétrico o barco',
    necklineExplanation: 'Tus proporciones faciales son muy simétricas; los cuellos con líneas asimétricas o despejados en hombros enmarcan tu barbilla sin distorsionar el balance.',
    accessorySuggestion: 'Pendientes geométricos medianos o aros clásicos',
    accessoryExplanation: 'Cualquier forma de pendiente y gafa te favorece, pero los aros medianos respetan el óvalo perfecto de tu rostro.'
  },
  redonda: {
    necklineSuggestion: 'Escote en V profundo o solapa estrecha alargada',
    necklineExplanation: 'Las líneas verticales y diagonales del escote en V contrarrestan la redondez de mejillas y alargan visualmente el cuello y rostro.',
    accessorySuggestion: 'Pendientes alargados o colgantes verticales',
    accessoryExplanation: 'Crean una guía vertical que estiliza la línea mandibular y adelgaza ópticamente el contorno facial.'
  },
  cuadrada: {
    necklineSuggestion: 'Escote redondo amplio, corazón o drapeado fluido',
    necklineExplanation: 'Las curvas suaves en el escote compensan y dulcifican los ángulos rectos de la mandíbula y sienes.',
    accessorySuggestion: 'Aros redondeados, pendientes en gota o gafas pantos/cat-eye suave',
    accessoryExplanation: 'Los contornos curvos suavizan la mandíbula angulosa y aportan feminidad visual.'
  },
  corazon: {
    necklineSuggestion: 'Escote barco, cuadrado o cuello desbocado',
    necklineExplanation: 'Aportan amplitud horizontal en la base del cuello, equilibrando la frente ancha con la barbilla afilada.',
    accessorySuggestion: 'Pendientes en forma de lágrima o con volumen en la base',
    accessoryExplanation: 'Añaden peso visual en la zona de la mandíbula para equilibrar el tercio inferior del rostro.'
  },
  diamante: {
    necklineSuggestion: 'Escotes amplios o escote en V medio',
    necklineExplanation: 'Despejan el cuello y aportan aire debajo de los pómulos anchos para suavizar la estructura ósea.',
    accessorySuggestion: 'Pendientes cortos de botón joya o aros pequeños',
    accessoryExplanation: 'No saturan la línea de los pómulos altos y mantienen la armonía escultural del rostro.'
  },
  alargada: {
    necklineSuggestion: 'Cuello perkins / cisne o escote barco horizontal',
    necklineExplanation: 'Corta la verticalidad del rostro y añade una línea horizontal estructurada que acorta visualmente la distancia cara-pecho.',
    accessorySuggestion: 'Pendientes voluminosos, redondos o pegados al lóbulo',
    accessoryExplanation: 'Añaden anchura lateral a los lados de las mejillas, restando longitud óptica al rostro.'
  }
};

interface MorphologyGuidance {
  topStyle: string;
  topWhy: string;
  bottomStyle: string;
  bottomWhy: string;
  outerwearStyle: string;
  outerwearWhy: string;
}

const BODY_SHAPE_GUIDANCE: Record<BodyShape, MorphologyGuidance> = {
  reloj_de_arena: {
    topStyle: 'Top entallado o chaleco sastre ceñido en cintura',
    topWhy: 'Acompaña las curvas naturales sin añadir volumen extra ni ocultar tu cintura definida.',
    bottomStyle: 'Pantalón sastre wide-leg o recto de tiro alto con pinzas',
    bottomWhy: 'Abraza la cadera y la cintura alta sin crear el temido hueco en la espalda baja.',
    outerwearStyle: 'Trench o blazer con cinturón anudable',
    outerwearWhy: 'Marca la transición entre pecho, cintura y cadera manteniendo la proporción 1:1.'
  },
  pera: {
    topStyle: 'Top estructurado con hombreras suaves o mangas abullonadas',
    topWhy: 'Añade presencia y volumen horizontal a los hombros para equilibrar la amplitud de la cadera.',
    bottomStyle: 'Pantalón sastre fluido de caída recta sin bolsillos laterales abultados',
    bottomWhy: 'Cae limpio desde la parte más ancha de la cadera alargando las piernas y estilizando la silueta.',
    outerwearStyle: 'Blazer estructurado a la altura de la media cadera o cropped',
    outerwearWhy: 'Atrae la mirada al torso superior y define hombros para compensar la parte inferior.'
  },
  triangulo_invertido: {
    topStyle: 'Top fluido escote en V o caída raglán sin hombreras',
    topWhy: 'Suaviza la línea de hombros anchos y despeja el pecho con líneas diagonales fluidas.',
    bottomStyle: 'Pantalón palazzo, falda evasé con vuelo o cargo refinado',
    bottomWhy: 'Añade volumen visual y dinamismo en la mitad inferior para equilibrar con los hombros.',
    outerwearStyle: 'Abrigo fluido de corte recto o chaqueta abierta sin solapas anchas',
    outerwearWhy: 'Crea una línea vertical limpia que no ensancha el torso superior.'
  },
  rectangulo: {
    topStyle: 'Top drapeado, cruzado o con detalles diagonales',
    topWhy: 'Rompe la continuidad recta del torso generando efecto de cintura y movimiento.',
    bottomStyle: 'Pantalón paperbag con cinturón o falda de tiro alto con vuelo',
    bottomWhy: 'Crea la ilusión óptica de cintura ceñida y cadera con volumen gracias al fruncido.',
    outerwearStyle: 'Blazer entallado o cazadora cropped a la cintura',
    outerwearWhy: 'Segmenta la figura en dos bloques y enfatiza la altura natural de tu cintura.'
  },
  manzana: {
    topStyle: 'Blusa fluida con escote en V y tejido vaporoso',
    topWhy: 'Alarga el torso superior, crea verticalidad y no se ajusta en la zona abdominal.',
    bottomStyle: 'Pantalón de tiro medio-alto recto con cintura elástica oculta o corte limpio',
    bottomWhy: 'Resalta tus piernas estilizadas manteniendo máxima comodidad y línea continua.',
    outerwearStyle: 'Blazer largo fluido abierto o chaqueta tipo kimono estructurado',
    outerwearWhy: 'Crea dos líneas verticales paralelas que afinan ópticamente toda la silueta.'
  }
};

/**
 * Genera recomendaciones inteligentes de Shopping Gaps personalizadas
 * basadas en el análisis de armario real, morfología corporal y visagismo facial.
 */
export function generateSmartShoppingGaps(
  wardrobe: ClothingItem[],
  profile: UserProfile
): ShoppingGapItem[] {
  const activeStores = profile.favoriteStores && profile.favoriteStores.length > 0
    ? profile.favoriteStores
    : ['Zara', 'Mango', 'Stradivarius', 'ASOS'];

  const getStoreForCategory = (_cat: Category, seed: number): string => {
    return activeStores[seed % activeStores.length];
  };

  const getSearchUrl = (storeName: string, query: string): string => {
    const encoded = encodeURIComponent(query);
    const lower = storeName.toLowerCase();
    if (lower.includes('zara')) return `https://www.zara.com/es/es/search?searchTerm=${encoded}`;
    if (lower.includes('mango')) return `https://www.mango.com/es/es/search?q=${encoded}`;
    if (lower.includes('stradivarius')) return `https://www.stradivarius.com/es/search?searchTerm=${encoded}`;
    if (lower.includes('bershka')) return `https://www.bershka.com/es/search?searchTerm=${encoded}`;
    if (lower.includes('asos')) return `https://www.asos.com/es/search/?q=${encoded}`;
    if (lower.includes('zalando')) return `https://www.zalando.es/catalogo/?q=${encoded}`;
    if (lower.includes('hm') || lower.includes('h&m')) return `https://www2.hm.com/es_es/search-results.html?q=${encoded}`;
    if (lower.includes('uniqlo')) return `https://www.uniqlo.com/es/es/search?q=${encoded}`;
    return `https://www.google.com/search?q=${encodeURIComponent(`${storeName} ${query}`)}`;
  };

  // 1. Análisis del armario
  const tops = wardrobe.filter(w => w.category === 'top');
  const bottoms = wardrobe.filter(w => w.category === 'bottom');
  const outerwear = wardrobe.filter(w => w.category === 'outerwear');
  const shoes = wardrobe.filter(w => w.category === 'shoes');
  const accessories = wardrobe.filter(w => w.category === 'accessory');

  // Nombres de prendas del armario para combinaciones
  const topNames = tops.slice(0, 3).map(t => t.name);
  const bottomNames = bottoms.slice(0, 3).map(b => b.name);
  const shoeNames = shoes.slice(0, 2).map(s => s.name);

  // 2. Datos biométricos y faciales del usuario
  const faceShape = (profile.faceShape || 'ovalada') as FaceShape;
  const bodyShape = (profile.bodyShape || 'reloj_de_arena') as BodyShape;
  const colorSeason = (profile.colorSeason || 'Otoño Suave') as ColorSeason;

  const visagismo = FACE_SHAPE_VISAGISMO[faceShape] || FACE_SHAPE_VISAGISMO.ovalada;
  const morphology = BODY_SHAPE_GUIDANCE[bodyShape] || BODY_SHAPE_GUIDANCE.reloj_de_arena;
  const colorInfo = SEASON_COLOR_RECOMMENDATIONS[colorSeason] || SEASON_COLOR_RECOMMENDATIONS['Otoño Suave'];

  const height = profile.heightCm || 167;
  const heightTag = height < 163 
    ? 'Corte que añade longitud visual a tus piernas' 
    : height > 172 
    ? 'Ideal para tu estatura esbelta y porte largo' 
    : 'Proporción áurea perfecta con tu estatura media';

  const waist = profile.waistCm || 65;
  const hips = profile.hipsCm || 94;
  const chest = profile.chestCm || 88;

  const gaps: ShoppingGapItem[] = [];

  // GAP 1: PRENDA INFERIOR (Pantalón sastre fluido / Falda según morfología)
  // Relevante si faltan bottoms en proporción a los tops
  const storeBottom = getStoreForCategory('bottom', 0);
  const unlockedBottomCount = Math.max(tops.length * Math.max(shoes.length, 1), 6);
  gaps.push({
    id: 'gap-bottom-tailored',
    title: `Pantalón sastre de tiro alto con pinzas en ${colorInfo.bestColorName.split('/')[0].trim()}`,
    category: 'bottom',
    store: storeBottom,
    whyNeeded: bottoms.length <= 2 
      ? `Solo tienes ${bottoms.length} parte(s) inferior(es) para ${tops.length} tops. Este pantalón multiplica tus combinaciones diarias x${unlockedBottomCount}.`
      : `Pieza comodín estructurada que eleva tanto tus tops básicos como tus blusas fluidas sin recurrir siempre a vaqueros.`,
    estimatedPrice: '29,95 €',
    unlockedOutfitsCount: unlockedBottomCount,
    tags: ['fondo de armario', 'sastrería', 'smart casual'],
    searchUrl: getSearchUrl(storeBottom, `pantalon sastre pinzas tiro alto ${colorInfo.bestColorName.split('/')[0].trim()}`),
    colorSuggestion: colorInfo.bestColorName,
    colorHex: colorInfo.bestHex,
    morphologyReason: `Para tu silueta ${bodyShape.replace('_', ' ')} (${waist}cm de cintura y ${hips}cm de cadera): ${morphology.bottomWhy} ${heightTag}.`,
    facialAnalysisReason: `Al despejar la línea inferior con un tono de tu paleta ${colorSeason}, mantiene la armonía cromática con tu tono de piel.`,
    colorSeasonReason: `El ${colorInfo.bestColorName} pertenece a tu carta de color ${colorSeason}, aportando contraste equilibrado.`,
    necklineOrCut: 'Tiro alto con pinza delantera y pernera recta/fluida',
    compatibleGarmentNames: [...topNames.slice(0, 1), ...shoeNames.slice(0, 1)]
  });

  // GAP 2: PRENDA SUPERIOR CON ESCOTE DE VISAGISMO
  const storeTop = getStoreForCategory('top', 1);
  const unlockedTopCount = Math.max(bottoms.length * Math.max(shoes.length, 1), 5);
  gaps.push({
    id: 'gap-top-visagismo',
    title: `Chaleco sastre entallado o top con ${visagismo.necklineSuggestion}`,
    category: 'top',
    store: storeTop,
    whyNeeded: `Una prenda superior estructurada que puedes llevar sola o en capas, adaptada milimétricamente al visagismo de tu rostro.`,
    estimatedPrice: '25,95 €',
    unlockedOutfitsCount: unlockedTopCount,
    tags: ['visagismo', 'clean girl', 'old money'],
    searchUrl: getSearchUrl(storeTop, `chaleco sastre top ${visagismo.necklineSuggestion.split(',')[0]} ${colorInfo.bestColorName.split('/')[0].trim()}`),
    colorSuggestion: colorInfo.bestColorName,
    colorHex: colorInfo.bestHex,
    morphologyReason: `Para tu cuerpo ${bodyShape.replace('_', ' ')} (${chest}cm pecho): ${morphology.topWhy}`,
    facialAnalysisReason: `Diseñado para rostro ${faceShape}: ${visagismo.necklineExplanation}`,
    colorSeasonReason: `Al situarse inmediatamente bajo el mentón, el tono ${colorInfo.bestColorName} ilumina directamente tu rostro y mirada.`,
    necklineOrCut: visagismo.necklineSuggestion,
    compatibleGarmentNames: bottomNames.slice(0, 2)
  });

  // GAP 3: CAPA EXTERIOR (Blazer / Trench fluido según proporciones)
  const storeOuter = getStoreForCategory('outerwear', 2);
  const unlockedOuterCount = Math.max(tops.length * bottoms.length, 8);
  gaps.push({
    id: 'gap-outerwear-capsule',
    title: `Blazer estructurado con solapa alargada o Trench fluido`,
    category: 'outerwear',
    store: storeOuter,
    whyNeeded: outerwear.length === 0
      ? 'No tienes ninguna chaqueta o blazer registrado. Esta pieza unificará cualquier outfit en cuestión de segundos.'
      : 'Capa de transición perfecta para entretiempo y oficina, aportando ese acabado pulido imprescindible.',
    estimatedPrice: '49,99 €',
    unlockedOutfitsCount: unlockedOuterCount,
    tags: ['tercera prenda', 'editorial', 'atemporal'],
    searchUrl: getSearchUrl(storeOuter, `blazer fluido estructurado neutro ${colorInfo.bestColorName.split('/')[0].trim()}`),
    colorSuggestion: colorInfo.bestColorName,
    colorHex: colorInfo.bestHex,
    morphologyReason: `Para tu silueta ${bodyShape.replace('_', ' ')}: ${morphology.outerwearWhy}`,
    facialAnalysisReason: `Las solapas enmarcadas crean una línea que estiliza tu rostro ${faceShape} y resalta los pómulos.`,
    colorSeasonReason: `Armoniza con el ${profile.facialContrast || 'medio'} contraste facial detectado en tu test.`,
    necklineOrCut: 'Solapa fina desestructurada con caída vertical',
    compatibleGarmentNames: [...topNames.slice(0, 1), ...bottomNames.slice(0, 1)]
  });

  // GAP 4: ACCESORIO DE VISAGISMO & CINTURA
  const storeAcc = getStoreForCategory('accessory', 3);
  const metalType = (profile.skinUndertone === 'frio') ? 'acabado plateado pulido' : 'hebilla dorada vintage / latón';
  gaps.push({
    id: 'gap-acc-belt',
    title: `Cinturón fino de piel (2.5 cm) con ${metalType}`,
    category: 'accessory',
    store: storeAcc,
    whyNeeded: accessories.length <= 1
      ? `Solo tienes ${accessories.length} accesorio(s) en tu armario. Un buen cinturón de piel marca el talle de tu cintura de ${waist} cm y multiplica la sofisticación de tus prendas inferiores.`
      : `El truco de estilista número uno: marca el talle de tu cintura de ${waist} cm y hace que pantalones sencillos parezcan de pasarela.`,
    estimatedPrice: '17,95 €',
    unlockedOutfitsCount: Math.max(bottoms.length * tops.length, 10),
    tags: ['definición de silueta', 'old money', 'lujo silencioso'],
    searchUrl: getSearchUrl(storeAcc, `cinturon piel hebilla ${profile.skinUndertone === 'frio' ? 'plata' : 'dorada'} vintage`),
    colorSuggestion: profile.skinUndertone === 'frio' ? 'Negro / Grafito' : 'Chocolate / Cuero tostado',
    colorHex: profile.skinUndertone === 'frio' ? '#1A1A1A' : '#4A2E1B',
    morphologyReason: `Enfatiza la línea natural de tu cintura (${waist} cm) creando un punto focal elegante que equilibra cadera y torso.`,
    facialAnalysisReason: `El metal (${metalType}) armoniza con el subtono ${profile.skinUndertone || 'cálido'} de tu piel y tu joyería recomendada.`,
    colorSeasonReason: `Color comodín de anclaje para tu paleta ${colorSeason}.`,
    necklineOrCut: 'Ancho 2.5 cm con herraje minimalista',
    compatibleGarmentNames: bottomNames.slice(0, 2)
  });

  // GAP 5: ACCESORIO DE ROSTRO (Gafas o Pendientes según visagismo)
  const storeJewel = getStoreForCategory('accessory', 4);
  gaps.push({
    id: 'gap-acc-visagismo',
    title: `${visagismo.accessorySuggestion} en ${profile.skinUndertone === 'frio' ? 'plata 925' : 'baño dorado cálido'}`,
    category: 'accessory',
    store: storeJewel,
    whyNeeded: `Pieza estratégica para el marco de tu cara. Enmarca tus facciones y eleva instantáneamente camisetas básicas.`,
    estimatedPrice: '12,99 €',
    unlockedOutfitsCount: 12,
    tags: ['visagismo facial', 'joyería', 'efecto glow'],
    searchUrl: getSearchUrl(storeJewel, `${visagismo.accessorySuggestion.split('o')[0]} ${profile.skinUndertone === 'frio' ? 'plata' : 'dorado'}`),
    colorSuggestion: profile.skinUndertone === 'frio' ? 'Plata brillante' : 'Dorado cálido 18k',
    colorHex: profile.skinUndertone === 'frio' ? '#D1D5DB' : '#C5A059',
    morphologyReason: 'Dirige el foco visual hacia el rostro y cuello, aligerando el peso óptico corporal.',
    facialAnalysisReason: `Específico para rostro ${faceShape}: ${visagismo.accessoryExplanation}`,
    colorSeasonReason: `Metales calibrados para tez con subtono ${profile.skinUndertone || 'cálido'}.`,
    necklineOrCut: 'Cierre ergonómico y proporción facial calibrada',
    compatibleGarmentNames: topNames.slice(0, 2)
  });

  // GAP 6: CALZADO ELEVADO VERSÁTIL
  const storeShoes = getStoreForCategory('shoes', 5);
  gaps.push({
    id: 'gap-shoes-versatile',
    title: `Mocasines de piel con herraje o Bailarinas Mary Jane en piel burdeos / cuero`,
    category: 'shoes',
    store: storeShoes,
    whyNeeded: shoes.length <= 1
      ? 'Solo cuentas con un par de calzado en el armario. Este modelo sustituye a las zapatillas cuando quieres ir más arreglada pero igual de cómoda.'
      : 'El comodín de transición perfecto entre zapatillas deportivas y tacones, apto para caminar horas.',
    estimatedPrice: '35,95 €',
    unlockedOutfitsCount: Math.max(bottoms.length * tops.length, 9),
    tags: ['calzado cómodo', 'tendencia', 'atemporal'],
    searchUrl: getSearchUrl(storeShoes, 'mocasines piel herraje mary jane burdeos'),
    colorSuggestion: colorSeason.includes('Invierno') || profile.skinUndertone === 'frio' ? 'Burdeos cereza / Negro' : 'Cacao / Cuero tostado',
    colorHex: colorSeason.includes('Invierno') ? '#4A0E17' : '#5C3826',
    morphologyReason: `La puntera ligeramente afilada o almendrada prolonga la línea de la pierna (${height} cm de altura).`,
    facialAnalysisReason: 'Aporta un punto de contraste sofisticado que balancea la presencia del outfit completo.',
    colorSeasonReason: `Tono compatible 100% con tu estación ${colorSeason}.`,
    necklineOrCut: 'Suela fina con tacón de 1.5 cm y puntera almendrada',
    compatibleGarmentNames: bottomNames.slice(0, 2)
  });

  return gaps;
}
