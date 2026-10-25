import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Sparkles, 
  MapPin, 
  Calendar, 
  Heart, 
  RefreshCw, 
  Check, 
  Sun, 
  Moon, 
  Sunset,
  Sparkle,
  MessageCircle,
  SlidersHorizontal,
  X,
  Lightbulb,
  Palette,
  Info,
  ArrowRight,
  Gem,
  CloudSun,
  ZoomIn,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { ClothingItem, UserProfile, OccasionQuery, OutfitRecommendation, QuerySeason } from '../types';
import { generateOutfitRecommendation } from '../services/stylistEngine';
import { logOutfitWear } from '../services/storage';
import { GarmentDetailModal } from './GarmentDetailModal';
import { ColorSeasonModal } from './ColorSeasonModal';

interface StylistViewProps {
  wardrobe: ClothingItem[];
  profile: UserProfile;
  onNavigateToCloset: () => void;
  onNavigateToProfile?: () => void;
  onRefreshWardrobe: () => void;
}

const PRESET_ACTIVITIES = [
  { label: '☕ Café con amiga', value: 'Tomar café con una amiga' },
  { label: '🎬 Cine con novio', value: 'Ir al cine con mi novio' },
  { label: '🍸 Noche de fiesta', value: 'Salir de fiesta y copas con amigas' },
  { label: '📚 Uni / Estudio', value: 'Clase en la universidad y biblioteca' },
  { label: '🥐 Brunch domingo', value: 'Brunch relajado de domingo' },
  { label: '🛍️ Shopping', value: 'Tarde de compras y paseo' },
  { label: '🍽️ Cena romántica', value: 'Cena romántica especial' }
];

const CITIES = ['Madrid', 'Barcelona', 'Sevilla', 'Valencia', 'Bilbao', 'Málaga', 'Zaragoza', 'Granada'];

const HARMONY_DETAILS: Record<string, { summary: string; whyWorks: string; starColors: string[]; avoid: string }> = {
  'Otoño Suave': {
    summary: 'Tonos tierra cálidos, aterciopelados y apagados. Predominan el camel, arena, terracota, marrón chocolate y verde oliva.',
    whyWorks: 'Suaviza las facciones y aporta un brillo dorado natural a pieles cálidas con contraste moderado.',
    starColors: ['#D8C7B5', '#C3684B', '#4A2E1B', '#708238', '#C5A880'],
    avoid: 'Negro puro o neones estridentes cerca de la cara.'
  },
  'Otoño Cálido': {
    summary: 'Colores otoñales ricos, intensos y dorados como el mostaza, teja, caldera, bronce y bosque.',
    whyWorks: 'Intensifica la calidez del cabello cobrizo o castaño dorado y la profundidad de los ojos miel.',
    starColors: ['#C5A059', '#B3541E', '#2D4B36', '#8B4513', '#E07A5F'],
    avoid: 'Tonos gélidos o pasteles fríos descoloridos.'
  },
  'Otoño Profundo': {
    summary: 'Tonos profundos, cálidos y penetrantes: granate, café oscuro, cacao y verde petróleo.',
    whyWorks: 'Acompaña la intensidad de rasgos oscuros con calidez sin restar fuerza visual.',
    starColors: ['#4A0E17', '#1B3B36', '#3D2314', '#D4AF37', '#7F1D1D'],
    avoid: 'Colores pastel excesivamente pálidos.'
  },
  'Invierno Frío': {
    summary: 'Contraste nítido y base fría: blanco puro, negro azabache, azul marino, rubí y magenta.',
    whyWorks: 'Crea un impacto visual elegante que hace que la piel clara u oscura fría resalte con pureza.',
    starColors: ['#FFFFFF', '#0A0A0A', '#1E3A8A', '#BE123C', '#701A75'],
    avoid: 'Tonos mostaza, naranjas terrosos o marrones cálidos.'
  },
  'Invierno Brillante': {
    summary: 'Colores joya vibrantes y saturados: zafiro, fucsia eléctrico, verde esmeralda y blanco puro.',
    whyWorks: 'Realza los ojos cristalinos y el alto contraste natural entre cabello y piel.',
    starColors: ['#2563EB', '#EC4899', '#059669', '#FFFFFF', '#0F172A'],
    avoid: 'Tonos tierra apagados y tonos beige topo.'
  },
  'Invierno Profundo': {
    summary: 'Colores oscuros, fríos e imponentes: cereza oscuro, ciruela, berenjena y azul medianoche.',
    whyWorks: 'Aporta magnetismo y sofisticación a rostros de cabello y ojos oscuros y piel fría.',
    starColors: ['#450A0A', '#3B0764', '#1E293B', '#831843', '#0F172A'],
    avoid: 'Tonos pastel descoloridos o amarillos dorados.'
  },
  'Primavera Clara': {
    summary: 'Tonos pastel cálidos, luminosos y dulces: melocotón, aguamarina, coral suave y marfil.',
    whyWorks: 'Aporta frescura juvenil y luz diáfana a pieles con subtono dorado muy claro.',
    starColors: ['#FED7AA', '#A7F3D0', '#F472B6', '#FFFBEB', '#FDE047'],
    avoid: 'Negro pesado o gris oscuro industrial.'
  },
  'Primavera Cálida': {
    summary: 'Colores alegres, dorados y luminosos: coral vivo, turquesa cálido, verde lima y amarillo mantequilla.',
    whyWorks: 'Irradia vitalidad y resalta los reflejos dorados del rostro.',
    starColors: ['#FB923C', '#2DD4BF', '#A3E635', '#FACC15', '#EA580C'],
    avoid: 'Gris apagado o azul pizarra triste.'
  },
  'Primavera Brillante': {
    summary: 'Colores cristalinos, vibrantes y cálidos: rojo amapola, fucsia cálido y verde manzana.',
    whyWorks: 'Armoniza con miradas vivas y pieles radiantes de alto contraste.',
    starColors: ['#EF4444', '#F43F5E', '#10B981', '#3B82F6', '#F59E0B'],
    avoid: 'Colores terrosos sucios o apagados.'
  },
  'Verano Claro': {
    summary: 'Tonos empolvados, fríos y delicados: rosa bebé, azul cielo, lavanda y gris perla.',
    whyWorks: 'Aporta una elegancia sutil y aterciopelada a rasgos rubios o castaños claros fríos.',
    starColors: ['#FBCFE8', '#BAE6FD', '#E9D5FF', '#E2E8F0', '#93C5FD'],
    avoid: 'Naranjas chillones o tonos teja.'
  },
  'Verano Suave': {
    summary: 'Tonos neutros fríos y mates: malva, verde salvia, azul acero y rosa ceniza.',
    whyWorks: 'Equilibra rostros de armonía suave sin sobrecargar la expresión.',
    starColors: ['#C084FC', '#94A3B8', '#86EFAC', '#F472B6', '#64748B'],
    avoid: 'Colores saturados puros o tonos dorados brillantes.'
  },
  'Verano Frío': {
    summary: 'Azules gélidos, frambuesa, gris azulado y rosa frío.',
    whyWorks: 'Resalta el subtono rosado o azulado de la piel con elegancia nórdica.',
    starColors: ['#38BDF8', '#BE185D', '#64748B', '#E0E7FF', '#1E40AF'],
    avoid: 'Mostaza, teja o camel cálido.'
  }
};

function useWindowSize() {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1440,
    height: typeof window !== 'undefined' ? window.innerHeight : 900
  });

  useEffect(() => {
    function handleResize() {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

export const StylistView: React.FC<StylistViewProps> = ({
  wardrobe,
  profile,
  onNavigateToCloset,
  onNavigateToProfile,
  onRefreshWardrobe
}) => {
  const { width: windowWidth } = useWindowSize();
  const isDesktop = windowWidth >= 1024;

  const [query, setQuery] = useState<OccasionQuery>({
    activity: 'Tomar café con una amiga',
    customActivity: '',
    timeOfDay: 'tarde',
    season: 'primavera',
    location: profile.city || 'Madrid',
    weatherTemp: 21,
    weatherCondition: 'Soleado y templado',
    vibe: 'effortless chic'
  });

  const [recommendation, setRecommendation] = useState<OutfitRecommendation | null>(() => {
    try {
      if (wardrobe.length > 0) {
        return generateOutfitRecommendation(
          {
            activity: 'Tomar café con una amiga',
            timeOfDay: 'tarde',
            season: 'primavera',
            location: profile.city || 'Madrid',
            weatherTemp: 21,
            weatherCondition: 'Agradable y soleado',
            vibe: 'effortless chic'
          },
          profile,
          wardrobe
        );
      }
    } catch (e) {
      console.warn('Initial outfit skipped', e);
    }
    return null;
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [wornToday, setWornToday] = useState(false);
  
  // Modals visibility
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isAdviceModalOpen, setIsAdviceModalOpen] = useState(false);
  const [isHarmonyModalOpen, setIsHarmonyModalOpen] = useState(false);
  const [isColorSeasonModalOpen, setIsColorSeasonModalOpen] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState<{ item: ClothingItem; role: string } | null>(null);

  // Active outfit item references
  const [currentTop, setCurrentTop] = useState<ClothingItem | undefined>(recommendation?.items.top);
  const [currentBottom, setCurrentBottom] = useState<ClothingItem | undefined>(recommendation?.items.bottom);
  const [currentDress, setCurrentDress] = useState<ClothingItem | undefined>(recommendation?.items.dress);
  const [currentOuterwear, setCurrentOuterwear] = useState<ClothingItem | undefined>(recommendation?.items.outerwear);
  const [currentShoes, setCurrentShoes] = useState<ClothingItem | undefined>(recommendation?.items.shoes);
  const [currentAccessory, setCurrentAccessory] = useState<ClothingItem | undefined>(recommendation?.items.accessory);

  const handleGenerate = (closeModal = false) => {
    if (wardrobe.length === 0) return;
    setIsGenerating(true);
    setWornToday(false);

    setTimeout(() => {
      try {
        const result = generateOutfitRecommendation(query, profile, wardrobe);
        setRecommendation(result);
        setCurrentTop(result.items.top);
        setCurrentBottom(result.items.bottom);
        setCurrentDress(result.items.dress);
        setCurrentOuterwear(result.items.outerwear);
        setCurrentShoes(result.items.shoes);
        setCurrentAccessory(result.items.accessory);
        if (closeModal) setIsConfigModalOpen(false);
      } catch (err) {
        console.error(err);
      } finally {
        setIsGenerating(false);
      }
    }, 280);
  };

  const handleSwapItem = (category: 'top' | 'bottom' | 'shoes' | 'outerwear' | 'accessory') => {
    const candidates = wardrobe.filter(i => i.category === category);
    if (candidates.length <= 1) return;

    if (category === 'top') {
      const idx = candidates.findIndex(c => c.id === currentTop?.id);
      const next = candidates[(idx + 1) % candidates.length];
      setCurrentTop(next);
      setCurrentDress(undefined);
    } else if (category === 'bottom') {
      const idx = candidates.findIndex(c => c.id === currentBottom?.id);
      const next = candidates[(idx + 1) % candidates.length];
      setCurrentBottom(next);
      setCurrentDress(undefined);
    } else if (category === 'shoes') {
      const idx = candidates.findIndex(c => c.id === currentShoes?.id);
      const next = candidates[(idx + 1) % candidates.length];
      setCurrentShoes(next);
    } else if (category === 'outerwear') {
      const idx = candidates.findIndex(c => c.id === currentOuterwear?.id);
      const next = candidates[(idx + 1) % candidates.length];
      setCurrentOuterwear(next);
    } else if (category === 'accessory') {
      const idx = candidates.findIndex(c => c.id === currentAccessory?.id);
      const next = candidates[(idx + 1) % candidates.length];
      setCurrentAccessory(next);
    }
  };

  const handleWearToday = () => {
    if (wornToday) return;

    const itemsToLog = [
      currentDress || currentTop,
      currentBottom,
      currentOuterwear,
      currentShoes,
      currentAccessory
    ].filter(Boolean).map(i => i!.id);

    logOutfitWear(query.activity, itemsToLog);
    setWornToday(true);
    onRefreshWardrobe();

    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#D4AF37', '#801323', '#FAF8F5', '#1A1A1A', '#E8B4B8']
    });
  };

  const harmonyData = HARMONY_DETAILS[profile.colorSeason] || HARMONY_DETAILS['Otoño Suave'];

  if (!recommendation || wardrobe.length === 0) {
    return (
      <div className="max-w-md mx-auto my-auto p-8 text-center space-y-4 bg-white border border-[#E5DFD5] rounded-3xl shadow-sm">
        <Sparkles className="w-10 h-10 text-neutral-300 mx-auto" />
        <h3 className="font-serif text-xl font-bold text-neutral-800">
          {wardrobe.length === 0 ? 'Tu armario está vacío' : 'Crear tu primer look'}
        </h3>
        <p className="text-xs text-neutral-500">
          {wardrobe.length === 0 
            ? 'Añade fotos de tus prendas para que la IA cree combinaciones.' 
            : 'Configura la ocasión para generar tu outfit.'}
        </p>
        {wardrobe.length === 0 ? (
          <button
            onClick={onNavigateToCloset}
            className="w-full py-3 bg-neutral-900 text-white rounded-xl text-xs font-semibold cursor-pointer hover:bg-neutral-800"
          >
            Digitalizar Ropa en Mi Armario →
          </button>
        ) : (
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="w-full py-3 bg-neutral-900 text-white rounded-xl text-xs font-semibold cursor-pointer hover:bg-neutral-800"
          >
            Configurar Ocasión ✨
          </button>
        )}
      </div>
    );
  }

  // Active items array to render
  const activeGarments = currentDress 
    ? [
        { item: currentDress, role: 'Vestido Estrella', cat: 'dress' as const },
        currentOuterwear && { item: currentOuterwear, role: 'Capa Exterior', cat: 'outerwear' as const },
        currentShoes && { item: currentShoes, role: 'Calzado', cat: 'shoes' as const },
        currentAccessory && { item: currentAccessory, role: 'Accesorio', cat: 'accessory' as const }
      ].filter(Boolean) as { item: ClothingItem; role: string; cat: any }[]
    : [
        currentTop && { item: currentTop, role: 'Prenda Superior', cat: 'top' as const },
        currentBottom && { item: currentBottom, role: 'Prenda Inferior', cat: 'bottom' as const },
        currentOuterwear && { item: currentOuterwear, role: 'Capa Exterior', cat: 'outerwear' as const },
        currentShoes && { item: currentShoes, role: 'Calzado', cat: 'shoes' as const },
        currentAccessory && { item: currentAccessory, role: 'Accesorio Clave', cat: 'accessory' as const }
      ].filter(Boolean) as { item: ClothingItem; role: string; cat: any }[];

  // Organización arriba y abajo para PC:
  // Fila Superior (Arriba): Tops, Vestidos y Chaquetas / Capas
  // Fila Inferior (Abajo): Pantalones / Faldas, Calzado y Accesorios
  const upperGarments = activeGarments.filter(
    (g) => g.cat === 'top' || g.cat === 'dress' || g.cat === 'outerwear'
  );
  const lowerGarments = activeGarments.filter(
    (g) => g.cat === 'bottom' || g.cat === 'shoes' || g.cat === 'accessory'
  );

  let row1 = upperGarments;
  let row2 = lowerGarments;

  if (row1.length === 0) {
    row1 = activeGarments.slice(0, Math.ceil(activeGarments.length / 2));
    row2 = activeGarments.slice(Math.ceil(activeGarments.length / 2));
  } else if (row2.length === 0) {
    row1 = activeGarments.slice(0, Math.ceil(activeGarments.length / 2));
    row2 = activeGarments.slice(Math.ceil(activeGarments.length / 2));
  }

  const renderGarmentCard = (
    entry: { item: ClothingItem; role: string; cat: any },
    idx: number,
    cardHeightClass: string = 'aspect-[4/3] sm:aspect-[4/3] lg:aspect-[4/3]',
    cardExtraClass: string = ''
  ) => {
    const { item, role, cat } = entry;
    const rawUrl = item.imageUrl || '';
    const cleanImageUrl = rawUrl.includes('photo-1521572267360-ee0c2909d518')
      ? 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=80'
      : rawUrl;
    const isCutout = cleanImageUrl.startsWith('data:image/png') || cleanImageUrl.includes('cutout');

    return (
      <div
        key={item.id + idx}
        className={`group relative bg-white rounded-2xl p-2 sm:p-2.5 border border-neutral-200/90 shadow-2xs flex flex-col justify-between hover:shadow-md transition-all min-w-0 overflow-hidden flex-1 ${cardExtraClass}`}
      >
        {/* Contenedor de foto con formato adaptado sin recortar la prenda */}
        <div 
          onClick={() => setSelectedDetailItem({ item, role })}
          className={`group/photo relative w-full ${cardHeightClass} rounded-xl overflow-hidden bg-[#FAF8F5] flex items-center justify-center cursor-pointer p-1.5`}
          title="Toca para ver la foto completa y detalles de la prenda"
        >
          <img
            src={cleanImageUrl}
            alt={item.name}
            className={`w-full h-full object-contain transition-transform duration-300 group-hover/photo:scale-105 ${
              isCutout 
                ? 'p-1 drop-shadow-sm' 
                : 'rounded-lg'
            }`}
          />

          {/* Icono discreto de zoom en hover */}
          <span className="absolute bottom-1.5 right-1.5 p-1 rounded-md bg-black/50 text-white opacity-0 group-hover/photo:opacity-100 transition-opacity backdrop-blur-2xs shadow-xs">
            <ZoomIn className="w-3 h-3" />
          </span>

          {/* Botón de rotar prenda */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSwapItem(cat);
            }}
            title={`Cambiar ${role}`}
            className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/60 text-white hover:bg-black transition-all cursor-pointer opacity-80 hover:opacity-100 shadow-xs z-10 backdrop-blur-2xs"
          >
            <RefreshCw className="w-3 h-3" />
          </button>

          {/* Punto de color */}
          <div
            className="absolute bottom-1.5 left-1.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs"
            style={{ backgroundColor: item.colorHex }}
            title={item.colorName}
          />
        </div>

        {/* Ficha descriptiva debajo */}
        <div className="mt-1.5 text-left shrink-0 min-w-0 w-full space-y-0.5">
          <span className="text-[8px] sm:text-[8.5px] uppercase font-bold text-neutral-400 block truncate tracking-wider">
            {role}
          </span>
          <p className="text-[11px] sm:text-xs font-semibold text-neutral-900 truncate" title={item.name}>
            {item.name}
          </p>
          <div className="flex items-center justify-between text-[10px] text-neutral-400 gap-1 min-w-0">
            <span className="truncate flex-1 min-w-0">{item.brand || 'Básico'}</span>
            <span className="font-medium text-emerald-800 shrink-0 whitespace-nowrap">{item.wearCount} puestas</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`w-full max-w-7xl mx-auto overflow-x-hidden ${isDesktop ? 'h-full flex flex-col justify-between px-4 sm:px-6 lg:px-8 py-2.5 overflow-hidden' : 'px-3 py-3 space-y-3'}`}>
      
      {/* ========================================================================= */}
      {/* MOBILE ONLY TOP BAR: Botón para cambiar ocasión y pastilla de armonía     */}
      {/* ========================================================================= */}
      {!isDesktop && (
        <div className="w-full max-w-full flex items-center justify-between gap-2 bg-white/95 border border-[#E5DFD5] rounded-2xl p-2.5 shadow-2xs min-w-0">
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="flex-1 flex items-center justify-between gap-2 text-left cursor-pointer group min-w-0 overflow-hidden"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="w-7 h-7 rounded-full bg-rose-50 flex items-center justify-center text-rose-900 shrink-0">
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] uppercase font-bold text-neutral-400 block truncate">
                  {query.location} ({query.timeOfDay})
                </span>
                <p className="text-xs font-bold text-neutral-900 truncate">
                  {query.activity}
                </p>
              </div>
            </div>
          </button>

          {/* Pastilla clicable de Armonía en Móvil */}
          <button
            onClick={() => setIsHarmonyModalOpen(true)}
            className="text-[10px] font-semibold px-2 py-1 bg-[#ECE6DC] text-neutral-800 rounded-full border border-[#DFD8CC] shrink-0 hover:bg-[#E2DBCF] cursor-pointer flex items-center gap-1 transition-all active:scale-95 shadow-2xs max-w-[130px]"
            title="Ver explicación de la armonía utilizada"
          >
            <Palette className="w-3 h-3 text-rose-900 shrink-0" />
            <span className="truncate">{profile.colorSeason}</span>
            <Info className="w-2.5 h-2.5 text-neutral-400 shrink-0" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN SCREEN WORKSPACE:                                                    */}
      {/* EN PC: 2 COLUMNAS (Estudio de Moda):                                      */}
      {/* Col 1 (4 cols): Panel Lateral (Configurar Ocasión + Amiga Experta)        */}
      {/* Col 2 (8 cols): Hero Moodboard Canvas Principal con Ropa Arriba y Abajo    */}
      {/* ========================================================================= */}
      <div className={`w-full max-w-full min-w-0 flex-1 min-h-0 ${isDesktop ? 'grid grid-cols-12 gap-5' : 'flex flex-col gap-3'}`}>
        
        {/* ===================================================================== */}
        {/* COLUMNA LATERAL (PC - 4 COLS): CONFIGURAR OCASIÓN & AMIGA EXPERTA     */}
        {/* ===================================================================== */}
        {isDesktop && (
          <div className="col-span-4 flex flex-col gap-4 min-h-0">
            
            {/* 1. Card: Configurar la Ocasión & Acciones Directas */}
            <div className="bg-white border border-[#E5DFD5] rounded-3xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-rose-50 flex items-center justify-center text-rose-900">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </span>
                  <h3 className="font-serif text-sm font-bold text-neutral-900">Configurar Ocasión</h3>
                </div>
                <span className="text-[9px] uppercase font-bold text-neutral-400">Plan actual</span>
              </div>

              {/* 1. Actividad */}
              <div>
                <label className="block text-[9px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                  1. ¿Qué vas a hacer?
                </label>
                <div className="flex flex-wrap gap-1">
                  {PRESET_ACTIVITIES.map((act) => {
                    const isSelected = query.activity === act.value;
                    return (
                      <button
                        key={act.value}
                        onClick={() => {
                          setQuery({ ...query, activity: act.value, customActivity: '' });
                        }}
                        className={`text-[10px] px-2 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                          isSelected
                            ? 'bg-neutral-900 text-white font-semibold shadow-2xs'
                            : 'bg-[#F7F5F0] text-neutral-700 hover:bg-[#EAE4D8]'
                        }`}
                      >
                        {act.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Momento del día */}
              <div>
                <label className="block text-[9px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                  2. Momento del día
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'manana', label: 'Mañana', icon: Sun },
                    { id: 'tarde', label: 'Tarde', icon: Sunset },
                    { id: 'noche', label: 'Noche', icon: Moon }
                  ].map((t) => {
                    const Icon = t.icon;
                    const isSelected = query.timeOfDay === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setQuery({ ...query, timeOfDay: t.id as any })}
                        className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[10px] font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-neutral-900 text-white border-neutral-900 font-semibold'
                            : 'bg-[#FAF8F5] text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Ciudad & Estación */}
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <span className="text-[9px] font-semibold uppercase text-neutral-400 block mb-0.5">Ciudad</span>
                  <div className="relative">
                    <MapPin className="w-3 h-3 absolute left-2 top-2 text-neutral-400" />
                    <select
                      value={query.location}
                      onChange={(e) => setQuery({ ...query, location: e.target.value })}
                      className="w-full text-[10px] pl-6 pr-1 py-1.5 rounded-lg border border-neutral-200 bg-[#FAF8F5] font-medium cursor-pointer"
                    >
                      {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <span className="text-[9px] font-semibold uppercase text-neutral-400 block mb-0.5">Estación</span>
                  <div className="relative">
                    <Calendar className="w-3 h-3 absolute left-2 top-2 text-neutral-400" />
                    <select
                      value={query.season}
                      onChange={(e) => setQuery({ ...query, season: e.target.value as QuerySeason })}
                      className="w-full text-[10px] pl-6 pr-1 py-1.5 rounded-lg border border-neutral-200 bg-[#FAF8F5] capitalize font-medium cursor-pointer"
                    >
                      <option value="primavera">Primavera</option>
                      <option value="verano">Verano</option>
                      <option value="otono">Otoño</option>
                      <option value="invierno">Invierno</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Botones de acción directa */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-100">
                <button
                  onClick={() => handleGenerate(false)}
                  disabled={isGenerating}
                  className="py-2.5 px-3 rounded-xl bg-neutral-900 text-white font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-neutral-800 transition-colors shadow-xs cursor-pointer active:scale-98"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                      <span>Generando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Actualizar Outfit</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleWearToday}
                  disabled={wornToday}
                  className={`py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-98 ${
                    wornToday
                      ? 'bg-emerald-700 text-white'
                      : 'bg-[#E8E1D3] hover:bg-[#DDD5C5] text-neutral-900 border border-[#D6CDBC]'
                  }`}
                >
                  {wornToday ? <Check className="w-3.5 h-3.5" /> : <Heart className="w-3.5 h-3.5 text-rose-800 fill-rose-800" />}
                  <span>{wornToday ? '¡Guardado hoy!' : '¡Me lo pongo!'}</span>
                </button>
              </div>
            </div>

            {/* 2. Card: Tu Amiga Experta & Consejos */}
            <div className="bg-white border border-[#E5DFD5] rounded-3xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-rose-950 text-white flex items-center justify-center text-xs font-serif font-bold shrink-0">
                    V
                  </span>
                  <div>
                    <h3 className="font-serif text-sm font-bold text-neutral-900">Tu Amiga Experta</h3>
                    <span className="text-[9px] uppercase font-bold text-rose-900 tracking-wider">Styling Advice</span>
                  </div>
                </div>

                <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                  <CloudSun className="w-3 h-3" />
                  <span>{query.weatherTemp}°C</span>
                </span>
              </div>

              {/* Mensaje de la amiga */}
              <div className="bg-[#FAF5EE] border-l-3 border-rose-900 p-3 rounded-r-2xl">
                <p className="text-xs text-neutral-800 leading-relaxed italic font-sans">
                  "{recommendation.friendAdvice}"
                </p>
              </div>

              {/* Trucos de estilismo */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3 text-amber-600" />
                  Trucos de Estilismo para Hoy:
                </span>
                <div className="space-y-1.5 text-[11px] text-neutral-700">
                  {recommendation.stylingTips.map((tip, i) => (
                    <div key={i} className="p-2.5 bg-[#FAF8F5] rounded-xl border border-neutral-200">
                      {tip}
                    </div>
                  ))}
                </div>
              </div>

              {/* Joyería y accesorios */}
              <div className="p-2.5 bg-[#F9F7F2] rounded-xl border border-neutral-200 text-[11px] text-neutral-700 space-y-1">
                <span className="font-bold text-[10px] uppercase tracking-wider text-neutral-500 flex items-center gap-1">
                  <Gem className="w-3 h-3 text-amber-600" />
                  Accesorios recomendados:
                </span>
                <p className="text-[11px] text-neutral-600">
                  Apuesta por pendientes y detalles en tonos dorados cálidos que armonicen con tu estación {profile.colorSeason}.
                </p>
              </div>

              {/* Botón a perfil / colorimetría */}
              {onNavigateToProfile && (
                <button
                  onClick={onNavigateToProfile}
                  className="w-full py-2 px-3 rounded-xl bg-[#FAF8F5] hover:bg-neutral-900 hover:text-white text-neutral-700 font-semibold text-[11px] flex items-center justify-between border border-neutral-200 transition-colors cursor-pointer shrink-0 mt-1"
                >
                  <span>Ver mi Ficha de Colorimetría</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

          </div>
        )}

        {/* ===================================================================== */}
        {/* COLUMNA PRINCIPAL (PC - 8 COLS): HERO MOODBOARD CANVAS                */}
        {/* ===================================================================== */}
        <div className={`${isDesktop ? 'col-span-8' : 'w-full max-w-full overflow-hidden'} bg-[#F4EFE8] border border-[#E8E1D5] rounded-3xl p-4 sm:p-5 flex flex-col justify-between shadow-2xs`}>
          
          {/* Header del Canvas */}
          <div className="flex items-center justify-between gap-2 border-b border-[#E2DBD0] pb-2 shrink-0 min-w-0 w-full">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[9px] uppercase font-bold text-rose-900 tracking-widest shrink-0">
                  Look Selection
                </span>
                <span className="text-[10px] text-neutral-400 shrink-0">•</span>
                <span className="text-[10px] text-neutral-600 font-medium capitalize truncate min-w-0">
                  {query.activity} ({query.location})
                </span>
              </div>
              <h2 className="font-serif text-base sm:text-xl font-bold text-neutral-900 truncate leading-tight mt-0.5" title={recommendation.title}>
                {recommendation.title}
              </h2>
            </div>
            
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] text-neutral-500 font-normal hidden xl:inline">
                Toca 🔄 para rotar prendas
              </span>
              <span className="text-[10.5px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full shrink-0 whitespace-nowrap">
                98% Match
              </span>
            </div>
          </div>

          {/* GRID DE PRENDAS CONTENIDO: EN PC DISTRIBUIDO ARRIBA Y ABAJO */}
          <div className="my-auto py-1 flex-1 min-h-0 flex flex-col justify-center w-full max-w-full gap-2">
            {isDesktop ? (
              <div className="flex flex-col gap-2.5 w-full flex-1 min-h-0 justify-between">
                {/* Fila Superior (Arriba): Tops, Vestidos y Capas Exteriores */}
                <div className="flex flex-col gap-1 w-full flex-1 min-h-0 justify-center">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-neutral-500 flex items-center gap-1">
                      <span>✨ Arriba • Torso & Capas</span>
                    </span>
                    <span className="text-[9px] text-neutral-400 font-medium">Prendas Superiores</span>
                  </div>
                  <div 
                    className="flex justify-center gap-2.5 w-full flex-1 min-h-0 items-stretch"
                  >
                    {row1.map((entry, idx) => 
                      renderGarmentCard(
                        entry, 
                        idx, 
                        'h-40 sm:h-44 lg:h-44 xl:h-48',
                        row1.length === 1 ? 'max-w-xs sm:max-w-sm' : row1.length === 2 ? 'max-w-[340px]' : ''
                      )
                    )}
                  </div>
                </div>

                {/* Fila Inferior (Abajo): Pantalones, Faldas, Calzado y Accesorios */}
                <div className="flex flex-col gap-1 w-full flex-1 min-h-0 justify-center">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-neutral-500 flex items-center gap-1">
                      <span>✨ Abajo • Parte Inferior, Calzado & Complementos</span>
                    </span>
                    <span className="text-[9px] text-neutral-400 font-medium">Prendas Inferiores</span>
                  </div>
                  <div 
                    className="grid gap-2.5 w-full flex-1 min-h-0 items-stretch"
                    style={{ gridTemplateColumns: `repeat(${row2.length}, minmax(0, 1fr))` }}
                  >
                    {row2.map((entry, idx) => renderGarmentCard(entry, idx + row1.length, 'h-40 sm:h-44 lg:h-44 xl:h-48'))}
                  </div>
                </div>
              </div>
            ) : (
              /* Móvil: Grid continuo de 2 columnas con formato vertical fashion */
              <div className="w-full max-w-full grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {activeGarments.map((entry, idx) => renderGarmentCard(entry, idx, 'aspect-[3/4] sm:aspect-[4/5]'))}
              </div>
            )}
          </div>

          {/* Canvas Footer Bar (Paleta de color y armonía clicable) */}
          <div className="pt-2 border-t border-[#E5DFD5] flex items-center justify-between gap-2 text-xs shrink-0 min-w-0 w-full">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[9.5px] uppercase font-bold tracking-wider text-neutral-500 whitespace-nowrap">
                Paleta:
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {recommendation.colorHarmony.palette.map((hex, idx) => (
                  <div
                    key={idx}
                    className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs shrink-0"
                    style={{ backgroundColor: hex }}
                    title={hex}
                  />
                ))}
              </div>
            </div>

            {/* Pastilla clicable de Armonía al pie del lienzo */}
            <button
              onClick={() => setIsHarmonyModalOpen(true)}
              className="text-[10.5px] sm:text-[11px] font-serif italic text-neutral-600 hover:text-rose-950 cursor-pointer underline decoration-dotted underline-offset-2 flex items-center gap-1 transition-colors min-w-0 truncate max-w-[180px]"
              title="Pulsa para ver la explicación de esta armonía y cómo cambiarla"
            >
              <Palette className="w-3 h-3 text-rose-900 shrink-0" />
              <span className="truncate">Armonía {profile.colorSeason}</span>
              <Info className="w-2.5 h-2.5 text-neutral-400 shrink-0" />
            </button>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* MOBILE ONLY BOTTOM BAR (3 Botones directos al pie en móvil)              */}
      {/* ========================================================================= */}
      {!isDesktop && (
        <div className="grid grid-cols-3 gap-2 pt-1 shrink-0 w-full max-w-full">
          <button
            onClick={() => setIsAdviceModalOpen(true)}
            className="py-2.5 px-2 rounded-2xl bg-[#F6F1E9] border border-[#DDD3C2] text-neutral-900 font-semibold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs min-w-0 truncate"
          >
            <MessageCircle className="w-3.5 h-3.5 text-rose-900 shrink-0" />
            <span className="truncate">Consejo</span>
          </button>

          <button
            onClick={handleWearToday}
            disabled={wornToday}
            className={`py-2.5 px-2 rounded-2xl font-semibold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm min-w-0 truncate ${
              wornToday ? 'bg-emerald-700 text-white' : 'bg-neutral-900 text-white'
            }`}
          >
            {wornToday ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Heart className="w-3.5 h-3.5 text-rose-300 fill-rose-300 shrink-0" />}
            <span className="truncate">{wornToday ? '¡Guardado!' : 'Me lo pongo'}</span>
          </button>

          <button
            onClick={() => handleGenerate(false)}
            className="py-2.5 px-2 rounded-2xl border border-neutral-300 bg-white text-neutral-700 font-medium text-[11px] flex items-center justify-center gap-1.5 cursor-pointer min-w-0 truncate"
          >
            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Otra idea</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1 (SOLO MÓVIL): CONFIGURAR OCASIÓN EN VENTANA EMERGENTE             */}
      {/* ========================================================================= */}
      {isConfigModalOpen && !isDesktop && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] overflow-y-auto bg-black/65 backdrop-blur-md p-3 flex min-h-screen items-center justify-center animate-in fade-in duration-150">
          <div 
            className="bg-[#FAF8F5] border border-[#E5DFD5] rounded-3xl max-w-lg w-full p-5 shadow-2xl relative my-auto max-h-[88vh] flex flex-col z-[100000] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkle className="w-4 h-4 text-rose-900" />
                <h3 className="font-serif text-xl font-bold text-neutral-900">Configurar la Ocasión</h3>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-800 p-1.5 rounded-full hover:bg-neutral-200/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto py-3.5 pr-1 flex-1 text-xs">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-2">
                  1. ¿Qué vas a hacer?
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_ACTIVITIES.map((act) => {
                    const isSelected = query.activity === act.value;
                    return (
                      <button
                        key={act.value}
                        onClick={() => setQuery({ ...query, activity: act.value, customActivity: '' })}
                        className={`text-xs px-3 py-2 rounded-xl transition-all cursor-pointer font-medium ${
                          isSelected
                            ? 'bg-neutral-900 text-white shadow-xs'
                            : 'bg-white text-neutral-700 hover:bg-[#EAE4D8] border border-neutral-200'
                        }`}
                      >
                        {act.label}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  placeholder="O escribe otro plan libre..."
                  value={query.customActivity || ''}
                  onChange={(e) => setQuery({ 
                    ...query, 
                    customActivity: e.target.value, 
                    activity: e.target.value || 'Plan personalizado' 
                  })}
                  className="mt-2 w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 bg-white focus:outline-none focus:ring-1 focus:ring-neutral-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                  2. ¿A qué hora?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'manana', label: 'Mañana', icon: Sun },
                    { id: 'tarde', label: 'Tarde', icon: Sunset },
                    { id: 'noche', label: 'Noche', icon: Moon }
                  ].map((t) => {
                    const Icon = t.icon;
                    const isSelected = query.timeOfDay === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setQuery({ ...query, timeOfDay: t.id as any })}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-white text-neutral-700 border-neutral-200'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                    3. Ciudad
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
                    <select
                      value={query.location}
                      onChange={(e) => setQuery({ ...query, location: e.target.value })}
                      className="w-full text-xs pl-8 pr-2 py-2 rounded-xl border border-neutral-300 bg-white cursor-pointer font-medium"
                    >
                      {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                    4. Estación
                  </label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
                    <select
                      value={query.season}
                      onChange={(e) => setQuery({ ...query, season: e.target.value as QuerySeason })}
                      className="w-full text-xs pl-8 pr-2 py-2 rounded-xl border border-neutral-300 bg-white capitalize cursor-pointer font-medium"
                    >
                      <option value="primavera">Primavera</option>
                      <option value="verano">Verano</option>
                      <option value="otono">Otoño</option>
                      <option value="invierno">Invierno</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-200 shrink-0">
              <button
                onClick={() => handleGenerate(true)}
                disabled={isGenerating || wardrobe.length === 0}
                className="w-full py-3 rounded-2xl bg-neutral-900 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors shadow-md cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Creando Look Perfecto...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>✨ Crear mi Look</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* MODAL 2 (SOLO MÓVIL): CONSEJO DE LA AMIGA EXPERTA                         */}
      {/* ========================================================================= */}
      {isAdviceModalOpen && !isDesktop && recommendation && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] overflow-y-auto bg-black/65 backdrop-blur-md p-3 flex min-h-screen items-center justify-center animate-in fade-in duration-150">
          <div 
            className="bg-[#FAF8F5] border border-[#E5DFD5] rounded-3xl max-w-md w-full p-5 shadow-2xl relative my-auto max-h-[85vh] flex flex-col z-[100000] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-full bg-rose-950 text-white flex items-center justify-center text-xs font-serif font-bold">
                  V
                </span>
                <div>
                  <h3 className="font-serif text-lg font-bold text-neutral-900">Tu Amiga Experta</h3>
                  <span className="text-[10px] uppercase font-bold text-rose-900 tracking-wider">Styling Advice</span>
                </div>
              </div>

              <button
                onClick={() => setIsAdviceModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-800 p-1.5 rounded-full hover:bg-neutral-200/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto py-3.5 pr-1 flex-1 text-xs sm:text-sm">
              <div className="bg-[#FAF5EE] border-l-4 border-rose-900 p-3.5 rounded-r-2xl">
                <p className="text-neutral-800 leading-relaxed font-sans italic">
                  "{recommendation.friendAdvice}"
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                  Trucos para elevar este look:
                </span>
                <div className="space-y-2 text-xs text-neutral-700">
                  {recommendation.stylingTips.map((tip, i) => (
                    <div key={i} className="p-2.5 bg-white rounded-xl border border-neutral-200/80 shadow-2xs">
                      {tip}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-neutral-200 text-xs space-y-1">
                <span className="font-bold text-neutral-900 block">Armonía {profile.colorSeason}:</span>
                <p className="text-neutral-600 text-[11px]">{recommendation.colorHarmony.description}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-200 shrink-0">
              <button
                onClick={() => setIsAdviceModalOpen(false)}
                className="w-full py-2.5 rounded-2xl bg-neutral-900 text-white font-medium text-xs sm:text-sm hover:bg-neutral-800 transition-colors cursor-pointer shadow-sm"
              >
                ¡Me encanta, gracias! ✨
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EXPLICACIÓN DE LA ARMONÍA CROMÁTICA & CÓMO CAMBIARLA (createPortal) */}
      {/* ========================================================================= */}
      {isHarmonyModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] overflow-y-auto bg-black/65 backdrop-blur-md p-3 sm:p-6 flex min-h-screen items-center justify-center animate-in fade-in duration-150">
          <div 
            className="bg-[#FAF8F5] border border-[#E5DFD5] rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative my-auto max-h-[88vh] flex flex-col z-[100000] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-neutral-200 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-900 shrink-0">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider block">Colorimetría VogueMe</span>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-neutral-900">
                    Armonía: {profile.colorSeason}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setIsHarmonyModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-800 p-1.5 rounded-full hover:bg-neutral-200/50 transition-colors cursor-pointer"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 overflow-y-auto py-3.5 pr-1 flex-1 text-xs sm:text-sm text-neutral-700 leading-relaxed">
              <div className="bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-2xs space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                  ¿Qué define esta armonía?
                </span>
                <p className="text-xs text-neutral-800 leading-relaxed font-sans">
                  {harmonyData.summary}
                </p>
                <p className="text-[11px] text-neutral-500 italic pt-1 border-t border-neutral-100">
                  ✨ <strong>Por qué te sienta bien:</strong> {harmonyData.whyWorks}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block mb-1.5">
                  Tus Colores Estrella en esta Armonía:
                </span>
                <div className="flex items-center gap-1.5">
                  {harmonyData.starColors.map((hex, i) => (
                    <div key={i} className="flex-1 text-center">
                      <div 
                        className="h-8 rounded-xl border border-black/15 shadow-2xs mb-0.5" 
                        style={{ backgroundColor: hex }} 
                      />
                      <span className="text-[8px] font-mono text-neutral-400">{hex}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-xl text-xs text-rose-950 space-y-0.5">
                <span className="font-bold text-[10px] uppercase tracking-wider block text-rose-900">
                  ⚠️ Mejor evitar cerca del rostro:
                </span>
                <p className="text-[11px] text-rose-900/90 leading-relaxed font-sans">{harmonyData.avoid}</p>
              </div>

              <div className="p-3.5 bg-[#FAF2E6] border border-[#E5DAC6] rounded-2xl space-y-2 text-xs">
                <span className="font-bold text-neutral-900 block flex items-center gap-1">
                  💡 ¿Cómo cambiar tu armonía en la app?
                </span>
                <p className="text-[11px] text-neutral-700 leading-relaxed">
                  Puedes seleccionar otra estación cromática manualmente o volver a hacerte el escáner de selfie con luz natural desde tu perfil.
                </p>

                <button
                  type="button"
                  onClick={() => setIsColorSeasonModalOpen(true)}
                  className="w-full py-2 px-3 rounded-xl bg-white hover:bg-[#FAF8F5] text-neutral-900 font-semibold text-xs flex items-center justify-center gap-1.5 border border-neutral-300 transition-colors cursor-pointer shadow-2xs mt-1"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-rose-900" />
                  <span>¿Cómo funciona la Colorimetría? (Guía completa)</span>
                </button>
                
                {onNavigateToProfile && (
                  <button
                    onClick={() => {
                      setIsHarmonyModalOpen(false);
                      onNavigateToProfile();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-neutral-900 text-white font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-neutral-800 transition-colors cursor-pointer shadow-xs mt-1"
                  >
                    <span>Ir a Mi Perfil a cambiarla</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-200 shrink-0">
              <button
                onClick={() => setIsHarmonyModalOpen(false)}
                className="w-full py-2.5 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL EDUCATIVO: GUÍA DE COLORIMETRÍA */}
      <ColorSeasonModal
        isOpen={isColorSeasonModalOpen}
        onClose={() => setIsColorSeasonModalOpen(false)}
        currentSeason={profile.colorSeason}
      />

      {/* MODAL FOTO AMPLIADA DE LA PRENDA */}
      <GarmentDetailModal
        item={selectedDetailItem?.item || null}
        role={selectedDetailItem?.role}
        onClose={() => setSelectedDetailItem(null)}
      />

    </div>
  );
};
