"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Activity, Download, X } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";

export function AppSuggestionPopup() {
  const { t } = useI18n();
  const [isVisible, setIsVisible] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [appInstalled, setAppInstalled] = useState(false);
  const [isInWebView, setIsInWebView] = useState(false);
  const [isInPWA, setIsInPWA] = useState(false);

  useEffect(() => {
    // Check if user is on Android
    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroidDevice = userAgent.indexOf("android") > -1;
    
    // Check if user is on desktop (not mobile)
    const isDesktopDevice = !/mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(userAgent);
    
    setIsAndroid(isAndroidDevice);
    setIsDesktop(isDesktopDevice);
    
    // Check if user is inside a WebView (Android app)
    // Common WebView indicators:
    // 1. WebView in the user agent
    // 2. wv parameter in the user agent
    // 3. Missing browser features that are present in regular browsers
    const isWebView = (
      userAgent.includes("wv") || 
      userAgent.includes("webview") ||
      // Check for Android WebView specific patterns
      (isAndroidDevice && !/chrome|firefox|opera|safari|edge|msie|trident/.test(userAgent)) ||
      // Check for missing browser features that are present in regular browsers
      typeof window !== "undefined" && (
        // WebView doesn't have the same browser APIs
        !window.requestIdleCallback ||
        // Check for custom Android WebView properties
        (window as any).AndroidWebView !== undefined ||
        (window as any).WEBVIEW !== undefined
      )
    );
    
    setIsInWebView(isWebView);
    
    // Check if user is in PWA mode
    // PWA indicators:
    // 1. Window is standalone or fullscreen
    // 2. Display mode is standalone
    // 3. Running as a PWA
    const isPWA = (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://') ||
      // Check for PWA specific window features
      (window as any).chrome?.app?.window !== undefined ||
      // Check if running in TWA (Trusted Web Activity)
      userAgent.includes('twa') ||
      // Check if running in PWA mode
      (window as any).PWA !== undefined
    );
    
    setIsInPWA(isPWA);
    
    // Only show popup if:
    // 1. User is on Android OR desktop
    // 2. User is NOT in WebView (already in the app)
    // 3. User is NOT in PWA mode (already installed as PWA)
    // 4. User is on /app page
    // 5. User hasn't closed the popup before
    if ((isAndroidDevice || isDesktopDevice) && !isWebView && !isPWA && window.location.pathname === "/app") {
      const hasClosedPopup = localStorage.getItem("dianova-popup-closed");
      
      // For Android, check if app is installed by trying to open the deep link
      if (isAndroidDevice) {
        const checkAppInstalled = () => {
          // Create an invisible iframe to test deep link
          const iframe = document.createElement("iframe");
          iframe.style.display = "none";
          iframe.src = "dianova://app"; // Deep link URL scheme
          
          document.body.appendChild(iframe);
          
          // Set a timeout to check if the app opened
          const timeout = setTimeout(() => {
            // If we're still here, the app didn't open
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
            setAppInstalled(false);
            
            // Show popup if app is not installed and user hasn't closed it before
            if (!hasClosedPopup) {
              setIsVisible(true);
            }
          }, 500);
          
          // Listen for the page visibility change
          const handleVisibilityChange = () => {
            if (document.hidden) {
              // The page was hidden, likely because the app opened
              clearTimeout(timeout);
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
              setAppInstalled(true);
              setIsVisible(false);
            }
          };
          
          document.addEventListener("visibilitychange", handleVisibilityChange);
          
          return () => {
            clearTimeout(timeout);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          };
        };
        
        checkAppInstalled();
      } else if (isDesktopDevice && !hasClosedPopup) {
        // For desktop, just show the popup if user hasn't closed it before
        setIsVisible(true);
      }
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("dianova-popup-closed", "true");
  };

  const handleContinueInBrowser = () => {
    setIsVisible(false);
    localStorage.setItem("dianova-popup-closed", "true");
  };

  if (!isVisible || (isAndroid && appInstalled) || isInWebView || isInPWA) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 md:items-center md:justify-center">
      <div className="bg-background rounded-t-2xl md:rounded-2xl w-full max-w-md p-6 animate-in slide-in-from-bottom-10 duration-300">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{t("appSuggestionPopup.title")}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">{t("appSuggestionPopup.closeButton")}</span>
          </Button>
        </div>
        
        <div className="space-y-4">
          {/* Browser Option */}
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <div>
                <h4 className="font-medium">{t("appSuggestionPopup.browserOption.title")}</h4>
                <p className="text-sm text-muted-foreground">{t("appSuggestionPopup.browserOption.description")}</p>
              </div>
            </div>
            <Button onClick={handleContinueInBrowser} variant="outline" size="sm">
              {t("appSuggestionPopup.browserOption.button")}
            </Button>
          </div>
          
          {/* App Option */}
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h4 className="font-medium">{t("appSuggestionPopup.appOption.title")}</h4>
                <p className="text-sm text-muted-foreground">
                  {isAndroid 
                    ? t("appSuggestionPopup.appOption.descriptionAndroid")
                    : t("appSuggestionPopup.appOption.descriptionDesktop")
                  }
                </p>
              </div>
            </div>
            <Link href="/release" passHref>
              <Button size="sm">
                <Download className="h-4 w-4 mr-1" />
                {t("appSuggestionPopup.appOption.button")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}