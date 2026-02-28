"use client"

import { useI18n } from "@/lib/i18n-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { Shield, ArrowLeft } from "lucide-react"

export default function PrivacyPolicyPage() {
  const { t } = useI18n()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PublicHeader />

        <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="flex items-center flex-col gap-4 w-full">
              <h1 className="text-2xl font-bold text-foreground">{t("privacyPolicy.title")}</h1>
              <p className="text-muted-foreground">{t("privacyPolicy.lastUpdated")}</p>
            </div>
          </div>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                {t("privacyPolicy.cardTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none space-y-6">
              <section>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t("privacyPolicy.sections.informationCollection.title")}
                </h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>{t("privacyPolicy.sections.informationCollection.description")}</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    {t("privacyPolicy.sections.informationCollection.items").map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t("privacyPolicy.sections.informationUsage.title")}
                </h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>{t("privacyPolicy.sections.informationUsage.description")}</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    {t("privacyPolicy.sections.informationUsage.items").map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t("privacyPolicy.sections.dataSecurity.title")}
                </h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>{t("privacyPolicy.sections.dataSecurity.description")}</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    {t("privacyPolicy.sections.dataSecurity.items").map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t("privacyPolicy.sections.informationSharing.title")}
                </h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>{t("privacyPolicy.sections.informationSharing.description")}</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    {t("privacyPolicy.sections.informationSharing.items").map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t("privacyPolicy.sections.userRights.title")}
                </h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>{t("privacyPolicy.sections.userRights.description")}</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    {t("privacyPolicy.sections.userRights.items").map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t("privacyPolicy.sections.dataStorage.title")}
                </h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>{t("privacyPolicy.sections.dataStorage.description")}</p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t("privacyPolicy.sections.policyChanges.title")}
                </h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>{t("privacyPolicy.sections.policyChanges.description")}</p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t("privacyPolicy.sections.contact.title")}
                </h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>{t("privacyPolicy.sections.contact.description")}</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    {t("privacyPolicy.sections.contact.items").map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </section>
            </CardContent>
          </Card>
        </div>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
}