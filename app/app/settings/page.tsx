"use client"

import { useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AppLayout } from "@/components/app-layout"
import { useAuth } from "@/contexts/auth-context"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useAppSettings } from "@/contexts/app-settings-context"
import { useI18n } from "@/lib/i18n-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Settings, User, Shield, Trash2, LogOut, Database, FileText, HelpCircle } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"
import Link from "next/link"

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const { profile, loading: profileLoading } = useUserProfile()
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const { settings, updateSettings } = useAppSettings()
  const { t } = useI18n()
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      toast({
        title: t("settings.toast.logoutSuccess.title"),
        description: t("settings.toast.logoutSuccess.description"),
      })
    } catch (error) {
      console.error("Logout error:", error)
      toast({
        title: t("settings.toast.logoutError.title"),
        description: t("settings.toast.logoutError.description"),
        variant: "destructive",
      })
    }
  }

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true)
      if (!user) throw new Error("User tidak ditemukan")
      // Hapus data user di Firestore jika ada
      if (profile && user.uid) {
        // Import fungsi deleteUserData dari delete-user-data.ts
        const { deleteUserData } = await import("@/lib/delete-user-data")
        await deleteUserData(user.uid)
      }
      // Hapus user dari Firebase Auth
      await user.delete()
      toast({
        title: "Akun Berhasil Dihapus",
        description: "Akun dan data Anda telah dihapus permanen.",
        variant: "destructive",
      })
      setDeleteDialogOpen(false)
      // Logout setelah hapus akun
      await logout()
    } catch (error: any) {
      console.error("Delete account error:", error)
      let message = "Gagal menghapus akun. Silakan hubungi support."
      if (error.code === "auth/requires-recent-login") {
        message = "Silakan login ulang sebelum menghapus akun."
      }
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AuthGuard>
      <AppLayout>
        <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">{t("settings.title")}</h1>
            <p className="text-muted-foreground">{t("settings.subtitle")}</p>
          </div>

          {/* Account Info */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                {t("settings.account.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage
                    src={profile.photoURL || undefined}
                    alt={profile.displayName || "User"}
                  />
                  <AvatarFallback>
                    <User className="h-8 w-8 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    {profile.displayName || t("settings.account.defaultName")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {profile.email || t("settings.account.emailNotAvailable")}
                  </p>
                  {profile.isAnonymous && (
                    <p className="text-xs text-yellow-600 mt-1">
                      {t("settings.account.anonymousAccount")}
                    </p>
                  )}
                </div>
              </div>

              {profile.isAnonymous && (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    {t("settings.account.anonymousWarning")}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* App Settings */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                {t("settings.app.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Notifications */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    {t("settings.app.notifications.label")}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t("settings.app.notifications.description")}
                  </p>
                </div>
                <Switch
                  checked={settings.notifications}
                  onCheckedChange={(checked) => updateSettings({ notifications: checked })}
                />
              </div>

              <Separator />

              {/* Auto Save */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    {t("settings.app.autoSave.label")}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t("settings.app.autoSave.description")}
                  </p>
                </div>
                <Switch
                  checked={settings.autoSave}
                  onCheckedChange={(checked) => updateSettings({ autoSave: checked })}
                />
              </div>

              <Separator />

              {/* Dark Mode */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    {t("settings.app.darkMode.label")}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t("settings.app.darkMode.description")}
                  </p>
                </div>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
              </div>

              <Separator />

              {/* High Quality Images */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    {t("settings.app.highQuality.label")}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t("settings.app.highQuality.description")}
                  </p>
                </div>
                <Switch
                  checked={settings.highQuality}
                  onCheckedChange={(checked) => updateSettings({ highQuality: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Data & Privacy */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                {t("settings.dataPrivacy.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <Link href="/app/privacy-policy">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Shield className="h-4 w-4 mr-2" />
                    {t("settings.dataPrivacy.privacyPolicy")}
                  </Button>
                </Link>

                <Link href="/app/tos">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <FileText className="h-4 w-4 mr-2" />
                    {t("settings.dataPrivacy.tos")}
                  </Button>
                </Link>

                <Link href="/app/procedure">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    {t("settings.dataPrivacy.userGuide")}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                {t("settings.accountActions.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleLogout} variant="outline" className="w-full justify-start bg-transparent">
                <LogOut className="h-4 w-4 mr-2" />
                {t("settings.accountActions.logout")}
              </Button>

              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full justify-start">
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("settings.accountActions.deleteAccount")}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("settings.deleteDialog.title")}</DialogTitle>
                    <DialogDescription>
                      {t("settings.deleteDialog.description")}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                      {t("settings.deleteDialog.cancel")}
                    </Button>
                    <Button onClick={handleDeleteAccount} disabled={isDeleting} variant="destructive">
                      {isDeleting ? t("settings.deleteDialog.confirming") : t("settings.deleteDialog.confirm")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* App Info */}
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">{t("settings.appInfo.version")}</p>
                <p className="text-xs text-muted-foreground">{t("settings.appInfo.copyright")}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </AuthGuard>
  )
}