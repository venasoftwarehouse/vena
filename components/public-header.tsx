"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Activity, Menu, ArrowRight, Home, FileText, ListOrdered, MessageSquare, Download } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useI18n } from "@/lib/i18n-context"
import { LanguageToggle } from "./language-toggle-desktop"
import { LanguageToggle as LanguangeToggleMobile } from "./language-toggle-mobile"

export function PublicHeader() {
  const { t } = useI18n()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const navigation = useMemo(() => [
    { name: t("publicHeader.navigation.home"), href: "/", icon: Home },
    { name: t("publicHeader.navigation.release"), href: "/release", icon: Download },
    { name: t("publicHeader.navigation.privacyPolicy"), href: "/privacy-policy", icon: FileText },
    { name: t("publicHeader.navigation.tos"), href: "/tos", icon: FileText },
    { name: t("publicHeader.navigation.procedure"), href: "/procedure", icon: ListOrdered },
    { name: t("publicHeader.navigation.feedback"), href: "/feedback", icon: MessageSquare },
  ], [t])

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center">
        <div className="flex items-center space-x-2 flex-1 lg:flex-none">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">{t("publicHeader.appName")}</span>
        </div>

        {/* Desktop Navigation - Only visible on large screens */}
        <nav className="hidden lg:flex space-x-6 flex-1 justify-center">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`${pathname === item.href
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground transition-colors"
                }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        <LanguageToggle />

        <div className="flex items-center space-x-4 lg:ml-5 ml-2">
          <LanguangeToggleMobile />
          <Link href="/app">
            <Button size="lg">
              {t("publicHeader.openApp")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>

          {/* Mobile & Tablet Navigation */}

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
                <span className="sr-only">{t("publicHeader.toggleMenu")}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col space-y-4 mt-8 p-6">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`${pathname === item.href
                          ? "text-primary font-medium flex items-center space-x-3"
                          : "text-muted-foreground hover:text-foreground transition-colors flex items-center space-x-3"
                        }`}
                      onClick={() => setIsOpen(false)}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}