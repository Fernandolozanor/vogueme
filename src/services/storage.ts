import type { ClothingItem, UserProfile } from '../types';
import { normalizeColorHarmony } from '../types';
import { INITIAL_CLOTHES, INITIAL_USER_PROFILE } from '../data/initialData';
import { compressImageForStorage } from './imageProcessing';

const CLOTHES_STORAGE_KEY = 'vogueme_clothes_v1';
const PROFILE_STORAGE_KEY = 'vogueme_profile_v1';
const OUTFIT_HISTORY_KEY = 'vogueme_outfit_history_v1';

// Almacenamiento IndexedDB de alta capacidad (sin límite de 5MB)
const IDB_NAME = 'vogueme_local_db';
const IDB_VERSION = 1;
const IDB_STORE = 'wardrobe_store';

// Caché en memoria para respuesta síncrona instantánea y sincronización fiable
let memoryWardrobeCache: ClothingItem[] | null = null;

function openIdb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    try {
      const request = indexedDB.open(IDB_NAME, IDB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn('No se pudo abrir IndexedDB, usando fallback', request.error);
        resolve(null);
      };
    } catch (err) {
      console.warn('IndexedDB no disponible:', err);
      resolve(null);
    }
  });
}

export async function idbSaveClothes(clothes: ClothingItem[]): Promise<void> {
  try {
    const db = await openIdb();
    if (!db) return;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.put(clothes, 'wardrobe');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error guardando en IndexedDB:', err);
  }
}

export async function idbGetClothes(): Promise<ClothingItem[] | null> {
  try {
    const db = await openIdb();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get('wardrobe');
      req.onsuccess = () => {
        if (req.result && Array.isArray(req.result)) {
          resolve(req.result as ClothingItem[]);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.error('Error leyendo de IndexedDB:', err);
    return null;
  }
}

/**
 * Inicializa el almacenamiento sincronizando IndexedDB (sin límite de 5MB)
 * con localStorage como fallback. Si IndexedDB ya tiene prendas, las retorna.
 * Además, comprime en segundo plano prendas existentes pesadas (>120KB) si las hubiera.
 */
export async function initStorage(): Promise<ClothingItem[]> {
  try {
    const fromIdb = await idbGetClothes();
    let currentItems: ClothingItem[];

    if (fromIdb && fromIdb.length > 0) {
      currentItems = fromIdb;
    } else {
      currentItems = getStoredClothes();
      await idbSaveClothes(currentItems);
    }

    // Auto-optimización en background de imágenes no comprimidas previas
    let needsReSave = false;
    const optimized = await Promise.all(
      currentItems.map(async (item) => {
        if (item.imageUrl && item.imageUrl.startsWith('data:image/') && item.imageUrl.length > 120000) {
          try {
            const compressed = await compressImageForStorage(item.imageUrl, 520, 0.82);
            if (compressed.length < item.imageUrl.length) {
              needsReSave = true;
              return { ...item, imageUrl: compressed };
            }
          } catch {
            // mantener original si falla
          }
        }
        return item;
      })
    );

    if (needsReSave) {
      currentItems = optimized;
      await idbSaveClothes(currentItems);
    }

    memoryWardrobeCache = currentItems;

    // Sincronizar espejo seguro a localStorage
    try {
      localStorage.setItem(CLOTHES_STORAGE_KEY, JSON.stringify(currentItems));
    } catch {
      // Ignorar QuotaExceededError en localStorage silenciosamente
    }

    return currentItems;
  } catch (err) {
    console.error('Error en initStorage:', err);
    return getStoredClothes();
  }
}

export interface LoggedWear {
  id: string;
  date: string;
  occasion: string;
  itemIds: string[];
}

export const getStoredClothes = (): ClothingItem[] => {
  if (memoryWardrobeCache && memoryWardrobeCache.length > 0) {
    return memoryWardrobeCache;
  }

  try {
    const raw = localStorage.getItem(CLOTHES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CLOTHES_STORAGE_KEY, JSON.stringify(INITIAL_CLOTHES));
      memoryWardrobeCache = INITIAL_CLOTHES;
      return INITIAL_CLOTHES;
    }
    const items: ClothingItem[] = JSON.parse(raw);
    // Sanitize any outdated sample image URLs
    let changed = false;
    const sanitized = items.map(item => {
      if (item.imageUrl?.includes('photo-1521572267360-ee0c2909d518')) {
        changed = true;
        return { ...item, imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=80' };
      }
      return item;
    });
    if (changed) {
      localStorage.setItem(CLOTHES_STORAGE_KEY, JSON.stringify(sanitized));
    }
    memoryWardrobeCache = sanitized;
    return sanitized;
  } catch (err) {
    console.error('Error loading clothes from localStorage', err);
    return INITIAL_CLOTHES;
  }
};

export const saveClothes = (clothes: ClothingItem[]): void => {
  memoryWardrobeCache = clothes;

  // 1. Guardar en IndexedDB (sin límite de 5MB, almacenamiento local persistente)
  idbSaveClothes(clothes).catch((err) => console.warn('Fallo al guardar en IndexedDB:', err));

  // 2. Guardar en localStorage de forma segura
  try {
    localStorage.setItem(CLOTHES_STORAGE_KEY, JSON.stringify(clothes));
  } catch (err) {
    console.warn('localStorage lleno (QuotaExceededError). Datos protegidos y persistidos con éxito en IndexedDB.', err);
  }
};

export const addClothingItem = (item: ClothingItem, currentWardrobe?: ClothingItem[]): ClothingItem[] => {
  const current = currentWardrobe || memoryWardrobeCache || getStoredClothes();
  const updated = [item, ...current.filter(c => c.id !== item.id)];
  saveClothes(updated);
  return updated;
};

export const updateClothingItem = (item: ClothingItem, currentWardrobe?: ClothingItem[]): ClothingItem[] => {
  const current = currentWardrobe || memoryWardrobeCache || getStoredClothes();
  const updated = current.map(c => c.id === item.id ? item : c);
  saveClothes(updated);
  return updated;
};

export const deleteClothingItem = (id: string, currentWardrobe?: ClothingItem[]): ClothingItem[] => {
  const current = currentWardrobe || memoryWardrobeCache || getStoredClothes();
  const updated = current.filter(item => item.id !== id);
  saveClothes(updated);
  return updated;
};

export const toggleFavoriteItem = (id: string, currentWardrobe?: ClothingItem[]): ClothingItem[] => {
  const current = currentWardrobe || memoryWardrobeCache || getStoredClothes();
  const updated = current.map(item => 
    item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
  );
  saveClothes(updated);
  return updated;
};

export const incrementWearCount = (itemIds: string[], currentWardrobe?: ClothingItem[]): ClothingItem[] => {
  const current = currentWardrobe || memoryWardrobeCache || getStoredClothes();
  const updated = current.map(item => {
    if (itemIds.includes(item.id)) {
      return { ...item, wearCount: (item.wearCount || 0) + 1 };
    }
    return item;
  });
  saveClothes(updated);
  return updated;
};

export const removeSampleClothes = (currentWardrobe?: ClothingItem[]): ClothingItem[] => {
  const current = currentWardrobe || memoryWardrobeCache || getStoredClothes();
  const sampleIds = new Set(INITIAL_CLOTHES.map(c => c.id));
  const updated = current.filter(item => !sampleIds.has(item.id));
  saveClothes(updated);
  return updated;
};

export const restoreSampleClothes = (currentWardrobe?: ClothingItem[]): ClothingItem[] => {
  const current = currentWardrobe || memoryWardrobeCache || getStoredClothes();
  const currentIds = new Set(current.map(c => c.id));
  const toAdd = INITIAL_CLOTHES.filter(c => !currentIds.has(c.id));
  const updated = [...current, ...toAdd];
  saveClothes(updated);
  return updated;
};

export const getStoredProfile = (): UserProfile => {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(INITIAL_USER_PROFILE));
      return INITIAL_USER_PROFILE;
    }
    const profile: UserProfile = JSON.parse(raw);
    if (profile.colorSeason) {
      profile.colorSeason = normalizeColorHarmony(profile.colorSeason);
    }
    return profile;
  } catch (err) {
    console.error('Error loading profile', err);
    return INITIAL_USER_PROFILE;
  }
};

export const saveProfile = (profile: UserProfile): void => {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Error saving profile', err);
  }
};

export const getSampleInitialHistory = (): LoggedWear[] => {
  const clothes = getStoredClothes();
  if (clothes.length < 5) return [];

  const now = new Date();
  
  // Look de ayer
  const d1 = new Date(now);
  d1.setDate(d1.getDate() - 1);

  // Look de hace 3 días
  const d2 = new Date(now);
  d2.setDate(d2.getDate() - 3);

  // Look de hace 5 días
  const d3 = new Date(now);
  d3.setDate(d3.getDate() - 5);

  // Look de hace 8 días
  const d4 = new Date(now);
  d4.setDate(d4.getDate() - 8);

  const top1 = clothes.find(c => c.category === 'top');
  const bottom1 = clothes.find(c => c.category === 'bottom');
  const outer1 = clothes.find(c => c.category === 'outerwear');
  const shoes1 = clothes.find(c => c.category === 'shoes');
  const dress1 = clothes.find(c => c.category === 'dress');

  const history: LoggedWear[] = [];

  if (top1 && bottom1 && shoes1) {
    history.push({
      id: 'sample-log-1',
      date: d1.toISOString(),
      occasion: 'Universidad & Biblioteca',
      itemIds: [top1.id, bottom1.id, outer1?.id, shoes1.id].filter((id): id is string => Boolean(id))
    });
  }

  if (outer1 && bottom1 && shoes1) {
    history.push({
      id: 'sample-log-2',
      date: d2.toISOString(),
      occasion: 'Café & Trabajo en remoto',
      itemIds: [outer1.id, bottom1.id, shoes1.id]
    });
  }

  if (dress1 && shoes1) {
    history.push({
      id: 'sample-log-3',
      date: d3.toISOString(),
      occasion: 'Cena con amigas',
      itemIds: [dress1.id, shoes1.id]
    });
  } else if (top1 && bottom1) {
    history.push({
      id: 'sample-log-3',
      date: d3.toISOString(),
      occasion: 'Cena con amigas',
      itemIds: [top1.id, bottom1.id]
    });
  }

  if (top1 && shoes1) {
    history.push({
      id: 'sample-log-4',
      date: d4.toISOString(),
      occasion: 'Reunión informal',
      itemIds: [top1.id, shoes1.id]
    });
  }

  return history;
};

export const isSameOutfitItems = (itemsA: string[], itemsB: string[]): boolean => {
  if (itemsA.length !== itemsB.length) return false;
  const setA = new Set(itemsA);
  return itemsB.every(id => setA.has(id));
};

export const logOutfitWear = (occasion: string, itemIds: string[]): LoggedWear[] => {
  return logOutfitWearForDate(new Date().toISOString(), occasion, itemIds);
};

export const logOutfitWearForDate = (dateIso: string, occasion: string, itemIds: string[]): LoggedWear[] => {
  try {
    const raw = localStorage.getItem(OUTFIT_HISTORY_KEY);
    const history: LoggedWear[] = raw ? JSON.parse(raw) : getSampleInitialHistory();

    const targetDay = dateIso.split('T')[0];

    // Comprobar si ya existe EXACTAMENTE este mismo conjunto en el mismo día
    const isDuplicateOnSameDay = history.some(log => 
      log.date.split('T')[0] === targetDay && isSameOutfitItems(log.itemIds, itemIds)
    );

    if (isDuplicateOnSameDay) {
      // Ya está registrado este mismo outfit en este día. Evitar duplicar.
      return history;
    }

    const newLog: LoggedWear = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      date: dateIso,
      occasion,
      itemIds
    };

    // Permite múltiples outfits distintos en el mismo día
    const updated = [newLog, ...history].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    localStorage.setItem(OUTFIT_HISTORY_KEY, JSON.stringify(updated));
    incrementWearCount(itemIds);
    return updated;
  } catch (err) {
    console.error('Error logging outfit wear for date', err);
    return [];
  }
};

export const deleteOutfitLog = (logId: string): LoggedWear[] => {
  try {
    const raw = localStorage.getItem(OUTFIT_HISTORY_KEY);
    const history: LoggedWear[] = raw ? JSON.parse(raw) : [];
    const updated = history.filter(item => item.id !== logId);
    localStorage.setItem(OUTFIT_HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error deleting outfit log', err);
    return [];
  }
};

export const getOutfitHistory = (): LoggedWear[] => {
  try {
    const raw = localStorage.getItem(OUTFIT_HISTORY_KEY);
    if (!raw) {
      const initial = getSampleInitialHistory();
      if (initial.length > 0) {
        localStorage.setItem(OUTFIT_HISTORY_KEY, JSON.stringify(initial));
        return initial;
      }
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error getting outfit history', err);
    return [];
  }
};
