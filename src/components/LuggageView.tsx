import React, { useState, useMemo, useEffect } from 'react';
import { 
  Luggage, 
  CheckSquare, 
  Square, 
  MapPin, 
  Calendar, 
  Clock, 
  Sun, 
  Cloud, 
  CloudRain, 
  Snowflake, 
  Compass, 
  Waves, 
  TreePine, 
  Footprints, 
  Utensils, 
  Briefcase, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Trash2, 
  RefreshCw, 
  SlidersHorizontal,
  X
} from 'lucide-react';
import type { ClothingItem, UserProfile } from '../types';
import { 
  recommendLuggageCapsule, 
  TRIP_PRESETS, 
  type TripConfig, 
  type ClimateType, 
  type EnvironmentType, 
  type TripActivity,
  type LuggageRecommendationItem
} from '../services/luggageRecommender';

interface LuggageViewProps {
  wardrobe: ClothingItem[];
  profile: UserProfile;
}

const STORAGE_TRIP_CONFIG_KEY = 'vogueme_trip_config_v1';
const STORAGE_TRIP_CHECKED_KEY = 'vogueme_trip_checked_v1';

const CLIMATE_OPTIONS: { id: ClimateType; label: string; temp: string; icon: typeof Sun }[] = [
  { id: 'calido', label: 'Cálido', temp: '>24°C', icon: Sun },
  { id: 'templado', label: 'Templado', temp: '16-23°C', icon: Cloud },
  { id: 'fresco', label: 'Fresco', temp: '10-15°C', icon: CloudRain },
  { id: 'frio', label: 'Frío / Nieve', temp: '<10°C', icon: Snowflake },
];

const ENVIRONMENT_OPTIONS: { id: EnvironmentType; label: string; icon: typeof Compass }[] = [
  { id: 'urbano', label: 'Urbano / Ciudad', icon: Compass },
  { id: 'playa', label: 'Playa / Costa', icon: Waves },
  { id: 'rural', label: 'Rural / Montaña', icon: TreePine },
  { id: 'nieve', label: 'Nieve / Esquí', icon: Snowflake },
  { id: 'relax', label: 'Relax / Resort', icon: Sparkles },
];

const ACTIVITY_OPTIONS: { id: TripActivity; label: string; icon: typeof Footprints; desc: string }[] = [
  { id: 'turismo', label: 'Turismo & Caminar', icon: Footprints, desc: 'Calzado cómodo y prendas todoterreno' },
  { id: 'cenas', label: 'Cenas & Noche', icon: Utensils, desc: 'Looks elegantes y calzado de vestir' },
  { id: 'playa', label: 'Playa & Relax', icon: Waves, desc: 'Tejidos fluidos, lino y sandalias' },
  { id: 'trabajo', label: 'Trabajo / Evento', icon: Briefcase, desc: 'Sastrería, blazers y estilo pulido' },
  { id: 'senderismo', label: 'Rutas / Naturaleza', icon: TreePine, desc: 'Capas térmicas y confort deportivo' },
  { id: 'cultura', label: 'Cultura & Museos', icon: Sparkles, desc: 'Estética chic y sofisticada' },
  { id: 'relax', label: 'Descanso total', icon: Sparkles, desc: 'Prendas cómodas y versátiles' },
];

export const LuggageView: React.FC<LuggageViewProps> = ({ wardrobe, profile }) => {
  // Default date: today's date formatted YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Trip configuration state with persistence
  const [tripConfig, setTripConfig] = useState<TripConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TRIP_CONFIG_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      destination: 'París',
      customDestination: '',
      startDate: todayStr,
      days: 3,
      climate: 'templado',
      environment: 'urbano',
      activities: ['turismo', 'cultura', 'cenas']
    };
  });

  // Packed checklist items state
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TRIP_CHECKED_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {};
  });

  // Mobile accordion state for the configuration card (collapsed by default on mobile to save space)
  const [isConfigOpenMobile, setIsConfigOpenMobile] = useState<boolean>(false);
  const [isConfigOpenDesktop, setIsConfigOpenDesktop] = useState<boolean>(true);

  // Manual items added or removed by the user
  const [customRemovedIds, setCustomRemovedIds] = useState<string[]>([]);
  const [customAddedItems, setCustomAddedItems] = useState<LuggageRecommendationItem[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'packed'>('all');

  // Persist trip config
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_TRIP_CONFIG_KEY, JSON.stringify(tripConfig));
    } catch {
      // ignore
    }
  }, [tripConfig]);

  // Persist checked items
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_TRIP_CHECKED_KEY, JSON.stringify(checkedItems));
    } catch {
      // ignore
    }
  }, [checkedItems]);

  // Generate capsule recommendation with algorithm
  const algorithmResult = useMemo(() => {
    return recommendLuggageCapsule(wardrobe, profile, tripConfig);
  }, [wardrobe, profile, tripConfig]);

  // Final capsule items: algorithm items minus removed + custom added
  const finalCapsuleItems = useMemo(() => {
    const baseItems = algorithmResult.items.filter(
      item => !customRemovedIds.includes(item.item.id)
    );
    const combined = [...baseItems, ...customAddedItems];
    // Deduplicate just in case
    const seen = new Set<string>();
    return combined.filter(entry => {
      if (seen.has(entry.item.id)) return false;
      seen.add(entry.item.id);
      return true;
    });
  }, [algorithmResult.items, customRemovedIds, customAddedItems]);

  // Total chosen garments count
  const totalChosenGarments = finalCapsuleItems.length;
  const packedCount = finalCapsuleItems.filter(i => checkedItems[i.item.id]).length;
  const pendingCount = totalChosenGarments - packedCount;
  const progressPercent = totalChosenGarments > 0 ? Math.round((packedCount / totalChosenGarments) * 100) : 0;

  // Filtered items to display
  const displayedItems = useMemo(() => {
    if (activeFilter === 'packed') {
      return finalCapsuleItems.filter(i => checkedItems[i.item.id]);
    }
    if (activeFilter === 'pending') {
      return finalCapsuleItems.filter(i => !checkedItems[i.item.id]);
    }
    return finalCapsuleItems;
  }, [finalCapsuleItems, activeFilter, checkedItems]);

  // Handlers
  const toggleCheck = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const removeItem = (id: string) => {
    setCustomRemovedIds(prev => [...prev, id]);
    setCustomAddedItems(prev => prev.filter(i => i.item.id !== id));
  };

  const addItemToCapsule = (garment: ClothingItem) => {
    // Remove from removed list if it was there
    setCustomRemovedIds(prev => prev.filter(id => id !== garment.id));
    setCustomAddedItems(prev => [
      ...prev,
      {
        item: garment,
        roleReason: 'Prenda añadida manualmente por ti',
        categoryGroup: garment.category as any,
        matchScore: 90
      }
    ]);
    setIsAddModalOpen(false);
  };

  const resetToAlgorithm = () => {
    setCustomRemovedIds([]);
    setCustomAddedItems([]);
  };

  // Preset selector handler
  const handleSelectPreset = (presetName: string) => {
    const found = TRIP_PRESETS.find(p => p.name === presetName);
    if (found) {
      setTripConfig(prev => ({
        ...prev,
        destination: found.name,
        customDestination: '',
        climate: found.defaultClimate,
        environment: found.defaultEnvironment,
        activities: found.defaultActivities
      }));
    } else {
      setTripConfig(prev => ({ ...prev, destination: presetName }));
    }
  };

  // Activity toggle handler
  const toggleActivity = (activityId: TripActivity) => {
    setTripConfig(prev => {
      const exists = prev.activities.includes(activityId);
      if (exists) {
        // Keep at least one activity
        if (prev.activities.length <= 1) return prev;
        return {
          ...prev,
          activities: prev.activities.filter(a => a !== activityId)
        };
      }
      return {
        ...prev,
        activities: [...prev.activities, activityId]
      };
    });
  };

  // Remaining wardrobe items not yet in suitcase
  const unselectedWardrobeItems = useMemo(() => {
    const selectedIds = new Set(finalCapsuleItems.map(i => i.item.id));
    return wardrobe.filter(w => !selectedIds.has(w.id));
  }, [wardrobe, finalCapsuleItems]);

  // Formatted date string for editorial badge
  const formattedTripDate = useMemo(() => {
    try {
      if (!tripConfig.startDate) return 'Fecha no definida';
      const parts = tripConfig.startDate.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      }
      return tripConfig.startDate;
    } catch {
      return tripConfig.startDate;
    }
  }, [tripConfig.startDate]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6 sm:space-y-8 pb-32 md:pb-12">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E8E2D6] pb-4 sm:pb-5">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-rose-900 flex items-center gap-1.5">
            <Luggage className="w-3.5 h-3.5" />
            Modo Escapada & Maleta Inteligente
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight mt-1">
            Maleta <span className="italic font-normal text-neutral-600">Cápsula</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-2xl leading-relaxed">
            Fórmula matemática de equipaje adaptada al destino, clima, actividades y días de tu escapada, optimizada para tu morfología y armario.
          </p>
        </div>

        {/* Desktop Progress pill */}
        <div className="hidden sm:flex items-center gap-4 bg-white px-5 py-3 rounded-2xl border border-neutral-200 shadow-2xs">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
              Equipaje Preparado
            </span>
            <div className="flex items-center gap-1.5 justify-end">
              <span className="text-sm font-bold text-neutral-900">
                {packedCount} de {totalChosenGarments}
              </span>
              <span className="text-xs text-neutral-400">prendas</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center font-bold text-amber-900 text-xs">
            {progressPercent}%
          </div>
        </div>
      </div>

      {/* =========================================================================
          BARRA FLOTANTE MÓVIL: "NÚMERO DE PRENDAS ELEGIDAS VISIBLE EN TODO MOMENTO"
          ========================================================================= */}
      <div className="md:hidden fixed bottom-[68px] left-3 right-3 z-35 bg-neutral-950/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center justify-between gap-3 transition-all animate-fadeIn">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-rose-900/80 flex items-center justify-center shrink-0 text-white font-bold text-sm shadow-inner">
            <Luggage className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-tight">
                {totalChosenGarments} prendas elegidas
              </span>
              <span className="text-[10px] text-neutral-400 font-medium">
                ({packedCount} empacadas)
              </span>
            </div>
            {/* Mini Progress Bar */}
            <div className="w-36 bg-neutral-800 h-1.5 rounded-full overflow-hidden mt-1">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setIsConfigOpenMobile(prev => !prev);
            if (!isConfigOpenMobile) {
              window.scrollTo({ top: 100, behavior: 'smooth' });
            }
          }}
          className="shrink-0 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-[11px] font-semibold text-white flex items-center gap-1 border border-white/20 transition-all cursor-pointer"
        >
          <SlidersHorizontal className="w-3 h-3 text-rose-300" />
          <span>{isConfigOpenMobile ? 'Ocultar' : 'Configurar'}</span>
        </button>
      </div>

      {/* =========================================================================
          CONFIGURACIÓN DE LA ESCAPADA (TARJETA DESPLEGABLE EN MÓVIL POR BOTÓN)
          ========================================================================= */}
      <div className="bg-white/95 border border-[#E5DFD5] rounded-3xl shadow-2xs overflow-hidden transition-all">
        {/* Cabecera / Tarjeta resumen desplegable en móvil */}
        <div 
          onClick={() => setIsConfigOpenMobile(prev => !prev)}
          className="p-4 sm:p-6 cursor-pointer select-none flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-neutral-100/80 hover:bg-[#FAF8F5]/60 transition-colors"
        >
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-900 border border-rose-100 flex items-center justify-center shrink-0 text-lg shadow-2xs">
                {TRIP_PRESETS.find(p => p.name === tripConfig.destination)?.icon || '✈️'}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-rose-900 block">
                  Configuración del viaje
                </span>
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-neutral-900 leading-tight">
                    {tripConfig.customDestination ? tripConfig.customDestination : tripConfig.destination}
                  </h2>
                  <span className="text-xs text-neutral-400 font-medium hidden sm:inline">•</span>
                  <span className="text-xs text-neutral-500 font-medium hidden sm:inline">
                    {tripConfig.days} días ({formattedTripDate})
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile Expand / Collapse Button */}
            <div className="flex items-center gap-2 md:hidden">
              <span className="text-xs font-semibold text-rose-900">
                {isConfigOpenMobile ? 'Cerrar' : 'Ajustar'}
              </span>
              <button 
                type="button"
                className="w-8 h-8 rounded-full bg-[#FAF8F5] border border-neutral-200 flex items-center justify-center text-neutral-700"
                aria-label="Desplegar configuración de escapada"
              >
                {isConfigOpenMobile ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Quick Badges Resumen (siempre visibles en el header de la tarjeta) */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 md:pt-0">
            <span className="text-[10.5px] px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-neutral-200 text-neutral-700 font-medium flex items-center gap-1">
              <Calendar className="w-3 h-3 text-rose-800" />
              <span>{tripConfig.days} días</span>
            </span>

            <span className="text-[10.5px] px-2.5 py-1 rounded-lg bg-amber-50/80 border border-amber-200/80 text-amber-900 font-medium flex items-center gap-1">
              {tripConfig.climate === 'calido' && <Sun className="w-3 h-3 text-amber-600" />}
              {tripConfig.climate === 'templado' && <Cloud className="w-3 h-3 text-amber-600" />}
              {tripConfig.climate === 'fresco' && <CloudRain className="w-3 h-3 text-blue-600" />}
              {tripConfig.climate === 'frio' && <Snowflake className="w-3 h-3 text-sky-600" />}
              <span className="capitalize">{tripConfig.climate}</span>
            </span>

            <span className="text-[10.5px] px-2.5 py-1 rounded-lg bg-purple-50/80 border border-purple-200/80 text-purple-900 font-medium capitalize">
              {tripConfig.environment}
            </span>

            <span className="text-[10.5px] px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-600 font-medium">
              {tripConfig.activities.length} actividades
            </span>

            {/* Desktop toggle button */}
            <div className="hidden md:flex items-center ml-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsConfigOpenDesktop(prev => !prev);
                }}
                className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
              >
                <span>{isConfigOpenDesktop ? 'Plegar' : 'Desplegar'}</span>
                {isConfigOpenDesktop ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* CUERPO DE LA CONFIGURACIÓN: DESPLEGABLE EN MÓVIL AL PULSAR EL BOTÓN */}
        <div className={`p-4 sm:p-6 space-y-6 ${isConfigOpenMobile ? 'block' : 'hidden md:block'} ${!isConfigOpenDesktop ? 'md:hidden' : ''}`}>
          {/* 1. LUGAR / DESTINO */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-900" />
                1. ¿A dónde te escapas? (Destino)
              </label>
              <span className="text-[11px] text-neutral-400">Selecciona o escribe</span>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {TRIP_PRESETS.map((dest) => {
                const isSelected = tripConfig.destination === dest.name && !tripConfig.customDestination;
                return (
                  <button
                    key={dest.name}
                    type="button"
                    onClick={() => handleSelectPreset(dest.name)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm ring-2 ring-neutral-900/10'
                        : 'bg-[#FAF8F5] text-neutral-800 border-neutral-200/90 hover:bg-[#F2ECE1]'
                    }`}
                  >
                    <span className="text-xl block mb-1">{dest.icon}</span>
                    <span className="text-xs font-bold block truncate">{dest.name}</span>
                    <span className={`text-[10px] block truncate ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      {dest.avgTemp} • {dest.country}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Destination Input */}
            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                placeholder="O escribe otro destino... (ej: Santander, Kioto, Menorca, Berlín)"
                value={tripConfig.customDestination || ''}
                onChange={(e) => {
                  setTripConfig(prev => ({
                    ...prev,
                    customDestination: e.target.value
                  }));
                }}
                className="flex-1 bg-[#FAF8F5] border border-neutral-200 rounded-xl px-3.5 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
              {tripConfig.customDestination && (
                <button
                  type="button"
                  onClick={() => setTripConfig(prev => ({ ...prev, customDestination: '' }))}
                  className="p-2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 2. FECHA Y DURACIÓN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-neutral-100">
            {/* Fecha */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5 mb-2">
                <Calendar className="w-3.5 h-3.5 text-rose-900" />
                2. Fecha de viaje
              </label>
              <input
                type="date"
                value={tripConfig.startDate}
                onChange={(e) => setTripConfig(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full bg-[#FAF8F5] border border-neutral-200 rounded-xl px-3.5 py-2 text-xs font-medium text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            {/* Duración */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5 mb-2">
                <Clock className="w-3.5 h-3.5 text-rose-900" />
                3. Duración ({tripConfig.days} {tripConfig.days === 1 ? 'día' : 'días'})
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[2, 3, 4, 5, 7, 10, 14].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setTripConfig(prev => ({ ...prev, days: d }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                      tripConfig.days === d
                        ? 'bg-neutral-900 text-white font-bold shadow-2xs'
                        : 'bg-[#FAF8F5] text-neutral-700 border border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    {d} d
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. CLIMA Y ENTORNO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-neutral-100">
            {/* Clima */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5 mb-2">
                <Sun className="w-3.5 h-3.5 text-amber-700" />
                4. Clima previsto
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CLIMATE_OPTIONS.map((c) => {
                  const Icon = c.icon;
                  const isSelected = tripConfig.climate === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setTripConfig(prev => ({ ...prev, climate: c.id }))}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                        isSelected
                          ? 'bg-amber-900 text-white border-amber-900 shadow-2xs'
                          : 'bg-[#FAF8F5] text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs font-semibold block leading-tight truncate">{c.label}</span>
                        <span className={`text-[10px] block ${isSelected ? 'text-amber-200' : 'text-neutral-400'}`}>
                          {c.temp}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Entorno */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5 mb-2">
                <Compass className="w-3.5 h-3.5 text-neutral-700" />
                5. Entorno
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ENVIRONMENT_OPTIONS.map((env) => {
                  const Icon = env.icon;
                  const isSelected = tripConfig.environment === env.id;
                  return (
                    <button
                      key={env.id}
                      type="button"
                      onClick={() => setTripConfig(prev => ({ ...prev, environment: env.id }))}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        isSelected
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs font-semibold'
                          : 'bg-[#FAF8F5] text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-[11px] truncate">{env.label.split('/')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. TIPO DE ACTIVIDADES A REALIZAR */}
          <div className="pt-3 border-t border-neutral-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                <Footprints className="w-3.5 h-3.5 text-purple-900" />
                6. Actividades a realizar (multiselección)
              </label>
              <span className="text-[10.5px] text-neutral-400">Calibra el estilo y calzado</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {ACTIVITY_OPTIONS.map((act) => {
                const Icon = act.icon;
                const isSelected = tripConfig.activities.includes(act.id);
                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => toggleActivity(act.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-purple-950 text-white border-purple-950 shadow-2xs'
                        : 'bg-[#FAF8F5] text-neutral-800 border-neutral-200 hover:bg-[#F2ECE1]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 mt-0.5 text-purple-400" />
                    <div className="min-w-0">
                      <span className="text-xs font-semibold block leading-tight">{act.label}</span>
                      <span className={`text-[10px] block line-clamp-1 ${isSelected ? 'text-purple-200' : 'text-neutral-400'}`}>
                        {act.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botón de Aplicar y Plegar en Móvil */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-neutral-100">
            <span className="text-xs text-neutral-500 text-center sm:text-left">
              ✨ El algoritmo recalcula la maleta en tiempo real adaptándose a tus elecciones.
            </span>
            <button
              type="button"
              onClick={() => {
                setIsConfigOpenMobile(false);
              }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:scale-98 text-white font-semibold text-xs tracking-wide shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Generar & Ver Maleta Cápsula</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BANNER DE ANÁLISIS EDITORIAL Y FÓRMULA MATEMÁTICA CÁPSULA
          ========================================================================= */}
      <div className="bg-gradient-to-br from-white via-[#FAF7F2] to-[#F5EFE6] border border-[#E8E2D6] rounded-3xl p-4 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-rose-900 text-white">
                Fórmula Cápsula
              </span>
              <span className="text-xs font-medium text-neutral-500">
                {tripConfig.destination} • {tripConfig.days} días
              </span>
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-neutral-900">
              {totalChosenGarments} prendas seleccionadas = {algorithmResult.totalOutfitsCount} outfits posibles
            </h3>
            <p className="text-xs text-neutral-600 max-w-2xl leading-relaxed">
              {algorithmResult.paletteHarmonyDescription}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white border border-neutral-200 hover:border-neutral-300 text-xs font-semibold text-neutral-800 flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-rose-900" />
              <span>Añadir otra prenda</span>
            </button>

            {(customRemovedIds.length > 0 || customAddedItems.length > 0) && (
              <button
                onClick={resetToAlgorithm}
                className="px-3 py-2 rounded-xl bg-[#FAF8F5] border border-neutral-200 text-xs font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-1 cursor-pointer transition-colors"
                title="Restaurar recomendación original"
              >
                <RefreshCw className="w-3 h-3" />
                <span className="hidden sm:inline">Restaurar</span>
              </button>
            )}
          </div>
        </div>

        {/* Desglose de piezas seleccionadas */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2 border-t border-[#E8E2D6]/80 text-center">
          <div className="bg-white/80 p-2 rounded-xl border border-neutral-100">
            <span className="text-[10px] text-neutral-400 uppercase font-bold block">Tops</span>
            <span className="text-sm font-bold text-neutral-800">
              {finalCapsuleItems.filter(i => i.item.category === 'top').length}
            </span>
          </div>
          <div className="bg-white/80 p-2 rounded-xl border border-neutral-100">
            <span className="text-[10px] text-neutral-400 uppercase font-bold block">Bottoms</span>
            <span className="text-sm font-bold text-neutral-800">
              {finalCapsuleItems.filter(i => i.item.category === 'bottom').length}
            </span>
          </div>
          <div className="bg-white/80 p-2 rounded-xl border border-neutral-100">
            <span className="text-[10px] text-neutral-400 uppercase font-bold block">Calzado</span>
            <span className="text-sm font-bold text-neutral-800">
              {finalCapsuleItems.filter(i => i.item.category === 'shoes').length}
            </span>
          </div>
          <div className="bg-white/80 p-2 rounded-xl border border-neutral-100">
            <span className="text-[10px] text-neutral-400 uppercase font-bold block">Capas / Abrigo</span>
            <span className="text-sm font-bold text-neutral-800">
              {finalCapsuleItems.filter(i => i.item.category === 'outerwear').length}
            </span>
          </div>
          <div className="bg-white/80 p-2 rounded-xl border border-neutral-100">
            <span className="text-[10px] text-neutral-400 uppercase font-bold block">Vestidos</span>
            <span className="text-sm font-bold text-neutral-800">
              {finalCapsuleItems.filter(i => i.item.category === 'dress').length}
            </span>
          </div>
          <div className="bg-white/80 p-2 rounded-xl border border-neutral-100">
            <span className="text-[10px] text-neutral-400 uppercase font-bold block">Accesorios</span>
            <span className="text-sm font-bold text-neutral-800">
              {finalCapsuleItems.filter(i => i.item.category === 'accessory').length}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          LISTA DE PRENDAS DE LA MALETA (CHECKLIST CON CONTROL DE EMPACADO)
          ========================================================================= */}
      <div className="space-y-4">
        {/* Filtros de lista */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                activeFilter === 'all'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              Todas ({totalChosenGarments})
            </button>
            <button
              onClick={() => setActiveFilter('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                activeFilter === 'pending'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              Pendientes ({pendingCount})
            </button>
            <button
              onClick={() => setActiveFilter('packed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                activeFilter === 'packed'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              Empacadas ({packedCount})
            </button>
          </div>

          <span className="text-xs text-neutral-400">
            Haz clic en una prenda para marcarla como empacada
          </span>
        </div>

        {/* Garments Grid */}
        {displayedItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-neutral-200 p-6 space-y-2">
            <p className="text-neutral-500 text-sm">No hay prendas en este filtro.</p>
            <button
              onClick={() => setActiveFilter('all')}
              className="text-xs text-rose-900 font-semibold underline cursor-pointer"
            >
              Ver todas las prendas de la maleta
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {displayedItems.map(({ item, roleReason }) => {
              const isChecked = !!checkedItems[item.id];
              return (
                <div
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 group relative ${
                    isChecked
                      ? 'bg-emerald-50/50 border-emerald-300 opacity-75'
                      : 'bg-white border-neutral-200/90 hover:border-neutral-400 shadow-2xs hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Image */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#FAF8F5] p-1 shrink-0 border border-neutral-100 flex items-center justify-center">
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="w-full h-full object-contain" 
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[9.5px] uppercase font-bold text-neutral-400 tracking-wider">
                          {item.category}
                        </span>
                        <div className="text-neutral-400 group-hover:text-neutral-700">
                          {isChecked ? (
                            <CheckSquare className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </div>
                      </div>

                      <h4 className={`text-xs font-semibold leading-snug line-clamp-2 mt-0.5 ${isChecked ? 'line-through text-neutral-500' : 'text-neutral-900'}`}>
                        {item.name}
                      </h4>

                      <div className="flex items-center gap-1.5 mt-1">
                        <span 
                          className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0" 
                          style={{ backgroundColor: item.colorHex || '#ccc' }} 
                        />
                        <span className="text-[10px] text-neutral-500 truncate">{item.colorName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Motivo de estilismo inteligente para el viaje */}
                  <div className="pt-2 border-t border-neutral-100/80 flex items-center justify-between gap-2">
                    <p className="text-[10.5px] text-neutral-500 italic leading-snug truncate flex-1">
                      💡 {roleReason}
                    </p>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(item.id);
                      }}
                      className="p-1 rounded-md text-neutral-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                      title="Quitar prenda de la maleta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL / DIALOG PARA AÑADIR OTRA PRENDA DEL ARMARIO A LA MALETA
          ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden animate-fadeIn">
            <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-neutral-900">
                  Añadir prenda de tu armario
                </h3>
                <p className="text-xs text-neutral-500">
                  Selecciona una prenda adicional para incluir en tu maleta cápsula
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-neutral-400 hover:text-neutral-700 cursor-pointer rounded-full hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {unselectedWardrobeItems.length === 0 ? (
                <p className="text-center text-xs text-neutral-400 py-8">
                  Todas las prendas de tu armario ya están incluidas en la maleta.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {unselectedWardrobeItems.map((garment) => (
                    <div
                      key={garment.id}
                      onClick={() => addItemToCapsule(garment)}
                      className="p-3 rounded-2xl border border-neutral-200 hover:border-neutral-900 bg-[#FAF8F5]/60 hover:bg-white flex items-center justify-between gap-3 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-white p-1 border border-neutral-100 overflow-hidden shrink-0">
                          <img src={garment.imageUrl} alt={garment.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9px] uppercase font-bold text-neutral-400 block">{garment.category}</span>
                          <span className="text-xs font-semibold text-neutral-800 truncate block">{garment.name}</span>
                          <span className="text-[10px] text-neutral-400">{garment.colorName}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="px-2.5 py-1 rounded-lg bg-neutral-900 text-white text-[10px] font-bold shrink-0"
                      >
                        + Añadir
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
