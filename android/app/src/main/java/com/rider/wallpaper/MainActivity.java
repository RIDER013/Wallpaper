package com.rider.wallpaper;

import android.app.Activity;
import android.app.WallpaperManager;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import android.util.Base64;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(WallpaperPlugin.class);
        super.onCreate(savedInstanceState);
        // Note: Do NOT override WebChromeClient with a bare instance.
        // Capacitor's default BridgeWebChromeClient is preserved so that
        // file choosers and camera/storage requests function properly.
    }

    @CapacitorPlugin(name = "WallpaperPlugin")
    public static class WallpaperPlugin extends Plugin {

        @PluginMethod
        public void pickImage(PluginCall call) {
            try {
                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.setType("image/*");
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                startActivityForResult(call, intent, "pickImageResult");
            } catch (Exception e) {
                try {
                    Intent intent = new Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI);
                    startActivityForResult(call, intent, "pickImageResult");
                } catch (Exception ex) {
                    call.reject("Could not open gallery: " + ex.getMessage());
                }
            }
        }

        @ActivityCallback
        private void pickImageResult(PluginCall call, ActivityResult result) {
            if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
                Intent data = result.getData();
                Uri imageUri = data.getData();
                if (imageUri != null) {
                    try {
                        InputStream is = getContext().getContentResolver().openInputStream(imageUri);
                        if (is != null) {
                            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
                            byte[] dataBytes = new byte[8192];
                            int nRead;
                            while ((nRead = is.read(dataBytes, 0, dataBytes.length)) != -1) {
                                buffer.write(dataBytes, 0, nRead);
                            }
                            buffer.flush();
                            byte[] imageBytes = buffer.toByteArray();
                            is.close();

                            String base64 = Base64.encodeToString(imageBytes, Base64.NO_WRAP);
                            String mimeType = getContext().getContentResolver().getType(imageUri);
                            if (mimeType == null) {
                                mimeType = "image/jpeg";
                            }

                            JSObject ret = new JSObject();
                            ret.put("dataUrl", "data:" + mimeType + ";base64," + base64);
                            call.resolve(ret);
                            return;
                        }
                    } catch (Exception e) {
                        call.reject("Failed to read image data: " + e.getMessage());
                        return;
                    }
                }
            }
            call.reject("Image selection cancelled");
        }

        @PluginMethod
        public void setWallpaper(PluginCall call) {
            String imageUriStr = call.getString("uri");
            String type = call.getString("type", "Both"); // 'Home screen', 'Lock screen', 'Both'

            if (imageUriStr == null) {
                call.reject("URI is missing");
                return;
            }

            try {
                byte[] decodedBytes;
                if (imageUriStr.contains(",")) {
                    String base64Data = imageUriStr.split(",")[1];
                    decodedBytes = Base64.decode(base64Data, Base64.DEFAULT);
                } else {
                    decodedBytes = Base64.decode(imageUriStr, Base64.DEFAULT);
                }

                WallpaperManager wallpaperManager = WallpaperManager.getInstance(getContext());
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
