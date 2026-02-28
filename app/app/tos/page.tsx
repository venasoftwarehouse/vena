"use client"

import { AuthGuard } from "@/components/auth-guard"
import { AppLayout } from "@/components/app-layout"
import { useI18n } from "@/lib/i18n-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function TermsOfServicePage() {
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
                {t("tos.backButton")}
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t("tos.title")}</h1>
              <p className="text-muted-foreground">{t("tos.lastUpdated")}</p>
            </div>
          </div>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {t("tos.cardTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none space-y-6">
              <section>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t("tos.sections.acceptance.title")}
                </h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>{t("tos.sections.acceptance.description")}</p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t("tos.sections.serviceDescription.title")}
                </h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>{t("tos.sections.serviceDescription.description")}</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    {t("tos.sections.serviceDescription.items").map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t("tos.sections.medicalLimitations.title")}
                </h3>
                <div className="space-y-2 text-muted-foreground">
                  <p className="font-medium text-yellow-700">
                    {t("tos.sections.medicalLimitations.disclaimer")}
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    {t("tos.sections.medicalLimitations.items").map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t("tos.sections.allowedUsage.title")}
                </h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>{t("tos.sections.allowedUsage.description")}</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    {t("tos.sections.allowedUsage.items").map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t("tos.sections.prohibitedUsage.title")}
                </h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>{t("tos.sections.prohibitedUsage.description")}</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    {t("tos.sections.prohibitedUsage.items").map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t("tos.sections.accuracyReliability.title")}
                </h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>{t("tos.sections.accuracyReliability.description")}</p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t("tos.sections.userResponsibility.title")}
                </h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>{t("tos.sections.userResponsibility.description")}</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    {t("tos.sections.userResponsibility.items").map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t("tos.sections.liabilityLimitation.title")}
                </h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>{t("tos.sections.liabilityLimitation.description")}</p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t("tos.sections.serviceChanges.title")}
                </h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>{t("tos.sections.serviceChanges.description")}</p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t("tos.sections.contact.title")}
                </h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>{t("tos.sections.contact.description")}</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    {t("tos.sections.contact.items").map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </section>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </AuthGuard>
  )
}