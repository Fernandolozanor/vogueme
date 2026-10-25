import React, { useState, useMemo } from 'react';
import { 
  X, Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  Trash2, Plus, AlertTriangle, CheckCircle2, 
  RotateCcw, Info, Flame
} from 'lucide-react';
import type { ClothingItem } from '../types';
import { 
  getOutfitHistory, 
  deleteOutfitLog, 
  logOutfitWearForDate, 
  type LoggedWear 
} from '../services/storage';
import { 
  calculateMonthlyStats, 
  calculateOutfitSimilarity,
  type RepetitionLevel
} from '../services/repetitionEngine';
import { GarmentDetailModal } from './GarmentDetailModal';

interface OutfitCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  wardrobe: ClothingItem[];
  onHistoryChange?: () => void;
  initialSelectedDate?: string; // YYYY-MM-DD
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const OutfitCalendarModal: React.FC<OutfitCalendarModalProps> = ({
  isOpen,
  onClose,
  wardrobe,
  onHistoryChange,
  initialSelectedDate
}) => {
  const [history, setHistory] = useState<LoggedWear[]>(() => getOutfitHistory());
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDayStr, setSelectedDayStr] = useState<string>(() => {
    return initialSelectedDate || new Date().toISOString().split('T')[0];
  });
  const [activeTab, setActiveTab] = useState<'calendar' | 'diagnostics'>('calendar');

  // Modal para ver prenda individual
  const [inspectedGarment, setInspectedGarment] = useState<ClothingItem | null>(null);

  // Modo añadir look manual
  const [isAddingLook, setIsAddingLook] = useState(false);
  const [selectedGarmentIds, setSelectedGarmentIds] = useState<string[]>([]);
  const [manualOccasion, setManualOccasion] = useState('Casual');

  const wardrobeMap = useMemo(() => new Map(wardrobe.map(i => [i.id, i])), [wardrobe]);

  // Refresh history when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setHistory(getOutfitHistory());
      if (initialSelectedDate) {
        setSelectedDayStr(initialSelectedDate);
      }
    }
  }, [isOpen, initialSelectedDate]);

  // Mapeo fecha "YYYY-MM-DD" -> LoggedWear
  const logsByDate = useMemo(() => {
    const map = new Map<string, LoggedWear>();
    history.forEach(log => {
      const datePart = log.date.split('T')[0];
      map.set(datePart, log);
    });
    return map;
  }, [history]);

  // Estadísticas del mes actual
  const monthlyStats = useMemo(() => {
    return calculateMonthlyStats(history, wardrobe, currentDate);
  }, [history, wardrobe, currentDate]);

  // Navegación meses
  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const handleGoToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDayStr(today.toISOString().split('T')[0]);
  };

  // Cálculo de los días para la cuadrícula del calendario (inicio en Lunes)
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // En JS getDay(): 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Domingo pasa a índice 6

    const totalDays = lastDay.getDate();

    const days: Array<{
      dayNum: number;
      dateStr: string;
      isCurrentMonth: boolean;
      log?: LoggedWear;
    }> = [];

    // Días de relleno del mes anterior
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const dateStr = prevDate.toISOString().split('T')[0];
      days.push({
        dayNum,
        dateStr,
        isCurrentMonth: false,
        log: logsByDate.get(dateStr)
      });
    }

    // Días del mes actual
    for (let d = 1; d <= totalDays; d++) {
      // Evitar desfase horario usando formato manual YYYY-MM-DD
      const monthPadded = String(month + 1).padStart(2, '0');
      const dayPadded = String(d).padStart(2, '0');
      const dateStr = `${year}-${monthPadded}-${dayPadded}`;

      days.push({
        dayNum: d,
        dateStr,
        isCurrentMonth: true,
        log: logsByDate.get(dateStr)
      });
    }

    // Días de relleno del mes siguiente para completar cuadrícula de 35 o 42 celdas
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      const dateStr = nextDate.toISOString().split('T')[0];
      days.push({
        dayNum: i,
        dateStr,
        isCurrentMonth: false,
        log: logsByDate.get(dateStr)
      });
    }

    return days;
  }, [currentDate, logsByDate]);

  // Outfit del día seleccionado
  const selectedLog = logsByDate.get(selectedDayStr);
  const selectedItems = useMemo(() => {
    if (!selectedLog) return [];
    return selectedLog.itemIds
      .map(id => wardrobeMap.get(id))
      .filter((i): i is ClothingItem => Boolean(i));
  }, [selectedLog, wardrobeMap]);

  // Análisis de repetición del día seleccionado respecto a días previos
  const selectedDayDiagnosis = useMemo(() => {
    if (!selectedLog || selectedItems.length === 0) return null;

    const selectedTime = new Date(selectedLog.date).getTime();
    // Filtramos looks anteriores a este día (hasta 14 días antes)
    const priorLogs = history.filter(l => {
      const t = new Date(l.date).getTime();
      return t < selectedTime && (selectedTime - t) <= 14 * 24 * 60 * 60 * 1000;
    });

    if (priorLogs.length === 0) {
      return {
        level: 'fresh' as RepetitionLevel,
        score: 0,
        text: 'Look fresco (sin precedentes cercanos)'
      };
    }

    let maxSim = 0;
    let closestDaysAgo = 0;
    let dominantPiece: string | undefined;

    priorLogs.forEach(pl => {
      const plItems = pl.itemIds.map(id => wardrobeMap.get(id)).filter(Boolean) as ClothingItem[];
      const comp = calculateOutfitSimilarity(selectedItems, plItems);
      if (comp.similarityScore > maxSim) {
        maxSim = comp.similarityScore;
        closestDaysAgo = Math.floor((selectedTime - new Date(pl.date).getTime()) / (1000 * 60 * 60 * 24));
        dominantPiece = comp.dominantSharedItem?.name;
      }
    });

    if (maxSim >= 70 && closestDaysAgo <= 4) {
      return {
        level: 'high' as RepetitionLevel,
        score: maxSim,
        text: `Repetición alta (${maxSim}% coincidencia visual con look de hace ${closestDaysAgo} días)`
      };
    }

    if (maxSim >= 45 && closestDaysAgo <= 6) {
      return {
        level: 'moderate' as RepetitionLevel,
        score: maxSim,
        text: `Prenda repetida (${dominantPiece || 'pieza clave'} usada hace ${closestDaysAgo} días)`
      };
    }

    return {
      level: 'fresh' as RepetitionLevel,
      score: maxSim,
      text: 'Look variado y equilibrado'
    };
  }, [selectedLog, selectedItems, history, wardrobeMap]);

  // Borrar look del día seleccionado
  const handleDeleteSelectedLog = () => {
    if (!selectedLog) return;
    if (window.confirm('¿Seguro que deseas eliminar el look registrado de este día?')) {
      const updated = deleteOutfitLog(selectedLog.id);
      setHistory(updated);
      onHistoryChange?.();
    }
  };

  // Guardar look manual para el día seleccionado
  const handleSaveManualLook = () => {
    if (selectedGarmentIds.length === 0) {
      alert('Selecciona al menos una prenda para el look.');
      return;
    }

    const isoDate = `${selectedDayStr}T12:00:00.000Z`;
    const updated = logOutfitWearForDate(isoDate, manualOccasion, selectedGarmentIds);
    setHistory(updated);
    setIsAddingLook(false);
    setSelectedGarmentIds([]);
    onHistoryChange?.();
  };

  const toggleSelectGarment = (id: string) => {
    setSelectedGarmentIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-[#FAF8F5] w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-[#E8E2D6] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Editorial Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-white border-b border-[#E8E2D6] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
              <CalendarIcon className="w-4 h-4 text-rose-900" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg sm:text-xl font-bold text-neutral-900 truncate">
                  Calendario de Outfits
                </h2>
                <span className="text-[10px] tracking-wider uppercase font-semibold text-rose-950 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 shrink-0 hidden sm:inline">
                  Control de Repeticiones
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 truncate">
                Historial diario y detector de prendas repetidas por impacto visual
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botón Hoy */}
            <button
              onClick={handleGoToday}
              className="px-2.5 py-1 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer transition-colors"
            >
              Hoy
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-500 cursor-pointer transition-colors"
              aria-label="Cerrar calendario"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Barra de pestañas secundarias */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 pb-1 border-b border-[#E8E2D6] bg-[#F5F1EA]">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'calendar'
                ? 'bg-white text-neutral-900 shadow-2xs border border-[#E2DBD0]'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            Vista Mensual
          </button>
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'diagnostics'
                ? 'bg-white text-neutral-900 shadow-2xs border border-[#E2DBD0]'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            Rotación & Repetición
            <span className="text-[10px] bg-neutral-200 text-neutral-700 font-bold px-1.5 py-0.2 rounded-full">
              {monthlyStats.totalOutfitsLogged}
            </span>
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4">
          
          {activeTab === 'calendar' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
              
              {/* Columna Izquierda: Calendario (7 columnas en desktop) */}
              <div className="lg:col-span-7 bg-white p-3 sm:p-5 rounded-2xl border border-[#E8E2D6] shadow-2xs space-y-3">
                {/* Selector de Mes */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-base sm:text-lg font-bold text-neutral-900 capitalize">
                      {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={handlePrevMonth}
                      className="p-1.5 rounded-lg text-neutral-600 hover:bg-neutral-100 cursor-pointer transition-colors"
                      title="Mes anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNextMonth}
                      className="p-1.5 rounded-lg text-neutral-600 hover:bg-neutral-100 cursor-pointer transition-colors"
                      title="Mes siguiente"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Días de la semana */}
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  {WEEKDAYS.map(w => (
                    <div key={w} className="py-1">{w}</div>
                  ))}
                </div>

                {/* Cuadrícula de días */}
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                  {calendarDays.map((cell, idx) => {
                    const isSelected = cell.dateStr === selectedDayStr;
                    const isToday = cell.dateStr === todayStr;
                    const hasLog = Boolean(cell.log);

                    const logItems = hasLog 
                      ? (cell.log!.itemIds.map(id => wardrobeMap.get(id)).filter(Boolean) as ClothingItem[])
                      : [];

                    return (
                      <button
                        key={`${cell.dateStr}-${idx}`}
                        onClick={() => {
                          setSelectedDayStr(cell.dateStr);
                          setIsAddingLook(false);
                        }}
                        className={`min-h-[58px] sm:min-h-[72px] p-1 sm:p-1.5 rounded-xl border flex flex-col justify-between items-start text-left cursor-pointer transition-all relative ${
                          isSelected
                            ? 'border-neutral-900 ring-2 ring-neutral-900/10 bg-neutral-50 shadow-xs'
                            : hasLog
                            ? 'border-[#E2DBD0] bg-[#FAF8F5] hover:border-neutral-400'
                            : 'border-transparent hover:bg-neutral-50'
                        } ${!cell.isCurrentMonth ? 'opacity-35' : ''}`}
                      >
                        <div className="w-full flex items-center justify-between">
                          <span className={`text-[11px] sm:text-xs font-semibold ${
                            isToday 
                              ? 'w-5 h-5 rounded-full bg-rose-950 text-white flex items-center justify-center font-bold'
                              : isSelected
                              ? 'text-neutral-900 font-bold'
                              : 'text-neutral-700'
                          }`}>
                            {cell.dayNum}
                          </span>

                          {hasLog && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Look registrado" />
                          )}
                        </div>

                        {/* Vista miniatura de prendas si tiene log */}
                        {hasLog && logItems.length > 0 ? (
                          <div className="flex items-center -space-x-1.5 overflow-hidden w-full pt-1">
                            {logItems.slice(0, 3).map((item, iIdx) => (
                              <div
                                key={iIdx}
                                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-white bg-white overflow-hidden shrink-0 shadow-2xs"
                              >
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                              </div>
                            ))}
                            {logItems.length > 3 && (
                              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-white bg-neutral-200 text-[8px] font-bold text-neutral-700 flex items-center justify-center shrink-0">
                                +{logItems.length - 3}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[9px] text-neutral-300 hidden sm:block">·</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Leyenda rápida */}
                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Con outfit registrado
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-950" /> Hoy
                    </span>
                  </div>
                  <span className="text-neutral-400">Pulsa cualquier día para ver detalle</span>
                </div>
              </div>

              {/* Columna Derecha: Detalle del día seleccionado */}
              <div className="lg:col-span-5 bg-white p-3.5 sm:p-5 rounded-2xl border border-[#E8E2D6] shadow-2xs space-y-3.5">
                
                {/* Cabecera del día */}
                <div className="flex items-start justify-between border-b border-neutral-200/80 pb-2.5">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                      Detalle del Día
                    </span>
                    <h4 className="font-serif text-base sm:text-lg font-bold text-neutral-900 capitalize">
                      {new Date(`${selectedDayStr}T12:00:00`).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </h4>
                  </div>

                  {selectedLog && (
                    <button
                      onClick={handleDeleteSelectedLog}
                      className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                      title="Eliminar registro de este día"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Caso 1: Hay un look registrado para este día */}
                {selectedLog && !isAddingLook && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-800 bg-neutral-100 px-2.5 py-0.5 rounded-full">
                        {selectedLog.occasion || 'Look del día'}
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        {selectedItems.length} prendas combinadas
                      </span>
                    </div>

                    {/* Badge de Diagnóstico de Repetición para este día */}
                    {selectedDayDiagnosis && (
                      <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                        selectedDayDiagnosis.level === 'high'
                          ? 'bg-rose-50 border-rose-200 text-rose-900'
                          : selectedDayDiagnosis.level === 'moderate'
                          ? 'bg-amber-50 border-amber-200 text-amber-900'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      }`}>
                        {selectedDayDiagnosis.level === 'high' ? (
                          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                        ) : selectedDayDiagnosis.level === 'moderate' ? (
                          <Info className="w-4 h-4 shrink-0 text-amber-600" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                        )}
                        <span className="text-[11px] font-medium leading-snug">
                          {selectedDayDiagnosis.text}
                        </span>
                      </div>
                    )}

                    {/* Cuadrícula de prendas */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block">
                        Prendas llevadas
                      </span>
                      <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                        {selectedItems.map(item => (
                          <div
                            key={item.id}
                            onClick={() => setInspectedGarment(item)}
                            className="p-2 rounded-xl border border-neutral-200/80 hover:border-neutral-400 bg-[#FAF8F5] flex items-center justify-between gap-2.5 cursor-pointer transition-all group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-white overflow-hidden p-0.5 shrink-0 border border-neutral-100 flex items-center justify-center">
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                              </div>
                              <div className="min-w-0">
                                <h5 className="text-xs font-semibold text-neutral-900 leading-snug break-words group-hover:text-rose-950">
                                  {item.name}
                                </h5>
                                <span className="text-[10px] text-neutral-400 capitalize block break-words">
                                  {item.category} • {item.colorName}
                                </span>
                              </div>
                            </div>

                            <span className="text-[10px] text-neutral-500 font-medium shrink-0">
                              {item.purchasePrice ? `${item.purchasePrice} €` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Caso 2: No hay look registrado y no está en modo edición */}
                {!selectedLog && !isAddingLook && (
                  <div className="text-center py-6 sm:py-8 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                      <CalendarIcon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-neutral-700">
                        No hay look registrado para este día
                      </p>
                      <p className="text-[11px] text-neutral-400 max-w-xs mx-auto">
                        ¿Llevaste un conjunto este día? Puedes asignarlo retroactivamente para mantener al día tus métricas.
                      </p>
                    </div>

                    <button
                      onClick={() => setIsAddingLook(true)}
                      className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Registrar look para este día
                    </button>
                  </div>
                )}

                {/* Caso 3: Modo añadir / editar look para esta fecha */}
                {isAddingLook && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900">
                        Selecciona las prendas del look:
                      </span>
                      <button
                        onClick={() => setIsAddingLook(false)}
                        className="text-xs text-neutral-400 hover:text-neutral-700"
                      >
                        Cancelar
                      </button>
                    </div>

                    {/* Input Ocasión */}
                    <div>
                      <label className="text-[10px] font-semibold text-neutral-500 uppercase block mb-1">
                        Ocasión o actividad:
                      </label>
                      <input
                        type="text"
                        value={manualOccasion}
                        onChange={(e) => setManualOccasion(e.target.value)}
                        placeholder="Ej: Oficina, Cena, Casual..."
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-neutral-300 focus:outline-none focus:border-neutral-900 bg-white"
                      />
                    </div>

                    {/* Selector de prendas de tu armario */}
                    <div className="max-h-[180px] overflow-y-auto space-y-1.5 pr-1 border border-neutral-200 rounded-xl p-2 bg-[#FAF8F5]">
                      {wardrobe.map(item => {
                        const isPicked = selectedGarmentIds.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            onClick={() => toggleSelectGarment(item.id)}
                            className={`p-1.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                              isPicked 
                                ? 'bg-white border-neutral-900 shadow-2xs ring-1 ring-neutral-900' 
                                : 'bg-transparent border-transparent hover:bg-white/60'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <img src={item.imageUrl} alt={item.name} className="w-7 h-7 object-contain rounded shrink-0 bg-white" />
                              <span className="text-xs text-neutral-900 truncate font-medium">
                                {item.name}
                              </span>
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              isPicked ? 'bg-neutral-900 text-white' : 'text-neutral-400'
                            }`}>
                              {isPicked ? 'Elegida' : '+'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={handleSaveManualLook}
                      className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors shadow-2xs"
                    >
                      Guardar Look ({selectedGarmentIds.length} prendas)
                    </button>
                  </div>
                )}

              </div>

            </div>
          ) : (
            /* Tab 2: Diagnóstico Mensual & Repetición de Piezas */
            <div className="space-y-4 sm:space-y-6">
              
              {/* KPIs de Rotación Mensual */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
                
                <div className="bg-white p-3 sm:p-4 rounded-2xl border border-[#E8E2D6] shadow-2xs space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-neutral-400">Outfits Registrados</span>
                  <div className="font-serif text-xl sm:text-2xl font-bold text-neutral-900">
                    {monthlyStats.totalOutfitsLogged}
                  </div>
                  <span className="text-[10px] text-neutral-500">en este mes</span>
                </div>

                <div className="bg-white p-3 sm:p-4 rounded-2xl border border-[#E8E2D6] shadow-2xs space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-neutral-400">Rotación Armario</span>
                  <div className="font-serif text-xl sm:text-2xl font-bold text-emerald-800">
                    {monthlyStats.rotationPercentage}%
                  </div>
                  <span className="text-[10px] text-neutral-500">{monthlyStats.uniqueGarmentsWornCount} prendas activas</span>
                </div>

                <div className="bg-white p-3 sm:p-4 rounded-2xl border border-[#E8E2D6] shadow-2xs space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-neutral-400">Racha de Estilo</span>
                  <div className="font-serif text-xl sm:text-2xl font-bold text-amber-700 flex items-center gap-1">
                    <Flame className="w-5 h-5 text-amber-500" />
                    {monthlyStats.currentStreakDays} días
                  </div>
                  <span className="text-[10px] text-neutral-500">registrando looks</span>
                </div>

                <div className="bg-white p-3 sm:p-4 rounded-2xl border border-[#E8E2D6] shadow-2xs space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-neutral-400">Diagnóstico IA</span>
                  <div className="font-serif text-base sm:text-lg font-bold text-neutral-900 truncate">
                    {monthlyStats.rotationPercentage >= 60 ? '✨ Variedad Alta' : '🔄 Rotación Moderada'}
                  </div>
                  <span className="text-[10px] text-neutral-500">armario equilibrado</span>
                </div>

              </div>

              {/* Prendas más repetidas en el mes */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8E2D6] shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-serif text-sm sm:text-base font-bold text-neutral-900">
                      Tus Piezas Más Explotadas Este Mes
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      Prendas con mayor frecuencia de uso. El algoritmo recomienda rotarlas para evitar saturación visual.
                    </p>
                  </div>
                  <RotateCcw className="w-4 h-4 text-neutral-400" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {monthlyStats.mostRepeatedItems.map((entry, idx) => (
                    <div 
                      key={entry.item.id}
                      onClick={() => setInspectedGarment(entry.item)}
                      className="p-3 rounded-xl border border-neutral-200/90 bg-[#FAF8F5] flex items-center gap-3 cursor-pointer hover:border-neutral-400 transition-all"
                    >
                      <div className="w-12 h-12 rounded-lg bg-white overflow-hidden p-1 shrink-0 border border-neutral-100 flex items-center justify-center">
                        <img src={entry.item.imageUrl} alt={entry.item.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wider block">
                          #{idx + 1} Más puesta
                        </span>
                        <h5 className="text-xs font-semibold text-neutral-900 leading-snug break-words">
                          {entry.item.name}
                        </h5>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-bold text-neutral-900 bg-neutral-200/80 px-1.5 py-0.2 rounded">
                            {entry.wearCountMonth} veces
                          </span>
                          <span className="text-[9.5px] text-neutral-400 capitalize">
                            {entry.item.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {monthlyStats.mostRepeatedItems.length === 0 && (
                    <div className="col-span-3 text-center py-6 text-xs text-neutral-400">
                      Aún no hay suficientes datos registrados este mes.
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline Cronológico de Todos los Looks */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8E2D6] shadow-2xs space-y-3">
                <h4 className="font-serif text-sm sm:text-base font-bold text-neutral-900">
                  Historial Cronológico de Outfits
                </h4>

                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {history.map((log) => {
                    const items = log.itemIds.map(id => wardrobeMap.get(id)).filter(Boolean) as ClothingItem[];
                    return (
                      <div 
                        key={log.id}
                        className="p-3 rounded-xl border border-neutral-200/80 bg-[#FAF8F5] flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-neutral-400 block uppercase">
                            {new Date(log.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </span>
                          <h5 className="text-xs font-semibold text-neutral-900 leading-snug break-words">
                            {log.occasion || 'Look diario'}
                          </h5>
                          <div className="flex items-center -space-x-1.5 pt-1.5">
                            {items.map((it, i) => (
                              <img 
                                key={i}
                                src={it.imageUrl} 
                                alt={it.name} 
                                title={it.name}
                                className="w-6 h-6 rounded-full object-cover border border-white bg-white shrink-0 shadow-2xs" 
                              />
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedDayStr(log.date.split('T')[0]);
                            setActiveTab('calendar');
                          }}
                          className="px-2.5 py-1 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 hover:border-neutral-900 rounded-lg cursor-pointer transition-colors shrink-0"
                        >
                          Ver en Calendario
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal emergente para inspeccionar ficha de prenda */}
        <GarmentDetailModal
          item={inspectedGarment}
          onClose={() => setInspectedGarment(null)}
        />
      </div>
    </div>
  );
};
