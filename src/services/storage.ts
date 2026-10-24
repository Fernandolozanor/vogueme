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

export const logOutfitWear = (occasion: string, itemIds: string[]): void => {
  try {
    const raw = localStorage.getItem(OUTFIT_HISTORY_KEY);
    const history: LoggedWear[] = raw ? JSON.parse(raw) : [];
    const newLog: LoggedWear = {
      id: 'log-' + Date.now(),
      date: new Date().toISOString(),
      occasion,
      itemIds
    };
    localStorage.setItem(OUTFIT_HISTORY_KEY, JSON.stringify([newLog, ...history]));
    incrementWearCount(itemIds);
  } catch (err) {
    console.error('Error logging outfit wear', err);
  }
};

export const getOutfitHistory = (): LoggedWear[] => {
  try {
    const raw = localStorage.getItem(OUTFIT_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error getting outfit history', err);
    return [];
  }
};
