import type { ClothingItem, UserProfile } from '../types';
import { INITIAL_CLOTHES, INITIAL_USER_PROFILE } from '../data/initialData';

const CLOTHES_STORAGE_KEY = 'vogueme_clothes_v1';
const PROFILE_STORAGE_KEY = 'vogueme_profile_v1';
const OUTFIT_HISTORY_KEY = 'vogueme_outfit_history_v1';

export interface LoggedWear {
  id: string;
  date: string;
  occasion: string;
  itemIds: string[];
}

export const getStoredClothes = (): ClothingItem[] => {
  try {
    const raw = localStorage.getItem(CLOTHES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CLOTHES_STORAGE_KEY, JSON.stringify(INITIAL_CLOTHES));
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
    return sanitized;
  } catch (err) {
    console.error('Error loading clothes from localStorage', err);
    return INITIAL_CLOTHES;
  }
};

export const saveClothes = (clothes: ClothingItem[]): void => {
  try {
    localStorage.setItem(CLOTHES_STORAGE_KEY, JSON.stringify(clothes));
  } catch (err) {
    console.error('Error saving clothes to localStorage', err);
  }
};

export const addClothingItem = (item: ClothingItem): ClothingItem[] => {
  const current = getStoredClothes();
  const updated = [item, ...current];
  saveClothes(updated);
  return updated;
};

export const updateClothingItem = (item: ClothingItem): ClothingItem[] => {
  const current = getStoredClothes();
  const updated = current.map(c => c.id === item.id ? item : c);
  saveClothes(updated);
  return updated;
};

export const deleteClothingItem = (id: string): ClothingItem[] => {
  const current = getStoredClothes();
  const updated = current.filter(item => item.id !== id);
  saveClothes(updated);
  return updated;
};

export const toggleFavoriteItem = (id: string): ClothingItem[] => {
  const current = getStoredClothes();
  const updated = current.map(item => 
    item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
  );
  saveClothes(updated);
  return updated;
};

export const incrementWearCount = (itemIds: string[]): ClothingItem[] => {
  const current = getStoredClothes();
  const updated = current.map(item => {
    if (itemIds.includes(item.id)) {
      return { ...item, wearCount: (item.wearCount || 0) + 1 };
    }
    return item;
  });
  saveClothes(updated);
  return updated;
};

export const removeSampleClothes = (): ClothingItem[] => {
  const current = getStoredClothes();
  const sampleIds = new Set(INITIAL_CLOTHES.map(c => c.id));
  const updated = current.filter(item => !sampleIds.has(item.id));
  saveClothes(updated);
  return updated;
};

export const restoreSampleClothes = (): ClothingItem[] => {
  const current = getStoredClothes();
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
    return JSON.parse(raw);
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

export const logOutfitWear = (occasion: string, itemIds: string[]): void => {
  logOutfitWearForDate(new Date().toISOString(), occasion, itemIds);
};

export const logOutfitWearForDate = (dateIso: string, occasion: string, itemIds: string[]): LoggedWear[] => {
  try {
    const raw = localStorage.getItem(OUTFIT_HISTORY_KEY);
    const history: LoggedWear[] = raw ? JSON.parse(raw) : getSampleInitialHistory();

    const targetDay = dateIso.split('T')[0];
    // Reemplaza si ya había uno para ese día o añade uno nuevo
    const filtered = history.filter(l => l.date.split('T')[0] !== targetDay);

    const newLog: LoggedWear = {
      id: 'log-' + Date.now(),
      date: dateIso,
      occasion,
      itemIds
    };

    const updated = [newLog, ...filtered].sort(
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
