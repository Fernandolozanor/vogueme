import React, { useState, useEffect } from 'react';
import { Download, X, Sparkles, Smartphone, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPwaPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    const standaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standaloneMode);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Check if user dismissed recently
    const dismissedTimestamp = localStorage.getItem('vogueme_pwa_dismissed');
    if (dismissedTimestamp) {
      const daysSince = (Date.now() - parseInt(dismissedTimestamp)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) {
        setDismissed(true);
      }
    }

    // Capture install prompt on supported browsers (Chrome, Edge, Android, Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (isStandalone || dismissed) {
    return null;
  }

  // Only show if we either have the deferred prompt or we are on iOS Safari
  if (!deferredPrompt && !isIOS) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDismissed(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('vogueme_pwa_dismissed', Date.now().toString());
  };

  return (
    <>
      {/* Floating Chic PWA Install Pill */}
      <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300 w-[92%] max-w-md">
        <div className="bg-[#1A1815] text-[#FAF8F5] p-3 rounded-2xl shadow-xl border border-[#D6CDBC]/20 flex items-center justify-between gap-3 backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2D2A26] to-[#141312] border border-amber-300/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                <span>Instalar VogueMe App</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-amber-400/20 text-amber-300 rounded font-normal">PWA</span>
              </p>
              <p className="text-[11px] text-[#C4BCB0] truncate">
                Úsala como app nativa a pantalla completa y sin internet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-white text-neutral-900 rounded-xl font-semibold text-xs transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Modal Guide */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-[#FAF8F5] border border-[#E5DFD5] rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-rose-950" />
                <h3 className="font-serif font-bold text-neutral-900 text-base">Instalar en tu iPhone o iPad</h3>
              </div>
              <button onClick={() => setShowIOSGuide(false)} className="text-neutral-400 hover:text-neutral-900 cursor-pointer p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-neutral-700 leading-relaxed">
              <p>Para añadir VogueMe a tu pantalla de inicio como una aplicación nativa:</p>
              
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 p-2.5 bg-white rounded-xl border border-neutral-200">
                  <span className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    Toca el botón <strong>Compartir</strong> en la barra inferior de Safari:
                    <div className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-900 font-semibold">
                      <Share className="w-3 h-3 text-blue-600" />
                      <span>Compartir</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-white rounded-xl border border-neutral-200">
                  <span className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    Baja en las opciones y selecciona <strong>"Añadir a pantalla de inicio"</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-white rounded-xl border border-neutral-200">
                  <span className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    Pulsa <strong>Añadir</strong> arriba a la derecha. ¡Listo! Ya tendrás el icono de VogueMe en tu pantalla.
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-semibold cursor-pointer hover:bg-neutral-800 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
