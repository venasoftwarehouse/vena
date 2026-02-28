"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Heart, Smartphone, Download, ArrowRight, Shield, Users, BarChart3, Bell, CheckCircle, Star, Monitor } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { useI18n } from "@/lib/i18n-context";

export default function Home() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <PublicHeader />

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16 mt-8">
          <div className="flex justify-center">
            <Badge className="mb-4 bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200">
              {t('homepage.hero.badge')}
            </Badge>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            {t('homepage.hero.title.line1')}
            <span className="block text-primary">{t('homepage.hero.title.line2')}</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
            {t('homepage.hero.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/app">
              <Button size="lg" className="w-full sm:w-auto">
                {t('homepage.hero.cta.start')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/release">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                {t('homepage.hero.cta.install')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <h2 className="text-3xl font-bold text-center mb-10">{t('homepage.features.title')}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{t('homepage.features.cards.monitoring.title')}</CardTitle>
              <CardDescription>
                {t('homepage.features.cards.monitoring.description')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{t('homepage.features.cards.analysis.title')}</CardTitle>
              <CardDescription>
                {t('homepage.features.cards.analysis.description')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Monitor className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{t('homepage.features.cards.webapp.title')}</CardTitle>
              <CardDescription>
                {t('homepage.features.cards.webapp.description')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{t('homepage.features.cards.security.title')}</CardTitle>
              <CardDescription>
                {t('homepage.features.cards.security.description')}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Detailed Features Section */}
        <div className="mb-16">
          <Tabs defaultValue="monitoring" className="w-full h-fit">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="monitoring">{t('homepage.tabs.labels.monitoring')}</TabsTrigger>
              <TabsTrigger value="analysis">{t('homepage.tabs.labels.analysis')}</TabsTrigger>
              <TabsTrigger value="app">{t('homepage.tabs.labels.app')}</TabsTrigger>
              <TabsTrigger value="security">{t('homepage.tabs.labels.security')}</TabsTrigger>
            </TabsList>
            <TabsContent value="monitoring" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    {t('homepage.tabs.monitoring.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('homepage.tabs.monitoring.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">{t('homepage.tabs.monitoring.items.accurate.title')}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t('homepage.tabs.monitoring.items.accurate.description')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">{t('homepage.tabs.monitoring.items.realtime.title')}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t('homepage.tabs.monitoring.items.realtime.description')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">{t('homepage.tabs.monitoring.items.history.title')}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t('homepage.tabs.monitoring.items.history.description')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">{t('homepage.tabs.monitoring.items.export.title')}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t('homepage.tabs.monitoring.items.export.description')}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="analysis" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    {t('homepage.tabs.analysis.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('homepage.tabs.analysis.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">{t('homepage.tabs.analysis.items.trends.title')}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t('homepage.tabs.analysis.items.trends.description')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">{t('homepage.tabs.analysis.items.recommendations.title')}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t('homepage.tabs.analysis.items.recommendations.description')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">{t('homepage.tabs.analysis.items.reports.title')}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t('homepage.tabs.analysis.items.reports.description')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">{t('homepage.tabs.analysis.items.integration.title')}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t('homepage.tabs.analysis.items.integration.description')}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="app" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Monitor className="mr-2 h-5 w-5" />
                    {t('homepage.tabs.app.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('homepage.tabs.app.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">{t('homepage.tabs.app.items.universal.title')}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t('homepage.tabs.app.items.universal.description')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">{t('homepage.tabs.app.items.noInstall.title')}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t('homepage.tabs.app.items.noInstall.description')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">{t('homepage.tabs.app.items.autoUpdate.title')}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t('homepage.tabs.app.items.autoUpdate.description')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">{t('homepage.tabs.app.items.pwa.title')}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t('homepage.tabs.app.items.pwa.description')}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="security" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="mr-2 h-5 w-5" />
                    {t('homepage.tabs.security.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('homepage.tabs.security.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">{t('homepage.tabs.security.items.encryption.title')}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t('homepage.tabs.security.items.encryption.description')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">{t('homepage.tabs.security.items.privacy.title')}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t('homepage.tabs.security.items.privacy.description')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">{t('homepage.tabs.security.items.firebase.title')}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t('homepage.tabs.security.items.firebase.description')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">{t('homepage.tabs.security.items.backup.title')}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t('homepage.tabs.security.items.backup.description')}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* PWA Section */}
        <div className="bg-card rounded-2xl p-6 md:p-8 mb-16 border">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-2 gap-8 items-center">
            <div className="md:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary">{t('homepage.pwa.badge')}</Badge>
                <h2 className="text-2xl font-bold">{t('homepage.pwa.title')}</h2>
              </div>
              <p className="text-muted-foreground mb-6">
                {t('homepage.pwa.description')}
              </p>
              <div className="space-y-4 mb-6">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-medium">{t('homepage.pwa.features.quickAccess.title')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('homepage.pwa.features.quickAccess.description')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-medium">{t('homepage.pwa.features.notifications.title')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('homepage.pwa.features.notifications.description')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-medium">{t('homepage.pwa.features.autoUpdate.title')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('homepage.pwa.features.autoUpdate.description')}
                    </p>
                  </div>
                </div>
              </div>
              <Link href="/release">
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  {t('homepage.pwa.cta')}
                </Button>
              </Link>
            </div>

            <div className="flex justify-center md:col-span-1 lg:col-span-1">
              <div className="relative w-48 h-48 lg:sm:w-64 lg:sm:h-64 md:w-40 md:h-40 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-30 h-30 lg:sm:w-48 lg:sm:h-48 md:w-28 md:h-28 bg-background rounded-xl shadow-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-8 h-8 lg:sm:w-12 lg:sm:h-12 md:w-10 md:h-10 rounded-lg bg-primary flex items-center justify-center mx-auto mb-3 md:mb-2">
                        <Activity className="w-4 h-4 lg:sm:h-6 lg:sm:w-6 md:h-5 md:w-5 text-primary-foreground" />
                      </div>
                      <p className="font-medium text-sm md:text-xs">{t('homepage.pwa.appName')}</p>
                      <p className="text-xs md:text-[10px] text-muted-foreground">{t('homepage.pwa.appTagline')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">{t('homepage.cta.title')}</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            {t('homepage.cta.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/app">
              <Button size="lg">
                {t('homepage.cta.buttons.start')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/release">
              <Button variant="outline" size="lg">
                <Download className="mr-2 h-4 w-4" />
                {t('homepage.cta.buttons.download')}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}