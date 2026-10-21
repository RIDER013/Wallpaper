package com.rider.wallpaper;

import android.app.WallpaperManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Build;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.InputStream;

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
                Uri uri = Uri.parse(imageUriStr);
                InputStream inputStream;

                if (imageUriStr.startsWith("content://") || imageUriStr.startsWith("file://")) {
                    inputStream = getContext().getContentResolver().openInputStream(uri);
                } else {
                    File file = new File(imageUriStr);
                    inputStream = new java.io.FileInputStream(file);
                }

                Bitmap bitmap = BitmapFactory.decodeStream(inputStream);
                if (bitmap != null) {
                    int flags = WallpaperManager.FLAG_SYSTEM | WallpaperManager.FLAG_LOCK;
                    if ("Home screen".equalsIgnoreCase(type)) {
                        flags = WallpaperManager.FLAG_SYSTEM;
                    } else if ("Lock screen".equalsIgnoreCase(type)) {
                        flags = WallpaperManager.FLAG_LOCK;
                    }

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                        wallpaperManager.setBitmap(bitmap, null, true, flags);
                    } else {
                        wallpaperManager.setBitmap(bitmap);
                    }

                    call.resolve();
                } else {
                    call.reject("Failed to decode image bitmap");
                }
            } catch (Exception e) {
                call.reject("Failed to set wallpaper: " + e.getMessage());
            }
        }
    }
}
