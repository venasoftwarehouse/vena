"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Download, Smartphone, Shield, Zap, Activity, Users, ArrowLeft, Apple, Chrome } from "lucide-react";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { useI18n } from "@/lib/i18n-context";

// Client Component untuk menangani event onClick
function ScrollToFeaturesButton() {
  const { t } = useI18n();

  const scrollToFeatures = () => {
    const element = document.getElementById("features");
    if (element) {
      // Menghitung posisi elemen dengan offset untuk header
      const headerOffset = 80; // Sesuaikan dengan tinggi header Anda
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <Button variant="outline" size="lg" onClick={scrollToFeatures}>
      {t("release.download.learnMoreButton")}
    </Button>
  );
}

export default function ReleasePage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PublicHeader />

      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200">
            {t("release.badge")}
          </Badge>
          <h1 className="text-4xl font-bold text-foreground mb-4">{t("release.title")}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            {t("release.subtitle")}
          </p>
          <Badge className="mb-6 bg-primary text-primary-foreground">{t("release.version")}</Badge>

          {/* CTA Section moved to the top */}
          <div className="bg-muted/30 rounded-xl p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-4">{t("release.download.title")}</h2>
            <p className="text-muted-foreground mb-6">
              {t("release.download.description")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="https://pub-2539cdf054104bf996af49bee301a3a8.r2.dev/apk/vena-v.1.0.0.apk" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Download className="mr-2 h-5 w-5" />
                  {t("release.download.downloadButton")}
                </Button>
              </Link>
              <ScrollToFeaturesButton />
            </div>

            <p className="text-sm text-muted-foreground mt-4">
              {t("release.download.fileInfo")}
            </p>
          </div>
        </div>

        {/* PWA Section */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              {t("release.pwa.title")}
            </CardTitle>
            <CardDescription>
              {t("release.pwa.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Apple className="h-6 w-6 text-primary" />
                    <CardTitle>{t("release.pwa.ios.title")}</CardTitle>
                  </div>
                  <CardDescription>
                    {t("release.pwa.ios.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 w-full h-full flex flex-col">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                        1
                      </div>
                      <div>
                        <h4 className="font-medium">{t("release.pwa.ios.step1.title")}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t("release.pwa.ios.step1.description")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                        2
                      </div>
                      <div>
                        <h4 className="font-medium">{t("release.pwa.ios.step2.title")}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t("release.pwa.ios.step2.description")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                        3
                      </div>
                      <div>
                        <h4 className="font-medium">{t("release.pwa.ios.step3.title")}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t("release.pwa.ios.step3.description")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link href="/app">
                      <Button className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        {t("release.pwa.ios.openButton")}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Chrome className="h-6 w-6 text-primary" />
                    <CardTitle>{t("release.pwa.android.title")}</CardTitle>
                  </div>
                  <CardDescription>
                    {t("release.pwa.android.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                        1
                      </div>
                      <div>
                        <h4 className="font-medium">{t("release.pwa.android.step1.title")}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t("release.pwa.android.step1.description")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                        2
                      </div>
                      <div>
                        <h4 className="font-medium">{t("release.pwa.android.step2.title")}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t("release.pwa.android.step2.description")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                        3
                      </div>
                      <div>
                        <h4 className="font-medium">{t("release.pwa.android.step3.title")}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t("release.pwa.android.step3.description")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link href="/app">
                      <Button className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        {t("release.pwa.android.openButton")}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">{t("release.pwa.benefits.title")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                      <path d="M20 9v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9"></path>
                      <path d="M9 22V12h6v10"></path>
                      <path d="M2 10.6L12 2l10 8.6"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium">{t("release.pwa.benefits.quickAccess.title")}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t("release.pwa.benefits.quickAccess.description")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                      <line x1="8" y1="21" x2="16" y2="21"></line>
                      <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium">{t("release.pwa.benefits.fullScreen.title")}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t("release.pwa.benefits.fullScreen.description")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium">{t("release.pwa.benefits.offline.title")}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t("release.pwa.benefits.offline.description")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium">{t("release.pwa.benefits.autoUpdate.title")}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t("release.pwa.benefits.autoUpdate.description")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12" id="features">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                {t("release.features.main.title")}
              </CardTitle>
              <CardDescription>
                {t("release.features.main.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {t("release.features.main.items").map((item: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                {t("release.features.security.title")}
              </CardTitle>
              <CardDescription>
                {t("release.features.security.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {t("release.features.security.items").map((item: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              {t("release.smartPatch.title")}
            </CardTitle>
            <CardDescription>
              {t("release.smartPatch.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {t("release.smartPatch.paragraph1")}
            </p>
            <p className="text-muted-foreground">
              {t("release.smartPatch.paragraph2")}
            </p>
          </CardContent>
        </Card>

        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {t("release.aiAssistant.title")}
            </CardTitle>
            <CardDescription>
              {t("release.aiAssistant.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {t("release.aiAssistant.paragraph1")}
            </p>
            <p className="text-muted-foreground">
              {t("release.aiAssistant.paragraph2")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
}