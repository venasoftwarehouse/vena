# Deployment ke Vercel dengan pnpm

## Persiapan

1. Pastikan Anda sudah memiliki akun Vercel di [vercel.com](https://vercel.com)
2. Install Vercel CLI jika belum terinstall:
   ```bash
   npm i -g vercel
   ```

## Variabel Lingkungan

Sebelum mendeploy, pastikan untuk menambahkan semua variabel lingkungan dari file `.env.example` ke Vercel:

1. Melalui Vercel Dashboard:
   - Buka proyek Anda di Vercel
   - Navigasi ke Settings > Environment Variables
   - Tambahkan semua variabel dari file `.env.example`

2. Atau melalui Vercel CLI:
   ```bash
   vercel env add firebase_api_key
   vercel env add firebase_auth_domain
   vercel env add firebase_project_id
   vercel env add firebase_storage_bucket
   vercel env add firebase_messaging_sender_id
   vercel env add firebase_app_id
   vercel env add firebase_measurement_id
   vercel env add r2_token
   vercel env add r2_access_key_id
   vercel env add r2_secret_key_id
   vercel env add r2_endpoint
   vercel env add r2_public_url
   vercel env add r2_bucket_name
   vercel env add groq_api_key
   vercel env add groq_model
   ```

## Deployment Melalui Vercel CLI

1. Login ke Vercel:
   ```bash
   vercel login
   ```

2. Link proyek Anda ke Vercel:
   ```bash
   vercel
   ```

3. Deploy ke Vercel:
   ```bash
   vercel --prod
   ```

## Deployment Melalui GitHub Integration

1. Push kode Anda ke repository GitHub
2. Di Vercel Dashboard:
   - Klik "New Project"
   - Pilih repository GitHub Anda
   - Vercel akan secara otomatis mendeteksi bahwa ini adalah proyek Next.js
   - Konfigurasikan variabel lingkungan di tab "Environment Variables"
   - Klik "Deploy"

## Catatan Penting

- Pastikan Anda telah mengatur semua variabel lingkungan dengan benar sebelum melakukan deployment
- Proyek ini menggunakan pnpm sebagai package manager, dan Vercel akan secara otomatis mendeteksinya dari file `pnpm-lock.yaml`
- File `vercel.json` telah dikonfigurasi untuk menggunakan pnpm saat build