# APK Directory

Direktori ini digunakan untuk menyimpan file APK aplikasi Android Dianova yang dapat diunduh oleh pengguna.

## Cara Menambahkan APK

1. Build aplikasi Android menggunakan Android Studio atau melalui command line:
   ```
   cd android
   ./gradlew assembleRelease
   ```

2. Salin file APK yang dihasilkan dari `android/app/build/outputs/apk/release/app-release.apk` ke direktori ini:
   ```
   cp android/app/build/outputs/apk/release/app-release.apk public/apk/dianova-v1.0.0.apk
   ```

3. Pastikan untuk memberi nama file APK dengan format yang konsisten:
   ```
   dianova-[versi].apk
   ```

4. Update halaman release (`app/app/release/page.tsx`) untuk menyesuaikan link download jika nama file berubah.

## Struktur Direktori

```
public/apk/
├── README.md (file ini)
├── .gitkeep (untuk memastikan direktori ter-tracking oleh git)
└── dianova-v1.0.0.apk (file APK)
```

## Catatan

- File APK yang disimpan di sini akan dapat diunduh secara publik melalui URL `/apk/[nama-file].apk`
- Pastikan file APK telah diuji dengan baik sebelum menambahkannya ke direktori ini
- Untuk keamanan, disarankan untuk menandatangani APK dengan key yang valid sebelum mendistribusikannya