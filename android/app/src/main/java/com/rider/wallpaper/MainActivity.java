package com.rider.wallpaper;

import android.app.WallpaperManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;
import android.util.Base64;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(WallpaperPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @CapacitorPlugin(name = "WallpaperPlugin")
    public static class WallpaperPlugin extends Plugin {
        @PluginMethod
        public void setWallpaper(PluginCall call) {
            String imageUriStr = call.getString("uri");
            String type = call.getString("type", "Both"); // 'Home screen', 'Lock screen', 'Both'

            if (imageUriStr == null) {
                call.reject("Image URI is missing");
                return;
            }

            try {
                WallpaperManager wallpaperManager = WallpaperManager.getInstance(getContext());
                byte[] decodedBytes;

                if (imageUriStr.contains(",")) {
                    String base64Data = imageUriStr.split(",")[1];
                    decodedBytes = Base64.decode(base64Data, Base64.DEFAULT);
                } else {
                    decodedBytes = Base64.decode(imageUriStr, Base64.DEFAULT);
                }

                Bitmap bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.length);
                if (bitmap != null) {
                    int flags = WallpaperManager.FLAG_SYSTEM | WallpaperManager.FLAG_LOCK;
                    if ("Home screen".equalsIgnoreCase(type) || "Home Screen".equalsIgnoreCase(type)) {
                        flags = WallpaperManager.FLAG_SYSTEM;
                    } else if ("Lock screen".equalsIgnoreCase(type) || "Lock Screen".equalsIgnoreCase(type)) {
                        flags = WallpaperManager.FLAG_LOCK;
                    }

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                        wallpaperManager.setBitmap(bitmap, null, true, flags);
                    } else {
                        wallpaperManager.setBitmap(bitmap);
                    }

                    call.resolve();
                } else {
                    call.reject("Failed to decode bitmap from base64 data");
                }
            } catch (Exception e) {
                call.reject("Failed to set wallpaper: " + e.getMessage());
            }
        }
    }
}
