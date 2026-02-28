"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useI18n } from "@/lib/i18n-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Home, Camera, History, MessageCircle, Settings, User, LogOut, Activity, MessageSquare } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useEffect, useState, useCallback, useMemo } from "react"
import { LanguageToggle } from "./language-toggle-desktop"
import { LanguageToggle as LanguangeToggleMobile } from "./language-toggle-mobile"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth()
  const { profile, loading } = useUserProfile()
  const { t } = useI18n()
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [roleLoading, setRoleLoading] = useState(true)


  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const idTokenResult = await user.getIdTokenResult()
          setUserRole(idTokenResult.claims.role as string || null)
        } catch (error) {
          console.error("Error fetching user role:", error)
          setUserRole(null)
        }
      } else {
        setUserRole(null)
      }
      setRoleLoading(false)
    }

    if (user) {
      fetchUserRole()
    } else {
      setRoleLoading(false)
    }
  }, [user])


  // Ensure component is mounted before rendering
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Debug logging - only in development mode
  useEffect(() => {
    if (process.env.NODE_ENV === "development" && isMounted) {
      console.log("Profile data in AppLayout:", profile)
      console.log("Profile photo URL in AppLayout:", profile.photoURL)
      console.log("Loading state:", loading)
      console.log("Image error state:", imageError)
    }
  }, [profile, loading, isMounted, imageError])

  // Memoize navigation items to prevent unnecessary re-renders
  const navigation = useMemo(() => [
    { name: t("appLayout.navigation.home"), href: "/app", icon: Home },
    { name: t("appLayout.navigation.scan"), href: "/app/scan", icon: Camera },
    { name: t("appLayout.navigation.history"), href: "/app/history", icon: History },
    { name: t("appLayout.navigation.aiAssistant"), href: "/app/chatbot", icon: MessageCircle },
    { name: t("appLayout.navigation.feedback"), href: "/app/feedback", icon: MessageSquare },
  ], [t])

  // Memoize user initials for better performance
  const userInitials = useMemo(() => {
    if (loading) return ""
    return profile.displayName?.charAt(0) || profile.email?.charAt(0) || "U"
  }, [loading, profile.displayName, profile.email])

  // Memoize avatar alt text
  const avatarAltText = useMemo(() => {
    return profile.displayName || "User"
  }, [profile.displayName])

  // Handle logout with proper error handling
  const handleLogout = useCallback(async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Logout error:", error)
      // Could add a toast notification here to inform the user
    }
  }, [logout])

  // Handle image error with proper error handling
  const handleImageError = useCallback(() => {
    console.error("Failed to load profile image")
    setImageError(true)
  }, [])

  // Don't render until component is mounted to avoid hydration issues
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/30 sticky top-0 z-50">
        <div className="px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">{t("appLayout.appName")}</span>
          </div>

          <LanguageToggle />
          <LanguangeToggleMobile />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full ml-5">
                <Avatar className="h-10 w-10">
                  {!loading && profile.photoURL && !imageError ? (
                    (() => {
                      console.log("Rendering AvatarImage with photoURL:", profile.photoURL);
                      return (
                        <AvatarImage
                          src={profile.photoURL || undefined}
                          alt={avatarAltText}
                          onError={handleImageError}
                        />
                      );
                    })()
                  ) : null}
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                    ) : (
                      userInitials
                    )}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  {loading ? (
                    <p className="font-medium text-sm">{t("appLayout.userMenu.loading")}</p>
                  ) : (
                    <>
                      {profile.displayName && <p className="font-medium text-sm">{profile.displayName}</p>}
                      {profile.email && <p className="w-[200px] truncate text-xs text-muted-foreground">{profile.email}</p>}
                      {userRole && <p className="text-xs text-primary font-medium capitalize">{userRole}</p>}
                      {profile.isAnonymous && <p className="text-xs text-yellow-600">{t("appLayout.userMenu.anonymousUser")}</p>}
                    </>
                  )}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/app/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t("appLayout.userMenu.settings")}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/app/feedback" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>{t("appLayout.userMenu.feedback")}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t("appLayout.userMenu.logout")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      {/* Jikalau berada di /chatbot, maka main memiliki pb-0 */}
      <main className={cn("flex-1", pathname === "/app/chatbot" ? "pb-0" : "pb-0")}>{children}</main>
    </div>
  )
}