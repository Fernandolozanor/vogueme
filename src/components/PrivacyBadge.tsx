import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, Info, X } from 'lucide-react';

export const PrivacyBadge: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#ECE7DE] text-[#4A443A] hover:bg-[#E2DBCF] transition-all cursor-pointer border border-[#DBD2C3]"
        title="Ver compromiso de privacidad"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
        <span className="font-semibold text-emerald-800">100% On-Device</span>
        <span className="hidden sm:inline text-neutral-600">• Tus fotos no salen de tu móvil</span>
        <Info className="w-3 h-3 text-neutral-500 ml-0.5" />
      </button>

      {/* Render modal directly in document.body via Portal to escape all stacking contexts */}
      {showModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] overflow-y-auto bg-black/65 backdrop-blur-md p-4 sm:p-6 flex min-h-screen items-center justify-center animate-in fade-in duration-200">
          <div 
            className="bg-[#FAF8F5] border border-[#E5DFD5] rounded-3xl max-w-md w-full p-6 shadow-2xl relative my-auto max-h-[85vh] flex flex-col z-[100000] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header (Pinned) */}
            <div className="flex items-center justify-between pb-3.5 border-b border-neutral-200 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-neutral-900 leading-tight">Privacidad Blindada</h3>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Arquitectura Zero-Biometric</p>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="text-neutral-400 hover:text-neutral-900 p-1.5 rounded-full hover:bg-neutral-200/60 transition-colors cursor-pointer shrink-0 ml-2"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="space-y-3.5 text-xs sm:text-sm text-neutral-700 leading-relaxed overflow-y-auto py-4 pr-1">
              <p>
                <strong>Tus fotos de cuerpo, rostro y prendas nunca se suben a ningún servidor central ni a la nube.</strong>
              </p>
              
              <div className="p-3.5 bg-white border border-[#E5DFD5] rounded-2xl text-xs space-y-2.5 text-neutral-600 shadow-2xs">
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-bold text-sm leading-none mt-0.5">✓</span>
                  <span><strong>Recorte en local:</strong> Las fotos de tu ropa se procesan con algoritmos que corren en el procesador de tu propio teléfono o PC.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-bold text-sm leading-none mt-0.5">✓</span>
                  <span><strong>Análisis sin imágenes:</strong> Si analizas tus rasgos, el navegador solo traduce tonos de color a un texto descriptivo anónimo y destruye la foto inmediatamente.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-bold text-sm leading-none mt-0.5">✓</span>
                  <span><strong>Almacenamiento seguro:</strong> Todo tu armario se guarda en la memoria interna de tu navegador (IndexedDB / LocalStorage).</span>
                </div>
              </div>

              <p className="text-[11px] text-neutral-500 italic">
                Diseñado expresamente para proteger tu identidad y privacidad en todo momento.
              </p>
            </div>

            {/* Footer Button (Pinned) */}
            <div className="pt-3 border-t border-neutral-200 shrink-0">
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-3 rounded-2xl bg-neutral-900 text-white text-xs sm:text-sm font-medium hover:bg-neutral-800 transition-colors cursor-pointer shadow-md active:scale-98"
              >
                Entendido, me encanta
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </>
  );
};
