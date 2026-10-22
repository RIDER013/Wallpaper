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
import { registerPlugin, Capacitor } from '@capacitor/core';

interface WallpaperPlugin {
  setWallpaper(options: { uri: string; type: string }): Promise<void>;
}

const WallpaperPlugin = registerPlugin<WallpaperPlugin>('WallpaperPlugin');

export default function App() {
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [step, setStep] = useState<'home' | 'adjust' | 'preview'>('home');
  const [selectedTarget, setSelectedTarget] = useState<'Home screen' | 'Lock screen' | 'Both'>('Both');
  const [videoThumbnailUri, setVideoThumbnailUri] = useState<string | null>(null);

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

  const extractVideoThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'auto';
      const url = URL.createObjectURL(file);
      video.src = url;
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';

      video.onloadedmetadata = () => {
        video.currentTime = Math.min(1.0, video.duration / 2);
      };

      video.onseeked = () => {
        setTimeout(() => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 1080;
          canvas.height = video.videoHeight || 1920;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
            URL.revokeObjectURL(url);
            resolve(dataUrl);
          } else {
            reject(new Error('Canvas context is null'));
          }
        }, 300);
      };

      video.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };

      video.load();
    });
  };

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const videoUrl = URL.createObjectURL(file);
      setMediaType('video');
      setMediaUri(videoUrl);
      setPosition({ x: 0, y: 0 });
      setScale(1);
      setStep('adjust');

      try {
        const thumbDataUrl = await extractVideoThumbnail(file);
        setVideoThumbnailUri(thumbDataUrl);
      } catch (err) {
        console.error('Failed to extract video thumbnail:', err);
      }
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
    setVideoThumbnailUri(null);
    setPosition({ x: 0, y: 0 });
    setScale(1);
  };

  const handleApplyWallpaper = async (option: string) => {
    const uriToApply = (mediaType === 'video' && videoThumbnailUri) ? videoThumbnailUri : mediaUri;
    if (!uriToApply) return;
    try {
      if (Capacitor.isNativePlatform()) {
        await WallpaperPlugin.setWallpaper({
          uri: uriToApply,
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
                  preload="auto"
                  onEnded={(e) => { e.currentTarget.play(); }}
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
                ) : mediaType === 'video' && mediaUri ? (
                  <video
                    ref={previewVideoRef}
                    src={mediaUri}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    onEnded={(e) => { e.currentTarget.play(); }}
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