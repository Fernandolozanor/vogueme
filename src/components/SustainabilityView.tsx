import React from 'react';
import { TrendingUp, AlertCircle, Award } from 'lucide-react';
import type { ClothingItem } from '../types';

interface SustainabilityViewProps {
  wardrobe: ClothingItem[];
  onSelectGarmentForLook?: (item: ClothingItem) => void;
}

export const SustainabilityView: React.FC<SustainabilityViewProps> = ({ wardrobe }) => {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E8E2D6] pb-5">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-emerald-800 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Moda Consciente & Finanzas Personales
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight mt-1">
            Coste por Puesta <span className="italic font-normal text-neutral-600">& Métricas</span>
          </h1>
          <p className="text-sm text-neutral-600 mt-1 max-w-xl">
            Descubre cuánto te cuesta realmente cada prenda cada vez que te la pones y aprende a sacarle el máximo partido a tu inversión.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white rounded-3xl p-5 border border-neutral-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Coste Medio por Puesta</span>
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-3xl font-bold text-emerald-800">{avgCostPerWear} €</span>
            <span className="text-xs text-neutral-500">/ uso</span>
          </div>
          <p className="text-[11px] text-neutral-500 pt-1">
            Cuanto más te pones una prenda, más barata resulta.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-neutral-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Total de Puestas Registradas</span>
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-3xl font-bold text-neutral-900">{totalWearCount}</span>
            <span className="text-xs text-neutral-500">looks vividos</span>
          </div>
          <p className="text-[11px] text-neutral-500 pt-1">
            Sumando los outfits de tus {totalItems} prendas.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-neutral-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Tasa de Amortización</span>
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-3xl font-bold text-neutral-900">{amortizedPercentage}%</span>
            <span className="text-xs text-neutral-500">activo</span>
          </div>
          <p className="text-[11px] text-neutral-500 pt-1">
            Prendas con 5 o más puestas en tu día a día.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-neutral-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Valor Estimado Armario</span>
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-3xl font-bold text-neutral-900">{totalEstimatedCost.toFixed(0)} €</span>
          </div>
          <p className="text-[11px] text-neutral-500 pt-1">
            Inversión total en tus prendas digitalizadas.
          </p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Top Investments (Lowest CPW) */}
        <div className="bg-[#FAF8F5] border border-[#E2DBD0] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              <h2 className="font-serif text-xl font-bold text-neutral-900">
                Tus Joyas Más Amortizadas
              </h2>
            </div>
            <span className="text-xs text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Compras Inteligentes
            </span>
          </div>

          <div className="space-y-3">
            {bestInvestments.map((item, idx) => (
              <div 
                key={item.id}
                className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] overflow-hidden p-1 shrink-0 border border-neutral-100">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-amber-700 uppercase">Top #{idx + 1} Rentabilidad</span>
                    <h3 className="text-xs font-semibold text-neutral-900 truncate max-w-[180px] sm:max-w-xs">
                      {item.name}
                    </h3>
                    <span className="text-[10px] text-neutral-400">{item.wearCount} puestas registradas</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-emerald-800 block">
                    {item.cpw.toFixed(2)} € / puesta
                  </span>
                  <span className="text-[10px] text-neutral-400">Coste inicial: {item.purchasePrice} €</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Forgotten Items (Rescue Wardrobe) */}
        <div className="bg-white/80 border border-[#E5DFD5] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-800" />
              <h2 className="font-serif text-xl font-bold text-neutral-900">
                Prendas Olvidadas en el Fondo
              </h2>
            </div>
            <span className="text-xs text-neutral-500 font-medium">
              ¡Dales una segunda vida!
            </span>
          </div>

          <p className="text-xs text-neutral-600">
            Prendas con 0 o 1 sola puesta. Tu estilista IA puede priorizarlas en el look de mañana para que no queden desaprovechadas.
          </p>

          <div className="space-y-3">
            {forgottenItems.map((item) => (
              <div 
                key={item.id}
                className="p-3.5 rounded-2xl border border-neutral-200/80 bg-[#FAF8F5] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white overflow-hidden p-1 shrink-0 border border-neutral-200">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-neutral-900 truncate max-w-[180px] sm:max-w-xs">
                      {item.name}
                    </h3>
                    <span className="text-[10px] text-rose-900 font-medium">
                      {item.wearCount === 0 ? 'Sin estrenar todavía' : 'Solo 1 puesta'}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-semibold text-neutral-600 block">
                    {item.purchasePrice ? `${item.purchasePrice} €` : 'Básico'}
                  </span>
                  <span className="text-[10px] text-neutral-400">Inversión parada</span>
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
    </div>
  );
};
