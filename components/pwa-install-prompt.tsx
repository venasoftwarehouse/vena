"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Smartphone } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";

export function PWAInstallPrompt() {
  const { t } = useI18n();
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if the app is running in standalone mode (already installed)
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

    // Check if the device is iOS
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Check if the browser is Safari
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);

    // Show prompt if:
    // 1. Device is iOS
    // 2. Browser is Safari
    // 3. App is not in standalone mode
    // 4. User hasn't closed the prompt before
    if (isIOSDevice && isSafari && !isStandalone) {
      const hasClosedPrompt = localStorage.getItem("vena-pwa-prompt-closed");

      if (!hasClosedPrompt) {
        // Show prompt after a short delay
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 3000);

        return () => clearTimeout(timer);
      }
    }
  }, [isStandalone]);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("vena-pwa-prompt-closed", "true");
  };

  const handleInstallInstructions = () => {
    setIsVisible(false);
    localStorage.setItem("vena-pwa-prompt-closed", "true");

    // Scroll to instructions section if it exists
    const instructionsElement = document.getElementById("pwa-install-instructions");
    if (instructionsElement) {
      instructionsElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (!isVisible || !isIOS || isStandalone) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 md:items-center md:justify-center">
        <div className="bg-background rounded-t-2xl md:rounded-2xl w-full max-w-md p-6 animate-in slide-in-from-bottom-10 duration-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{t("pwaInstallPrompt.title")}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">{t("pwaInstallPrompt.close")}</span>
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <Smartphone className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h4 className="font-medium">{t("pwaInstallPrompt.install.title")}</h4>
                <p className="text-sm text-muted-foreground">
                  {t("pwaInstallPrompt.install.description")}
                </p>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h5 className="font-medium mb-2">{t("pwaInstallPrompt.install.howToTitle")}</h5>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                {[0, 1, 2].map((index) => (
                  <li key={index}>{t(`pwaInstallPrompt.install.steps.${index}`)}</li>
                ))}
              </ol>
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleClose} variant="outline" className="flex-1">
                {t("pwaInstallPrompt.buttons.later")}
              </Button>
              <Button onClick={handleInstallInstructions} className="flex-1">
                <Download className="h-4 w-4 mr-1" />
                {t("pwaInstallPrompt.buttons.fullGuide")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions section that can be scrolled to */}
      <div id="pwa-install-instructions" className="hidden">
        <div className="max-w-2xl mx-auto py-12 px-4">
          <h2 className="text-2xl font-bold mb-6">{t("pwaInstallPrompt.guide.title")}</h2>

          <div className="space-y-6">
            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-3">{t("pwaInstallPrompt.guide.step1.title")}</h3>
              <p className="text-muted-foreground mb-4">
                {t("pwaInstallPrompt.guide.step1.description")}
              </p>
              <div className="bg-muted p-4 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-primary flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground">
                      <circle cx="18" cy="5" r="3"></circle>
                      <circle cx="6" cy="12" r="3"></circle>
                      <circle cx="18" cy="19" r="3"></circle>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                    </svg>
                  </div>
                  <p className="text-sm font-medium">{t("pwaInstallPrompt.guide.step1.iconLabel")}</p>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-3">{t("pwaInstallPrompt.guide.step2.title")}</h3>
              <p className="text-muted-foreground mb-4">
                {t("pwaInstallPrompt.guide.step2.description")}
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground">
                      <path d="M20 9v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9"></path>
                      <path d="M9 22V12h6v10"></path>
                      <path d="M2 10.6L12 2l10 8.6"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">{t("pwaInstallPrompt.guide.step2.optionTitle")}</p>
                    <p className="text-sm text-muted-foreground">{t("pwaInstallPrompt.guide.step2.optionDescription")}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-3">{t("pwaInstallPrompt.guide.step3.title")}</h3>
              <p className="text-muted-foreground mb-4">
                {t("pwaInstallPrompt.guide.step3.description")}
              </p>
              <div className="bg-muted p-4 rounded-lg flex items-center justify-center">
                <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium">
                  {t("pwaInstallPrompt.guide.step3.buttonLabel")}
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-3">{t("pwaInstallPrompt.guide.complete.title")}</h3>
              <p className="text-muted-foreground">
                {t("pwaInstallPrompt.guide.complete.description")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}