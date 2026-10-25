import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Heart, Pencil } from 'lucide-react';
import type { ClothingItem } from '../types';

interface GarmentDetailModalProps {
  item: ClothingItem | null;
  role?: string;
  onClose: () => void;
  onToggleFavorite?: (id: string) => void;
  onEdit?: (item: ClothingItem) => void;
}

export const GarmentDetailModal: React.FC<GarmentDetailModalProps> = ({
  item,
  role,
  onClose,
  onToggleFavorite,
  onEdit
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  const rawUrl = item.imageUrl || '';
  const cleanImageUrl = rawUrl.includes('photo-1521572267360-ee0c2909d518')
    ? 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=80'
    : rawUrl;

  const costPerWear = item.purchasePrice && item.wearCount > 0
    ? (item.purchasePrice / item.wearCount).toFixed(2)
    : null;

  return typeof document !== 'undefined' ? createPortal(
    <div 
      className="fixed inset-0 z-[99999] overflow-y-auto bg-black/75 backdrop-blur-md p-3 sm:p-6 flex min-h-screen items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-[#FAF8F5] border border-[#E5DFD5] rounded-3xl max-w-lg w-full shadow-2xl relative my-auto max-h-[92vh] flex flex-col z-[100000] animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#E8E1D5] shrink-0 bg-white/60">
          <div className="min-w-0 flex-1 pr-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-rose-900 tracking-wider">
                {role || item.category.toUpperCase()}
              </span>
              <span className="text-[10px] text-neutral-400">•</span>
              <span className="text-[10px] text-neutral-500 font-medium truncate">
                {item.subCategory || item.category}
              </span>
            </div>
            <h2 className="font-serif text-lg sm:text-xl font-bold text-neutral-900 truncate mt-0.5" title={item.name}>
              {item.name}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(item);
                }}
                className="px-3 py-1.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-900 hover:text-white text-neutral-800 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                title="Editar características de la prenda"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Editar</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-900 p-2 rounded-full hover:bg-neutral-200/50 transition-colors cursor-pointer shrink-0"
              title="Cerrar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Large Image & Detailed Specifications */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-4 flex-1">
          
          {/* Main Photo Enclosure */}
          <div className="relative w-full h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden bg-[#F4EFE8] border border-[#E8E1D5] flex items-center justify-center p-3 shadow-inner">
            <img
              src={cleanImageUrl}
              alt={item.name}
              className="max-h-full max-w-full object-contain drop-shadow-md select-none transition-transform duration-300 hover:scale-105"
            />

            {/* Favorite button */}
            {onToggleFavorite && (
              <button
                onClick={() => onToggleFavorite(item.id)}
                className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-xs text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer shadow-sm"
                title={item.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
              >
                <Heart className={`w-4 h-4 ${item.isFavorite ? 'text-rose-600 fill-rose-600' : ''}`} />
              </button>
            )}

            {/* Color Swatch Badge */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-sm border border-neutral-200/80 shadow-xs">
              <div
                className="w-4 h-4 rounded-full border border-black/15 shadow-2xs shrink-0"
                style={{ backgroundColor: item.colorHex }}
                title={item.colorHex}
              />
              <span className="text-xs font-semibold text-neutral-800">
                {item.colorName}
              </span>
            </div>

            {/* High Definition Zoom cue */}
            <span className="absolute bottom-3 right-3 text-[10px] text-neutral-400 font-medium px-2 py-1 rounded-lg bg-black/40 text-white backdrop-blur-xs hidden sm:inline">
              Vista Ampliada
            </span>
          </div>

          {/* Garment Metrics and Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="bg-white p-3 rounded-2xl border border-neutral-200 text-center">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">Tienda / Marca</span>
              <p className="text-xs font-bold text-neutral-900 truncate">{item.brand || 'Básico'}</p>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-neutral-200 text-center">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">Puestas</span>
              <p className="text-xs font-bold text-neutral-900">{item.wearCount} {item.wearCount === 1 ? 'vez' : 'veces'}</p>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-neutral-200 text-center">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">Precio</span>
              <p className="text-xs font-bold text-neutral-900">{item.purchasePrice ? `${item.purchasePrice}€` : 'S/D'}</p>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-neutral-200 text-center">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">Coste / Puesta</span>
              <p className="text-xs font-bold text-emerald-800">
                {costPerWear ? `${costPerWear}€` : 'Sin estrenar'}
              </p>
            </div>
          </div>

          {/* Style Tags and Seasons */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mr-1">Vibes:</span>
              {item.styles.map((st) => (
                <span
                  key={st}
                  className="px-2.5 py-1 rounded-lg bg-[#FAF5EE] text-neutral-800 border border-[#EAE0D0] text-[10px] font-medium"
                >
                  #{st}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mr-1">Estaciones:</span>
              {item.seasons.map((se) => (
                <span
                  key={se}
                  className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 text-[10px] capitalize font-medium"
                >
                  {se}
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-[#E8E1D5] bg-white/60 shrink-0 flex items-center justify-between gap-2">
          {onEdit ? (
            <button
              onClick={() => {
                onClose();
                onEdit(item);
              }}
              className="py-2.5 px-4 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-800 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Pencil className="w-3.5 h-3.5 text-rose-900" />
              <span>Editar Prenda</span>
            </button>
          ) : <div />}

          <button
            onClick={onClose}
            className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs text-center"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>,
    document.body
  ) : null;
};
