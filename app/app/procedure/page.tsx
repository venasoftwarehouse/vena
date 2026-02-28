"use client"

import { AuthGuard } from "@/components/auth-guard"
import { AppLayout } from "@/components/app-layout"
import { useI18n } from "@/lib/i18n-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HelpCircle, ArrowLeft, CheckCircle, AlertTriangle, Camera, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ProcedurePage() {
  const { t } = useI18n()

  return (
    <AuthGuard requireAuth={false}>
      <AppLayout>
        <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href="/app/settings">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("procedure.backButton")}
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t("procedure.title")}</h1>
              <p className="text-muted-foreground">{t("procedure.subtitle")}</p>
            </div>
          </div>

          {/* Overview */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                {t("procedure.overview.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {t("procedure.overview.description")}
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full mx-auto"></div>
                  <p className="text-xs text-muted-foreground">
                    {t("procedure.overview.colorIndicators.normal")}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full mx-auto"></div>
                  <p className="text-xs text-muted-foreground">
                    {t("procedure.overview.colorIndicators.warning")}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="w-8 h-8 bg-red-500 rounded-full mx-auto"></div>
                  <p className="text-xs text-muted-foreground">
                    {t("procedure.overview.colorIndicators.high")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step by Step */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>{t("procedure.steps.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">
                  1
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">{t("procedure.steps.step1.title")}</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {t("procedure.steps.step1.items").map((item: string, index: number) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">
                  2
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">{t("procedure.steps.step2.title")}</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {t("procedure.steps.step2.items").map((item: string, index: number) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">
                  3
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">{t("procedure.steps.step3.title")}</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {t("procedure.steps.step3.items").map((item: string, index: number) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">
                  4
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">{t("procedure.steps.step4.title")}</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {t("procedure.steps.step4.items").map((item: string, index: number) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">
                  5
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">{t("procedure.steps.step5.title")}</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {t("procedure.steps.step5.items").map((item: string, index: number) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                {t("procedure.tips.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <div className="flex items-start gap-3">
                  <Camera className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t("procedure.tips.lighting.title")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("procedure.tips.lighting.description")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Smartphone className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t("procedure.tips.cameraPosition.title")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("procedure.tips.cameraPosition.description")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t("procedure.tips.avoidInterference.title")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("procedure.tips.avoidInterference.description")}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warning */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-yellow-800">
                    {t("procedure.warning.title")}
                  </p>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    {t("procedure.warning.items").map((item: string, index: number) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support */}
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <h4 className="font-semibold text-foreground">{t("procedure.support.title")}</h4>
                <p className="text-sm text-muted-foreground">
                  {t("procedure.support.description")}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Link href="/app/feedback">
                    <Button variant="outline" size="sm">
                      {t("procedure.support.sendFeedback")}
                    </Button>
                  </Link>
                  <Link href="/app/chatbot">
                    <Button size="sm">{t("procedure.support.askAssistant")}</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </AuthGuard>
  )
}