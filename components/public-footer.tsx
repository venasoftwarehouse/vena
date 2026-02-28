"use client"

import { Activity, Download } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useI18n } from "@/lib/i18n-context"

export function PublicFooter() {
  const { t } = useI18n()
  const pathname = usePathname()

  return (
    <footer className="py-12 px-4 border-t border-border">
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-8 lg:space-y-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">{t("publicFooter.appName")}</span>
          </div>
          <div className="flex flex-col items-start space-y-4 text-sm text-muted-foreground lg:flex-row lg:items-center lg:space-y-0 lg:space-x-6">
            <Link 
              href="/" 
              className={`${
                pathname === "/" 
                  ? "text-primary font-medium" 
                  : "hover:text-foreground transition-colors"
              }`}
            >
              {t("publicFooter.navigation.home")}
            </Link>
            <Link 
              href="/release" 
              className={`${
                pathname === "/release" 
                  ? "text-primary font-medium" 
                  : "hover:text-foreground transition-colors"
              }`}
            >
              {t("publicFooter.navigation.release")}
            </Link>
            <Link 
              href="/privacy-policy" 
              className={`${
                pathname === "/privacy-policy" 
                  ? "text-primary font-medium" 
                  : "hover:text-foreground transition-colors"
              }`}
            >
              {t("publicFooter.navigation.privacyPolicy")}
            </Link>
            <Link 
              href="/tos" 
              className={`${
                pathname === "/tos" 
                  ? "text-primary font-medium" 
                  : "hover:text-foreground transition-colors"
              }`}
            >
              {t("publicFooter.navigation.tos")}
            </Link>
            <Link 
              href="/procedure" 
              className={`${
                pathname === "/procedure" 
                  ? "text-primary font-medium" 
                  : "hover:text-foreground transition-colors"
              }`}
            >
              {t("publicFooter.navigation.procedure")}
            </Link>
            <Link 
              href="/feedback" 
              className={`${
                pathname === "/feedback" 
                  ? "text-primary font-medium" 
                  : "hover:text-foreground transition-colors"
              }`}
            >
              {t("publicFooter.navigation.feedback")}
            </Link>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          {t("publicFooter.copyright")}
        </div>
      </div>
    </footer>
  )
}