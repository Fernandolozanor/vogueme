import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, 
  Upload, 
  Trash2, 
  Heart, 
  Sparkles, 
  X, 
  ShieldCheck,
  RotateCcw,
  Shirt,
  Image as ImageIcon,
  ZoomIn,
  Wand2,
  Sliders,
  Pencil
} from 'lucide-react';
import type { ClothingItem, Category, StyleTag, Season } from '../types';
import { INITIAL_CLOTHES } from '../data/initialData';
import { processGarmentImage, applyCustomCutout } from '../services/imageProcessing';
import { 
  addClothingItem, 
  updateClothingItem,
  deleteClothingItem, 
  toggleFavoriteItem,
  removeSampleClothes,
  restoreSampleClothes
} from '../services/storage';
import { GarmentDetailModal } from './GarmentDetailModal';

interface ClosetViewProps {
  wardrobe: ClothingItem[];
  onWardrobeChange: (newWardrobe: ClothingItem[]) => void;
}

const CATEGORIES: { id: Category | 'all'; label: string }[] = [
  { id: 'all', label: 'Todo' },
  { id: 'top', label: 'Tops & Camisas' },
  { id: 'bottom', label: 'Pantalones & Faldas' },
  { id: 'dress', label: 'Vestidos' },
  { id: 'outerwear', label: 'Chaquetas & Abrigos' },
  { id: 'shoes', label: 'Calzado' },
  { id: 'accessory', label: 'Accesorios' }
];

const STYLE_OPTIONS: StyleTag[] = [
  'clean girl', 'chic', 'old money', 'casual', 'streetwear', 'fiesta', 'coquette', 'elegante', 'comfy'
];

const GARMENT_COLORS_PALETTE = [
  { name: 'Blanco roto / Crudo', hex: '#F6F5F2' },
  { name: 'Negro azabache', hex: '#1A1A1A' },
  { name: 'Beige arena / Camel', hex: '#D8C7B5' },
  { name: 'Marrón chocolate', hex: '#4A2E1B' },
  { name: 'Gris melange', hex: '#9E9E9E' },
  { name: 'Azul denim / Marino', hex: '#2A4365' },
  { name: 'Azul cielo / Pastel', hex: '#B8D4E3' },
  { name: 'Verde oliva / Salvia', hex: '#708238' },
  { name: 'Terracota / Teja', hex: '#C3684B' },
  { name: 'Burdeos / Cereza', hex: '#801323' },
  { name: 'Rosa empolvado', hex: '#E8B4B8' },
  { name: 'Mostaza / Dorado', hex: '#C5A059' },
  { name: 'Lila / Lavanda', hex: '#BDB0D0' }
];

export const ClosetView: React.FC<ClosetViewProps> = ({ wardrobe, onWardrobeChange }) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState<ClothingItem | null>(null);

  // Edit / Add Item Modal Form States
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReProcessing, setIsReProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [cutoutImage, setCutoutImage] = useState<string | null>(null);
  const [whiteStudioImage, setWhiteStudioImage] = useState<string | null>(null);
  const [activeBackgroundMode, setActiveBackgroundMode] = useState<'transparent' | 'white' | 'original'>('transparent');
  const [cutoutSensitivity, setCutoutSensitivity] = useState<number>(48);
  const [isMagicWandActive, setIsMagicWandActive] = useState<boolean>(false);
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState<Category>('top');
  const [itemSubCategory, setItemSubCategory] = useState<string>('');
  const [itemColorName, setItemColorName] = useState('Blanco roto');
  const [itemColorHex, setItemColorHex] = useState('#F6F5F2');
  const [itemBrand, setItemBrand] = useState('Zara');
  const [itemPrice, setItemPrice] = useState<string>('29.99');
  const [itemWearCount, setItemWearCount] = useState<number>(0);
  const [itemSeasons, setItemSeasons] = useState<Season[]>(['todas']);
  const [itemStyles, setItemStyles] = useState<StyleTag[]>(['casual', 'chic']);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleItemSeason = (season: Season) => {
    if (season === 'todas') {
      setItemSeasons(['todas']);
      return;
    }
    const withoutAll = itemSeasons.filter(s => s !== 'todas');
    const exists = withoutAll.includes(season);
    const updated = exists ? withoutAll.filter(s => s !== season) : [...withoutAll, season];
    setItemSeasons(updated.length === 0 ? ['todas'] : updated);
  };

  const toggleItemStyle = (style: StyleTag) => {
    const exists = itemStyles.includes(style);
    const updated = exists ? itemStyles.filter(s => s !== style) : [...itemStyles, style];
    setItemStyles(updated.length === 0 ? ['casual'] : updated);
  };

  const handleStartAdd = () => {
    setEditingItem(null);
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleStartEdit = (item: ClothingItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemCategory(item.category);
    setItemSubCategory(item.subCategory || '');
    setItemColorName(item.colorName);
    setItemColorHex(item.colorHex);
    setItemBrand(item.brand || 'Básico');
    setItemPrice(item.purchasePrice !== undefined ? item.purchasePrice.toString() : '');
    setItemWearCount(item.wearCount || 0);
    setItemSeasons(item.seasons && item.seasons.length > 0 ? item.seasons : ['todas']);
    setItemStyles(item.styles && item.styles.length > 0 ? item.styles : ['casual', 'chic']);
    setPreviewImage(item.imageUrl);
    setOriginalImage(null);
    setCutoutImage(item.imageUrl);
    setWhiteStudioImage(null);
    setActiveBackgroundMode('transparent');
    setCutoutSensitivity(48);
    setIsMagicWandActive(false);
    setIsAddModalOpen(true);
  };

  // Filtering
  const filteredClothes = wardrobe.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesStyle = selectedStyle === 'all' || item.styles.includes(selectedStyle as StyleTag);
    return matchesCat && matchesStyle;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const result = await processGarmentImage(file, true, cutoutSensitivity);
      setOriginalImage(result.originalDataUrl);
      setCutoutImage(result.dataUrl);
      setWhiteStudioImage(result.whiteStudioDataUrl);

      if (result.hasCutout) {
        setActiveBackgroundMode('transparent');
        setPreviewImage(result.dataUrl);
      } else {
        // Si la foto no tenía fondo separable claro, ofrecemos el modo estudio blanco por defecto
        setActiveBackgroundMode('white');
        setPreviewImage(result.whiteStudioDataUrl || result.originalDataUrl);
      }

      setItemColorHex(result.dominantColorHex);
      setItemColorName(result.dominantColorName);
      setItemCategory(result.suggestedCategory);
      if (!itemName) {
        setItemName(`${result.suggestedCategory.charAt(0).toUpperCase() + result.suggestedCategory.slice(1)} ${result.dominantColorName}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSwitchBackgroundMode = (mode: 'transparent' | 'white' | 'original') => {
    setActiveBackgroundMode(mode);
    if (mode === 'transparent' && cutoutImage) {
      setPreviewImage(cutoutImage);
    } else if (mode === 'white' && whiteStudioImage) {
      setPreviewImage(whiteStudioImage);
    } else if (mode === 'original' && originalImage) {
      setPreviewImage(originalImage);
    }
  };

  const handleSensitivityChange = async (newSens: number) => {
    if (!originalImage) return;
    setCutoutSensitivity(newSens);
    setIsReProcessing(true);
    try {
      const res = await applyCustomCutout(originalImage, { sensitivity: newSens });
      setCutoutImage(res.cutoutDataUrl);
      setWhiteStudioImage(res.whiteStudioDataUrl);
      if (activeBackgroundMode === 'transparent') {
        setPreviewImage(res.cutoutDataUrl);
      } else if (activeBackgroundMode === 'white') {
        setPreviewImage(res.whiteStudioDataUrl);
      }
    } catch (err) {
      console.error('Error al recalcular recorte:', err);
    } finally {
      setIsReProcessing(false);
    }
  };

  const handlePreviewClick = async (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isMagicWandActive || !originalImage) return;
    const imgEl = e.currentTarget;
    const rect = imgEl.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    const naturalWidth = imgEl.naturalWidth || 800;
    const naturalHeight = imgEl.naturalHeight || 800;
    const clickPoint = { x: relX * naturalWidth, y: relY * naturalHeight };

    setIsReProcessing(true);
    try {
      const res = await applyCustomCutout(originalImage, { sensitivity: cutoutSensitivity, clickPoint });
      setCutoutImage(res.cutoutDataUrl);
      setWhiteStudioImage(res.whiteStudioDataUrl);
      if (activeBackgroundMode === 'transparent') {
        setPreviewImage(res.cutoutDataUrl);
      } else if (activeBackgroundMode === 'white') {
        setPreviewImage(res.whiteStudioDataUrl);
      }
    } catch (err) {
      console.error('Error al eliminar fondo por punto:', err);
    } finally {
      setIsReProcessing(false);
    }
  };

  const handleSaveItem = () => {
    if (!previewImage) return;

    if (editingItem) {
      const updatedItem: ClothingItem = {
        ...editingItem,
        name: itemName.trim() || `${itemCategory} ${itemColorName}`,
        category: itemCategory,
        subCategory: itemSubCategory.trim() || undefined,
        colorName: itemColorName,
        colorHex: itemColorHex,
        brand: itemBrand.trim() || 'Básico',
        purchasePrice: itemPrice ? parseFloat(itemPrice) : undefined,
        wearCount: Math.max(0, parseInt(itemWearCount.toString()) || 0),
        seasons: itemSeasons.length > 0 ? itemSeasons : ['todas'],
        styles: itemStyles.length > 0 ? itemStyles : ['casual'],
        imageUrl: previewImage || editingItem.imageUrl
      };

      const updated = updateClothingItem(updatedItem);
      onWardrobeChange(updated);
      setIsAddModalOpen(false);
      resetForm();
      return;
    }

    const newItem: ClothingItem = {
      id: 'custom-' + Date.now(),
      name: itemName.trim() || `${itemCategory} ${itemColorName}`,
      category: itemCategory,
      subCategory: itemSubCategory.trim() || undefined,
      colorName: itemColorName,
      colorHex: itemColorHex,
      brand: itemBrand.trim() || 'Básico',
      purchasePrice: itemPrice ? parseFloat(itemPrice) : undefined,
      seasons: itemSeasons.length > 0 ? itemSeasons : ['todas'],
      styles: itemStyles.length > 0 ? itemStyles : ['casual', 'chic'],
      imageUrl: previewImage,
      wearCount: Math.max(0, parseInt(itemWearCount.toString()) || 0),
      dateAdded: new Date().toISOString().split('T')[0],
      isFavorite: false
    };

    const updated = addClothingItem(newItem);
    onWardrobeChange(updated);
    setIsAddModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingItem(null);
    setPreviewImage(null);
    setOriginalImage(null);
    setCutoutImage(null);
    setWhiteStudioImage(null);
    setActiveBackgroundMode('transparent');
    setCutoutSensitivity(48);
    setIsMagicWandActive(false);
    setItemName('');
    setItemCategory('top');
    setItemSubCategory('');
    setItemColorName('Blanco roto');
    setItemColorHex('#F6F5F2');
    setItemBrand('Zara');
    setItemPrice('29.99');
    setItemWearCount(0);
    setItemSeasons(['todas']);
    setItemStyles(['casual', 'chic']);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar esta prenda de tu armario?')) {
      const updated = deleteClothingItem(id);
      onWardrobeChange(updated);
    }
  };

  const handleToggleFavorite = (id: string) => {
    const updated = toggleFavoriteItem(id);
    onWardrobeChange(updated);
  };

  // Sample clothes detection
  const sampleIds = new Set(INITIAL_CLOTHES.map(c => c.id));
  const sampleClothesCount = wardrobe.filter(item => sampleIds.has(item.id)).length;
  const hasSampleClothes = sampleClothesCount > 0;

  const handleRemoveSampleClothes = () => {
    if (confirm(`¿Eliminar las ${sampleClothesCount} prendas de ejemplo? Si tienes prendas añadidas por ti, se mantendrán intactas.`)) {
      const updated = removeSampleClothes();
      onWardrobeChange(updated);
    }
  };

  const handleRestoreSampleClothes = () => {
    const updated = restoreSampleClothes();
    onWardrobeChange(updated);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E8E2D6] pb-5">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-neutral-400">Digital Archive</span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight mt-1">
            Tu Armario <span className="italic font-normal text-neutral-600">Digital</span>
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            {wardrobe.length} prendas digitalizadas • 100% privadas en tu dispositivo
          </p>
        </div>

        {/* Action Buttons: Sample clothes toggle & Add item */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {hasSampleClothes ? (
            <button
              onClick={handleRemoveSampleClothes}
              className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl border border-neutral-300 bg-white hover:bg-rose-50 hover:border-rose-200 text-neutral-700 hover:text-rose-900 font-medium text-xs sm:text-sm transition-all shadow-2xs cursor-pointer active:scale-98"
              title="Eliminar las prendas de ejemplo para quedarte solo con las tuyas"
            >
              <Trash2 className="w-3.5 h-3.5 text-neutral-400" />
              <span>Borrar prendas de ejemplo ({sampleClothesCount})</span>
            </button>
          ) : (
            <button
              onClick={handleRestoreSampleClothes}
              className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl border border-[#D6CDBC] bg-[#E8E1D3] hover:bg-[#DDD5C5] text-neutral-900 font-medium text-xs sm:text-sm transition-all shadow-2xs cursor-pointer active:scale-98"
              title="Restaurar el catálogo de 15 prendas de ejemplo para probar looks"
            >
              <RotateCcw className="w-3.5 h-3.5 text-neutral-800" />
              <span>Recuperar prendas de ejemplo</span>
            </button>
          )}

          <button
            onClick={handleStartAdd}
            className="inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-2xl bg-neutral-900 text-white font-medium text-xs sm:text-sm hover:bg-neutral-800 transition-all shadow-md cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Digitalizar Prenda (Foto)</span>
          </button>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`text-xs px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all cursor-pointer ${
                isSelected
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-white text-neutral-700 hover:bg-[#EAE4D8] border border-neutral-200'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Style Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap text-xs text-neutral-500">
        <span className="font-semibold uppercase tracking-wider text-[10px]">Filtrar por vibe:</span>
        <button
          onClick={() => setSelectedStyle('all')}
          className={`px-2.5 py-1 rounded-lg cursor-pointer ${
            selectedStyle === 'all' ? 'bg-[#ECE5D8] text-neutral-900 font-bold' : 'hover:text-neutral-900'
          }`}
        >
          Todos
        </button>
        {STYLE_OPTIONS.map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStyle(st)}
            className={`px-2.5 py-1 rounded-lg capitalize cursor-pointer ${
              selectedStyle === st ? 'bg-[#ECE5D8] text-neutral-900 font-bold' : 'hover:text-neutral-900'
            }`}
          >
            #{st}
          </button>
        ))}
      </div>

      {/* Wardrobe Items Grid */}
      {filteredClothes.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredClothes.map((item) => {
            const costPerWear = item.purchasePrice && item.wearCount > 0
              ? (item.purchasePrice / item.wearCount).toFixed(2)
              : null;

            return (
              <div 
                key={item.id}
                className="group bg-white rounded-2xl border border-neutral-200/80 p-3 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div 
                  onClick={() => setSelectedDetailItem(item)}
                  className="group/photo relative aspect-square rounded-xl overflow-hidden bg-[#F7F5F0] flex items-center justify-center p-2 mb-2 cursor-pointer"
                  title="Toca para ver la foto ampliada y detalles"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-contain group-hover/photo:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />

                  {/* Icono discreto de zoom en hover */}
                  <span className="absolute bottom-2 right-2 p-1 rounded-md bg-black/40 text-white opacity-0 group-hover/photo:opacity-100 transition-opacity">
                    <ZoomIn className="w-3 h-3" />
                  </span>

                  {/* Favorite Heart */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(item.id);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 backdrop-blur-xs text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer z-10"
                  >
                    <Heart className={`w-3.5 h-3.5 ${item.isFavorite ? 'text-rose-600 fill-rose-600' : ''}`} />
                  </button>

                  {/* Color dot */}
                  <div 
                    className="absolute bottom-2 left-2 w-3.5 h-3.5 rounded-full border border-white shadow-2xs"
                    style={{ backgroundColor: item.colorHex }}
                    title={item.colorName}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 font-medium">
                    <span>{item.brand || 'Básico'}</span>
                    <span>{item.wearCount} {item.wearCount === 1 ? 'puesta' : 'puestas'}</span>
                  </div>

                  <h3 className="font-medium text-xs text-neutral-900 line-clamp-1 group-hover:text-neutral-600 transition-colors">
                    {item.name}
                  </h3>

                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {costPerWear ? `${costPerWear}€ / puesta` : 'Sin estrenar'}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(item);
                        }}
                        className="text-neutral-400 hover:text-neutral-900 transition-colors p-1.5 cursor-pointer rounded-lg hover:bg-neutral-100"
                        title="Editar prenda"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                        className="text-neutral-300 hover:text-rose-700 transition-colors p-1.5 cursor-pointer rounded-lg hover:bg-rose-50"
                        title="Eliminar prenda"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-[#E5DFD5] rounded-3xl p-10 sm:p-12 text-center space-y-4">
          <Shirt className="w-10 h-10 text-neutral-300 mx-auto" />
          <h3 className="font-serif text-lg sm:text-xl font-bold text-neutral-800">
            {wardrobe.length === 0 ? 'Tu armario está vacío' : 'No hay prendas en esta categoría'}
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
            {wardrobe.length === 0 
              ? 'Puedes digitalizar tus propias prendas subiendo fotos o recuperar las prendas de ejemplo para probar outfits de inmediato.'
              : 'Prueba a cambiar el filtro de categoría o vibe para ver más prendas.'}
          </p>
          {wardrobe.length === 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <button
                onClick={handleRestoreSampleClothes}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D6CDBC] bg-[#E8E1D3] hover:bg-[#DDD5C5] text-neutral-900 text-xs font-semibold cursor-pointer transition-all shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Recuperar prendas de ejemplo</span>
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold cursor-pointer transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Digitalizar Mi Prenda</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal: Digitalizar Prenda con IA Local */}
      {isAddModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] overflow-y-auto bg-black/65 backdrop-blur-md p-3 sm:p-6 flex min-h-screen items-center justify-center animate-in fade-in duration-200">
          <div 
            className="bg-[#FAF8F5] border border-[#E2DBD0] rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative my-auto max-h-[85vh] flex flex-col z-[100000] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Header (Always Visible) */}
            <div className="flex items-start justify-between border-b border-neutral-200 pb-3 mb-3 shrink-0">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  100% On-Device Processing
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-neutral-900 mt-0.5">
                  {editingItem ? 'Editar Prenda' : 'Digitalizar Prenda'}
                </h2>
                <p className="text-[11px] sm:text-xs text-neutral-500">
                  {editingItem 
                    ? 'Modifica los datos, nombre, categoría, color, puestas o foto de tu prenda.' 
                    : 'Sube la foto de tu ropa. La IA recortará el fondo y extraerá su color en tu propio dispositivo.'}
                </p>
              </div>

              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingItem(null);
                }}
                className="text-neutral-400 hover:text-neutral-800 p-1.5 rounded-full hover:bg-neutral-200/50 transition-colors cursor-pointer shrink-0 ml-2"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="space-y-4 overflow-y-auto pr-1 flex-1">
              {/* Image Upload Area */}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {previewImage ? (
                  <div className="space-y-2.5">
                    {/* Selector de modo: Transparente vs Estudio Blanco vs Foto Original */}
                    {originalImage && (
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-1.5 pb-0.5">
                          <div className="flex items-center gap-1 p-1 bg-[#E8E1D3] rounded-xl border border-[#D6CDBC]">
                            <button
                              type="button"
                              onClick={() => handleSwitchBackgroundMode('transparent')}
                              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
                                activeBackgroundMode === 'transparent'
                                  ? 'bg-neutral-900 text-white font-semibold shadow-xs'
                                  : 'text-[#5C5346] hover:text-neutral-900'
                              }`}
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                              <span>✨ Transparente</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSwitchBackgroundMode('white')}
                              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
                                activeBackgroundMode === 'white'
                                  ? 'bg-neutral-900 text-white font-semibold shadow-xs'
                                  : 'text-[#5C5346] hover:text-neutral-900'
                              }`}
                            >
                              <span className="w-3 h-3 rounded-full bg-white border border-neutral-300 inline-block shadow-2xs" />
                              <span>⚪ Estudio Blanco</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSwitchBackgroundMode('original')}
                              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
                                activeBackgroundMode === 'original'
                                  ? 'bg-neutral-900 text-white font-semibold shadow-xs'
                                  : 'text-[#5C5346] hover:text-neutral-900'
                              }`}
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>Original</span>
                            </button>
                          </div>

                          {/* Botón Varita Mágica para borrar fondos difíciles */}
                          {activeBackgroundMode !== 'original' && (
                            <button
                              type="button"
                              onClick={() => setIsMagicWandActive(!isMagicWandActive)}
                              className={`px-2.5 py-1 text-[11px] rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                                isMagicWandActive
                                  ? 'bg-rose-900 text-white border-rose-950 shadow-xs ring-2 ring-rose-300 font-semibold'
                                  : 'bg-white/80 hover:bg-white text-neutral-700 border-neutral-300'
                              }`}
                              title="Toca cualquier zona para borrar ese color de fondo"
                            >
                              <Wand2 className="w-3.5 h-3.5" />
                              <span>{isMagicWandActive ? 'Toca la foto para borrar' : 'Varita de fondo'}</span>
                            </button>
                          )}
                        </div>

                        {/* Ajuste fino de tolerancia/sensibilidad del recorte */}
                        {activeBackgroundMode !== 'original' && (
                          <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-[#FAF8F5] rounded-xl border border-[#E8E1D3] text-[11px]">
                            <div className="flex items-center gap-1.5 text-neutral-600 font-medium">
                              <Sliders className="w-3 h-3 text-neutral-500" />
                              <span>Intensidad recorte:</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {[
                                { label: 'Suave', value: 34 },
                                { label: 'Media', value: 48 },
                                { label: 'Fuerte', value: 68 }
                              ].map((lvl) => (
                                <button
                                  key={lvl.value}
                                  type="button"
                                  onClick={() => handleSensitivityChange(lvl.value)}
                                  className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                                    cutoutSensitivity === lvl.value
                                      ? 'bg-neutral-900 text-white shadow-2xs font-semibold'
                                      : 'bg-neutral-200/60 hover:bg-neutral-200 text-neutral-700'
                                  }`}
                                >
                                  {lvl.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {isMagicWandActive && (
                          <p className="text-[11px] text-rose-800 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl animate-pulse">
                            👉 Toca en la foto la zona que quieras eliminar (ej. percha, colcha o sombras).
                          </p>
                        )}
                      </div>
                    )}

                    {/* Indicador superior si está procesando una nueva foto */}
                    {isProcessing && (
                      <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-amber-950 text-xs shadow-2xs animate-pulse">
                        <Sparkles className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">Procesando nueva foto de la prenda...</p>
                          <p className="text-[10px] text-amber-700 truncate">Extrayendo silueta, aislando fondo y recalculando color en local</p>
                        </div>
                      </div>
                    )}

                    {/* Previsualizador con cuadrícula de transparencia real */}
                    <div 
                      className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-neutral-300 flex items-center justify-center select-none"
                      style={{
                        backgroundColor: activeBackgroundMode === 'white' ? '#FFFFFF' : '#FAF8F5',
                        backgroundImage: activeBackgroundMode === 'transparent' 
                          ? 'repeating-conic-gradient(#E5E2DA 0% 25%, #FAF8F5 0% 50%) 50% / 16px 16px' 
                          : 'none'
                      }}
                    >
                      <img 
                        src={previewImage} 
                        alt="Preview" 
                        onClick={handlePreviewClick}
                        className={`w-full h-full object-contain p-2 drop-shadow-xs transition-opacity ${
                          isProcessing ? 'opacity-25 blur-[1px]' : isReProcessing ? 'opacity-40' : 'opacity-100'
                        } ${isMagicWandActive ? 'cursor-crosshair' : ''}`} 
                      />

                      {/* Overlay cuando se procesa o recorta una nueva imagen desde "Cambiar foto" */}
                      {isProcessing && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-xs text-white p-4 text-center z-20">
                          <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center mb-2.5 shadow-xl">
                            <Sparkles className="w-6 h-6 text-amber-300 animate-spin" />
                          </div>
                          <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
                            Procesando en segundo plano
                          </span>
                          <p className="text-sm font-semibold text-white mt-0.5">
                            Aislando prenda & analizando color
                          </p>
                          <span className="text-[10.5px] text-neutral-300 mt-1 max-w-xs leading-tight">
                            Red neuronal en tu dispositivo • 100% privado en local
                          </span>
                        </div>
                      )}

                      {/* Overlay cuando se reajusta sensibilidad / varita */}
                      {isReProcessing && !isProcessing && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-2xs z-20 animate-in fade-in duration-150">
                          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900/95 text-white text-xs font-medium shadow-xl border border-white/10">
                            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                            <span>Ajustando silueta...</span>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing || isReProcessing}
                        className={`absolute bottom-3 right-3 px-3.5 py-2 text-xs rounded-xl shadow-md flex items-center gap-1.5 backdrop-blur-xs z-30 transition-all ${
                          isProcessing || isReProcessing
                            ? 'bg-neutral-800/85 text-neutral-300 cursor-not-allowed opacity-90'
                            : 'bg-neutral-900/90 text-white cursor-pointer hover:bg-neutral-900 active:scale-95'
                        }`}
                      >
                        {isProcessing ? (
                          <>
                            <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-300" />
                            <span>Procesando nueva foto...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>Cambiar foto</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-neutral-300 hover:border-neutral-800 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-colors bg-white/50"
                  >
                    {isProcessing ? (
                      <div className="space-y-2 py-4">
                        <Sparkles className="w-8 h-8 text-neutral-800 animate-spin mx-auto text-rose-900" />
                        <p className="text-xs font-semibold text-neutral-800">
                          Recortando silueta con IA neuronal en tu móvil...
                        </p>
                        <p className="text-[10px] text-neutral-400">
                          Extrayendo prenda y aislando fondo 100% en local
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 text-neutral-400 mx-auto" />
                        <p className="text-xs font-medium text-neutral-800">
                          Haz una foto o sube una imagen de tu prenda
                        </p>
                        <p className="text-[11px] text-neutral-400">
                          JPG, PNG o HEIC • Sin enviar datos a internet
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Garment Details Form */}
              {previewImage && (
                <div className="space-y-3 text-xs pb-1">
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">Nombre de la prenda</label>
                    <input
                      type="text"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder="Ej. Top canalé beige"
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white focus:outline-none focus:ring-1 focus:ring-neutral-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Categoría</label>
                      <select
                        value={itemCategory}
                        onChange={(e) => setItemCategory(e.target.value as Category)}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white focus:outline-none focus:ring-1 focus:ring-neutral-800 cursor-pointer font-medium"
                      >
                        <option value="top">Top / Camisa</option>
                        <option value="bottom">Pantalón / Falda</option>
                        <option value="dress">Vestido</option>
                        <option value="outerwear">Chaqueta / Blazer</option>
                        <option value="shoes">Calzado</option>
                        <option value="accessory">Accesorio / Bolso</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Subcategoría o Tipo</label>
                      <input
                        type="text"
                        value={itemSubCategory}
                        onChange={(e) => setItemSubCategory(e.target.value)}
                        placeholder="Ej. Blazers, Vaqueros, Tops..."
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white focus:outline-none focus:ring-1 focus:ring-neutral-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1 flex items-center justify-between">
                      <span>Color de la prenda</span>
                      <span className="text-[10px] text-neutral-400 font-normal">Toca el círculo para elegir</span>
                    </label>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neutral-300 bg-white shadow-2xs">
                      <label className="relative cursor-pointer flex items-center shrink-0" title="Toca para abrir paleta cromática">
                        <div 
                          className="w-5 h-5 rounded-full border border-black/20 shadow-2xs shrink-0 cursor-pointer hover:scale-110 transition-transform"
                          style={{ backgroundColor: itemColorHex }} 
                        />
                        <input
                          type="color"
                          value={itemColorHex}
                          onChange={(e) => setItemColorHex(e.target.value)}
                          className="sr-only"
                        />
                      </label>
                      <input
                        type="text"
                        value={itemColorName}
                        onChange={(e) => setItemColorName(e.target.value)}
                        placeholder="Nombre del color"
                        className="w-full text-xs font-medium text-neutral-800 bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Selector rápido de colores de moda */}
                  <div className="space-y-1.5 bg-[#FAF6F0] p-3 rounded-2xl border border-[#E8DFC9]">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-neutral-800">Cambiar a un color frecuente:</span>
                      <span className="text-[10px] text-neutral-500">O toca el círculo para elegir cualquier tono</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {GARMENT_COLORS_PALETTE.map((c) => {
                        const isSelected = itemColorHex.toLowerCase() === c.hex.toLowerCase();
                        return (
                          <button
                            type="button"
                            key={c.name}
                            onClick={() => {
                              setItemColorHex(c.hex);
                              setItemColorName(c.name);
                            }}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs font-semibold'
                                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-[#FAF8F5]'
                            }`}
                          >
                            <div
                              className="w-2.5 h-2.5 rounded-full border border-black/15 shrink-0"
                              style={{ backgroundColor: c.hex }}
                            />
                            <span className="truncate max-w-[85px]">{c.name.split(' ')[0]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Marca / Tienda</label>
                      <input
                        type="text"
                        value={itemBrand}
                        onChange={(e) => setItemBrand(e.target.value)}
                        placeholder="Zara, Mango..."
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white focus:outline-none focus:ring-1 focus:ring-neutral-800"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Precio aprox. (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={itemPrice}
                        onChange={(e) => setItemPrice(e.target.value)}
                        placeholder="29.99"
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white focus:outline-none focus:ring-1 focus:ring-neutral-800"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Puestas registradas</label>
                      <input
                        type="number"
                        min="0"
                        value={itemWearCount}
                        onChange={(e) => setItemWearCount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white focus:outline-none focus:ring-1 focus:ring-neutral-800"
                      />
                    </div>
                  </div>

                  {/* Estilos y Vibes de la prenda */}
                  <div className="space-y-1.5 pt-1">
                    <label className="block font-semibold text-neutral-700">Estilos & Vibes de la prenda</label>
                    <div className="flex flex-wrap gap-1.5">
                      {STYLE_OPTIONS.map((style) => {
                        const isSelected = itemStyles.includes(style);
                        return (
                          <button
                            type="button"
                            key={style}
                            onClick={() => toggleItemStyle(style)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs font-semibold'
                                : 'bg-white text-neutral-600 border-neutral-200 hover:bg-[#FAF8F5]'
                            }`}
                          >
                            #{style}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Temporadas recomendadas */}
                  <div className="space-y-1.5 pt-1">
                    <label className="block font-semibold text-neutral-700">Temporadas recomendadas</label>
                    <div className="flex flex-wrap gap-1.5">
                      {(['todas', 'primavera', 'verano', 'otono', 'invierno'] as Season[]).map((season) => {
                        const isSelected = itemSeasons.includes(season);
                        return (
                          <button
                            type="button"
                            key={season}
                            onClick={() => toggleItemSeason(season)}
                            className={`px-3 py-1 rounded-xl text-[11px] font-medium capitalize border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-rose-950 text-white border-rose-950 shadow-2xs font-semibold'
                                : 'bg-white text-neutral-600 border-neutral-200 hover:bg-[#FAF8F5]'
                            }`}
                          >
                            {season}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer / Action Button (Always Visible) */}
            {previewImage && (
              <div className="pt-3 border-t border-neutral-200 shrink-0">
                <button
                  onClick={handleSaveItem}
                  className="w-full py-2.5 sm:py-3 rounded-2xl bg-neutral-900 text-white font-medium text-xs sm:text-sm hover:bg-neutral-800 transition-colors cursor-pointer shadow-md"
                >
                  {editingItem ? 'Guardar Cambios en la Prenda ✅' : 'Añadir Prenda a Mi Armario ✨'}
                </button>
              </div>
            )}

          </div>
        </div>,
        document.body
      )}

      {/* Modal: Foto ampliada de la prenda */}
      <GarmentDetailModal
        item={selectedDetailItem}
        onClose={() => setSelectedDetailItem(null)}
        onToggleFavorite={handleToggleFavorite}
        onEdit={(item) => handleStartEdit(item)}
      />

    </div>
  );
};
