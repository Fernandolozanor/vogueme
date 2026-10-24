import React, { useState } from 'react';
import { Luggage, CheckSquare, Square } from 'lucide-react';
import type { ClothingItem, UserProfile } from '../types';

interface LuggageViewProps {
  wardrobe: ClothingItem[];
  profile: UserProfile;
}

const DESTINATION_PRESETS = [
  { name: 'París', vibe: 'Chic, museos & café en terraza', temp: '18°C', icon: '🥐' },
  { name: 'Ibiza / Costa', vibe: 'Playa, tardeo & cena junto al mar', temp: '26°C', icon: '🌊' },
  { name: 'Londres', vibe: 'Layers, trench & paseos urbanos', temp: '15°C', icon: '🌧️' },
  { name: 'Roma', vibe: 'Comfy chic para caminar 20.000 pasos', temp: '22°C', icon: '🏛️' },
  { name: 'Escapada Rural', vibe: 'Botas, punto suave & comfy total', temp: '14°C', icon: '🌲' }
];

export const LuggageView: React.FC<LuggageViewProps> = ({ wardrobe }) => {
  const [destination, setDestination] = useState('París');
  const [days, setDays] = useState(3);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Generate optimal capsule for the trip
  const tops = wardrobe.filter(i => i.category === 'top');
  const bottoms = wardrobe.filter(i => i.category === 'bottom');
  const shoes = wardrobe.filter(i => i.category === 'shoes');
  const outerwears = wardrobe.filter(i => i.category === 'outerwear');
  const dresses = wardrobe.filter(i => i.category === 'dress');
  const accessories = wardrobe.filter(i => i.category === 'accessory');

  // Capsule selection:
  const capsuleTops = tops.slice(0, Math.min(days, 3));
  const capsuleBottoms = bottoms.slice(0, 2);
  const capsuleOuter = outerwears.slice(0, 1);
  const capsuleShoes = shoes.slice(0, 2);
  const capsuleDress = dresses.slice(0, 1);
  const capsuleAcc = accessories.slice(0, 2);

  const allCapsuleItems = [
    ...capsuleTops,
    ...capsuleBottoms,
    ...capsuleOuter,
    ...capsuleShoes,
    ...capsuleDress,
    ...capsuleAcc
  ];

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCount = allCapsuleItems.filter(i => checkedItems[i.id]).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E8E2D6] pb-5">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-rose-900 flex items-center gap-1.5">
            <Luggage className="w-3.5 h-3.5" />
            Modo Escapada Inteligente
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight mt-1">
            Maleta <span className="italic font-normal text-neutral-600">Cápsula</span>
          </h1>
          <p className="text-sm text-neutral-600 mt-1 max-w-xl">
            La fórmula matemática de moda para viajar ligera: el mínimo de prendas para crear todos los outfits del viaje.
          </p>
        </div>

        <div className="bg-white px-4 py-2 rounded-2xl border border-neutral-200 shadow-2xs text-right">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block">Progreso Equipaje</span>
          <span className="text-xs font-semibold text-neutral-800">
            {completedCount} de {allCapsuleItems.length} prendas empacadas
          </span>
        </div>
      </div>

      {/* Destination Configurator */}
      <div className="bg-white/80 border border-[#E5DFD5] rounded-3xl p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-2">
            1. ¿A dónde te escapas?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {DESTINATION_PRESETS.map((dest) => {
              const isSelected = destination === dest.name;
              return (
                <button
                  key={dest.name}
                  onClick={() => setDestination(dest.name)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                      : 'bg-[#FAF8F5] text-neutral-800 border-neutral-200 hover:bg-[#EFEAE0]'
                  }`}
                >
                  <span className="text-xl block mb-1">{dest.icon}</span>
                  <span className="text-xs font-bold block">{dest.name}</span>
                  <span className={`text-[10px] line-clamp-1 ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                    {dest.vibe}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 border-t border-neutral-100">
          <div className="w-full sm:w-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600 block mb-1">
              Duración de la escapada:
            </span>
            <div className="flex gap-2">
              {[2, 3, 4, 5].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                    days === d
                      ? 'bg-neutral-900 text-white font-bold'
                      : 'bg-[#FAF8F5] text-neutral-700 border border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {d} días
                </button>
              ))}
            </div>
          </div>

          <div className="sm:ml-auto text-xs text-neutral-500 bg-[#FAF8F5] p-3 rounded-2xl border border-neutral-200">
            ✨ Con <strong>{allCapsuleItems.length} prendas</strong> puedes crear hasta <strong>{days * 2} combinaciones diferentes</strong>.
          </div>
        </div>
      </div>

      {/* Capsule Wardrobe Items Checklist */}
      <div className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-neutral-900">
          Tu Armario Cápsula para {destination} ({days} días)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {allCapsuleItems.map((item) => {
            const isChecked = !!checkedItems[item.id];
            return (
              <div
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                  isChecked
                    ? 'bg-emerald-50/60 border-emerald-300 opacity-70'
                    : 'bg-white border-neutral-200 hover:border-neutral-400 shadow-2xs'
                }`}
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#FAF8F5] p-1 shrink-0 border border-neutral-100">
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-[9px] uppercase font-bold text-neutral-400 block">{item.category}</span>
                  <h3 className={`text-xs font-semibold truncate ${isChecked ? 'line-through text-neutral-500' : 'text-neutral-900'}`}>
                    {item.name}
                  </h3>
                  <span className="text-[10px] text-neutral-400">{item.colorName}</span>
                </div>

                <div className="shrink-0 text-neutral-400">
                  {isChecked ? (
                    <CheckSquare className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
