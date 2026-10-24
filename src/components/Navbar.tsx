import React from 'react';
import { Sparkles, Shirt, UserCheck, ShoppingBag, Luggage, BarChart3 } from 'lucide-react';
import { PrivacyBadge } from './PrivacyBadge';

export type NavTab = 'stylist' | 'closet' | 'profile' | 'shopping' | 'luggage' | 'sustainability';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  clothesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange, clothesCount }) => {
  const tabs = [
    { id: 'stylist' as NavTab, label: 'Look de Hoy', mobileLabel: 'Look', icon: Sparkles },
    { id: 'closet' as NavTab, label: 'Armario', mobileLabel: 'Armario', icon: Shirt, badge: clothesCount },
    { id: 'shopping' as NavTab, label: 'Shopping Gaps', mobileLabel: 'Shopping', icon: ShoppingBag },
    { id: 'luggage' as NavTab, label: 'Maleta', mobileLabel: 'Maleta', icon: Luggage },
    { id: 'sustainability' as NavTab, label: 'Métricas & CPW', mobileLabel: 'Métricas', icon: BarChart3 },
    { id: 'profile' as NavTab, label: 'Perfil', mobileLabel: 'Perfil', icon: UserCheck }
  ];

  return (
    <>
      {/* Top Editorial Header */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E8E2D6] px-3 sm:px-4 lg:px-8 py-3.5 transition-all w-full max-w-full overflow-x-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-6 min-w-0">
            <button 
              onClick={() => onTabChange('stylist')}
              className="group text-left cursor-pointer focus:outline-none min-w-0"
            >
              <div className="flex items-baseline gap-1.5 min-w-0">
                <span className="font-serif text-2xl lg:text-3xl font-bold tracking-tight text-neutral-900 group-hover:opacity-85 transition-opacity truncate">
                  Vogue<span className="italic font-normal text-rose-950">Me</span>
                </span>
                <span className="text-[10px] tracking-widest uppercase font-semibold text-neutral-400 shrink-0">Atelier</span>
              </div>
              <p className="text-[11px] text-neutral-500 tracking-wide -mt-1 hidden sm:block truncate">
                Tu estilista IA & armario inteligente
              </p>
            </button>
          </div>

          {/* Desktop Navigation (un tono más oscuro que el fondo #FAF8F5) */}
          <nav className="hidden md:flex items-center gap-1 bg-[#E8E1D3] p-1 rounded-full border border-[#D6CDBC] shadow-2xs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-neutral-900 text-white shadow-sm font-semibold'
                      : 'text-[#544B3E] hover:text-neutral-950 hover:bg-black/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#D6CDBC] text-[#3E362B]'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Privacy Badge */}
          <div className="flex items-center gap-2">
            <PrivacyBadge />
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Fondo un tono más oscuro que la página #FAF8F5, no negro) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#E8E1D3]/95 backdrop-blur-md border-t border-[#D6CDBC] px-1.5 py-2 flex items-center justify-around safe-bottom shadow-lg w-full max-w-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center p-1 flex-1 min-w-0 relative transition-all cursor-pointer ${
                isActive ? 'text-neutral-900' : 'text-[#615749] hover:text-neutral-900'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${
                isActive ? 'bg-neutral-900 text-white scale-105 shadow-sm font-bold' : 'hover:bg-black/5'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-[9.5px] mt-0.5 tracking-tight font-medium truncate max-w-full ${
                isActive ? 'font-bold text-neutral-950' : 'text-[#615749]'
              }`}>
                {tab.mobileLabel}
              </span>
              {tab.badge !== undefined && (
                <span className="absolute top-0.5 right-1 text-[9px] bg-rose-900 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold shadow-xs">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
