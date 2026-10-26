import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Camera, RefreshCw, Upload, Sun, AlertCircle } from 'lucide-react';

interface FaceCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export const FaceCaptureModal: React.FC<FaceCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Detener pistas de la cámara
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Iniciar la cámara en vivo
  const startCamera = useCallback(async (mode: 'user' | 'environment') => {
    stopStream();
    setCameraError(null);
    setHasCameraPermission(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador no soporta captura de cámara en vivo.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 960 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setHasCameraPermission(true);
    } catch (err: unknown) {
      console.warn('Error accediendo a la cámara:', err);
      const errMsg = err instanceof Error ? err.message : 'No se pudo acceder a la cámara';
      setHasCameraPermission(false);
      setCameraError(
        errMsg.includes('Permission') || errMsg.includes('denied')
          ? 'Permiso de cámara denegado. Puedes habilitarlo en los ajustes o subir una foto desde tu galería.'
          : 'No se pudo iniciar la cámara en este dispositivo. Puedes subir una foto desde tu galería.'
      );
    }
  }, [stopStream]);

  // Al abrir/cerrar el modal
  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      stopStream();
    }
    return () => {
      stopStream();
    };
  }, [isOpen, facingMode, startCamera, stopStream]);

  // Alternar entre cámara frontal y trasera
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
  };

  // Capturar el fotograma actual
  const handleCaptureFrame = () => {
    if (!videoRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const video = videoRef.current;
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No se pudo inicializar canvas de captura');
      }

      // Si es cámara frontal, espejar horizontalmente para que la foto capturada
      // coincida exactamente con lo que el usuario ve en el visor
      if (facingMode === 'user') {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setIsCapturing(false);
            return;
          }
          const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' });
          stopStream();
          onCapture(file);
          onClose();
        },
        'image/jpeg',
        0.92
      );
    } catch (err) {
      console.error('Error al capturar fotograma:', err);
      setIsCapturing(false);
    }
  };

  // Subir desde archivo/galería como alternativa
  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      stopStream();
      onCapture(file);
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between overflow-hidden select-none touch-none">
      {/* Video en Vivo de fondo */}
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className={`w-full h-full object-cover transition-transform duration-300 ${
            facingMode === 'user' ? 'scale-x-[-1]' : 'scale-x-100'
          }`}
        />

        {/* Máscara SVG con Óvalo de Enfoque Facial */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 400 600"
          preserveAspectRatio="none"
        >
          <defs>
            <mask id="face-oval-mask">
              {/* Fondo blanco completo (opaco) */}
              <rect width="400" height="600" fill="white" />
              {/* Óvalo negro central (recorte transparente para el rostro) */}
              <ellipse cx="200" cy="275" rx="120" ry="165" fill="black" />
            </mask>
          </defs>

          {/* Sombra oscura exterior que resalta el óvalo */}
          <rect
            width="400"
            height="600"
            fill="rgba(10, 10, 10, 0.65)"
            mask="url(#face-oval-mask)"
          />

          {/* Borde exterior del óvalo con tono dorado editorial */}
          <ellipse
            cx="200"
            cy="275"
            rx="120"
            ry="165"
            fill="none"
            stroke="#D4AF37"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            className="opacity-90"
          />

          {/* Guía horizontal punteada para la línea de los ojos */}
          <line
            x1="120"
            y1="245"
            x2="280"
            y2="245"
            stroke="rgba(255, 255, 255, 0.45)"
            strokeWidth="1.2"
            strokeDasharray="3 3"
          />

          {/* Guía para la barbilla */}
          <line
            x1="170"
            y1="415"
            x2="230"
            y2="415"
            stroke="rgba(255, 255, 255, 0.45)"
            strokeWidth="1.5"
          />

          {/* Microetiquetas sobre el óvalo */}
          <text
            x="200"
            y="238"
            fill="rgba(255, 255, 255, 0.7)"
            fontSize="10"
            fontWeight="600"
            textAnchor="middle"
            letterSpacing="1"
          >
            LÍNEA DE OJOS
          </text>
          <text
            x="200"
            y="432"
            fill="rgba(255, 255, 255, 0.7)"
            fontSize="9"
            fontWeight="600"
            textAnchor="middle"
            letterSpacing="1"
          >
            BARBILLA
          </text>
        </svg>
      </div>

      {/* Barra Superior con Acciones */}
      <div className="relative z-10 w-full pt-safe px-4 py-4 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <button
          type="button"
          onClick={onClose}
          className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors cursor-pointer"
          title="Cerrar visor"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white text-xs font-medium">
          <Sun className="w-3.5 h-3.5 text-amber-300" />
          <span>Luz frontal uniforme</span>
        </div>

        <button
          type="button"
          onClick={handleToggleFacingMode}
          className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors cursor-pointer"
          title="Girar cámara"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Banner de error o permiso denegado */}
      {hasCameraPermission === false && (
        <div className="relative z-20 mx-4 max-w-sm p-4 rounded-2xl bg-neutral-900/90 border border-neutral-700 backdrop-blur-lg text-white text-center space-y-3 shadow-2xl">
          <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
          <p className="text-xs text-neutral-200 leading-relaxed">
            {cameraError || 'No se pudo activar la cámara.'}
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 px-4 rounded-xl bg-white text-neutral-900 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-neutral-100 transition-all cursor-pointer shadow-md"
          >
            <Upload className="w-4 h-4 text-neutral-900" />
            <span>Seleccionar de la galería</span>
          </button>
        </div>
      )}

      {/* Barra Inferior con Controles de Disparo */}
      <div className="relative z-10 w-full pb-safe px-6 py-6 flex flex-col items-center gap-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
        {/* Indicador de ayuda */}
        <p className="text-xs text-white/90 font-medium tracking-wide drop-shadow-sm text-center">
          Centra tu rostro dentro del óvalo dorado
        </p>

        <div className="w-full flex items-center justify-around max-w-xs">
          {/* Botón Galería */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <div className="p-3 rounded-full bg-white/15 backdrop-blur-md border border-white/20 hover:bg-white/25">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-medium tracking-wider uppercase">Galería</span>
          </button>

          {/* Botón Obturador Principal */}
          <button
            type="button"
            onClick={handleCaptureFrame}
            disabled={isCapturing || hasCameraPermission === false}
            className="relative p-1 rounded-full border-2 border-white/90 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none group shadow-xl"
            title="Tomar foto"
          >
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-inner group-hover:bg-[#FAF8F5]">
              <div className="w-13 h-13 rounded-full border-2 border-neutral-900/10 flex items-center justify-center">
                <Camera className="w-6 h-6 text-neutral-900" />
              </div>
            </div>
          </button>

          {/* Botón Rotar */}
          <button
            type="button"
            onClick={handleToggleFacingMode}
            className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <div className="p-3 rounded-full bg-white/15 backdrop-blur-md border border-white/20 hover:bg-white/25">
              <RefreshCw className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-medium tracking-wider uppercase">Girar</span>
          </button>
        </div>
      </div>

      {/* Input oculto para subir desde galería */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleGallerySelect}
        className="hidden"
      />
    </div>,
    document.body
  );
};
