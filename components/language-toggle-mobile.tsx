"use client"

import { Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useI18n } from "@/lib/i18n-context"

export function LanguageToggle() {
  const { language, setLanguage } = useI18n()

  return (
    <div className="lg:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-9 w-9 px-0">
            <Languages className="h-4 w-4" />
            <span className="sr-only">Toggle language</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setLanguage("id")} className="cursor-pointer">
            <span className="mr-2">🇮🇩</span>
            <span>Bahasa Indonesia</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setLanguage("en")} className="cursor-pointer">
            <span className="mr-2">🇺🇸</span>
            <span>English</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
