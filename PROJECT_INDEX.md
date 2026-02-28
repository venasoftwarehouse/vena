# INDEKS LENGKAP PROJECT DIANOVA

## Struktur Folder Utama

### 📁 Root Directory
- `components.json` - Konfigurasi komponen UI (shadcn/ui)
- `DEPLOYMENT.md` - Dokumentasi deployment
- `firebase-debug.log` - Log Firebase
- `firebase.json` - Konfigurasi Firebase
- `firebase-debug.log` - Log debug Firebase

### 📁 .firebase/
- `venaweb/` - Konfigurasi hosting Firebase
  - `functions/` - Firebase Functions
    - `next.config.mjs` - Konfigurasi Next.js untuk Firebase
    - `package.json` - Dependencies Firebase Functions
    - `.next/` - Build output Next.js (berisi banyak file build)
  - `hosting/` - Firebase Hosting
    - `404.html` - Halaman 404
    - `app.html` - Template aplikasi
    - `feedback.html` - Halaman feedback
    - `index.html` - Halaman utama
    - `privacy-policy.html` - Halaman kebijakan privasi
    - `procedure.html` - Halaman prosedur
    - `_next/static/` - Asset statis Next.js
    - `app/` - Sub-halaman aplikasi

### 📁 .github/
- `workflows/` - GitHub Actions workflows
  - `firebase-hosting-merge.yml` - Workflow untuk merge ke production
  - `firebase-hosting-pull-request.yml` - Workflow untuk pull request

### 📁 android/
- `.gitignore` - File ignore untuk Android
- `build.gradle.kts` - Build script tingkat project
- `google-services.json` - Konfigurasi Google Services
- `gradle.properties` - Properti Gradle
- `gradlew` - Wrapper Gradle (Unix)
- `gradlew.bat` - Wrapper Gradle (Windows)
- `local.properties` - Properti lokal
- `settings.gradle.kts` - Pengaturan Gradle

#### 📁 android/app/
- `.gitignore` - File ignore untuk app module
- `build.gradle.kts` - Build script untuk aplikasi
- `google-services.json` - Konfigurasi Google Services
- `proguard-rules.pro` - Aturan ProGuard
- `build/` - Output build (berisi banyak file build)
- `src/main/` - Sumber utama aplikasi
  - `AndroidManifest.xml` - Manifest aplikasi
  - `java/id/riristartup/vena/` - Kotlin/Java source code
    - `MainActivity.kt` - Activity utama
    - `MyFirebaseMessagingService.kt` - Service Firebase Messaging
    - `NotificationWorker.kt` - Worker untuk notifikasi
    - `PasskeyWebListener.kt` - Listener untuk Passkey
    - `PermissionsActivity.kt` - Activity untuk permissions
    - `SplashActivity.kt` - Splash screen activity
    - `WebAppInterface.kt` - Interface untuk web app
  - `res/` - Resource aplikasi
    - `drawable/` - Gambar dan drawable
    - `font/` - Font aplikasi
    - `layout/` - Layout XML
    - `mipmap-*/` - Icon launcher berbagai resolusi
    - `values/` - Resource values (strings, colors, styles, themes)
    - `values-night/` - Resource mode malam
    - `xml/` - File konfigurasi XML

#### 📁 android/build/
- `reports/` - Laporan build
  - `problems/problems-report.html` - Laporan masalah build

#### 📁 android/gradle/
- `libs.versions.toml` - Versi dependencies
- `wrapper/` - Gradle wrapper
  - `gradle-wrapper.jar` - JAR wrapper
  - `gradle-wrapper.properties` - Properti wrapper

### 📁 app/
- `globals.css` - Global styles
- `layout.tsx` - Layout root aplikasi
- `page.tsx` - Halaman utama
- `viewport.tsx` - Konfigurasi viewport

#### 📁 app/api/
- `ai-notes/route.ts` - API untuk AI notes
- `ai-tips/route.ts` - API untuk AI tips
- `auth/google/route.ts` - API auth Google
- `chat/route.ts` - API chat
- `chat-history/route.ts` - API chat history
- `daily-reminder/route.ts` - API daily reminder
- `delete-scan/route.ts` - API delete scan
- `fcm-token/route.ts` - API FCM token
- `icons/route.ts` - API icons
- `scan-detail/route.ts` - API scan detail
- `upload-scan/route.ts` - API upload scan
- `user-scans/route.ts` - API user scans

#### 📁 app/app/
- `register/page.tsx` - Halaman registrasi
- `settings/page.tsx` - Halaman pengaturan
- `tos/page.tsx` - Halaman Terms of Service

#### 📁 app/feedback/
- `page.tsx` - Halaman feedback

#### 📁 app/icons/
- `page.tsx` - Halaman icons

#### 📁 app/privacy-policy/
- `page.tsx` - Halaman kebijakan privasi

#### 📁 app/procedure/
- `page.tsx` - Halaman prosedur

#### 📁 app/release/
- `page.tsx` - Halaman release

#### 📁 app/tos/
- `page.tsx` - Halaman Terms of Service

### 📁 components/
- `anonymous-warning-modal.tsx` - Modal peringatan anonymous
- `app-layout.tsx` - Layout aplikasi
- `app-suggestion-popup.tsx` - Popup saran aplikasi
- `auth-guard.tsx` - Guard untuk autentikasi
- `camera-scanner.tsx` - Komponen scanner kamera
- `pwa-install-prompt.tsx` - Prompt install PWA
- `read-more.tsx` - Komponen read more
- `seo.tsx` - Komponen SEO
- `service-worker-registration.tsx` - Registrasi service worker
- `theme-provider.tsx` - Provider tema

#### 📁 components/ui/
- `accordion.tsx` - Komponen accordion
- `alert-dialog.tsx` - Dialog alert
- `alert.tsx` - Komponen alert
- `aspect-ratio.tsx` - Komponen aspect ratio
- `avatar.tsx` - Komponen avatar
- `badge.tsx` - Komponen badge
- `breadcrumb.tsx` - Komponen breadcrumb
- `button.tsx` - Komponen button
- `calendar.tsx` - Komponen calendar
- `card.tsx` - Komponen card
- `carousel.tsx` - Komponen carousel
- `chart.tsx` - Komponen chart
- `checkbox.tsx` - Komponen checkbox
- `collapsible.tsx` - Komponen collapsible
- `command.tsx` - Komponen command
- `context-menu.tsx` - Menu konteks
- `dialog.tsx` - Dialog
- `drawer.tsx` - Drawer
- `dropdown-menu.tsx` - Dropdown menu
- `form.tsx` - Form
- `hover-card.tsx` - Hover card
- `input-otp.tsx` - Input OTP
- `input.tsx` - Input
- `label.tsx` - Label
- `menubar.tsx` - Menu bar
- `navigation-menu.tsx` - Menu navigasi
- `pagination.tsx` - Pagination
- `popover.tsx` - Popover
- `progress.tsx` - Progress
- `radio-group.tsx` - Radio group
- `resizable.tsx` - Resizable
- `scroll-area.tsx` - Scroll area
- `select.tsx` - Select
- `separator.tsx` - Separator
- `sheet.tsx` - Sheet
- `sidebar.tsx` - Sidebar
- `skeleton.tsx` - Skeleton
- `slider.tsx` - Slider
- `sonner.tsx` - Notifikasi Sonner
- `switch.tsx` - Switch
- `table.tsx` - Table
- `tabs.tsx` - Tabs
- `textarea.tsx` - Textarea
- `toast.tsx` - Toast
- `toaster.tsx` - Toaster
- `toggle-group.tsx` - Toggle group
- `toggle.tsx` - Toggle
- `tooltip.tsx` - Tooltip
- `use-mobile.tsx` - Hook mobile detection
- `use-toast.ts` - Hook toast

### 📁 contexts/
- `app-settings-context.tsx` - Context pengaturan aplikasi
- `auth-context.tsx` - Context autentikasi

### 📁 hooks/
- `use-camera.ts` - Hook untuk kamera
- `use-chat-history.ts` - Hook untuk chat history
- `use-daily-reminder.ts` - Hook untuk daily reminder
- `use-health-status.ts` - Hook untuk status kesehatan
- `use-mobile.ts` - Hook untuk deteksi mobile
- `use-notifications.ts` - Hook untuk notifikasi
- `use-recent-scans.ts` - Hook untuk scan terbaru
- `use-toast.ts` - Hook untuk toast
- `use-user-profile.ts` - Hook untuk profil user
- `use-webview-auth.ts` - Hook untuk auth webview

### 📁 lib/
- `chrome-custom-tabs-auth.ts` - Auth untuk Chrome custom tabs
- `cloudflare-r2.ts` - Integrasi Cloudflare R2
- `color-detection.ts` - Deteksi warna
- `deep-link-handler.ts` - Handler deep link
- `feedback-service.ts` - Service feedback
- `firebase.ts` - Konfigurasi Firebase
- `format-ai-text.tsx` - Format AI text
- `groq-client.ts` - Client Groq AI
- `notification-service.ts` - Service notifikasi
- `scan-service.ts` - Service scan
- `types.ts` - TypeScript types
- `utils.ts` - Utility functions

### 📁 public/
- `activity.svg` - Icon aktivitas
- `apple-touch-icon.svg` - Icon Apple touch
- `favicon-16x16.svg` - Favicon 16x16
- `favicon-32x32.svg` - Favicon 32x32
- `favicon.svg` - Favicon
- `placeholder-logo.png` - Placeholder logo PNG
- `placeholder-logo.svg` - Placeholder logo SVG
- `placeholder-user.jpg` - Placeholder user image
- `placeholder.jpg` - Placeholder image
- `placeholder.svg` - Placeholder SVG
- `robots.txt` - Robots.txt
- `site.webmanifest` - Web manifest
- `sitemap.xml` - Sitemap
- `sw.js` - Service worker

#### 📁 public/apk/
- `.gitkeep` - File keep folder
- `vena-v1.0.0.apk` - APK aplikasi
- `README.md` - Dokumentasi APK

### 📁 styles/
- `globals.css` - Global styles CSS