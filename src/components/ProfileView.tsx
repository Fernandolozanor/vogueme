import React, { useState, useRef } from 'react';
import { 
  Camera, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  Ruler, 
  Palette,
  User,
  MapPin,
  Calendar,
  Briefcase,
  Eye,
  Smile,
  Gem,
  Glasses,
  Trash2,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { UserProfile, ColorSeason, BodyShape, StyleTag, FaceShape, ColorSwatch } from '../types';
import { ColorSeasonModal } from './ColorSeasonModal';
import { 
  extractLocalBiometricFeatures,
  getJewelryTip,
  getNecklineTip,
  getEyewearTip,
  calculateColorSeason
} from '../services/imageProcessing';
import { saveProfile } from '../services/storage';

interface ProfileViewProps {
  profile: UserProfile;
  onProfileUpdate: (updated: UserProfile) => void;
}

const FACE_SHAPES_CONFIG: Record<FaceShape, { label: string; description: string; icon: string }> = {
  ovalada: {
    label: 'Ovalada',
    description: 'Proporción equilibrada (largo aprox. 1.5 veces el ancho), pómulos suaves y barbilla ligeramente redondeada. Es la forma más armónica y versátil.',
    icon: '🥚'
  },
  redonda: {
    label: 'Redonda',
    description: 'Ancho y largo de proporciones casi iguales, pómulos rellenos y ángulos de mandíbula muy suaves.',
    icon: '⚪'
  },
  cuadrada: {
    label: 'Cuadrada',
    description: 'Frente amplia y mandíbula recta y angulosa con el mismo ancho que los pómulos. Fuerte presencia estructural.',
    icon: '⏹️'
  },
  corazon: {
    label: 'Corazón / Triángulo',
    description: 'Frente ancha y pómulos marcados que se van estrechando hacia una barbilla afilada o en punta.',
    icon: '🤍'
  },
  diamante: {
    label: 'Diamante',
    description: 'Pómulos altos y anchos con frente y mandíbula notablemente más estrechas. Rostro escultural.',
    icon: '💎'
  },
  alargada: {
    label: 'Alargada / Rectangular',
    description: 'Predominio vertical evidente, frente alta y barbilla alargada con sienes y mandíbula alineadas.',
    icon: '⌛'
  }
};

const EYE_COLORS_PRESETS = [
  { label: 'Miel / Ámbar cálido', hex: '#C5A059' },
  { label: 'Marrón castaño cálido', hex: '#5C3826' },
  { label: 'Marrón café profundo', hex: '#2A1810' },
  { label: 'Verde oliva / Avellana', hex: '#556B2F' },
  { label: 'Azul zafiro / Cielo', hex: '#3B6E8C' },
  { label: 'Gris perla / Azul verdoso', hex: '#708090' }
];

const HAIR_COLORS_PRESETS = [
  { label: 'Castaño avellana / Miel', hex: '#6F4E37' },
  { label: 'Castaño chocolate', hex: '#3D2817' },
  { label: 'Negro azabache', hex: '#1A1A1A' },
  { label: 'Rubio dorado luminoso', hex: '#D4AF37' },
  { label: 'Rubio ceniza / Platino', hex: '#B8B0A2' },
  { label: 'Pelirrojo / Cobrizo cálido', hex: '#B3541E' }
];

export const COLOR_HARMONIES_LIST: ColorSeason[] = [
  'Cálida Luminosa',
  'Cálida Dorada',
  'Cálida Vibrante',
  'Cálida Suave',
  'Cálida Terrosa',
  'Cálida Profunda',
  'Fría Clara',
  'Fría Empolvada',
  'Fría Serena',
  'Fría Cristalina',
  'Fría Intensa',
  'Fría Profunda'
];

const COLOR_SEASONS_INFO: Record<ColorSeason, { 
  description: string; 
  bestColors: ColorSwatch[]; 
  faceRecommendedColors: ColorSwatch[];
  avoidColors: ColorSwatch[]; 
}> = {
  'Cálida Suave': {
    description: 'Tonos tierra cálidos, apagados y aterciopelados. El beige arena, camel, terracota suave, oliva y marrón chocolate potencian tu luminosidad.',
    bestColors: [
      { name: 'Beige arena', hex: '#D8C7B5' },
      { name: 'Terracota suave', hex: '#C3684B' },
      { name: 'Marrón café', hex: '#4A2E1B' },
      { name: 'Verde oliva', hex: '#708238' },
      { name: 'Camel tostado', hex: '#C5A880' }
    ],
    faceRecommendedColors: [
      { name: 'Marfil cálido', hex: '#FFF8EE' },
      { name: 'Terracota suave', hex: '#C3684B' },
      { name: 'Marrón café suave', hex: '#4A2E1B' },
      { name: 'Oro viejo / Bronce', hex: '#C5A880' }
    ],
    avoidColors: [
      { name: 'Negro puro', hex: '#000000' },
      { name: 'Cian puro', hex: '#00FFFF' },
      { name: 'Fucsia flúor', hex: '#FF00FF' }
    ]
  },
  'Cálida Terrosa': {
    description: 'Colores cálidos ricos y tostados. Mostaza dorada, teja, caldera, verde bosque y tonos bronce.',
    bestColors: [
      { name: 'Mostaza dorada', hex: '#C5A059' },
      { name: 'Caldera / Teja', hex: '#B3541E' },
      { name: 'Verde bosque', hex: '#2D4B36' },
      { name: 'Cuero / Caramelo', hex: '#8B4513' },
      { name: 'Coral tostado', hex: '#E07A5F' }
    ],
    faceRecommendedColors: [
      { name: 'Crema tostado', hex: '#FDF5E6' },
      { name: 'Mostaza dorada', hex: '#C5A059' },
      { name: 'Caldera / Teja', hex: '#B3541E' },
      { name: 'Oro amarillo rico', hex: '#D4AF37' }
    ],
    avoidColors: [
      { name: 'Celeste frío', hex: '#E0F7FA' },
      { name: 'Gris acero', hex: '#B0BEC5' },
      { name: 'Lila pastel', hex: '#E1BEE7' }
    ]
  },
  'Cálida Profunda': {
    description: 'Colores intensos, cálidos y profundos. Granate vino, verde petróleo, cacao y café oscuro.',
    bestColors: [
      { name: 'Granate vino', hex: '#4A0E17' },
      { name: 'Verde petróleo', hex: '#1B3B36' },
      { name: 'Chocolate oscuro', hex: '#3D2314' },
      { name: 'Oro viejo', hex: '#D4AF37' },
      { name: 'Rojo borgoña', hex: '#7F1D1D' }
    ],
    faceRecommendedColors: [
      { name: 'Blanco crema denso', hex: '#F5EBE1' },
      { name: 'Granate vino', hex: '#4A0E17' },
      { name: 'Verde petróleo', hex: '#1B3B36' },
      { name: 'Oro envejecido', hex: '#B8860B' }
    ],
    avoidColors: [
      { name: 'Crema pálido', hex: '#FFFDD0' },
      { name: 'Azul hielo', hex: '#E0F2FE' },
      { name: 'Rosa bebé', hex: '#FCE7F3' }
    ]
  },
  'Cálida Luminosa': {
    description: 'Tonos pastel cálidos, luminosos y frescos: melocotón, aguamarina, coral suave y marfil.',
    bestColors: [
      { name: 'Melocotón suave', hex: '#FED7AA' },
      { name: 'Verde menta', hex: '#A7F3D0' },
      { name: 'Rosa coralino', hex: '#F472B6' },
      { name: 'Marfil cálido', hex: '#FFFBEB' },
      { name: 'Amarillo sol', hex: '#FDE047' }
    ],
    faceRecommendedColors: [
      { name: 'Marfil luminoso', hex: '#FFFBEB' },
      { name: 'Melocotón coralino', hex: '#FED7AA' },
      { name: 'Verde menta pastel', hex: '#A7F3D0' },
      { name: 'Oro claro brillante', hex: '#FDE047' }
    ],
    avoidColors: [
      { name: 'Negro noche', hex: '#0F172A' },
      { name: 'Gris antracita', hex: '#374151' },
      { name: 'Azul tinta', hex: '#111827' }
    ]
  },
  'Cálida Dorada': {
    description: 'Colores dorados, vivos y radiantes: coral vibrante, turquesa cálido, verde lima y amarillo mantequilla.',
    bestColors: [
      { name: 'Coral vibrante', hex: '#FB923C' },
      { name: 'Turquesa cálido', hex: '#2DD4BF' },
      { name: 'Verde lima', hex: '#A3E635' },
      { name: 'Amarillo oro', hex: '#FACC15' },
      { name: 'Naranja amapola', hex: '#EA580C' }
    ],
    faceRecommendedColors: [
      { name: 'Vainilla cálida', hex: '#FEF9C3' },
      { name: 'Coral amapola', hex: '#FB923C' },
      { name: 'Turquesa cálido', hex: '#2DD4BF' },
      { name: 'Oro amarillo brillante', hex: '#FACC15' }
    ],
    avoidColors: [
      { name: 'Azul pizarra', hex: '#1E293B' },
      { name: 'Gris ceniza', hex: '#475569' },
      { name: 'Gris plomo', hex: '#64748B' }
    ]
  },
  'Cálida Vibrante': {
    description: 'Colores vivos, alegres y cristalinos: rojo amapola, fucsia cálido, esmeralda y ámbar.',
    bestColors: [
      { name: 'Rojo amapola', hex: '#EF4444' },
      { name: 'Sandía brillante', hex: '#F43F5E' },
      { name: 'Verde esmeralda', hex: '#10B981' },
      { name: 'Azul eléctrico', hex: '#3B82F6' },
      { name: 'Ámbar brillante', hex: '#F59E0B' }
    ],
    faceRecommendedColors: [
      { name: 'Blanco marfil radiante', hex: '#FEFCE8' },
      { name: 'Rojo amapola cristalino', hex: '#EF4444' },
      { name: 'Esmeralda cálido', hex: '#10B981' },
      { name: 'Oro pulido', hex: '#F59E0B' }
    ],
    avoidColors: [
      { name: 'Gris topo', hex: '#71717A' },
      { name: 'Gris mate', hex: '#52525B' },
      { name: 'Marrón ceniza', hex: '#3F3F46' }
    ]
  },
  'Fría Clara': {
    description: 'Tonos suaves, fríos y empolvados: rosa pastel, azul cielo, lavanda y gris perla.',
    bestColors: [
      { name: 'Rosa pastel', hex: '#FBCFE8' },
      { name: 'Azul cielo', hex: '#BAE6FD' },
      { name: 'Lavanda suave', hex: '#E9D5FF' },
      { name: 'Gris perla', hex: '#E2E8F0' },
      { name: 'Azul bebé', hex: '#93C5FD' }
    ],
    faceRecommendedColors: [
      { name: 'Blanco suave nube', hex: '#F8FAFC' },
      { name: 'Rosa empolvado', hex: '#FBCFE8' },
      { name: 'Azul cielo claro', hex: '#BAE6FD' },
      { name: 'Plata mate', hex: '#E2E8F0' }
    ],
    avoidColors: [
      { name: 'Marrón cálido', hex: '#78350F' },
      { name: 'Caldera fuerte', hex: '#B45309' },
      { name: 'Naranja teja', hex: '#EA580C' }
    ]
  },
  'Fría Empolvada': {
    description: 'Tonos neutros fríos y empolvados: malva, verde salvia apagado, azul acero y rosa ceniza.',
    bestColors: [
      { name: 'Malva empolvado', hex: '#C084FC' },
      { name: 'Gris pizarra', hex: '#94A3B8' },
      { name: 'Verde salvia', hex: '#86EFAC' },
      { name: 'Rosa ceniza', hex: '#F472B6' },
      { name: 'Azul denim suave', hex: '#64748B' }
    ],
    faceRecommendedColors: [
      { name: 'Gris perla claro', hex: '#F1F5F9' },
      { name: 'Malva empolvado', hex: '#C084FC' },
      { name: 'Verde salvia apagado', hex: '#86EFAC' },
      { name: 'Plata envejecida suave', hex: '#94A3B8' }
    ],
    avoidColors: [
      { name: 'Naranja caldera', hex: '#EA580C' },
      { name: 'Mostaza ocre', hex: '#D97706' },
      { name: 'Amarillo dorado', hex: '#EAB308' }
    ]
  },
  'Fría Serena': {
    description: 'Azules gélidos, frambuesa, gris azulado y rosa frío de intensidad media.',
    bestColors: [
      { name: 'Azul hielo', hex: '#38BDF8' },
      { name: 'Frambuesa frío', hex: '#BE185D' },
      { name: 'Azul acero', hex: '#64748B' },
      { name: 'Blanco lavanda', hex: '#E0E7FF' },
      { name: 'Azul marino suave', hex: '#1E40AF' }
    ],
    faceRecommendedColors: [
      { name: 'Blanco lavanda', hex: '#EEF2FF' },
      { name: 'Frambuesa frío', hex: '#BE185D' },
      { name: 'Azul acero gélido', hex: '#38BDF8' },
      { name: 'Plata pura', hex: '#CBD5E1' }
    ],
    avoidColors: [
      { name: 'Marrón teja', hex: '#B45309' },
      { name: 'Mostaza cálida', hex: '#CA8A04' },
      { name: 'Calabaza / Óxido', hex: '#D97706' }
    ]
  },
  'Fría Cristalina': {
    description: 'Colores vibrantes, joya y de alto impacto con base fría: zafiro, fucsia eléctrico, esmeralda y blanco puro.',
    bestColors: [
      { name: 'Azul cobalto', hex: '#2563EB' },
      { name: 'Fucsia eléctrico', hex: '#EC4899' },
      { name: 'Esmeralda puro', hex: '#059669' },
      { name: 'Blanco nuclear', hex: '#FFFFFF' },
      { name: 'Negro noche', hex: '#0F172A' }
    ],
    faceRecommendedColors: [
      { name: 'Blanco hielo', hex: '#F8FAFC' },
      { name: 'Fucsia eléctrico', hex: '#EC4899' },
      { name: 'Azul cobalto zafiro', hex: '#2563EB' },
      { name: 'Plata pulida', hex: '#CBD5E1' }
    ],
    avoidColors: [
      { name: 'Ocre mostaza', hex: '#D97706' },
      { name: 'Marrón barro', hex: '#92400E' },
      { name: 'Camel apagado', hex: '#78350F' }
    ]
  },
  'Fría Intensa': {
    description: 'Contraste frío y puro. Blanco nuclear, negro azabache, azul marino profundo, rubí y magenta.',
    bestColors: [
      { name: 'Blanco puro', hex: '#FFFFFF' },
      { name: 'Negro azabache', hex: '#0A0A0A' },
      { name: 'Azul marino frío', hex: '#1E3A8A' },
      { name: 'Rojo rubí', hex: '#BE123C' },
      { name: 'Púrpura real', hex: '#701A75' }
    ],
    faceRecommendedColors: [
      { name: 'Blanco nuclear puro', hex: '#FFFFFF' },
      { name: 'Rojo rubí frío', hex: '#BE123C' },
      { name: 'Azul marino noche', hex: '#1E3A8A' },
      { name: 'Plata brillante', hex: '#E2E8F0' }
    ],
    avoidColors: [
      { name: 'Naranja tostado', hex: '#D97706' },
      { name: 'Teja cálido', hex: '#B45309' },
      { name: 'Mostaza dorada', hex: '#CA8A04' }
    ]
  },
  'Fría Profunda': {
    description: 'Tonos oscuros y penetrantes con base fría: cereza oscuro, berenjena, carbón y azul noche.',
    bestColors: [
      { name: 'Cereza oscuro', hex: '#450A0A' },
      { name: 'Berenjena intenso', hex: '#3B0764' },
      { name: 'Gris carbón', hex: '#1E293B' },
      { name: 'Magenta oscuro', hex: '#831843' },
      { name: 'Azul noche', hex: '#0F172A' }
    ],
    faceRecommendedColors: [
      { name: 'Blanco nieve', hex: '#F1F5F9' },
      { name: 'Cereza oscuro', hex: '#450A0A' },
      { name: 'Berenjena real', hex: '#3B0764' },
      { name: 'Plata oscura / Platino', hex: '#94A3B8' }
    ],
    avoidColors: [
      { name: 'Amarillo suave', hex: '#FEF08A' },
      { name: 'Melocotón pastel', hex: '#FED7AA' },
      { name: 'Vainilla pálido', hex: '#FDE68A' }
    ]
  },

  // Alias heredados para retrocompatibilidad total:
  'Otoño Suave': null as any,
  'Otoño Cálido': null as any,
  'Otoño Profundo': null as any,
  'Primavera Clara': null as any,
  'Primavera Cálida': null as any,
  'Primavera Brillante': null as any,
  'Verano Claro': null as any,
  'Verano Suave': null as any,
  'Verano Frío': null as any,
  'Invierno Brillante': null as any,
  'Invierno Frío': null as any,
  'Invierno Profundo': null as any
};

// Vinculación de alias heredados:
COLOR_SEASONS_INFO['Otoño Suave'] = COLOR_SEASONS_INFO['Cálida Suave'];
COLOR_SEASONS_INFO['Otoño Cálido'] = COLOR_SEASONS_INFO['Cálida Terrosa'];
COLOR_SEASONS_INFO['Otoño Profundo'] = COLOR_SEASONS_INFO['Cálida Profunda'];
COLOR_SEASONS_INFO['Primavera Clara'] = COLOR_SEASONS_INFO['Cálida Luminosa'];
COLOR_SEASONS_INFO['Primavera Cálida'] = COLOR_SEASONS_INFO['Cálida Dorada'];
COLOR_SEASONS_INFO['Primavera Brillante'] = COLOR_SEASONS_INFO['Cálida Vibrante'];
COLOR_SEASONS_INFO['Verano Claro'] = COLOR_SEASONS_INFO['Fría Clara'];
COLOR_SEASONS_INFO['Verano Suave'] = COLOR_SEASONS_INFO['Fría Empolvada'];
COLOR_SEASONS_INFO['Verano Frío'] = COLOR_SEASONS_INFO['Fría Serena'];
COLOR_SEASONS_INFO['Invierno Brillante'] = COLOR_SEASONS_INFO['Fría Cristalina'];
COLOR_SEASONS_INFO['Invierno Frío'] = COLOR_SEASONS_INFO['Fría Intensa'];
COLOR_SEASONS_INFO['Invierno Profundo'] = COLOR_SEASONS_INFO['Fría Profunda'];

const BODY_SHAPES_INFO: Record<BodyShape, { label: string; tip: string }> = {
  'reloj_de_arena': {
    label: 'Reloj de Arena',
    tip: 'Busto y caderas proporcionados con cintura definida. Favorecen los cortes que respetan la cintura natural, pantalones tiro alto y vestidos cruzados.'
  },
  'pera': {
    label: 'Triángulo / Pera',
    tip: 'Caderas más anchas que los hombros. Favorece atraer la atención hacia la parte superior con blazers estructurados, tops llamativos y partes inferiores de caída fluida.'
  },
  'rectangulo': {
    label: 'Rectángulo',
    tip: 'Hombros, cintura y caderas alineados. El estilismo busca crear curvas y dinamismo con cinturones vistosos, drapeados y cortes fluidos.'
  },
  'triangulo_invertido': {
    label: 'Triángulo Invertido',
    tip: 'Hombros más anchos que la cadera. Favorecen los pantalones anchos wide-leg o faldas evasé para equilibrar el volumen inferior.'
  },
  'manzana': {
    label: 'Ovalada / Manzana',
    tip: 'Volumen concentrado en la zona media. Favorecen los tejidos con caída, líneas verticales, escotes en V y prendas monocromáticas.'
  }
};

const STYLES_LIST: StyleTag[] = [
  'clean girl', 'old money', 'chic', 'casual', 'streetwear', 'coquette', 'elegante', 'comfy', 'fiesta'
];

export type ProfileCardSection = 'identity' | 'facial' | 'morphology' | 'styles' | 'colorSeason';

export const ProfileView: React.FC<ProfileViewProps> = ({ profile, onProfileUpdate }) => {
  const [currentProfile, setCurrentProfile] = useState<UserProfile>({
    ...profile,
    faceShape: profile.faceShape || 'ovalada',
    facialContrast: profile.facialContrast || 'medio'
  });
  const [isScanning, setIsScanning] = useState(false);
  const [scanResultNotice, setScanResultNotice] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isColorSeasonModalOpen, setIsColorSeasonModalOpen] = useState(false);

  // Control de tarjetas plegadas en móvil (solo una abierta a la vez o todas plegadas)
  const [expandedMobileSection, setExpandedMobileSection] = useState<ProfileCardSection | null>(null);

  const toggleMobileSection = (section: ProfileCardSection) => {
    setExpandedMobileSection(prev => prev === section ? null : section);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const analysis = await extractLocalBiometricFeatures(file);
      
      const updated: UserProfile = {
        ...currentProfile,
        skinTone: analysis.skinTone,
        skinUndertone: analysis.skinUndertone,
        colorSeason: analysis.colorSeason,
        eyeColor: analysis.eyeColor,
        hairColor: analysis.hairColor,
        faceShape: analysis.faceShape,
        facialContrast: analysis.facialContrast,
        faceAnalysisPhoto: analysis.facePhotoDataUrl,
        avatarLocalPreview: analysis.facePhotoDataUrl,
        detectedFacialFeatures: {
          skinTone: analysis.skinTone,
          skinUndertone: analysis.skinUndertone,
          eyeColor: analysis.eyeColor,
          hairColor: analysis.hairColor,
          faceShape: analysis.faceShape,
          facialContrast: analysis.facialContrast,
          colorSeason: analysis.colorSeason,
          scanDate: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        }
      };

      setCurrentProfile(updated);
      setScanResultNotice(analysis.summaryText);
      saveProfile(updated);
      onProfileUpdate(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveFacePhoto = () => {
    if (confirm('¿Eliminar la foto guardada en tu dispositivo?')) {
      const updated: UserProfile = {
        ...currentProfile,
        faceAnalysisPhoto: undefined,
        avatarLocalPreview: undefined,
        detectedFacialFeatures: undefined
      };
      setCurrentProfile(updated);
      saveProfile(updated);
      onProfileUpdate(updated);
      setScanResultNotice(null);
    }
  };

  const handleRestoreDetectedFeatures = () => {
    if (!currentProfile.detectedFacialFeatures) return;
    const d = currentProfile.detectedFacialFeatures;
    const updated: UserProfile = {
      ...currentProfile,
      skinTone: d.skinTone,
      skinUndertone: d.skinUndertone,
      eyeColor: d.eyeColor,
      hairColor: d.hairColor,
      faceShape: d.faceShape,
      facialContrast: d.facialContrast,
      colorSeason: d.colorSeason
    };
    setCurrentProfile(updated);
    saveProfile(updated);
    onProfileUpdate(updated);
  };

  const updateFacialFeature = (patch: Partial<UserProfile>) => {
    const affectsSeason = 'skinUndertone' in patch || 
                          'skinTone' in patch || 
                          'facialContrast' in patch || 
                          'eyeColor' in patch || 
                          'hairColor' in patch;

    const updated: UserProfile = { ...currentProfile, ...patch };

    // Si se modifica una variable fisonómica y no se está forzando manualmente colorSeason,
    // recalculamos en tiempo real la armonía cromática idónea:
    if (affectsSeason && !('colorSeason' in patch)) {
      const newSeason = calculateColorSeason({
        skinUndertone: updated.skinUndertone,
        skinTone: updated.skinTone,
        facialContrast: updated.facialContrast || 'medio',
        eyeColor: updated.eyeColor,
        hairColor: updated.hairColor
      });
      updated.colorSeason = newSeason;
    }

    setCurrentProfile(updated);
    saveProfile(updated);
    onProfileUpdate(updated);
  };

  const handleSave = () => {
    saveProfile(currentProfile);
    onProfileUpdate(currentProfile);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const toggleStyle = (style: StyleTag) => {
    const exists = currentProfile.preferredStyles.includes(style);
    const updated = exists
      ? currentProfile.preferredStyles.filter(s => s !== style)
      : [...currentProfile.preferredStyles, style];
    setCurrentProfile({ ...currentProfile, preferredStyles: updated });
  };

  const currentSeasonData = COLOR_SEASONS_INFO[currentProfile.colorSeason] || COLOR_SEASONS_INFO['Cálida Suave'];
  const activeFaceShape: FaceShape = currentProfile.faceShape || 'ovalada';
  const faceShapeInfo = FACE_SHAPES_CONFIG[activeFaceShape] || FACE_SHAPES_CONFIG.ovalada;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-6 space-y-2 sm:space-y-8 pb-24 md:pb-12 overflow-x-hidden">
      {/* Editorial Header (Ultra compacto en móvil para encajar las 5 tarjetas en una sola pantalla) */}
      <div className="flex items-center justify-between gap-2 border-b border-[#E8E2D6] pb-2 sm:pb-5">
        <div className="min-w-0">
          <span className="text-[10px] sm:text-xs uppercase tracking-widest font-semibold text-rose-900 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            Ficha de Estilo
          </span>
          <h1 className="font-serif text-lg sm:text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight leading-tight truncate sm:whitespace-normal">
            Mi Perfil <span className="italic font-normal text-rose-950">& Visagismo</span>
          </h1>
          <p className="text-sm text-neutral-600 mt-1 max-w-xl hidden sm:block">
            Tus rasgos faciales, morfología y colorimetría analizados y <strong>100% configurables</strong> en tu dispositivo.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center justify-center gap-1.5 py-1.5 sm:py-3 px-3 sm:px-6 rounded-full sm:rounded-2xl bg-neutral-900 text-white font-semibold text-xs sm:text-sm hover:bg-neutral-800 transition-all shadow-xs shrink-0 cursor-pointer"
        >
          {savedSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>¡Guardado!</span>
            </>
          ) : (
            <span>Guardar</span>
          )}
        </button>
      </div>

      {/* TOP SECTION: Datos Personales (Nombre, Edad, Ciudad, Ocupación) */}
      <div className="bg-white/90 border border-[#E5DFD5] rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-2xs space-y-2 sm:space-y-4 transition-all">
        <div 
          onClick={() => toggleMobileSection('identity')}
          className="flex items-center justify-between border-b border-neutral-100 pb-1.5 sm:pb-3 cursor-pointer select-none lg:cursor-default"
        >
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-rose-50 flex items-center justify-center text-rose-900 shrink-0">
              <User className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-serif text-xs sm:text-xl font-bold text-neutral-900 leading-snug">
                Datos Personales & Identidad
              </h2>
              {/* Resumen Móvil */}
              <p className="text-[10.5px] sm:text-xs text-rose-950/80 font-medium truncate block lg:hidden mt-0.5">
                {currentProfile.name || 'Tu nombre'} • {currentProfile.age ? currentProfile.age + ' años' : 'Edad no definida'} • {currentProfile.city || 'Ciudad no definida'}
              </p>
              <p className="text-xs text-neutral-500 hidden lg:block">
                Para que tu estilista IA personalice el trato y el contexto diario
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <span className="hidden sm:inline-block text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Privado en tu móvil
            </span>

            {/* Toggle button en móvil */}
            <div className="lg:hidden flex items-center gap-1 text-[11px] font-semibold text-rose-900">
              <span>{expandedMobileSection === 'identity' ? 'Plegar' : 'Ajustar'}</span>
              {expandedMobileSection === 'identity' ? (
                <ChevronUp className="w-3.5 h-3.5 text-rose-900" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              )}
            </div>
          </div>
        </div>

        {/* Contenido (desplegable en móvil, siempre visible en desktop) */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1 ${
          expandedMobileSection === 'identity' ? 'block' : 'hidden lg:grid'
        }`}>
          {/* Nombre */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-neutral-400" />
              Tu Nombre o Apodo
            </label>
            <input
              type="text"
              value={currentProfile.name}
              onChange={(e) => setCurrentProfile({ ...currentProfile, name: e.target.value })}
              placeholder="Ej. Lucía, Sofi, Marta..."
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-[#FAF8F5] focus:outline-none focus:ring-1 focus:ring-neutral-800 font-medium"
            />
          </div>

          {/* Edad */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              Edad (años)
            </label>
            <input
              type="number"
              value={currentProfile.age || ''}
              onChange={(e) => setCurrentProfile({ ...currentProfile, age: parseInt(e.target.value) || 20 })}
              placeholder="Ej. 21"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-[#FAF8F5] focus:outline-none focus:ring-1 focus:ring-neutral-800 font-medium"
            />
          </div>

          {/* Ciudad / Residencia */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-neutral-400" />
              Ciudad de Residencia
            </label>
            <input
              type="text"
              value={currentProfile.city || ''}
              onChange={(e) => setCurrentProfile({ ...currentProfile, city: e.target.value })}
              placeholder="Madrid, Barcelona, Sevilla..."
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-[#FAF8F5] focus:outline-none focus:ring-1 focus:ring-neutral-800 font-medium"
            />
          </div>

          {/* Ocupación habitual */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-neutral-400" />
              Ocupación / Rutina
            </label>
            <input
              type="text"
              value={currentProfile.occupation || ''}
              onChange={(e) => setCurrentProfile({ ...currentProfile, occupation: e.target.value })}
              placeholder="Estudiante, Oficina, Creativa..."
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-[#FAF8F5] focus:outline-none focus:ring-1 focus:ring-neutral-800 font-medium"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-8">
        
        {/* Left Column: Full Facial Analysis & Visagism Card */}
        <div className="lg:col-span-6 space-y-2 sm:space-y-6">
          
          {/* ========================================================================= */}
          {/* SECCIÓN PRINCIPAL: ANÁLISIS FACIAL COMPLETO & VISAGISMO                    */}
          {/* ========================================================================= */}
          <div className="bg-white/95 border border-[#E5DFD5] rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-2xs space-y-2 sm:space-y-6 transition-all">
            
            {/* Header del Analizador */}
            <div 
              onClick={() => toggleMobileSection('facial')}
              className="flex items-center justify-between border-b border-neutral-200 pb-1.5 sm:pb-3 cursor-pointer select-none lg:cursor-default"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-rose-900 shrink-0" />
                  <h2 className="font-serif text-xs sm:text-xl font-bold text-neutral-900 leading-snug">
                    Análisis Facial & Visagismo
                  </h2>
                </div>
                {/* Resumen Móvil */}
                <p className="text-[10.5px] sm:text-xs text-rose-950/80 font-medium truncate block lg:hidden mt-0.5">
                  Rostro {FACE_SHAPES_CONFIG[activeFaceShape]?.label || 'Ovalada'} • Contraste {currentProfile.facialContrast || 'medio'} • Piel {currentProfile.skinTone} ({currentProfile.skinUndertone})
                </p>
                <p className="text-xs text-neutral-500 mt-0.5 hidden lg:block">
                  Fisonomía, forma de rostro, ojos y contraste • 100% configurable
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  100% En Dispositivo
                </span>

                {/* Toggle button en móvil */}
                <div className="lg:hidden flex items-center gap-1 text-[11px] font-semibold text-rose-900">
                  <span>{expandedMobileSection === 'facial' ? 'Plegar' : 'Ajustar'}</span>
                  {expandedMobileSection === 'facial' ? (
                    <ChevronUp className="w-3.5 h-3.5 text-rose-900" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Contenido (desplegable en móvil, siempre visible en desktop) */}
            <div className={`space-y-6 ${expandedMobileSection === 'facial' ? 'block' : 'hidden lg:block'}`}>

            {/* Escáner de Selfie con IA Local & Comparativa de Foto Guardada */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handlePhotoScan}
              className="hidden"
            />

            {currentProfile.faceAnalysisPhoto ? (
              <div className="bg-[#FAF8F5] border border-[#E5DFD5] rounded-2xl p-4 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-neutral-200/70 pb-3">
                  <div>
                    <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-rose-900" />
                      Foto de Análisis Guardada (100% Local)
                    </span>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      {currentProfile.detectedFacialFeatures?.scanDate 
                        ? `Analizada el ${currentProfile.detectedFacialFeatures.scanDate} • Almacenada en este dispositivo`
                        : 'Almacenada de forma privada en tu dispositivo local'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isScanning}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-neutral-300 text-neutral-700 hover:text-neutral-900 hover:border-neutral-400 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Camera className="w-3.5 h-3.5 text-neutral-600" />
                      <span>{isScanning ? 'Analizando...' : 'Cambiar foto'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveFacePhoto}
                      className="p-1.5 text-neutral-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar foto del dispositivo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Grid: Foto guardada + Comparativa "¿En qué difiere?" */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  {/* Foto guardada en local con relación de aspecto original */}
                  <div className="sm:col-span-4 flex flex-col items-center justify-center">
                    <div className="relative w-full max-w-[145px] sm:max-w-[175px] rounded-2xl overflow-hidden border-2 border-neutral-300 shadow-xs bg-[#F7F5F0] flex items-center justify-center p-1">
                      <img 
                        src={currentProfile.faceAnalysisPhoto} 
                        alt="Rostro analizado" 
                        className="w-full h-auto max-h-60 rounded-xl object-contain drop-shadow-2xs"
                      />
                      <span className="absolute bottom-2 inset-x-2 text-center text-[9px] font-bold bg-neutral-900/85 text-white py-0.5 rounded-md backdrop-blur-2xs shadow-xs">
                        🔒 Aspecto Original
                      </span>
                    </div>
                  </div>

                  {/* Panel de Comparativa: En qué difiere */}
                  <div className="sm:col-span-8 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-neutral-800 flex items-center gap-1">
                        <span>🔍 ¿En qué difiere de tu foto?</span>
                      </span>
                      {currentProfile.detectedFacialFeatures && (
                        (() => {
                          const det = currentProfile.detectedFacialFeatures;
                          const hasDiff = (
                            det.faceShape !== currentProfile.faceShape ||
                            det.eyeColor !== currentProfile.eyeColor ||
                            det.hairColor !== currentProfile.hairColor ||
                            det.skinTone !== currentProfile.skinTone ||
                            det.skinUndertone !== currentProfile.skinUndertone ||
                            det.colorSeason !== currentProfile.colorSeason
                          );
                          return hasDiff ? (
                            <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              ✏️ Personalizado por ti
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              100% Fiel a la foto
                            </span>
                          );
                        })()
                      )}
                    </div>

                    {currentProfile.detectedFacialFeatures ? (
                      <div className="bg-white rounded-xl border border-neutral-200 p-2.5 space-y-1.5">
                        {/* 1. Forma de Rostro */}
                        <div className="flex items-center justify-between text-[11px] pb-1 border-b border-neutral-100">
                          <span className="text-neutral-500">Forma Rostro:</span>
                          <div className="flex items-center gap-1.5 font-medium">
                            <span className="text-neutral-400">Foto: {currentProfile.detectedFacialFeatures.faceShape}</span>
                            <span className="text-neutral-300">→</span>
                            <span className={currentProfile.detectedFacialFeatures.faceShape !== currentProfile.faceShape ? 'text-amber-800 font-bold' : 'text-neutral-900'}>
                              {currentProfile.faceShape}
                            </span>
                            {currentProfile.detectedFacialFeatures.faceShape === currentProfile.faceShape ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <span className="text-[10px] text-amber-700 bg-amber-50 px-1 rounded">editado</span>
                            )}
                          </div>
                        </div>

                        {/* 2. Color de Ojos */}
                        <div className="flex items-center justify-between text-[11px] pb-1 border-b border-neutral-100">
                          <span className="text-neutral-500">Ojos:</span>
                          <div className="flex items-center gap-1.5 font-medium">
                            <span className="text-neutral-400">Foto: {currentProfile.detectedFacialFeatures.eyeColor}</span>
                            <span className="text-neutral-300">→</span>
                            <span className={currentProfile.detectedFacialFeatures.eyeColor !== currentProfile.eyeColor ? 'text-amber-800 font-bold' : 'text-neutral-900'}>
                              {currentProfile.eyeColor}
                            </span>
                            {currentProfile.detectedFacialFeatures.eyeColor === currentProfile.eyeColor ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <span className="text-[10px] text-amber-700 bg-amber-50 px-1 rounded">editado</span>
                            )}
                          </div>
                        </div>

                        {/* 3. Piel & Subtono */}
                        <div className="flex items-center justify-between text-[11px] pb-1 border-b border-neutral-100">
                          <span className="text-neutral-500">Piel / Subtono:</span>
                          <div className="flex items-center gap-1.5 font-medium">
                            <span className="text-neutral-400">Foto: {currentProfile.detectedFacialFeatures.skinTone} ({currentProfile.detectedFacialFeatures.skinUndertone})</span>
                            <span className="text-neutral-300">→</span>
                            <span className={
                              currentProfile.detectedFacialFeatures.skinTone !== currentProfile.skinTone ||
                              currentProfile.detectedFacialFeatures.skinUndertone !== currentProfile.skinUndertone
                                ? 'text-amber-800 font-bold'
                                : 'text-neutral-900'
                            }>
                              {currentProfile.skinTone} ({currentProfile.skinUndertone})
                            </span>
                          </div>
                        </div>

                        {/* 4. Armonía Cromática Personal */}
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-neutral-500">Armonía Personal:</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-medium">
                            <span className="text-neutral-400">Foto: {currentProfile.detectedFacialFeatures.colorSeason}</span>
                            <span className="text-neutral-300">→</span>
                            <span className={currentProfile.detectedFacialFeatures.colorSeason !== currentProfile.colorSeason ? 'text-amber-800 font-bold' : 'text-neutral-900'}>
                              {currentProfile.colorSeason}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-neutral-500">Foto guardada en memoria local de tu dispositivo.</p>
                    )}

                    {/* Botón para restablecer a los valores exactos de la foto si difiere */}
                    {currentProfile.detectedFacialFeatures && (
                      <button
                        type="button"
                        onClick={handleRestoreDetectedFeatures}
                        className="text-[11px] text-neutral-600 hover:text-neutral-900 font-medium flex items-center gap-1 transition-colors cursor-pointer pt-0.5"
                      >
                        <RotateCcw className="w-3 h-3 text-neutral-500" />
                        <span>Restablecer rasgos exactos detectados en la foto</span>
                      </button>
                    )}
                  </div>
                </div>

                {scanResultNotice && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1 animate-in fade-in">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Análisis completado y guardado en local</span>
                    </div>
                    <p className="text-emerald-800 leading-relaxed font-sans">{scanResultNotice}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#FAF8F5] border border-[#E5DFD5] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-rose-900" />
                    Auto-Detección con Selfie (100% Local)
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Guardado en tu dispositivo
                  </span>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Sube o hazte un selfie frontal con buena luz. El navegador medirá tu fisonomía y <strong>guardará la foto en el almacenamiento local de tu dispositivo</strong> para que puedas contrastar en qué difiere del análisis.
                </p>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isScanning}
                  className="w-full py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                >
                  {isScanning ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                      <span>Midiendo forma de rostro, ojos y contraste en local...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      <span>📸 Escanear Rostro y Guardar Foto en Local</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* 1. FORMA DEL ROSTRO (CONFIGURABLE) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                  <Smile className="w-4 h-4 text-rose-900" />
                  1. Forma del Rostro
                </label>
                <span className="text-xs font-semibold px-2 py-0.5 bg-rose-50 text-rose-900 rounded-md border border-rose-200">
                  {faceShapeInfo.label}
                </span>
              </div>

              {/* Botones de las 6 morfologías faciales */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(FACE_SHAPES_CONFIG) as FaceShape[]).map((shape) => {
                  const cfg = FACE_SHAPES_CONFIG[shape];
                  const isSelected = activeFaceShape === shape;
                  return (
                    <button
                      key={shape}
                      onClick={() => updateFacialFeature({ faceShape: shape })}
                      className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-left transition-all cursor-pointer flex items-center gap-2 ${
                        isSelected
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs font-semibold'
                          : 'bg-[#FAF8F5] text-neutral-700 border-neutral-200 hover:bg-[#EAE4D8]'
                      }`}
                    >
                      <span className="text-sm shrink-0">{cfg.icon}</span>
                      <span className="truncate">{cfg.label.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-neutral-600 bg-[#FAF8F5] p-3 rounded-xl border border-neutral-200 leading-relaxed italic">
                "{faceShapeInfo.description}"
              </p>
            </div>

            {/* 2. COLOR DE OJOS (CONFIGURABLE) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-rose-900" />
                  2. Color de Ojos
                </label>
                <span className="text-xs font-semibold text-neutral-900">
                  {currentProfile.eyeColor}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {EYE_COLORS_PRESETS.map((preset) => {
                  const isSelected = currentProfile.eyeColor === preset.label;
                  return (
                    <button
                      key={preset.label}
                      onClick={() => updateFacialFeature({ eyeColor: preset.label })}
                      className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs font-semibold'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      <div
                        className="w-3 h-3 rounded-full border border-white shadow-2xs shrink-0"
                        style={{ backgroundColor: preset.hex }}
                      />
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. COLOR DEL CABELLO (CONFIGURABLE) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-rose-900" />
                  3. Color del Cabello
                </label>
                <span className="text-xs font-semibold text-neutral-900">
                  {currentProfile.hairColor}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {HAIR_COLORS_PRESETS.map((preset) => {
                  const isSelected = currentProfile.hairColor === preset.label;
                  return (
                    <button
                      key={preset.label}
                      onClick={() => updateFacialFeature({ hairColor: preset.label })}
                      className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs font-semibold'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      <div
                        className="w-3 h-3 rounded-full border border-white shadow-2xs shrink-0"
                        style={{ backgroundColor: preset.hex }}
                      />
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. TONO, SUBTONO & CONTRASTE FACIAL (CONFIGURABLES) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-neutral-100">
              {/* Tono de piel */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  Tono de Piel
                </label>
                <select
                  value={currentProfile.skinTone}
                  onChange={(e) => updateFacialFeature({ skinTone: e.target.value as any })}
                  className="w-full text-xs px-2.5 py-2 rounded-xl border border-neutral-300 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-neutral-800"
                >
                  <option value="muy_claro">Muy claro (Porcelana)</option>
                  <option value="claro">Claro</option>
                  <option value="medio">Medio</option>
                  <option value="bronceado">Bronceado</option>
                  <option value="oscuro">Oscuro</option>
                </select>
              </div>

              {/* Subtono de piel */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  Subtono
                </label>
                <select
                  value={currentProfile.skinUndertone}
                  onChange={(e) => updateFacialFeature({ skinUndertone: e.target.value as any })}
                  className="w-full text-xs px-2.5 py-2 rounded-xl border border-neutral-300 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-neutral-800"
                >
                  <option value="calido">Cálido (Dorado / Amarillo)</option>
                  <option value="frio">Frío (Rosado / Azulado)</option>
                  <option value="neutro">Neutro (Equilibrado)</option>
                </select>
              </div>

              {/* Contraste Facial */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  Contraste Facial
                </label>
                <select
                  value={currentProfile.facialContrast || 'medio'}
                  onChange={(e) => updateFacialFeature({ facialContrast: e.target.value as any })}
                  className="w-full text-xs px-2.5 py-2 rounded-xl border border-neutral-300 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-neutral-800"
                >
                  <option value="alto">Alto Contraste</option>
                  <option value="medio">Contraste Medio</option>
                  <option value="suave">Contraste Suave</option>
                </select>
              </div>
            </div>

            {/* Armonía Cromática recalculada en vivo según las 4 variables */}
            <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-3 flex items-center justify-between gap-2.5 transition-all">
              <div className="flex items-center gap-2.5 min-w-0">
                <Palette className="w-4 h-4 text-rose-900 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10.5px] text-neutral-500 block leading-tight">Armonía cromática calibrada:</span>
                  <strong className="text-xs sm:text-sm text-rose-950 font-bold block truncate">{currentProfile.colorSeason}</strong>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-rose-900 bg-white/90 px-2.5 py-1 rounded-full border border-rose-200 shadow-2xs shrink-0">
                Auto-calibrada ✨
              </span>
            </div>

            {/* 5. TARJETA DE VISAGISMO: CONSEJOS SEGÚN TU ROSTRO */}
            <div className="bg-[#FAF6F0] border border-[#E6DDCF] rounded-2xl p-4 space-y-3">
              <h3 className="font-serif text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Gem className="w-4 h-4 text-rose-900" />
                Guía de Visagismo & Estilo para tu Rostro {faceShapeInfo.label}
              </h3>

              <div className="space-y-2 text-xs text-neutral-700">
                <div className="flex items-start gap-2">
                  <Gem className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-neutral-900">Joyería & Pendientes:</strong>{' '}
                    <span>{getJewelryTip(activeFaceShape, currentProfile.skinUndertone)}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Smile className="w-3.5 h-3.5 text-rose-900 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-neutral-900">Escotes Favorecedores:</strong>{' '}
                    <span>{getNecklineTip(activeFaceShape)}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Glasses className="w-3.5 h-3.5 text-neutral-800 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-neutral-900">Gafas de Sol Ideales:</strong>{' '}
                    <span>{getEyewearTip(activeFaceShape)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Fin contenido condicional móvil Card 2 */}
            </div>

          </div>

        </div>

        {/* Right Column: Measurements, Body Shape & Style Vibes */}
        <div className="lg:col-span-6 space-y-2 sm:space-y-6">
          
          {/* Body Shape & Measurements Box */}
          <div className="bg-white/80 border border-[#E5DFD5] rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-2xs space-y-2 sm:space-y-5 transition-all">
            <div 
              onClick={() => toggleMobileSection('morphology')}
              className="flex items-center justify-between border-b border-neutral-200 pb-1.5 sm:pb-3 cursor-pointer select-none lg:cursor-default"
            >
              <div className="min-w-0 flex-1">
                <h2 className="font-serif text-xs sm:text-xl font-bold text-neutral-900 flex items-center gap-1.5 sm:gap-2 leading-tight">
                  <Ruler className="w-4 h-4 sm:w-5 sm:h-5 text-rose-900 shrink-0" />
                  <span>Morfología & Medidas</span>
                </h2>
                {/* Resumen Móvil */}
                <p className="text-[10.5px] sm:text-xs text-rose-950/80 font-medium truncate block lg:hidden mt-0.5">
                  {BODY_SHAPES_INFO[currentProfile.bodyShape]?.label || 'Reloj de Arena'} • {currentProfile.heightCm || 165} cm • ({currentProfile.chestCm || 88}-{currentProfile.waistCm || 65}-{currentProfile.hipsCm || 94} cm)
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="hidden sm:inline-block text-xs text-neutral-400">100% Confidencial</span>
                
                {/* Toggle button en móvil */}
                <div className="lg:hidden flex items-center gap-0.5 text-[11px] sm:text-xs font-semibold text-rose-900">
                  <span>{expandedMobileSection === 'morphology' ? 'Plegar' : 'Ajustar'}</span>
                  {expandedMobileSection === 'morphology' ? (
                    <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-900" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Contenido (desplegable en móvil, siempre visible en desktop) */}
            <div className={`space-y-5 ${expandedMobileSection === 'morphology' ? 'block' : 'hidden lg:block'}`}>

            {/* Silhouette Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-2">
                Silueta Corporal
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(BODY_SHAPES_INFO) as BodyShape[]).map((shape) => {
                  const isSelected = currentProfile.bodyShape === shape;
                  return (
                    <button
                      key={shape}
                      onClick={() => setCurrentProfile({ ...currentProfile, bodyShape: shape })}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                          : 'bg-[#FAF8F5] text-neutral-700 border-neutral-200 hover:bg-[#EAE4D8]'
                      }`}
                    >
                      {BODY_SHAPES_INFO[shape].label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-neutral-600 mt-2.5 p-3 bg-[#FAF8F5] rounded-xl border border-neutral-200">
                💡 <strong>Consejo de tu silueta:</strong> {BODY_SHAPES_INFO[currentProfile.bodyShape]?.tip}
              </p>
            </div>

            {/* Numerical measurements */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-2">
                Estatura & Medidas para Proporciones
              </label>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <span className="block text-[9px] uppercase font-bold text-neutral-400 mb-1">Altura</span>
                  <div className="relative">
                    <input
                      type="number"
                      value={currentProfile.heightCm || 165}
                      onChange={(e) => setCurrentProfile({ ...currentProfile, heightCm: parseInt(e.target.value) || 165 })}
                      className="w-full text-xs p-2 rounded-lg border border-neutral-300 bg-white text-center font-bold"
                    />
                    <span className="absolute right-1 top-2 text-[9px] text-neutral-400">cm</span>
                  </div>
                </div>

                <div>
                  <span className="block text-[9px] uppercase font-bold text-neutral-400 mb-1">Pecho</span>
                  <div className="relative">
                    <input
                      type="number"
                      value={currentProfile.chestCm || 88}
                      onChange={(e) => setCurrentProfile({ ...currentProfile, chestCm: parseInt(e.target.value) || 88 })}
                      className="w-full text-xs p-2 rounded-lg border border-neutral-300 bg-white text-center font-bold"
                    />
                    <span className="absolute right-1 top-2 text-[9px] text-neutral-400">cm</span>
                  </div>
                </div>

                <div>
                  <span className="block text-[9px] uppercase font-bold text-neutral-400 mb-1">Cintura</span>
                  <div className="relative">
                    <input
                      type="number"
                      value={currentProfile.waistCm || 65}
                      onChange={(e) => setCurrentProfile({ ...currentProfile, waistCm: parseInt(e.target.value) || 65 })}
                      className="w-full text-xs p-2 rounded-lg border border-neutral-300 bg-white text-center font-bold"
                    />
                    <span className="absolute right-1 top-2 text-[9px] text-neutral-400">cm</span>
                  </div>
                </div>

                <div>
                  <span className="block text-[9px] uppercase font-bold text-neutral-400 mb-1">Cadera</span>
                  <div className="relative">
                    <input
                      type="number"
                      value={currentProfile.hipsCm || 94}
                      onChange={(e) => setCurrentProfile({ ...currentProfile, hipsCm: parseInt(e.target.value) || 94 })}
                      className="w-full text-xs p-2 rounded-lg border border-neutral-300 bg-white text-center font-bold"
                    />
                    <span className="absolute right-1 top-2 text-[9px] text-neutral-400">cm</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Fin contenido condicional móvil Card 3 */}
            </div>

          </div>

          {/* Style Preferences & Vibes */}
          <div className="bg-white/80 border border-[#E5DFD5] rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-2xs space-y-2 sm:space-y-4 transition-all">
            <div 
              onClick={() => toggleMobileSection('styles')}
              className="flex items-center justify-between border-b border-neutral-100 pb-1.5 sm:pb-3 cursor-pointer select-none lg:cursor-default"
            >
              <div className="min-w-0 flex-1">
                <h2 className="font-serif text-xs sm:text-xl font-bold text-neutral-900 leading-tight">
                  Estilos & Vibes Predilectos
                </h2>
                {/* Resumen Móvil */}
                <p className="text-[10.5px] sm:text-xs text-rose-950/80 font-medium truncate block lg:hidden mt-0.5">
                  {currentProfile.preferredStyles.length > 0 
                    ? currentProfile.preferredStyles.map(s => '#' + s).join(', ') 
                    : 'Ningún estilo seleccionado'}
                </p>
                <p className="text-xs text-neutral-500 hidden lg:block">
                  Selecciona los estilos con los que más te identificas para priorizar recomendaciones afines
                </p>
              </div>

              <div className="lg:hidden flex items-center gap-0.5 text-[11px] sm:text-xs font-semibold text-rose-900 shrink-0 ml-2">
                <span>{expandedMobileSection === 'styles' ? 'Plegar' : 'Ajustar'}</span>
                {expandedMobileSection === 'styles' ? (
                  <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-900" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-400" />
                )}
              </div>
            </div>

            {/* Contenido (desplegable en móvil, siempre visible en desktop) */}
            <div className={`space-y-4 ${expandedMobileSection === 'styles' ? 'block' : 'hidden lg:block'}`}>
              <div className="flex flex-wrap gap-2">
                {STYLES_LIST.map((style) => {
                  const isSelected = currentProfile.preferredStyles.includes(style);
                  return (
                    <button
                      key={style}
                      onClick={() => toggleStyle(style)}
                      className={`py-1.5 px-3 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs font-semibold'
                          : 'bg-[#FAF8F5] text-neutral-600 border-neutral-200 hover:bg-[#EAE4D8]'
                      }`}
                    >
                      #{style}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Armonía Cromática Personal & Harmonizer */}
          <div className="bg-[#FAF8F5] border border-[#E2DBD0] rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-2xs space-y-2 sm:space-y-5 transition-all">
            <div 
              onClick={() => toggleMobileSection('colorSeason')}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2.5 border-b border-neutral-200 pb-1.5 sm:pb-3 cursor-pointer select-none lg:cursor-default"
            >
              <div className="flex items-center justify-between w-full lg:w-auto">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-rose-900 shrink-0" />
                    <h2 className="font-serif text-xs sm:text-xl font-bold text-neutral-900 leading-tight">
                      Armonía Cromática Personal
                    </h2>
                  </div>
                  {/* Resumen Móvil */}
                  <p className="text-[10.5px] sm:text-xs text-rose-950/80 font-medium truncate block lg:hidden mt-0.5">
                    Armonía {currentProfile.colorSeason}
                  </p>
                </div>

                {/* Mobile chevron */}
                <div className="lg:hidden flex items-center gap-0.5 text-[11px] sm:text-xs font-semibold text-rose-900 shrink-0 ml-2">
                  <span>{expandedMobileSection === 'colorSeason' ? 'Plegar' : 'Ajustar'}</span>
                  {expandedMobileSection === 'colorSeason' ? (
                    <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-900" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-400" />
                  )}
                </div>
              </div>

              {/* Desktop badge */}
              <div className="hidden lg:flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 bg-white rounded-full border border-neutral-200 text-neutral-800 shrink-0">
                  {currentProfile.colorSeason}
                </span>
              </div>
            </div>

            {/* Contenido (desplegable en móvil, siempre visible en desktop) */}
            <div className={`space-y-5 ${expandedMobileSection === 'colorSeason' ? 'block' : 'hidden lg:block'}`}>

            {/* Banner explicativo rápido */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/80 p-3.5 rounded-2xl border border-neutral-200 text-xs">
              <div className="flex items-center gap-2 text-neutral-700">
                <Sparkles className="w-4 h-4 text-rose-900 shrink-0" />
                <span>Descubre qué colores potencian tu luminosidad facial y la regla de oro para vestir.</span>
              </div>
              <button
                type="button"
                onClick={() => setIsColorSeasonModalOpen(true)}
                className="self-start sm:self-auto text-rose-900 hover:text-rose-950 font-bold underline cursor-pointer text-xs shrink-0"
              >
                Guía completa →
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-2">
                Seleccionar o ajustar tu armonía cromática:
              </label>
              <select
                value={currentProfile.colorSeason}
                onChange={(e) => updateFacialFeature({ colorSeason: e.target.value as ColorSeason })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-white focus:outline-none focus:ring-1 focus:ring-neutral-800 cursor-pointer font-medium"
              >
                {COLOR_HARMONIES_LIST.map((harmony) => (
                  <option key={harmony} value={harmony}>{harmony}</option>
                ))}
              </select>
            </div>

            <p className="text-xs text-neutral-700 leading-relaxed italic bg-white/70 p-3.5 rounded-2xl border border-neutral-200">
              "{currentSeasonData.description}"
            </p>

            {/* Best Flattering Colors */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 block mb-2">
                Tus Colores Estrella (Potencian tu brillo):
              </span>
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {currentSeasonData.bestColors.map((color, i) => (
                  <div key={i} className="text-center group" title={`${color.name} (${color.hex})`}>
                    <div 
                      className="h-10 sm:h-12 rounded-xl border border-black/10 shadow-2xs mb-1.5 transition-transform group-hover:scale-105" 
                      style={{ backgroundColor: color.hex }} 
                    />
                    <span className="text-[9.5px] sm:text-[10.5px] text-neutral-800 font-medium block break-words leading-tight">
                      {color.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Colors recommended near the face */}
            <div className="bg-emerald-50/40 p-3.5 rounded-2xl border border-emerald-200/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  Colores recomendados cerca del rostro:
                </span>
                <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-100/70 px-2 py-0.5 rounded-full">
                  Efecto buena cara
                </span>
              </div>
              <p className="text-[11px] text-neutral-600 leading-relaxed">
                Ideales para tops, camisas, bufandas, blazers, gafas y pendientes. Proyectan luz directa a tu piel:
              </p>
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2 pt-1">
                {currentSeasonData.faceRecommendedColors.map((color, i) => (
                  <div key={i} className="text-center group" title={`${color.name} (${color.hex})`}>
                    <div 
                      className="h-9 sm:h-10 rounded-xl border border-emerald-300/80 shadow-2xs mb-1.5 transition-transform group-hover:scale-105" 
                      style={{ backgroundColor: color.hex }} 
                    />
                    <span className="text-[9.5px] sm:text-[10.5px] text-neutral-800 font-medium block break-words leading-tight">
                      {color.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Colors to avoid near face */}
            <div className="bg-rose-50/30 p-3.5 rounded-2xl border border-rose-200/60 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-950 block">
                Colores a evitar cerca del rostro:
              </span>
              <p className="text-[11px] text-neutral-600 leading-relaxed">
                Pueden proyectar sombras o apagar el tono del cuello hacia arriba. Úsalos preferentemente en pantalones o faldas:
              </p>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-1">
                {currentSeasonData.avoidColors.map((color, i) => (
                  <div key={i} className="text-center opacity-90 group" title={`${color.name} (${color.hex})`}>
                    <div 
                      className="h-7 sm:h-8 rounded-lg border border-black/10 mb-1 transition-transform group-hover:scale-105" 
                      style={{ backgroundColor: color.hex }} 
                    />
                    <span className="text-[9.5px] sm:text-[10.5px] text-neutral-600 font-medium block break-words leading-tight">
                      {color.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fin contenido condicional móvil Card 5 */}
            </div>

          </div>

        </div>

      </div>

      {/* Ventana Emergente Educativa: ¿Cómo funciona la Armonía Cromática? */}
      <ColorSeasonModal
        isOpen={isColorSeasonModalOpen}
        onClose={() => setIsColorSeasonModalOpen(false)}
        currentSeason={currentProfile.colorSeason}
      />
    </div>
  );
};
