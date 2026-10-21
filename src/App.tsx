import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Video as VideoIcon,
  CheckCircle2,
  X,
  Maximize2,
  Minimize2,
  Download,
  Smartphone,
  Scissors,
  Lock,
  Home,
  Layers,
  Sparkles
} from 'lucide-react';

export default function App() {
  const [selectedMedia, setSelectedMedia] = useState<{
    url: string;
    type: 'image' | 'video';
    name?: string;
    trimStart?: number;
    trimEnd?: number;
  } | null>(null);

  // Video pending trim state
  const [pendingVideo, setPendingVideo] = useState<{
    url: string;
    name: string;
    duration: number;
    startTime: number;
    endTime: number;
  } | null>(null);

  const [alertInfo, setAlertInfo] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setSelectedMedia({
        url: objectUrl,
        type: 'image',
        name: file.name,
      });
      setAlertInfo({
        title: 'Success',
        message: 'Image successfully select zali ahe!',
      });
    }
    e.target.value = '';
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      // Load video metadata to get duration
      const tempVideo = document.createElement('video');
      tempVideo.src = objectUrl;
      tempVideo.onloadedmetadata = () => {
        const dur = tempVideo.duration || 10;
        setPendingVideo({
          url: objectUrl,
          name: file.name,
          duration: dur,
          startTime: 0,
          endTime: dur > 10 ? 10 : dur,
        });
      };
      // fallback if onloadedmetadata fails
      setTimeout(() => {
        if (!pendingVideo) {
          setPendingVideo({
            url: objectUrl,
            name: file.name,
            duration: 10,
            startTime: 0,
            endTime: 10,
          });
        }
      }, 500);
    }
    e.target.value = '';
  };

  const handleTrimDone = () => {
    if (!pendingVideo) return;
    setSelectedMedia({
      url: pendingVideo.url,
      type: 'video',
      name: pendingVideo.name,
      trimStart: pendingVideo.startTime,
      trimEnd: pendingVideo.endTime,
    });
    setPendingVideo(null);
    setAlertInfo({
      title: 'Success',
      message: 'Video successfully select zali ahe!',
    });
  };

  const applyWallpaper = (target: 'Lock screen' | 'Home screen' | 'Both') => {
    setAlertInfo({
      title: 'Wallpaper Applied',
      message: `Successfully set wallpaper on ${target}!`,
    });
  };

  const downloadWallpaper = () => {
    if (!selectedMedia) return;
    const link = document.createElement('a');
    link.href = selectedMedia.url;
    link.download = selectedMedia.name || `wallpaper-${Date.now()}.${selectedMedia.type === 'video' ? 'mp4' : 'jpg'}`;
    link.target = '_blank';
    link.rel = 'noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleImageChange}
      />
      <input
        type="file"
        ref={videoInputRef}
        accept="video/*"
        className="hidden"
        onChange={handleVideoChange}
      />

      {/* Top Ribbon Header as requested */}
      <header className="w-full bg-[#181818] border-b border-gray-800 py-4 px-6 flex flex-col items-center shadow-md">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-widest uppercase">
          RIDER
        </h1>
        <p className="text-[11px] sm:text-xs text-gray-400 font-medium tracking-widest uppercase mt-0.5">
          wallpaper manager
        </p>
      </header>

      {/* Floating Alert Modal */}
      {alertInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1e1e1e] border border-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-[#4CAF50] flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{alertInfo.title}</h3>
            <p className="text-gray-300 text-sm mb-6">{alertInfo.message}</p>
            <button
              onClick={() => setAlertInfo(null)}
              className="w-full bg-[#4CAF50] hover:bg-[#43a047] text-white font-semibold py-2.5 px-4 rounded-xl transition duration-150 cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Video Cutter / Trimmer Modal */}
      {pendingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2 text-blue-400">
                <Scissors className="w-5 h-5" />
                <h3 className="font-bold text-white">Cut & Adjust Video</h3>
              </div>
              <button
                onClick={() => setPendingVideo(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full h-48 bg-black rounded-xl overflow-hidden relative flex items-center justify-center">
              <video
                ref={videoRef}
                src={pendingVideo.url}
                controls
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Start: {pendingVideo.startTime.toFixed(1)}s</span>
                <span>Duration: {(pendingVideo.endTime - pendingVideo.startTime).toFixed(1)}s</span>
                <span>End: {pendingVideo.endTime.toFixed(1)}s</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">Trim Range</span>
                <input
                  type="range"
                  min={0}
                  max={pendingVideo.duration}
                  step={0.5}
                  value={pendingVideo.endTime}
                  onChange={(e) =>
                    setPendingVideo({
                      ...pendingVideo,
                      endTime: Math.max(pendingVideo.startTime + 1, parseFloat(e.target.value)),
                    })
                  }
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setPendingVideo(null)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-2.5 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleTrimDone}
                className="flex-1 bg-[#2196F3] hover:bg-[#1e88e5] text-white font-semibold py-2.5 rounded-xl transition shadow-lg shadow-blue-900/30"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Preview Modal */}
      {isFullscreen && selectedMedia && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-3 bg-black/60 hover:bg-black/80 rounded-full text-white backdrop-blur-md transition"
              title="Close Fullscreen"
            >
              <Minimize2 className="w-6 h-6" />
            </button>
          </div>
          {selectedMedia.type === 'video' ? (
            <video
              src={selectedMedia.url}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={selectedMedia.url}
              alt="Wallpaper Fullscreen"
              className="w-full h-full object-cover"
            />
          )}

          {/* Simulated Lock Screen Time Overlay */}
          <div className="absolute top-16 text-center select-none pointer-events-none drop-shadow-lg">
            <p className="text-lg font-medium text-white/90">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
            <h1 className="text-7xl font-extralight tracking-tight text-white">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </h1>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="w-full max-w-xl mx-auto flex flex-col items-center gap-6 p-4 sm:p-6 my-auto">
        <p className="text-gray-400 text-sm text-center mb-2">
          Select an option below to set your wallpaper
        </p>

        {/* Buttons Section */}
        <div className="w-full flex flex-col gap-3.5">
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="w-full bg-[#4CAF50] hover:bg-[#43a047] active:scale-[0.99] text-white py-4 px-6 rounded-xl font-semibold text-base shadow-lg hover:shadow-emerald-900/30 transition duration-150 flex items-center justify-center gap-3 cursor-pointer"
          >
            <ImageIcon className="w-5 h-5" />
            <span>Set Image Wallpaper</span>
          </button>

          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            className="w-full bg-[#2196F3] hover:bg-[#1e88e5] active:scale-[0.99] text-white py-4 px-6 rounded-xl font-semibold text-base shadow-lg hover:shadow-blue-900/30 transition duration-150 flex items-center justify-center gap-3 cursor-pointer"
          >
            <VideoIcon className="w-5 h-5" />
            <span>Set Video Wallpaper</span>
          </button>
        </div>

        {/* Selected Media Preview & Apply Section */}
        {selectedMedia && (
          <div className="w-full flex flex-col items-center bg-[#181818] border border-gray-800 rounded-2xl p-5 shadow-2xl">
            <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-gray-200 truncate max-w-[200px]">
                  {selectedMedia.name || `${selectedMedia.type.toUpperCase()} Wallpaper`}
                </span>
                <span className="text-xs uppercase px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-mono">
                  {selectedMedia.type}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
                  title="Fullscreen Preview"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={downloadWallpaper}
                  className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedMedia(null)}
                  className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-red-400 transition cursor-pointer"
                  title="Remove Wallpaper"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mobile Phone Mockup Frame */}
            <div className="relative w-[200px] h-[400px] rounded-[36px] p-2.5 bg-neutral-900 border-4 border-neutral-700 shadow-[0_0_25px_rgba(0,0,0,0.8)] overflow-hidden mb-5">
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full z-20 flex items-center justify-end px-2">
                <div className="w-2 h-2 rounded-full bg-neutral-800"></div>
              </div>

              <div className="w-full h-full rounded-[28px] overflow-hidden relative bg-black">
                {selectedMedia.type === 'video' ? (
                  <video
                    src={selectedMedia.url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={selectedMedia.url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                )}

                <div className="absolute top-10 inset-x-0 text-center select-none pointer-events-none drop-shadow">
                  <p className="text-[10px] text-white/80 font-medium">
                    {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  <h2 className="text-3xl font-light text-white tracking-tight">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </h2>
                </div>

                <div className="absolute bottom-4 inset-x-3 bg-white/20 backdrop-blur-md rounded-2xl py-2 px-3 flex justify-between items-center">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/80 flex items-center justify-center text-xs">📞</div>
                  <div className="w-7 h-7 rounded-xl bg-blue-500/80 flex items-center justify-center text-xs">💬</div>
                  <div className="w-7 h-7 rounded-xl bg-amber-500/80 flex items-center justify-center text-xs">🧭</div>
                  <div className="w-7 h-7 rounded-xl bg-rose-500/80 flex items-center justify-center text-xs">📷</div>
                </div>
              </div>
            </div>

            {/* 3 Wallpaper Options as requested: Lockscreen, Homescreen, Both */}
            <div className="w-full flex flex-col gap-2.5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center mb-1">
                Apply Wallpaper To
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => applyWallpaper('Lock screen')}
                  className="bg-neutral-800 hover:bg-neutral-700 active:scale-[0.98] text-white py-2.5 px-3 rounded-xl text-xs font-medium flex flex-col items-center gap-1.5 transition cursor-pointer border border-gray-700/60"
                >
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>Lock screen</span>
                </button>
                <button
                  onClick={() => applyWallpaper('Home screen')}
                  className="bg-neutral-800 hover:bg-neutral-700 active:scale-[0.98] text-white py-2.5 px-3 rounded-xl text-xs font-medium flex flex-col items-center gap-1.5 transition cursor-pointer border border-gray-700/60"
                >
                  <Home className="w-4 h-4 text-blue-400" />
                  <span>Home screen</span>
                </button>
                <button
                  onClick={() => applyWallpaper('Both')}
                  className="bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white py-2.5 px-3 rounded-xl text-xs font-medium flex flex-col items-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-900/30"
                >
                  <Layers className="w-4 h-4 text-white" />
                  <span>Both</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-4 border-t border-gray-900 text-xs text-gray-600">
        RIDER Wallpaper Manager • Android & Web Edition
      </footer>
    </div>
  );
}
