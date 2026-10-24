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
  CheckCircle2
} from 'lucide-react';
import type { UserProfile, ColorSeason, BodyShape, StyleTag, FaceShape } from '../types';
import { 
  extractLocalBiometricFeatures,
  getJewelryTip,
  getNecklineTip,
  getEyewearTip
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

const COLOR_SEASONS_INFO: Record<ColorSeason, { description: string; bestColors: string[]; avoidColors: string[] }> = {
  'Otoño Suave': {
    description: 'Tonos tierra cálidos, apagados y aterciopelados. El beige, camel, terracota, oliva y marrón chocolate potencian tu luminosidad.',
    bestColors: ['#D8C7B5', '#C3684B', '#4A2E1B', '#708238', '#C5A880'],
    avoidColors: ['#000000', '#00FFFF', '#FF00FF']
  },
  'Otoño Cálido': {
    description: 'Colores otoñales ricos y dorados. Mostaza, teja, caldera, verde bosque y tonos bronce.',
    bestColors: ['#C5A059', '#B3541E', '#2D4B36', '#8B4513', '#E07A5F'],
    avoidColors: ['#E0F7FA', '#B0BEC5', '#E1BEE7']
  },
  'Otoño Profundo': {
    description: 'Colores intensos, cálidos y profundos. Granate, verde petróleo, cacao y café oscuro.',
    bestColors: ['#4A0E17', '#1B3B36', '#3D2314', '#D4AF37', '#7F1D1D'],
    avoidColors: ['#FFFDD0', '#E0F2FE', '#FCE7F3']
  },
  'Invierno Frío': {
    description: 'Contraste frío y puro. Blanco nuclear, negro absoluto, azul marino profundo, rubí y magenta.',
    bestColors: ['#FFFFFF', '#0A0A0A', '#1E3A8A', '#BE123C', '#701A75'],
    avoidColors: ['#D97706', '#B45309', '#CA8A04']
  },
  'Invierno Brillante': {
    description: 'Colores vibrantes, joya y de alto impacto con base fría: zafiro, fucsia eléctrico, esmeralda y blanco puro.',
    bestColors: ['#2563EB', '#EC4899', '#059669', '#FFFFFF', '#0F172A'],
    avoidColors: ['#D97706', '#92400E', '#78350F']
  },
  'Invierno Profundo': {
    description: 'Tonos oscuros y penetrantes: cereza oscuro, berenjena, carbón y azul noche.',
    bestColors: ['#450A0A', '#3B0764', '#1E293B', '#831843', '#0F172A'],
    avoidColors: ['#FEF08A', '#FED7AA', '#FDE68A']
  },
  'Primavera Clara': {
    description: 'Tonos pastel cálidos, luminosos y frescos: melocotón, aguamarina, coral suave y marfil.',
    bestColors: ['#FED7AA', '#A7F3D0', '#F472B6', '#FFFBEB', '#FDE047'],
    avoidColors: ['#0F172A', '#374151', '#111827']
  },
  'Primavera Cálida': {
    description: 'Colores dorados, vivos y radiantes: coral, turquesa cálido, verde lima y amarillo mantequilla.',
    bestColors: ['#FB923C', '#2DD4BF', '#A3E635', '#FACC15', '#EA580C'],
    avoidColors: ['#1E293B', '#475569', '#64748B']
  },
  'Primavera Brillante': {
    description: 'Colores vivos, alegres y cristalinos: rojo amapola, fucsia cálido y verde manzana.',
    bestColors: ['#EF4444', '#F43F5E', '#10B981', '#3B82F6', '#F59E0B'],
    avoidColors: ['#71717A', '#52525B', '#3F3F46']
  },
  'Verano Claro': {
    description: 'Tonos suaves, fríos y empolvados: rosa bebé, azul cielo, lavanda y gris perla.',
    bestColors: ['#FBCFE8', '#BAE6FD', '#E9D5FF', '#E2E8F0', '#93C5FD'],
    avoidColors: ['#78350F', '#B45309', '#EA580C']
  },
  'Verano Suave': {
    description: 'Tonos neutros fríos y empolvados: malva, verde salvia apagado, azul acero y rosa ceniza.',
    bestColors: ['#C084FC', '#94A3B8', '#86EFAC', '#F472B6', '#64748B'],
    avoidColors: ['#EA580C', '#D97706', '#EAB308']
  },
  'Verano Frío': {
    description: 'Azules gélidos, frambuesa, gris azulado y rosa frío.',
    bestColors: ['#38BDF8', '#BE185D', '#64748B', '#E0E7FF', '#1E40AF'],
    avoidColors: ['#B45309', '#CA8A04', '#D97706']
  }
};

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

export const ProfileView: React.FC<ProfileViewProps> = ({ profile, onProfileUpdate }) => {
  const [currentProfile, setCurrentProfile] = useState<UserProfile>({
    ...profile,
    faceShape: profile.faceShape || 'ovalada',
    facialContrast: profile.facialContrast || 'medio'
  });
  const [isScanning, setIsScanning] = useState(false);
  const [scanResultNotice, setScanResultNotice] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

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
    const updated = { ...currentProfile, ...patch };
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

  const currentSeasonData = COLOR_SEASONS_INFO[currentProfile.colorSeason] || COLOR_SEASONS_INFO['Otoño Suave'];
  const activeFaceShape: FaceShape = currentProfile.faceShape || 'ovalada';
  const faceShapeInfo = FACE_SHAPES_CONFIG[activeFaceShape] || FACE_SHAPES_CONFIG.ovalada;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E8E2D6] pb-5">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-rose-900 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Ficha de Estilo Zero-Biometric
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight mt-1">
            Mi Perfil <span className="italic font-normal text-rose-950">& Visagismo Facial</span>
          </h1>
          <p className="text-sm text-neutral-600 mt-1 max-w-xl">
            Tus rasgos faciales, morfología y colorimetría analizados y <strong>100% configurables</strong> en tu dispositivo.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-neutral-900 text-white font-medium text-xs sm:text-sm hover:bg-neutral-800 transition-all shadow-md cursor-pointer"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>¡Datos Guardados!</span>
            </>
          ) : (
            <span>Guardar Cambios</span>
          )}
        </button>
      </div>

      {/* TOP SECTION: Datos Personales (Nombre, Edad, Ciudad, Ocupación) */}
      <div className="bg-white/90 border border-[#E5DFD5] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center text-rose-900">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-neutral-900">Datos Personales & Identidad</h2>
              <p className="text-xs text-neutral-500">Para que tu estilista IA personalice el trato y el contexto diario</p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Privado en tu móvil
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Full Facial Analysis & Visagism Card */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* ========================================================================= */}
          {/* SECCIÓN PRINCIPAL: ANÁLISIS FACIAL COMPLETO & VISAGISMO                    */}
          {/* ========================================================================= */}
          <div className="bg-white/95 border border-[#E5DFD5] rounded-3xl p-6 shadow-sm space-y-6">
            
            {/* Header del Analizador */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-3">
              <div>
                <h2 className="font-serif text-xl font-bold text-neutral-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-rose-900" />
                  Análisis Facial Completo & Visagismo
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Fisonomía, forma de rostro, ojos y contraste • 100% configurable
                </p>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
                100% En Dispositivo
              </span>
            </div>

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

                        {/* 4. Paleta Estacional */}
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-neutral-500">Paleta Estación:</span>
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

          </div>

        </div>

        {/* Right Column: Measurements, Body Shape & Style Vibes */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Body Shape & Measurements Box */}
          <div className="bg-white/80 border border-[#E5DFD5] rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h2 className="font-serif text-xl font-bold text-neutral-900 flex items-center gap-2">
                <Ruler className="w-5 h-5 text-rose-900" />
                Morfología & Medidas
              </h2>
              <span className="text-xs text-neutral-400">100% Confidencial</span>
            </div>

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
          </div>

          {/* Style Preferences & Vibes */}
          <div className="bg-white/80 border border-[#E5DFD5] rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="font-serif text-xl font-bold text-neutral-900">
              Estilos & Vibes Predilectos
            </h2>
            <p className="text-xs text-neutral-500">
              Selecciona los estilos con los que más te identificas para priorizar recomendaciones afines:
            </p>

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

          {/* Color Season Selector & Harmonizer */}
          <div className="bg-[#FAF8F5] border border-[#E2DBD0] rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h2 className="font-serif text-xl font-bold text-neutral-900 flex items-center gap-2">
                <Palette className="w-5 h-5 text-rose-900" />
                Tu Estación Cromática
              </h2>
              <span className="text-xs font-semibold px-2.5 py-1 bg-white rounded-full border border-neutral-200 text-neutral-800">
                {currentProfile.colorSeason}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-2">
                Seleccionar o ajustar tu estación:
              </label>
              <select
                value={currentProfile.colorSeason}
                onChange={(e) => updateFacialFeature({ colorSeason: e.target.value as ColorSeason })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-white focus:outline-none focus:ring-1 focus:ring-neutral-800 cursor-pointer font-medium"
              >
                {Object.keys(COLOR_SEASONS_INFO).map((season) => (
                  <option key={season} value={season}>{season}</option>
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
              <div className="flex items-center gap-2">
                {currentSeasonData.bestColors.map((hex, i) => (
                  <div key={i} className="flex-1 text-center">
                    <div 
                      className="h-10 rounded-xl border border-black/10 shadow-2xs mb-1" 
                      style={{ backgroundColor: hex }} 
                    />
                    <span className="text-[9px] text-neutral-500 font-mono">{hex}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Colors to avoid */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-2">
                Colores a evitar cerca del rostro:
              </span>
              <div className="flex items-center gap-2">
                {currentSeasonData.avoidColors.map((hex, i) => (
                  <div key={i} className="flex-1 text-center opacity-80">
                    <div 
                      className="h-7 rounded-lg border border-black/10 mb-1" 
                      style={{ backgroundColor: hex }} 
                    />
                    <span className="text-[9px] text-neutral-400 font-mono">{hex}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
