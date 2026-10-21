import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Video as VideoIcon,
  Lock,
  Home,
  Smartphone,
  Check,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import bgImage from './assets/bg.png';
import { registerPlugin } from '@capacitor/core';

interface WallpaperPlugin {
  setWallpaper(options: { uri: string; type: string }): Promise<void>;
}

const WallpaperPlugin = registerPlugin<WallpaperPlugin>('WallpaperPlugin');

export default function App() {
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [step, setStep] = useState<'home' | 'adjust' | 'preview'>('home');

  // Interactive Drag & Scale State (hatane adjust karaych)
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [scale, setScale] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ startX: number; startY: number }>({ startX: 0, startY: 0 });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const adjustVideoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  // Gallery file selection
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMediaType('image');
      setMediaUri(url);
      setPosition({ x: 0, y: 0 });
      setScale(1);
      setStep('adjust');
    }
    e.target.value = '';
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMediaType('video');
      setMediaUri(url);
      setPosition({ x: 0, y: 0 });
      setScale(1);
      setStep('adjust');
    }
    e.target.value = '';
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
      await WallpaperPlugin.setWallpaper({
        uri: mediaUri,
        type: option,
      });
      // Show success popup ONLY when successfully set in reality
      setShowSuccessPopup(true);
      if (autoHomeTimerRef.current) {
        clearTimeout(autoHomeTimerRef.current);
      }
      autoHomeTimerRef.current = window.setTimeout(() => {
        handleCloseSuccessAndGoHome();
      }, 1800);
    } catch (err) {
      console.error('Wallpaper set failed:', err);
      // Do NOT show success popup if failed
      alert('Wallpaper could not be set. Please try again.');
    }
  };

  const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col justify-between font-sans selection:bg-green-500 selection:text-white relative">
      {/* Background Image with Transparency (Clearly visible) */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat opacity-40 filter contrast-125 select-none"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-b from-gray-950/70 via-transparent to-gray-950/85" />

      {/* Hidden Native File Pickers for Real Device Gallery */}
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleImageFileChange}
      />
      <input
        type="file"
        ref={videoInputRef}
        accept="video/*"
        className="hidden"
        onChange={handleVideoFileChange}
      />

      {/* Success Popup Modal: Wallpaper set successfully */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-xs w-full shadow-2xl text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-base font-semibold text-white mb-5">
              Wallpaper set successfully
            </p>
            <button
              type="button"
              onClick={handleCloseSuccessAndGoHome}
              className="w-full bg-green-600 hover:bg-green-500 active:scale-95 text-white font-medium py-2.5 rounded-xl transition cursor-pointer shadow-lg shadow-green-900/30"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* FULLSCREEN ADJUST SCREEN (Pure, minimal: Only Back at top, Girder grid in middle, and Done at bottom) */}
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
            className={`flex-1 w-full bg-black rounded-3xl overflow-hidden relative border-2 border-white/20 shadow-2xl my-3 touch-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
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
              ) : mediaType === 'video' && mediaUri ? (
                <video
                  ref={adjustVideoRef}
                  src={mediaUri}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="max-w-none w-full h-full object-cover select-none pointer-events-none"
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
              className="w-full bg-green-600 hover:bg-green-500 active:scale-95 text-white font-semibold py-4 rounded-2xl shadow-xl shadow-green-950/50 transition-all text-center cursor-pointer text-base"
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

      {/* Main Container - Full Screen, no window box */}
      {step !== 'adjust' && (
        <main className="w-full flex-1 flex flex-col justify-center items-center px-4 py-6 relative z-10">
          {/* STEP 1: HOME SCREEN */}
          {step === 'home' && (
            <div className="w-full max-w-sm flex flex-col gap-5 items-center my-auto">
              <div className="text-center mb-2">
                <h2 className="text-xl font-bold text-gray-100 tracking-tight">Choose Wallpaper Type</h2>
              </div>

              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg shadow-green-950/40 transition-all transform active:scale-95 cursor-pointer"
              >
                <ImageIcon className="w-5 h-5" />
                <span>Set Image Wallpaper</span>
              </button>

              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg shadow-blue-950/40 transition-all transform active:scale-95 cursor-pointer"
              >
                <VideoIcon className="w-5 h-5" />
                <span>Set Video Wallpaper</span>
              </button>
            </div>
          )}

          {/* STEP 3: PREVIEW & APPLY OPTIONS */}
          {step === 'preview' && (
            <div className="w-full flex flex-col h-full justify-between">
              {/* Header with Edit Button */}
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-800/80">
                <button
                  type="button"
                  onClick={() => setStep('adjust')}
                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Edit
                </button>
                <span className="text-xs font-semibold text-green-400">Preview Mode</span>
              </div>

              {/* Simulated Phone Mockup Frame - Larger as requested */}
              <div className="relative w-full h-[460px] sm:h-[500px] rounded-[34px] p-2 bg-neutral-900 border-2 border-neutral-700 shadow-2xl overflow-hidden my-2 flex flex-col justify-between">
                {/* Notch */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-3.5 bg-black rounded-full z-20"></div>

                {/* Media Layer (with saved hand-adjusted position & scale) */}
                <div className="absolute inset-0 z-0 bg-black overflow-hidden flex items-center justify-center">
                  {mediaType === 'image' && mediaUri ? (
                    <img
                      src={mediaUri}
                      alt="Wallpaper Mock"
                      className="w-full h-full object-cover pointer-events-none select-none"
                      style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                      }}
                    />
                  ) : mediaType === 'video' && mediaUri ? (
                    <video
                      ref={previewVideoRef}
                      src={mediaUri}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover pointer-events-none select-none"
                      style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                      }}
                    />
                  ) : null}
                </div>

                {/* Time & Date Overlay on Lockscreen */}
                <div className="relative z-10 text-center mt-7 select-none pointer-events-none drop-shadow-lg">
                  <span className="text-5xl sm:text-6xl font-extralight text-white tracking-tight">
                    {formattedTime}
                  </span>
                  <p className="text-xs sm:text-sm text-gray-200 font-medium drop-shadow mt-1">
                    {formattedDate}
                  </p>
                </div>

                {/* Ready Indicator on Dock */}
                <div className="relative z-10 w-full bg-black/40 backdrop-blur-md rounded-xl py-2 px-3 text-center text-[10px] text-gray-200 border border-white/10 mb-1">
                  Wallpaper Ready to Apply
                </div>
              </div>

              {/* Wallpaper Options */}
              <div className="mt-3 w-full">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyWallpaper('Lock screen')}
                    className="flex flex-col items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700/80 active:scale-95 py-3 px-2 rounded-xl transition-all cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-green-400" />
                    <span className="text-[11px] font-medium">Lock screen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyWallpaper('Home screen')}
                    className="flex flex-col items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700/80 active:scale-95 py-3 px-2 rounded-xl transition-all cursor-pointer"
                  >
                    <Home className="w-4 h-4 text-blue-400" />
                    <span className="text-[11px] font-medium">Home screen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyWallpaper('Both')}
                    className="flex flex-col items-center justify-center gap-1.5 bg-green-600 hover:bg-green-500 text-white border border-green-500 active:scale-95 py-3 px-2 rounded-xl shadow-lg shadow-green-950/40 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4 text-white" />
                    <span className="text-[11px] font-medium">Both</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
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