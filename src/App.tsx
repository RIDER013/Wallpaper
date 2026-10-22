import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  ArrowLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import bgImage from './assets/bg.png';
import { registerPlugin, Capacitor } from '@capacitor/core';

interface WallpaperPlugin {
  setWallpaper(options: { uri: string; type: string; isVideo?: boolean }): Promise<void>;
  pickImage?(): Promise<{ dataUrl: string }>;
}

const WallpaperPlugin = registerPlugin<WallpaperPlugin>('WallpaperPlugin');

export default function App() {
  const [mediaType, setMediaType] = useState<'image' | null>(null);
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [step, setStep] = useState<'home' | 'adjust' | 'preview'>('home');
  const [selectedTarget, setSelectedTarget] = useState<'Home screen' | 'Lock screen' | 'Both'>('Both');

  // Interactive Drag & Scale State (hatane adjust karaych)
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [scale, setScale] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ startX: number; startY: number }>({ startX: 0, startY: 0 });

  const imageInputRef = useRef<HTMLInputElement>(null);

  // Gallery file selection
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Str = event.target?.result as string;
        if (base64Str) {
          setMediaType('image');
          setMediaUri(base64Str);
          setPosition({ x: 0, y: 0 });
          setScale(1);
          setStep('adjust');
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleOpenGallery = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        if (WallpaperPlugin.pickImage) {
          const result = await WallpaperPlugin.pickImage();
          if (result && result.dataUrl) {
            setMediaType('image');
            setMediaUri(result.dataUrl);
            setPosition({ x: 0, y: 0 });
            setScale(1);
            setStep('adjust');
            return;
          }
        }
      } catch (err: any) {
        console.warn('Native gallery picker cancelled or error:', err);
        const errMsg = err?.message || String(err);
        if (errMsg.toLowerCase().includes('cancel')) {
          return;
        }
      }
    }
    // Web and secondary fallback
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  };

  // Pointer drag events for "hatane adjust karaych" (touch & mouse)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX - position.x,
      startY: e.clientY - position.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStartRef.current.startX,
      y: 0, // Locked to 0 for left/right only dragging
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Wheel zoom over crop area
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.1 : -0.1;
    setScale((prev) => Math.min(3, Math.max(1, prev + zoomDelta)));
  };

  const [showSuccessPopup, setShowSuccessPopup] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const autoHomeTimerRef = useRef<number | null>(null);

  const handleCloseSuccessAndGoHome = () => {
    if (autoHomeTimerRef.current) {
      clearTimeout(autoHomeTimerRef.current);
      autoHomeTimerRef.current = null;
    }
    setShowSuccessPopup(false);
    setStep('home');
    setMediaType(null);
    setMediaUri(null);
    setPosition({ x: 0, y: 0 });
    setScale(1);
  };

  const handleApplyWallpaper = async (option: string) => {
    if (!mediaUri) return;
    try {
      if (Capacitor.isNativePlatform()) {
        await WallpaperPlugin.setWallpaper({
          uri: mediaUri,
          type: option,
        });
      } else {
        // Web preview simulation
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
      // Show success popup ONLY when successfully set
      setShowSuccessPopup(true);
      if (autoHomeTimerRef.current) {
        clearTimeout(autoHomeTimerRef.current);
      }
      autoHomeTimerRef.current = window.setTimeout(() => {
        handleCloseSuccessAndGoHome();
      }, 1800);
    } catch (err) {
      console.error('Wallpaper set failed:', err);
      setErrorMessage('Wallpaper could not be set. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col justify-between font-sans selection:bg-green-500 selection:text-white relative">
      {/* Background Image with Transparency (Clearly visible anime artwork) */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat opacity-50 filter contrast-125 select-none"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-b from-gray-950/60 via-transparent to-gray-950/85" />

      {/* Native and Web File Picker */}
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        style={{
          position: 'fixed',
          top: '-1000px',
          left: '-1000px',
          opacity: 0,
          pointerEvents: 'none',
        }}
        onChange={handleImageFileChange}
      />

      {/* Success Popup Modal: Wallpaper set successfully */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-xs w-full shadow-2xl text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-base font-semibold text-white mb-5">
              Wallpaper Set Successfully - Done
            </p>
            <button
              type="button"
              onClick={handleCloseSuccessAndGoHome}
              className="w-full bg-green-600 hover:bg-green-500 active:scale-95 text-white font-medium py-2.5 rounded-xl transition cursor-pointer shadow-lg shadow-green-900/30"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Error Popup Modal */}
      {errorMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-gray-900 border border-red-500/40 rounded-2xl p-6 max-w-xs w-full shadow-2xl text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-base font-semibold text-white mb-5">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="w-full bg-red-600 hover:bg-red-500 active:scale-95 text-white font-medium py-2.5 rounded-xl transition cursor-pointer shadow-lg shadow-red-900/30"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* FULLSCREEN ADJUST SCREEN (Only Back at top, Girder grid in middle, and Done at bottom) */}
      {step === 'adjust' && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-4 select-none touch-none">
          {/* Top: ONLY Back button */}
          <div className="w-full flex items-center justify-start pt-2">
            <button
              type="button"
              onClick={() => setStep('home')}
              className="p-3 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 active:scale-95 rounded-full transition w-12 h-12 flex items-center justify-center cursor-pointer shadow-lg backdrop-blur-md"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          </div>

          {/* Middle: Full Girder Grid Area (Touch & Hand Draggable) */}
          <div
            className={`flex-1 bg-black rounded-3xl overflow-hidden relative border-2 border-white/20 shadow-2xl my-3 touch-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{
              height: '10000px',
              width: '355.421px',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
          >
            {/* Draggable Media Layer */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-transform duration-75 pointer-events-none select-none"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              }}
            >
              {mediaType === 'image' && mediaUri ? (
                <img
                  src={mediaUri}
                  alt=""
                  className="max-w-none w-full h-full object-cover select-none pointer-events-none"
                  draggable={false}
                />
              ) : null}
            </div>

            {/* 3x3 Girder Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-20">
              <div className="border-r border-b border-white/30"></div>
              <div className="border-r border-b border-white/30"></div>
              <div className="border-b border-white/30"></div>
              <div className="border-r border-b border-white/30"></div>
              <div className="border-r border-b border-white/30"></div>
              <div className="border-b border-white/30"></div>
              <div className="border-r border-b border-white/30"></div>
              <div className="border-r border-b border-white/30"></div>
              <div></div>
            </div>

            {/* Corner Viewfinder Indicators */}
            <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-green-400 z-30 pointer-events-none"></div>
            <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-green-400 z-30 pointer-events-none"></div>
            <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-green-400 z-30 pointer-events-none"></div>
            <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-green-400 z-30 pointer-events-none"></div>
          </div>

          {/* Bottom: ONLY Done button */}
          <div className="w-full pb-2">
            <button
              type="button"
              onClick={() => setStep('preview')}
              className="bg-green-600 hover:bg-green-500 active:scale-95 text-white font-semibold rounded-2xl shadow-xl shadow-green-950/50 transition-all text-center cursor-pointer text-base flex items-center justify-center"
              style={{
                height: '42.965px',
                width: '224.421px',
                paddingRight: '0px',
                paddingLeft: '0px',
                marginLeft: '100px',
                marginRight: '-5px',
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Top Ribbon (Full width, bold white RIDER on left, R instagram link on right) */}
      {step === 'home' && (
        <header className="w-full bg-gray-900/90 border-b border-gray-800 px-6 py-4 flex items-center justify-between shadow-lg sticky top-0 z-30">
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-black tracking-[0.25em] text-white italic">
              ƦƗƉƐƦ
            </h1>
            <p className="text-[10px] tracking-widest text-gray-400 uppercase font-medium mt-0.5">
              Wallpaper Manager
            </p>
          </div>
          <a
            href="https://www.instagram.com/ru_rider__?psln=MWJyYmdiZjJqZzJ4dQ=="
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-black text-sky-400 hover:text-sky-300 transition w-7 h-7 flex items-center justify-center rounded-full hover:bg-sky-950/40 cursor-pointer"
          >
            Ʀ
          </a>
        </header>
      )}

      {/* Main Container - Full Screen */}
      {step === 'home' && (
        <main className="w-full flex-1 flex flex-col justify-center items-center px-4 py-6 relative z-10">
          <div className="w-full max-w-sm flex flex-col gap-5 items-center my-auto">
            {/* Single Option: Set Image Wallpaper */}
            <button
              type="button"
              onClick={handleOpenGallery}
              className="flex items-center justify-center gap-3 text-white font-semibold rounded-xl shadow-lg transition-all transform active:scale-95 cursor-pointer"
              style={{
                backgroundColor: '#000000',
                width: '272.992px',
                height: '43.965px',
                marginTop: '300px',
                marginBottom: '-200px',
                marginLeft: '-6px',
                marginRight: '-50px',
                paddingTop: '12px',
                paddingBottom: '18px',
                paddingLeft: '33px',
                paddingRight: '0px',
              }}
            >
              <ImageIcon className="w-5 h-5" />
              <span>Set Image Wallpaper</span>
            </button>
          </div>
        </main>
      )}

      {/* STEP 3: PREVIEW & APPLY OPTIONS */}
      {step === 'preview' && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-4 select-none">
          {/* Header with Edit Button */}
          <div className="flex items-center justify-between z-20 pt-2">
            <button
              type="button"
              onClick={() => setStep('adjust')}
              className="flex items-center gap-1.5 text-xs text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition cursor-pointer backdrop-blur-md"
            >
              <ArrowLeft className="w-4 h-4" /> Edit
            </button>
          </div>

          {/* Full Screen Media Layer */}
          <div className="absolute inset-0 z-0 bg-black overflow-hidden flex items-center justify-center">
            {mediaType === 'image' && mediaUri ? (
              <img
                src={mediaUri}
                alt="Wallpaper Fullscreen"
                className="w-full h-full object-cover pointer-events-none select-none"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                }}
              />
            ) : null}
          </div>

          {/* Bottom: Selection Names and Done Button */}
          <div className="relative z-20 mt-4 w-full max-w-sm mx-auto bg-black/75 backdrop-blur-md p-4 rounded-3xl border border-white/10 shadow-2xl mb-4 flex flex-col gap-3">
            <div className="flex items-center justify-start gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedTarget('Home screen')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedTarget === 'Home screen'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50 ring-2 ring-blue-400 scale-105'
                    : 'bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                Home Screen
              </button>

              <button
                type="button"
                onClick={() => setSelectedTarget('Lock screen')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedTarget === 'Lock screen'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50 ring-2 ring-purple-400 scale-105'
                    : 'bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                Lock Screen
              </button>

              <button
                type="button"
                onClick={() => setSelectedTarget('Both')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedTarget === 'Both'
                    ? 'bg-green-600 text-white shadow-lg shadow-green-500/50 ring-2 ring-green-400 scale-105'
                    : 'bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                Both
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleApplyWallpaper(selectedTarget)}
              className="w-full flex items-center justify-center bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white active:scale-95 py-3 rounded-xl shadow-lg shadow-green-950/40 transition-all cursor-pointer text-sm font-bold tracking-wide"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Footer (Shown only on Home) */}
      {step === 'home' && (
        <footer className="mt-3 text-[11px] text-gray-500 tracking-wide text-center relative z-10">
          created by ƦƗƉƐƦ
        </footer>
      )}
    </div>
  );
}