"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
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
import { useI18n } from "@/lib/i18n-context"

export default function LoginPage() {
  const { t } = useI18n()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showAnonymousModal, setShowAnonymousModal] = useState(false)

  const { signIn, signInAsAnonymous, isAndroidWebView, signInWithGoogle, signInWithGoogleIdToken } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Listen for authentication results from Credential Manager
  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('Setting up Google Auth handlers for Credential Manager');

    // @ts-ignore
    window.handleGoogleAuth = (idToken: string) => {
      console.log('handleGoogleAuth called with ID token from Credential Manager');
      setLoading(true);
      signInWithGoogleIdToken(idToken)
        .then(() => {
          toast({
            title: t('login.toast.success.title'),
            description: t('login.toast.success.welcomeNew'),
          });
          router.push("/app");
        })
        .catch((error) => {
          console.error('Error in handleGoogleAuth:', error);
          toast({
            title: t('login.toast.failed.titleGoogle'),
            description: error.message || t('login.toast.failed.defaultMessage'),
            variant: "destructive",
          });
        })
        .finally(() => {
          setLoading(false);
        });
    };

    // @ts-ignore
    window.handleGoogleAuthError = (error: string) => {
      console.error('handleGoogleAuthError called from Credential Manager:', error);
      toast({
        title: t('login.toast.failed.titleGoogle'),
        description: error || t('login.toast.failed.defaultMessage'),
        variant: "destructive",
      });
      setLoading(false);
    };

    return () => {
      // @ts-ignore
      delete window.handleGoogleAuth;
      // @ts-ignore
      delete window.handleGoogleAuthError;
    };
  }, [signInWithGoogleIdToken, router, toast, t]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast({
        title: t('login.toast.error.title'),
        description: t('login.toast.error.emptyFields'),
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await signIn(email, password)
      toast({
        title: t('login.toast.success.title'),
        description: t('login.toast.success.welcome'),
      })
      router.push("/app")
    } catch (error: any) {
      toast({
        title: t('login.toast.failed.title'),
        description: error.message || t('login.toast.failed.defaultMessage'),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      if (isAndroidWebView) {
        // Use Credential Manager for Android WebView
        console.log('Starting Google Sign-In for Android WebView with Credential Manager');
        await signInWithGoogle()
        // The actual success/error handling will be done in the event listeners above
        // Note: We don't set loading to false here because the result will be handled asynchronously
      } else {
        // Use standard Firebase auth for regular browsers
        await signInWithGoogle()
        toast({
          title: t('login.toast.success.title'),
          description: t('login.toast.success.welcomeNew'),
        })
        router.push("/app")
        setLoading(false)
      }
    } catch (error: any) {
      console.error('Error in handleGoogleLogin:', error);
      toast({
        title: t('login.toast.failed.titleGoogle'),
        description: error.message || t('login.toast.failed.defaultMessage'),
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
        title: t('login.toast.anonymous.title'),
        description: t('login.toast.anonymous.description'),
      })
      router.push("/app")
    } catch (error: any) {
      toast({
        title: t('login.toast.failed.titleAnonymous'),
        description: error.message || t('login.toast.failed.defaultMessage'),
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
          <CardTitle className="text-2xl font-bold text-emerald-700">{t('login.title')}</CardTitle>
          <CardDescription>{t('login.subtitle')}</CardDescription>
          {isAndroidWebView && (
            <div className="mt-2 p-2 bg-blue-50 rounded-md">
              <p className="text-xs text-blue-700">
                {t('login.androidWebViewNotice')}
              </p>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('login.form.email.label')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t('login.form.email.placeholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('login.form.password.label')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t('login.form.password.placeholder')}
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('login.form.submitting') : t('login.form.submit')}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">{t('login.divider')}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full bg-transparent" 
              onClick={handleGoogleLogin} 
              disabled={loading}
            >
              <Chrome className="mr-2 h-4 w-4" />
              {t('login.social.google')}
            </Button>

            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => setShowAnonymousModal(true)}
              disabled={loading}
            >
              <UserX className="mr-2 h-4 w-4" />
              {t('login.social.anonymous')}
            </Button>
          </div>
        </CardContent>

        <CardFooter className="text-center">
          <p className="text-sm text-muted-foreground">
            {t('login.footer.noAccount')}{" "}
            <Link href="/app/register" className="text-emerald-600 hover:underline font-medium">
              {t('login.footer.register')}
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