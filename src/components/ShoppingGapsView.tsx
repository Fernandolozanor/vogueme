import React, { useState, useMemo } from 'react';
import { 
  ExternalLink, 
  Plus, 
  Check, 
  Sparkles, 
  Layers, 
  Trash2,
  Store,
  Ruler,
  Smile,
  Palette,
  Shirt,
  Scissors
} from 'lucide-react';
import type { ClothingItem, UserProfile } from '../types';
import { POPULAR_STORES } from '../data/initialData';
import { saveProfile } from '../services/storage';
import { generateSmartShoppingGaps } from '../services/shoppingGapsRecommender';

interface ShoppingGapsViewProps {
  profile: UserProfile;
  wardrobe: ClothingItem[];
  onProfileUpdate: (updated: UserProfile) => void;
}

export const ShoppingGapsView: React.FC<ShoppingGapsViewProps> = ({ 
  profile, 
  wardrobe, 
  onProfileUpdate 
}) => {
  const [favoriteStores, setFavoriteStores] = useState<string[]>(
    profile.favoriteStores || ['Zara', 'Stradivarius', 'Mango']
  );
  const [customStores, setCustomStores] = useState<string[]>(profile.customStores || []);
  const [newStoreName, setNewStoreName] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  const smartGaps = useMemo(() => {
    return generateSmartShoppingGaps(wardrobe, profile);
  }, [wardrobe, profile]);

  const toggleStoreFavorite = (storeName: string) => {
    const updated = favoriteStores.includes(storeName)
      ? favoriteStores.filter(s => s !== storeName)
      : [...favoriteStores, storeName];

    setFavoriteStores(updated);
    const updatedProfile = { ...profile, favoriteStores: updated };
    saveProfile(updatedProfile);
    onProfileUpdate(updatedProfile);
  };

  const handleAddCustomStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;

    const trimmed = newStoreName.trim();
    if (!customStores.includes(trimmed)) {
      const updatedCustom = [...customStores, trimmed];
      const updatedFavs = [...favoriteStores, trimmed];
      setCustomStores(updatedCustom);
      setFavoriteStores(updatedFavs);

      const updatedProfile = { 
        ...profile, 
        customStores: updatedCustom, 
        favoriteStores: updatedFavs 
      };
      saveProfile(updatedProfile);
      onProfileUpdate(updatedProfile);
    }
    setNewStoreName('');
  };

  const handleRemoveCustomStore = (storeName: string) => {
    const updatedCustom = customStores.filter(s => s !== storeName);
    const updatedFavs = favoriteStores.filter(s => s !== storeName);
    setCustomStores(updatedCustom);
    setFavoriteStores(updatedFavs);

    const updatedProfile = { 
        ...profile, 
        customStores: updatedCustom, 
        favoriteStores: updatedFavs 
    };
    saveProfile(updatedProfile);
    onProfileUpdate(updatedProfile);
  };

  const filteredGaps = smartGaps.filter(gap => {
    return selectedCategoryFilter === 'all' || gap.category === selectedCategoryFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E8E2D6] pb-5">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-rose-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Smart Shopping & Wardrobe Gaps
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight mt-1">
            Huecos en el <span className="italic font-normal text-neutral-600">Armario</span>
          </h1>
          <p className="text-sm text-neutral-600 mt-1 max-w-2xl">
            Recomendaciones hiperpersonalizadas que detectan las piezas que realmente te faltan, calibradas con tu morfología corporal y tu análisis de visagismo facial.
          </p>
        </div>
      </div>

      {/* Triple Personalization Engine Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pilar 1: Armario Real */}
        <div className="bg-white/90 border border-[#E5DFD5] rounded-2xl p-4 shadow-2xs flex items-start gap-3">
          <span className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
            <Shirt className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
              1. Prendas Faltantes
            </span>
            <h4 className="text-xs font-bold text-neutral-900 truncate">
              {wardrobe.length} prendas registradas
            </h4>
            <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
              Prioriza huecos clave para maximizar outfits combinando con lo que ya tienes.
            </p>
          </div>
        </div>

        {/* Pilar 2: Medidas y Morfología */}
        <div className="bg-white/90 border border-[#E5DFD5] rounded-2xl p-4 shadow-2xs flex items-start gap-3">
          <span className="w-9 h-9 rounded-xl bg-rose-50 text-rose-900 flex items-center justify-center shrink-0">
            <Ruler className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
              2. Tus Medidas & Silueta
            </span>
            <h4 className="text-xs font-bold text-neutral-900 capitalize truncate">
              Silueta {(profile.bodyShape || 'reloj_de_arena').replace('_', ' ')} • {profile.heightCm || 167} cm
            </h4>
            <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
              Cortes, tiros y largos adaptados a tus {profile.waistCm || 65}cm de cintura y {profile.hipsCm || 94}cm de cadera.
            </p>
          </div>
        </div>

        {/* Pilar 3: Análisis Facial y Visagismo */}
        <div className="bg-white/90 border border-[#E5DFD5] rounded-2xl p-4 shadow-2xs flex items-start gap-3">
          <span className="w-9 h-9 rounded-xl bg-purple-50 text-purple-900 flex items-center justify-center shrink-0">
            <Smile className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
              3. Análisis Facial & Visagismo
            </span>
            <h4 className="text-xs font-bold text-neutral-900 capitalize truncate">
              Rostro {profile.faceShape || 'ovalada'} • {profile.colorSeason || 'Otoño Suave'}
            </h4>
            <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
              Escotes, solapas, accesorios y metales calibrados con tus facciones y tono de piel.
            </p>
          </div>
        </div>
      </div>

      {/* Stores Selection Section */}
      <div className="bg-white/80 border border-[#E5DFD5] rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
          <div>
            <h2 className="font-serif text-xl font-bold text-neutral-900 flex items-center gap-2">
              <Store className="w-5 h-5 text-neutral-700" />
              Tus Tiendas de Moda Habituales
            </h2>
            <p className="text-xs text-neutral-500">
              Marca las tiendas que sueles usar para personalizar los enlaces de compra directa.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-[#F5F1EA] text-neutral-800 rounded-full border border-[#E8E2D6]">
            {favoriteStores.length} tiendas activas
          </span>
        </div>

        {/* Store Chips Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {POPULAR_STORES.map((store) => {
            const isFav = favoriteStores.includes(store.name);
            return (
              <button
                key={store.id}
                onClick={() => toggleStoreFavorite(store.name)}
                className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  isFav
                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                    : 'bg-[#FAF8F5] text-neutral-700 border-neutral-200 hover:bg-[#EFEAE0]'
                }`}
              >
                <div>
                  <span className="text-xs font-bold block">{store.name}</span>
                  <span className={`text-[10px] ${isFav ? 'text-neutral-300' : 'text-neutral-400'}`}>
                    {store.badge}
                  </span>
                </div>
                {isFav && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
              </button>
            );
          })}

          {/* User's custom stores */}
          {customStores.map((store) => {
            const isFav = favoriteStores.includes(store);
            return (
              <div
                key={store}
                className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                  isFav
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-[#FAF8F5] text-neutral-700 border-neutral-200'
                }`}
              >
                <button
                  onClick={() => toggleStoreFavorite(store)}
                  className="flex-1 cursor-pointer text-left"
                >
                  <span className="text-xs font-bold block">{store}</span>
                  <span className="text-[10px] text-neutral-400">Personalizada</span>
                </button>
                <button
                  onClick={() => handleRemoveCustomStore(store)}
                  className="text-neutral-400 hover:text-rose-400 p-1 cursor-pointer"
                  title="Eliminar tienda"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Add custom store input */}
        <form onSubmit={handleAddCustomStore} className="flex gap-2 max-w-md pt-2">
          <input
            type="text"
            value={newStoreName}
            onChange={(e) => setNewStoreName(e.target.value)}
            placeholder="Añadir otra tienda (ej. Subdued, Pull&Bear, COS...)"
            className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-[#FAF8F5] focus:outline-none focus:ring-1 focus:ring-neutral-800"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir</span>
          </button>
        </form>
      </div>

      {/* Recommended Gaps Grid */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl font-bold text-neutral-900">
              Piezas Faltantes Recomendadas para Ti
            </h2>
            <p className="text-xs text-neutral-500">
              Personalizadas según tu paleta <strong className="text-neutral-700">{profile.colorSeason}</strong>, tu silueta y tus medidas exactas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-neutral-400 font-medium mr-1">Filtrar:</span>
            {[
              { id: 'all', label: 'Todas' },
              { id: 'top', label: 'Tops' },
              { id: 'bottom', label: 'Pantalones & Faldas' },
              { id: 'outerwear', label: 'Chaquetas' },
              { id: 'shoes', label: 'Calzado' },
              { id: 'accessory', label: 'Accesorios' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryFilter(cat.id)}
                className={`text-xs px-3 py-1.5 rounded-full cursor-pointer font-medium transition-all ${
                  selectedCategoryFilter === cat.id
                    ? 'bg-neutral-900 text-white shadow-2xs'
                    : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredGaps.map((gap) => (
            <div
              key={gap.id}
              className="bg-white rounded-3xl border border-neutral-200/90 p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3.5">
                {/* Header card: Store badge, unlocked count and price */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 bg-neutral-900 text-white rounded-md">
                      {gap.store}
                    </span>
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      +{gap.unlockedOutfitsCount} outfits nuevos
                    </span>
                  </div>

                  <span className="text-xs font-bold text-neutral-900 font-mono">
                    {gap.estimatedPrice}
                  </span>
                </div>

                {/* Title */}
                <div>
                  <h3 className="font-serif text-lg font-bold text-neutral-900 leading-snug">
                    {gap.title}
                  </h3>
                  {gap.necklineOrCut && (
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-rose-900 bg-rose-50 border border-rose-200/60 rounded-md px-2 py-0.5 mt-1">
                      <Scissors className="w-3 h-3" />
                      {gap.necklineOrCut}
                    </span>
                  )}
                </div>

                {/* 1. Motivo del Armario */}
                <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#EFE9DF] space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-amber-800">
                    <Shirt className="w-3 h-3" />
                    <span>Hueco en tu Armario:</span>
                  </div>
                  <p className="text-xs text-neutral-700 leading-relaxed">
                    {gap.whyNeeded}
                  </p>
                  {gap.compatibleGarmentNames && gap.compatibleGarmentNames.length > 0 && (
                    <div className="pt-1 text-[10.5px] text-neutral-500 flex flex-wrap items-center gap-1">
                      <span className="font-semibold text-neutral-600">Combina directo con:</span>
                      {gap.compatibleGarmentNames.map((name, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-white rounded border border-neutral-200 font-medium text-neutral-800">
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Motivo de Medidas y Morfología */}
                {gap.morphologyReason && (
                  <div className="bg-rose-50/40 p-3 rounded-2xl border border-rose-100/80 space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-rose-900">
                      <Ruler className="w-3 h-3" />
                      <span>Favorece tus Medidas & Silueta:</span>
                    </div>
                    <p className="text-xs text-neutral-700 leading-relaxed">
                      {gap.morphologyReason}
                    </p>
                  </div>
                )}

                {/* 3. Motivo de Análisis Facial & Visagismo */}
                {gap.facialAnalysisReason && (
                  <div className="bg-purple-50/40 p-3 rounded-2xl border border-purple-100/80 space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-purple-900">
                      <Smile className="w-3 h-3" />
                      <span>Visagismo Facial ({profile.faceShape || 'ovalada'}):</span>
                    </div>
                    <p className="text-xs text-neutral-700 leading-relaxed">
                      {gap.facialAnalysisReason}
                    </p>
                  </div>
                )}

                {/* Color Suggestion & Tags */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-neutral-600 pt-1">
                  <div className="flex items-center gap-1.5">
                    {gap.colorHex && (
                      <span 
                        className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs inline-block shrink-0" 
                        style={{ backgroundColor: gap.colorHex }}
                      />
                    )}
                    <span>Color recomendado: <strong>{gap.colorSuggestion}</strong></span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {gap.tags.map((t: string) => (
                      <span key={t} className="text-[10px] text-neutral-400">#{t}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button: Direct store search */}
              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                  <Palette className="w-3 h-3 text-rose-900" />
                  Paleta {profile.colorSeason}
                </span>
                <a
                  href={gap.searchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FAF6F0] hover:bg-neutral-900 hover:text-white border border-[#E5DFD4] text-xs font-semibold text-neutral-900 transition-colors cursor-pointer shadow-2xs"
                >
                  <span>Buscar en {gap.store}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
