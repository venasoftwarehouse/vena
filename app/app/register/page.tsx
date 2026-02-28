"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useI18n } from "@/lib/i18n-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { AnonymousWarningModal } from "@/components/anonymous-warning-modal"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, Mail, Lock, Chrome, UserX } from "lucide-react"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showAnonymousModal, setShowAnonymousModal] = useState(false)

  const { signUp, signInAsAnonymous, isAndroidWebView, signInWithGoogle } = useAuth()
  const { t } = useI18n()
  const router = useRouter()
  const { toast } = useToast()

  // Listen for authentication results from Chrome Custom Tabs
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleAuthSuccess = (event: any) => {
      console.log('Auth success event received:', event.detail);
      // The Android app would handle the actual authentication
      // and then refresh the WebView or redirect to the app
      toast({
        title: t("register.toast.registerSuccess.title"),
        description: t("register.toast.registerSuccess.descriptionShort"),
      })
      router.push("/app")
    };

    const handleAuthError = (event: any) => {
      console.error('Auth error event received:', event.detail);
      toast({
        title: t("register.toast.googleRegisterError.title"),
        description: event.detail.errorDescription || t("register.toast.googleRegisterError.defaultMessage"),
        variant: "destructive",
      })
    };

    window.addEventListener('authSuccess', handleAuthSuccess);
    window.addEventListener('authError', handleAuthError);

    return () => {
      window.removeEventListener('authSuccess', handleAuthSuccess);
      window.removeEventListener('authError', handleAuthError);
    };
  }, [router, toast, t]);

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return t("register.validation.passwordMinLength")
    }
    return null
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password || !confirmPassword) {
      toast({
        title: "Error",
        description: t("register.validation.allFieldsRequired"),
        variant: "destructive",
      })
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      toast({
        title: t("register.validation.passwordInvalid"),
        description: passwordError,
        variant: "destructive",
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: t("register.validation.passwordMismatch"),
        description: t("register.validation.passwordMismatchDescription"),
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await signUp(email, password)
      toast({
        title: t("register.toast.registerSuccess.title"),
        description: t("register.toast.registerSuccess.description"),
      })
      router.push("/app")
    } catch (error: any) {
      let errorMessage = t("register.toast.registerError.defaultMessage")

      if (error.code === "auth/email-already-in-use") {
        errorMessage = t("register.toast.registerError.emailInUse")
      } else if (error.code === "auth/invalid-email") {
        errorMessage = t("register.toast.registerError.invalidEmail")
      } else if (error.code === "auth/weak-password") {
        errorMessage = t("register.toast.registerError.weakPassword")
      }

      toast({
        title: t("register.toast.registerError.title"),
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleRegister = async () => {
    setLoading(true)
    try {
      if (isAndroidWebView) {
        // Use Chrome Custom Tabs for Android WebView
        await signInWithGoogle()
        // The actual success/error handling will be done in the event listeners above
      } else {
        // Use standard Firebase auth for regular browsers
        await signInWithGoogle()
        toast({
          title: t("register.toast.registerSuccess.title"),
          description: t("register.toast.registerSuccess.descriptionShort"),
        })
        router.push("/app")
      }
    } catch (error: any) {
      toast({
        title: t("register.toast.googleRegisterError.title"),
        description: error.message || t("register.toast.googleRegisterError.defaultMessage"),
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const handleAnonymousLogin = async () => {
    setLoading(true)
    try {
      await signInAsAnonymous()
      toast({
        title: t("register.toast.guestLogin.title"),
        description: t("register.toast.guestLogin.description"),
      })
      router.push("/app")
    } catch (error: any) {
      toast({
        title: t("register.toast.guestLoginError.title"),
        description: error.message || t("register.toast.guestLoginError.defaultMessage"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setShowAnonymousModal(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-emerald-700">{t("register.title")}</CardTitle>
          <CardDescription>{t("register.subtitle")}</CardDescription>
          {isAndroidWebView && (
            <div className="mt-2 p-2 bg-blue-50 rounded-md">
              <p className="text-xs text-blue-700">
                {t("register.webViewNotice")}
              </p>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("register.form.email.label")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t("register.form.email.placeholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("register.form.password.label")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("register.form.password.placeholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("register.form.confirmPassword.label")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={t("register.form.confirmPassword.placeholder")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("register.form.submitting") : t("register.form.submitButton")}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">{t("register.divider")}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full bg-transparent" 
              onClick={handleGoogleRegister} 
              disabled={loading}
            >
              <Chrome className="mr-2 h-4 w-4" />
              {t("register.googleButton")}
            </Button>

            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => setShowAnonymousModal(true)}
              disabled={loading}
            >
              <UserX className="mr-2 h-4 w-4" />
              {t("register.guestButton")}
            </Button>
          </div>
        </CardContent>

        <CardFooter className="text-center">
          <p className="text-sm text-muted-foreground">
            {t("register.footer.haveAccount")}{" "}
            <Link href="/app/login" className="text-emerald-600 hover:underline font-medium">
              {t("register.footer.loginLink")}
            </Link>
          </p>
        </CardFooter>
      </Card>

      <AnonymousWarningModal
        isOpen={showAnonymousModal}
        onClose={() => setShowAnonymousModal(false)}
        onConfirm={handleAnonymousLogin}
      />
    </div>
  )
}