import { useState } from 'react';
import { Navbar, type NavTab } from './components/Navbar';
import { StylistView } from './components/StylistView';
import { ClosetView } from './components/ClosetView';
import { ProfileView } from './components/ProfileView';
import { ShoppingGapsView } from './components/ShoppingGapsView';
import { LuggageView } from './components/LuggageView';
import { SustainabilityView } from './components/SustainabilityView';
import { InstallPwaPrompt } from './components/InstallPwaPrompt';
import type { ClothingItem, UserProfile } from './types';
import { getStoredClothes, getStoredProfile } from './services/storage';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('stylist');
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>(() => getStoredClothes());
  const [profile, setProfile] = useState<UserProfile>(() => getStoredProfile());

  const handleRefreshWardrobe = () => {
    setWardrobe(getStoredClothes());
  };

  const handleProfileUpdate = (updated: UserProfile) => {
    setProfile(updated);
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden bg-[#FAF8F5] flex flex-col font-sans text-[#1A1A1A] min-h-screen pb-20 md:pb-12">
      {/* Top Editorial Navbar */}
      <Navbar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        clothesCount={wardrobe.length} 
      />

      {/* Main Screen Content */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        {activeTab === 'stylist' && (
          <StylistView 
            wardrobe={wardrobe} 
            profile={profile} 
            onNavigateToCloset={() => setActiveTab('closet')}
            onNavigateToProfile={() => setActiveTab('profile')}
            onRefreshWardrobe={handleRefreshWardrobe}
          />
        )}

        {activeTab === 'closet' && (
          <ClosetView 
            wardrobe={wardrobe} 
            onWardrobeChange={setWardrobe} 
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView 
            profile={profile} 
            onProfileUpdate={handleProfileUpdate} 
          />
        )}

        {activeTab === 'shopping' && (
          <ShoppingGapsView 
            profile={profile} 
            wardrobe={wardrobe}
            onProfileUpdate={handleProfileUpdate} 
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'luggage' && (
          <LuggageView 
            wardrobe={wardrobe} 
            profile={profile} 
          />
        )}

        {activeTab === 'sustainability' && (
          <SustainabilityView 
            wardrobe={wardrobe} 
          />
        )}
      </main>

      {/* Editorial Footer */}
      <footer className="mt-auto border-t border-[#E8E2D6] py-6 px-4 text-center text-xs text-neutral-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-neutral-800 text-sm">VogueMe</span>
            <span>•</span>
            <span>Estilismo IA & Moda Inteligente</span>
          </div>

          <div className="text-[11px] text-neutral-500">
            🔒 <strong>Zero-Biometric Guarantee:</strong> Todas las fotos y medidas se procesan en tu dispositivo y nunca viajan por internet.
          </div>

          <div className="text-[11px] text-neutral-400">
            Inspirado en publicaciones y catálogos de moda internacional.
          </div>
        </div>
      </footer>

      {/* Floating PWA Install Banner */}
      <InstallPwaPrompt />
    </div>
  );
}

export default App;
