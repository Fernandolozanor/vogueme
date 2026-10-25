export type Category = 'top' | 'bottom' | 'shoes' | 'outerwear' | 'accessory' | 'dress';

export type Season = 'primavera' | 'verano' | 'otono' | 'invierno' | 'todas';
export type QuerySeason = 'primavera' | 'verano' | 'otono' | 'invierno';

export type StyleTag = 
  | 'casual' 
  | 'chic' 
  | 'streetwear' 
  | 'clean girl' 
  | 'old money' 
  | 'coquette' 
  | 'elegante' 
  | 'comfy' 
  | 'fiesta' 
  | 'deportivo';

export interface ClothingItem {
  id: string;
  name: string;
  category: Category;
  subCategory?: string;
  colorName: string;
  colorHex: string;
  seasons: Season[];
  styles: StyleTag[];
  imageUrl: string;
  wearCount: number;
  purchasePrice?: number;
  brand?: string;
  dateAdded: string;
  isFavorite?: boolean;
}

export type ColorSeason = 
  // Armonía Cromática Personal (Nuevas denominaciones no estacionales)
  | 'Cálida Suave' 
  | 'Cálida Terrosa' 
  | 'Cálida Profunda' 
  | 'Cálida Luminosa' 
  | 'Cálida Dorada' 
  | 'Cálida Vibrante' 
  | 'Fría Clara' 
  | 'Fría Empolvada' 
  | 'Fría Serena' 
  | 'Fría Cristalina' 
  | 'Fría Intensa' 
  | 'Fría Profunda'
  // Compatibilidad hacia atrás:
  | 'Otoño Suave' 
  | 'Otoño Cálido' 
  | 'Otoño Profundo' 
  | 'Invierno Brillante' 
  | 'Invierno Frío' 
  | 'Invierno Profundo' 
  | 'Primavera Brillante' 
  | 'Primavera Cálida' 
  | 'Primavera Clara' 
  | 'Verano Claro' 
  | 'Verano Suave' 
  | 'Verano Frío';

export const COLOR_HARMONY_MAP: Record<string, ColorSeason> = {
  'Cálida Suave': 'Cálida Suave',
  'Cálida Terrosa': 'Cálida Terrosa',
  'Cálida Profunda': 'Cálida Profunda',
  'Cálida Luminosa': 'Cálida Luminosa',
  'Cálida Dorada': 'Cálida Dorada',
  'Cálida Vibrante': 'Cálida Vibrante',
  'Fría Clara': 'Fría Clara',
  'Fría Empolvada': 'Fría Empolvada',
  'Fría Serena': 'Fría Serena',
  'Fría Cristalina': 'Fría Cristalina',
  'Fría Intensa': 'Fría Intensa',
  'Fría Profunda': 'Fría Profunda',
  // Mapeo desde nombres tradicionales de estaciones:
  'Otoño Suave': 'Cálida Suave',
  'Otoño Cálido': 'Cálida Terrosa',
  'Otoño Profundo': 'Cálida Profunda',
  'Primavera Clara': 'Cálida Luminosa',
  'Primavera Cálida': 'Cálida Dorada',
  'Primavera Brillante': 'Cálida Vibrante',
  'Verano Claro': 'Fría Clara',
  'Verano Suave': 'Fría Empolvada',
  'Verano Frío': 'Fría Serena',
  'Invierno Brillante': 'Fría Cristalina',
  'Invierno Frío': 'Fría Intensa',
  'Invierno Profundo': 'Fría Profunda'
};

export function normalizeColorHarmony(season?: string): ColorSeason {
  if (!season) return 'Cálida Suave';
  return COLOR_HARMONY_MAP[season] || 'Cálida Suave';
}

export interface ColorSwatch {
  name: string;
  hex: string;
}

export type FaceShape = 
  | 'ovalada' 
  | 'redonda' 
  | 'cuadrada' 
  | 'corazon' 
  | 'diamante' 
  | 'alargada';

export type FacialContrast = 'alto' | 'medio' | 'suave';

export interface FacialAnalysisResult {
  skinTone: 'muy_claro' | 'claro' | 'medio' | 'bronceado' | 'oscuro';
  skinUndertone: 'calido' | 'frio' | 'neutro';
  eyeColor: string;
  hairColor: string;
  faceShape: FaceShape;
  facialContrast: FacialContrast;
  colorSeason: ColorSeason;
  summaryText: string;
  jewelryTip: string;
  necklineTip: string;
  eyewearTip: string;
  facePhotoDataUrl?: string;
}

export type BodyShape = 
  | 'reloj_de_arena' 
  | 'pera' 
  | 'rectangulo' 
  | 'triangulo_invertido' 
  | 'manzana';

export interface UserProfile {
  name: string;
  age: number;
  city: string;
  occupation?: string;
  colorSeason: ColorSeason;
  skinTone: 'muy_claro' | 'claro' | 'medio' | 'bronceado' | 'oscuro';
  skinUndertone: 'calido' | 'frio' | 'neutro';
  hairColor: string;
  eyeColor: string;
  faceShape?: FaceShape;
  facialContrast?: FacialContrast;
  bodyShape: BodyShape;
  heightCm: number;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  preferredStyles: StyleTag[];
  favoriteStores: string[];
  customStores: string[];
  privacyConsentAcknowledged: boolean;
  avatarLocalPreview?: string;
  faceAnalysisPhoto?: string;
  detectedFacialFeatures?: {
    skinTone: 'muy_claro' | 'claro' | 'medio' | 'bronceado' | 'oscuro';
    skinUndertone: 'calido' | 'frio' | 'neutro';
    eyeColor: string;
    hairColor: string;
    faceShape: FaceShape;
    facialContrast: FacialContrast;
    colorSeason: ColorSeason;
    scanDate: string;
  };
}

export interface OccasionQuery {
  activity: string;
  customActivity?: string;
  timeOfDay: 'manana' | 'tarde' | 'noche';
  season: QuerySeason;
  location: string;
  weatherTemp?: number;
  weatherCondition?: string;
  vibe: string;
}

export interface OutfitRecommendation {
  id: string;
  title: string;
  vibeSummary: string;
  items: {
    top?: ClothingItem;
    bottom?: ClothingItem;
    dress?: ClothingItem;
    outerwear?: ClothingItem;
    shoes?: ClothingItem;
    accessory?: ClothingItem;
  };
  friendAdvice: string;
  stylingTips: string[];
  colorHarmony: {
    name: string;
    description: string;
    palette: string[];
  };
  occasionMatchScore: number;
}

export interface ShoppingGapItem {
  id: string;
  title: string;
  category: Category;
  store: string;
  whyNeeded: string;
  estimatedPrice: string;
  unlockedOutfitsCount: number;
  tags: string[];
  searchUrl: string;
  colorSuggestion: string;
  colorHex?: string;
  morphologyReason?: string;
  facialAnalysisReason?: string;
  colorSeasonReason?: string;
  necklineOrCut?: string;
  compatibleGarmentNames?: string[];
}
