import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/contexts/auth-context"
import { AppSettingsProvider } from "@/contexts/app-settings-context"
import { ThemeProvider } from "@/components/theme-provider"
import { NotificationInitializer } from "@/components/notification-initializer"
import { Toaster } from "@/components/ui/toaster"
import { AppSuggestionPopup } from "@/components/app-suggestion-popup"
import { DeepLinkHandler } from "@/components/deep-link-handler"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"
import { ServiceWorkerRegistration } from "@/components/service-worker-registration"
import { SEO } from "@/components/seo"
import { Suspense } from "react"
import { I18nProvider } from "@/lib/i18n-context"
import "./globals.css"

export const metadata: Metadata = {
  title: "Vena - Monitor Glukosa Darah dengan Teknologi Patch Pintar",
  description: "Aplikasi monitoring glukosa darah dengan teknologi patch pintar yang inovatif. Pantau kadar gula darah Anda dengan mudah dan akurat.",
  keywords: "glukosa darah, diabetes, monitoring kesehatan, patch pintar, Vena, kesehatan",
  authors: [{ name: "Vena Team" }],
  openGraph: {
    title: "Vena - Monitor Glukosa Darah dengan Teknologi Patch Pintar",
    description: "Aplikasi monitoring glukosa darah dengan teknologi patch pintar yang inovatif. Pantau kadar gula darah Anda dengan mudah dan akurat.",
    url: "https://vena.vercel.app",
    siteName: "Vena",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vena - Monitor Glukosa Darah dengan Teknologi Patch Pintar",
    description: "Aplikasi monitoring glukosa darah dengan teknologi patch pintar yang inovatif. Pantau kadar gula darah Anda dengan mudah dan akurat.",
    creator: "@vena",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.svg", sizes: "16x16", type: "image/svg+xml" },
      { url: "/favicon-32x32.svg", sizes: "32x32", type: "image/svg+xml" },
      // Fallback for browsers that don't support SVG icons
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.svg", sizes: "180x180", type: "image/svg+xml" },
      // Fallback for browsers that don't support SVG icons
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "manifest", url: "/site.webmanifest" },
    ],
  },
  manifest: "/site.webmanifest",
  category: "health",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <SEO />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function getInitialTheme() {
                  const storedTheme = localStorage.getItem('vena-theme');
                  if (storedTheme) {
                    return storedTheme;
                  }
                  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                
                const theme = getInitialTheme();
                document.documentElement.classList.toggle('dark', theme === 'dark');
              })();
            `,
          }}
        />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <I18nProvider>
          <Suspense fallback={null}>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
              storageKey="vena-theme"
            >
              <AppSettingsProvider>
                <Toaster />
                <AuthProvider>
                  <DeepLinkHandler>
                    {children}
                    <NotificationInitializer />
                    <AppSuggestionPopup />
                    <PWAInstallPrompt />
                    <ServiceWorkerRegistration />
                  </DeepLinkHandler>
                </AuthProvider>
              </AppSettingsProvider>
            </ThemeProvider>
          </Suspense>
          <Analytics />
        </I18nProvider>
      </body>
    </html>
  )
}
