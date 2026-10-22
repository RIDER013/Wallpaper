package com.rider.wallpaper;

import android.media.MediaPlayer;
import android.service.wallpaper.WallpaperService;
import android.view.SurfaceHolder;

import java.io.File;

public class VideoWallpaperService extends WallpaperService {
    @Override
    public Engine onCreateEngine() {
        return new VideoWallpaperEngine();
    }

    private class VideoWallpaperEngine extends Engine {
        private MediaPlayer mediaPlayer;
        private File videoFile;

        @Override
        public void onCreate(SurfaceHolder surfaceHolder) {
            super.onCreate(surfaceHolder);
        }

        @Override
        public void onSurfaceCreated(SurfaceHolder holder) {
            super.onSurfaceCreated(holder);
            try {
                mediaPlayer = new MediaPlayer();
                mediaPlayer.setSurface(holder.getSurface());
                
                File filesDir = getFilesDir();
                videoFile = new File(filesDir, "live_wallpaper.mp4");
                if (videoFile.exists() && videoFile.length() > 0) {
                    mediaPlayer.setDataSource(videoFile.getAbsolutePath());
                    mediaPlayer.setLooping(true);
                    mediaPlayer.setVolume(0f, 0f); // Muted for live wallpaper
                    mediaPlayer.prepare();
                    mediaPlayer.start();
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        @Override
        public void onVisibilityChanged(boolean visible) {
            super.onVisibilityChanged(visible);
            if (mediaPlayer != null) {
                if (visible) {
                    if (!mediaPlayer.isPlaying()) {
                        mediaPlayer.start();
                    }
                } else {
                    if (mediaPlayer.isPlaying()) {
                        mediaPlayer.pause();
                    }
                }
            }
        }

        @Override
        public void onSurfaceDestroyed(SurfaceHolder holder) {
            super.onSurfaceDestroyed(holder);
            if (mediaPlayer != null) {
                try {
                    if (mediaPlayer.isPlaying()) {
                        mediaPlayer.stop();
                    }
                    mediaPlayer.release();
                } catch (Exception e) {
                    e.printStackTrace();
                }
                mediaPlayer = null;
            }
        }
    }
}
