import React, { useState } from 'react';
import { TrendingUp, AlertCircle, Award } from 'lucide-react';
import type { ClothingItem } from '../types';
import { GarmentDetailModal } from './GarmentDetailModal';
import { toggleFavoriteItem } from '../services/storage';

interface SustainabilityViewProps {
  wardrobe: ClothingItem[];
  onSelectGarmentForLook?: (item: ClothingItem) => void;
  onWardrobeChange?: (updated: ClothingItem[]) => void;
}

export const SustainabilityView: React.FC<SustainabilityViewProps> = ({ 
  wardrobe,
  onWardrobeChange
}) => {
  const [selectedGarment, setSelectedGarment] = useState<{ item: ClothingItem; role?: string } | null>(null);

  // Calculations
  const totalItems = wardrobe.length;
  const totalWearCount = wardrobe.reduce((acc, i) => acc + (i.wearCount || 0), 0);
  const totalEstimatedCost = wardrobe.reduce((acc, i) => acc + (i.purchasePrice || 35), 0);
  
  const avgCostPerWear = totalWearCount > 0 
    ? (totalEstimatedCost / totalWearCount).toFixed(2)
    : '0.00';

  // Items sorted by best CPW (most worn relative to price)
  const itemsWithCPW = wardrobe
    .filter(i => (i.purchasePrice || 0) > 0 && i.wearCount > 0)
    .map(i => ({
      ...i,
      cpw: (i.purchasePrice! / i.wearCount)
    }))
    .sort((a, b) => a.cpw - b.cpw);

  const bestInvestments = itemsWithCPW.slice(0, 3);

  // Forgotten items (worn 0 or 1 time)
  const forgottenItems = wardrobe
    .filter(i => (i.wearCount || 0) <= 1)
    .slice(0, 4);

  const amortizedPercentage = totalItems > 0
    ? Math.round((wardrobe.filter(i => (i.wearCount || 0) >= 5).length / totalItems) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6 sm:space-y-8 pb-28 md:pb-12 overflow-x-hidden">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 border-b border-[#E8E2D6] pb-4 sm:pb-5">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-emerald-800 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Moda Consciente & Finanzas Personales
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight mt-1">
            Coste por Puesta <span className="italic font-normal text-neutral-600">& Métricas</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-xl leading-relaxed">
            Descubre cuánto te cuesta realmente cada prenda cada vez que te la pones y aprende a sacarle el máximo partido a tu inversión.
          </p>
        </div>
      </div>

      {/* KPI Cards (2x2 en móvil para aprovechar el ancho) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-neutral-200/90 shadow-2xs space-y-1 min-w-0">
          <span className="text-[9.5px] sm:text-[10px] uppercase font-bold tracking-wider text-neutral-400 block truncate">
            Coste Medio / Puesta
          </span>
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-emerald-800">{avgCostPerWear} €</span>
            <span className="text-[10px] sm:text-xs text-neutral-500">/ uso</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-neutral-500 pt-0.5 line-clamp-2">
            Cuanto más usas una prenda, más barata resulta.
          </p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-neutral-200/90 shadow-2xs space-y-1 min-w-0">
          <span className="text-[9.5px] sm:text-[10px] uppercase font-bold tracking-wider text-neutral-400 block truncate">
            Puestas Registradas
          </span>
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900">{totalWearCount}</span>
            <span className="text-[10px] sm:text-xs text-neutral-500">looks</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-neutral-500 pt-0.5 line-clamp-2">
            Sumando outfits de tus {totalItems} prendas.
          </p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-neutral-200/90 shadow-2xs space-y-1 min-w-0">
          <span className="text-[9.5px] sm:text-[10px] uppercase font-bold tracking-wider text-neutral-400 block truncate">
            Amortización
          </span>
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900">{amortizedPercentage}%</span>
            <span className="text-[10px] sm:text-xs text-neutral-500">activo</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-neutral-500 pt-0.5 line-clamp-2">
            Prendas con 5 o más puestas en tu día a día.
          </p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-neutral-200/90 shadow-2xs space-y-1 min-w-0">
          <span className="text-[9.5px] sm:text-[10px] uppercase font-bold tracking-wider text-neutral-400 block truncate">
            Valor Armario
          </span>
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900">{totalEstimatedCost.toFixed(0)} €</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-neutral-500 pt-0.5 line-clamp-2">
            Inversión en tus prendas digitalizadas.
          </p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
        
        {/* Top Investments (Lowest CPW) */}
        <div className="bg-[#FAF8F5] border border-[#E2DBD0] rounded-3xl p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4 min-w-0 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200/80 pb-3">
            <div className="flex items-center gap-2 min-w-0">
              <Award className="w-5 h-5 text-amber-600 shrink-0" />
              <h2 className="font-serif text-lg sm:text-xl font-bold text-neutral-900 truncate">
                Tus Joyas Más Amortizadas
              </h2>
            </div>
            <span className="self-start sm:self-auto text-[10px] sm:text-xs text-emerald-800 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
              Compras Inteligentes
            </span>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            {bestInvestments.map((item, idx) => (
              <div 
                key={item.id}
                onClick={() => setSelectedGarment({
                  item,
                  role: `Top #${idx + 1} Más Amortizada (${item.cpw.toFixed(2)} € / uso)`
                })}
                className="bg-white p-3 sm:p-3.5 rounded-2xl border border-neutral-200/80 hover:border-neutral-400 hover:shadow-xs active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between gap-2.5 sm:gap-3 shadow-2xs min-w-0 group"
                title="Pulsa para ver ficha completa de la prenda"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#FAF8F5] overflow-hidden p-1 shrink-0 border border-neutral-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wider block">
                      Top #{idx + 1} Rentabilidad
                    </span>
                    <h3 className="text-xs font-semibold text-neutral-900 truncate group-hover:text-amber-900 transition-colors">
                      {item.name}
                    </h3>
                    <span className="text-[10px] text-neutral-400 block truncate">
                      {item.wearCount} puestas registradas
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-1">
                  <span className="text-xs sm:text-sm font-bold text-emerald-800 block whitespace-nowrap">
                    {item.cpw.toFixed(2)} € <span className="text-[9.5px] sm:text-[10px] font-normal text-emerald-700">/ uso</span>
                  </span>
                  <span className="text-[10px] text-neutral-400 block whitespace-nowrap">
                    Coste: {item.purchasePrice} €
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Forgotten Items (Rescue Wardrobe) */}
        <div className="bg-white/90 border border-[#E5DFD5] rounded-3xl p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4 min-w-0 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200/80 pb-3">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-5 h-5 text-rose-800 shrink-0" />
              <h2 className="font-serif text-lg sm:text-xl font-bold text-neutral-900 truncate">
                Prendas Olvidadas en el Fondo
              </h2>
            </div>
            <span className="self-start sm:self-auto text-[10px] sm:text-xs text-neutral-500 font-medium bg-neutral-100 px-2.5 py-0.5 rounded-full shrink-0">
              ¡Dales una segunda vida!
            </span>
          </div>

          <p className="text-xs text-neutral-600 leading-relaxed">
            Prendas con 0 o 1 sola puesta. Tu estilista IA puede priorizarlas en el look de mañana para rentabilizar tu armario.
          </p>

          <div className="space-y-2.5 sm:space-y-3">
            {forgottenItems.map((item) => (
              <div 
                key={item.id}
                onClick={() => setSelectedGarment({
                  item,
                  role: item.wearCount === 0 ? 'Prenda sin estrenar' : 'Prenda con solo 1 puesta'
                })}
                className="p-3 sm:p-3.5 rounded-2xl border border-neutral-200/80 hover:border-neutral-400 hover:shadow-xs active:scale-[0.99] transition-all cursor-pointer bg-[#FAF8F5] flex items-center justify-between gap-2.5 sm:gap-3 min-w-0 group"
                title="Pulsa para ver ficha completa de la prenda"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white overflow-hidden p-1 shrink-0 border border-neutral-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-semibold text-neutral-900 truncate group-hover:text-rose-950 transition-colors">
                      {item.name}
                    </h3>
                    <span className="text-[10px] text-rose-900 font-medium block truncate">
                      {item.wearCount === 0 ? 'Sin estrenar todavía' : 'Solo 1 puesta'}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-1">
                  <span className="text-xs font-semibold text-neutral-700 block whitespace-nowrap">
                    {item.purchasePrice ? `${item.purchasePrice} €` : 'Básico'}
                  </span>
                  <span className="text-[10px] text-neutral-400 block whitespace-nowrap">
                    Inversión parada
                  </span>
                </div>
              </div>
            ))}

            {forgottenItems.length === 0 && (
              <div className="p-6 text-center text-xs text-neutral-500">
                ¡Increíble! Todas tus prendas tienen uso frecuente. Eres una auténtica pro de la moda sostenible. ✨
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Modal Emergente con los Detalles Completos de la Prenda */}
      <GarmentDetailModal
        item={selectedGarment ? selectedGarment.item : null}
        role={selectedGarment?.role}
        onClose={() => setSelectedGarment(null)}
        onToggleFavorite={(id) => {
          const updated = toggleFavoriteItem(id);
          onWardrobeChange?.(updated);
          if (selectedGarment && selectedGarment.item.id === id) {
            setSelectedGarment(prev => prev ? {
              ...prev,
              item: { ...prev.item, isFavorite: !prev.item.isFavorite }
            } : null);
          }
        }}
      />
    </div>
  );
};
