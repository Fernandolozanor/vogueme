import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Palette, 
  Sparkles, 
  Sun, 
  Flame, 
  Check, 
  HelpCircle,
  Eye,
  Shirt
} from 'lucide-react';
import type { ColorSeason, ColorSwatch } from '../types';

interface ColorSeasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSeason?: ColorSeason;
}

const SEASONS_SUMMARY: Record<string, {
  name: string;
  family: string;
  temp: 'Cálido' | 'Frío';
  depth: 'Claro' | 'Profundo' | 'Medio';
  contrast: 'Brillante' | 'Suave' | 'Medio';
  description: string;
  sampleColors: ColorSwatch[];
  icon: string;
}> = {
  'Primavera': {
    name: 'Primavera',
    family: 'Cálida & Luminosa',
    temp: 'Cálido',
    depth: 'Claro',
    contrast: 'Brillante',
    description: 'Tonos vivos, dorados, cristalinos y alegres. Melocotón, coral, verde manzana, turquesa cálido y amarillo mantequilla.',
    sampleColors: [
      { name: 'Coral vivo', hex: '#FB923C' },
      { name: 'Turquesa cálido', hex: '#2DD4BF' },
      { name: 'Verde lima', hex: '#A3E635' },
      { name: 'Amarillo oro', hex: '#FACC15' },
      { name: 'Naranja amapola', hex: '#EA580C' }
    ],
    icon: '🌸'
  },
  'Verano': {
    name: 'Verano',
    family: 'Fría & Empolvada',
    temp: 'Frío',
    depth: 'Claro',
    contrast: 'Suave',
    description: 'Tonos suaves, fríos y azulados con efecto aterciopelado. Rosa empolvado, lavanda, azul cielo, verde salvia y gris perla.',
    sampleColors: [
      { name: 'Rosa pastel', hex: '#FBCFE8' },
      { name: 'Azul cielo', hex: '#BAE6FD' },
      { name: 'Lavanda', hex: '#E9D5FF' },
      { name: 'Azul bebé', hex: '#93C5FD' },
      { name: 'Gris perla', hex: '#94A3B8' }
    ],
    icon: '☀️'
  },
  'Otoño': {
    name: 'Otoño',
    family: 'Cálida & Envolvente',
    temp: 'Cálido',
    depth: 'Profundo',
    contrast: 'Suave',
    description: 'Tonos tierra ricos, dorados y tostados. Terracota, mostaza, caldera, verde oliva, camel y marrón chocolate.',
    sampleColors: [
      { name: 'Beige arena', hex: '#D8C7B5' },
      { name: 'Terracota', hex: '#C3684B' },
      { name: 'Marrón café', hex: '#4A2E1B' },
      { name: 'Verde oliva', hex: '#708238' },
      { name: 'Mostaza dorada', hex: '#C5A059' }
    ],
    icon: '🍂'
  },
  'Invierno': {
    name: 'Invierno',
    family: 'Fría & Contraste Puro',
    temp: 'Frío',
    depth: 'Profundo',
    contrast: 'Brillante',
    description: 'Colores puros, intensos y tonos joya con alto contraste. Blanco nuclear, negro absoluto, zafiro, fucsia eléctrico y rubí.',
    sampleColors: [
      { name: 'Blanco nuclear', hex: '#FFFFFF' },
      { name: 'Negro azabache', hex: '#0A0A0A' },
      { name: 'Azul zafiro', hex: '#1E3A8A' },
      { name: 'Rojo rubí', hex: '#BE123C' },
      { name: 'Azul cobalto', hex: '#2563EB' }
    ],
    icon: '❄️'
  }
};

export const ColorSeasonModal: React.FC<ColorSeasonModalProps> = ({
  isOpen,
  onClose,
  currentSeason
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Determine which main season category the user belongs to
  const activeMainSeason = currentSeason
    ? currentSeason.includes('Primavera') ? 'Primavera'
      : currentSeason.includes('Verano') ? 'Verano'
      : currentSeason.includes('Otoño') ? 'Otoño'
      : 'Invierno'
    : 'Otoño';

  return typeof document !== 'undefined' ? createPortal(
    <div 
      className="fixed inset-0 z-[99999] overflow-y-auto bg-black/75 backdrop-blur-md p-3 sm:p-6 flex min-h-screen items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-[#FAF8F5] border border-[#E5DFD5] rounded-3xl max-w-2xl w-full shadow-2xl relative my-auto max-h-[90vh] flex flex-col z-[100000] animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#E8E1D5] shrink-0 bg-white/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-900 border border-rose-100 flex items-center justify-center shrink-0 shadow-2xs">
              <Palette className="w-5 h-5 text-rose-900" />
            </div>
            <div className="min-w-0">
              <h2 className="font-serif text-lg sm:text-xl font-bold text-neutral-900 truncate">
                ¿Cómo funciona la Colorimetría?
              </h2>
              <span className="text-[11px] text-neutral-500 block truncate">
                Guía de Estaciones Cromáticas & Armonía Personal
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#FAF8F5] hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900 flex items-center justify-center transition-colors cursor-pointer shrink-0 border border-neutral-200/60"
            aria-label="Cerrar ventana emergente"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-neutral-800 text-xs sm:text-sm leading-relaxed">
          
          {/* Introducción / Concepto clave */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200/90 shadow-2xs space-y-2.5">
            <div className="flex items-center gap-2 text-rose-900 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-rose-900" />
              <span>El Efecto "Buena Cara" Inmediato</span>
            </div>
            <p className="text-neutral-700 leading-relaxed">
              La <strong>colorimetría estacional</strong> es la ciencia que estudia cómo los pigmentos naturales de tu <strong>piel, ojos y cabello</strong> reaccionan con la luz que reflejan las prendas que vistes cerca del rostro.
            </p>
            <p className="text-neutral-600 leading-relaxed">
              Cuando vistes los colores de tu estación cromática adecuada, tu rostro se ilumina naturalmente, se difuminan las ojeras y pequeñas líneas, y tu mirada gana brillo sin necesidad de maquillaje. Por el contrario, un color inadecuado puede apagar tu tono o proyectar sombras grisáceas o cetrinas.
            </p>
          </div>

          {/* Los 3 Parámetros Científicos */}
          <div className="space-y-3">
            <h3 className="font-serif text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-700" />
              Los 3 Pilares que definen tu Estación
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Pilar 1: Temperatura */}
              <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/90 space-y-1.5 shadow-2xs">
                <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-xs">
                  <Flame className="w-4 h-4 text-amber-700" />
                </div>
                <h4 className="font-semibold text-neutral-900 text-xs">1. Temperatura</h4>
                <p className="text-[11px] text-neutral-600 leading-snug">
                  <strong>Cálido vs. Frío:</strong> Determinado por el subtono de tu piel (dorado/cetrino vs. azulado/rosado).
                </p>
              </div>

              {/* Pilar 2: Claridad / Valor */}
              <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/90 space-y-1.5 shadow-2xs">
                <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center font-bold text-xs">
                  <Sun className="w-4 h-4 text-blue-700" />
                </div>
                <h4 className="font-semibold text-neutral-900 text-xs">2. Claridad (Valor)</h4>
                <p className="text-[11px] text-neutral-600 leading-snug">
                  <strong>Claro vs. Profundo:</strong> El grado de luz natural que predomina en tu cabello, ojos y tez.
                </p>
              </div>

              {/* Pilar 3: Croma / Contraste */}
              <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/90 space-y-1.5 shadow-2xs">
                <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center font-bold text-xs">
                  <Eye className="w-4 h-4 text-purple-700" />
                </div>
                <h4 className="font-semibold text-neutral-900 text-xs">3. Contraste (Croma)</h4>
                <p className="text-[11px] text-neutral-600 leading-snug">
                  <strong>Brillante vs. Suave:</strong> La diferencia de intensidad entre el blanco de tus ojos, piel y cabello.
                </p>
              </div>
            </div>
          </div>

          {/* Las 4 Grandes Estaciones */}
          <div className="space-y-3">
            <h3 className="font-serif text-base sm:text-lg font-bold text-neutral-900">
              Las 4 Familias de Estaciones
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(SEASONS_SUMMARY).map(([key, season]) => {
                const isCurrentActive = activeMainSeason === key;
                return (
                  <div 
                    key={key}
                    className={`p-4 rounded-2xl border transition-all ${
                      isCurrentActive
                        ? 'bg-rose-50/50 border-rose-300 ring-2 ring-rose-900/10 shadow-xs'
                        : 'bg-white border-neutral-200/90'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg">{season.icon}</span>
                        <h4 className="font-serif font-bold text-neutral-900 text-sm">
                          {season.name}
                        </h4>
                      </div>
                      {isCurrentActive && (
                        <span className="text-[9.5px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-900 text-white">
                          Tu Estación
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] uppercase font-semibold text-neutral-400 block tracking-wider mb-1">
                      {season.family} • {season.temp}
                    </span>

                    <p className="text-[11.5px] text-neutral-600 leading-relaxed mb-2.5">
                      {season.description}
                    </p>

                    {/* Paleta de muestra con nombres */}
                    <div className="grid grid-cols-5 gap-1 pt-1">
                      {season.sampleColors.map((color, i) => (
                        <div key={i} className="text-center group" title={`${color.name} (${color.hex})`}>
                          <div 
                            className="h-5 rounded-md border border-black/10 shadow-2xs mb-0.5 transition-transform group-hover:scale-110"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span className="text-[8.5px] text-neutral-600 font-medium block truncate leading-tight">
                            {color.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Regla de Oro del Estilismo */}
          <div className="bg-[#FAF7F2] border border-[#E5DFD4] p-4 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-neutral-900 font-bold text-xs uppercase tracking-wider">
              <Shirt className="w-4 h-4 text-amber-800" />
              <span>Regla de Oro: ¿Dónde aplicar tus colores?</span>
            </div>
            <p className="text-[11.5px] text-neutral-700 leading-relaxed">
              Tus colores estrella son fundamentales <strong>del pecho hacia arriba</strong> (camisetas, tops, bufandas, camisas, blazers, pendientes y monturas de gafas), ya que son los que reflejan la luz directamente en tu rostro.
            </p>
            <p className="text-[11.5px] text-neutral-500 leading-relaxed">
              Para <strong>pantalones, faldas, shorts y calzado</strong>, tienes absoluta libertad cromática: no afectan a la luminosidad de tu piel y te permiten combinar tus prendas favoritas sin límites.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#E8E1D5] bg-white/70 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-neutral-500">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">
              {currentSeason ? `Actualmente calibrado en: ${currentSeason}` : 'Calibrado con IA en tu perfil'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs transition-colors cursor-pointer shadow-2xs shrink-0"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;
};
