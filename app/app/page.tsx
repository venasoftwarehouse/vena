"use client"

import { AuthGuard } from "@/components/auth-guard"
import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/contexts/auth-context"
import { useRecentScans } from "@/hooks/use-recent-scans"
import { useHealthStatus, type HealthStatus } from "@/hooks/use-health-status"
import { useDailyReminder } from "@/hooks/use-daily-reminder"
import { Camera, History, MessageCircle, Activity, TrendingUp, AlertCircle, Sparkles, Clock, CheckCircle, AlertTriangle, ArrowRight, Shield } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { useI18n } from "@/lib/i18n-context"
import { useEffect, useState } from "react"

export default function AppHomePage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const { scans: recentScans, loading: recentScansLoading } = useRecentScans(3)
  const { healthStatus, loading: healthStatusLoading } = useHealthStatus()
  const { reminder, loading: reminderLoading } = useDailyReminder()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [roleLoading, setRoleLoading] = useState(true)

  // Fetch user role dari custom claims
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

  const getGlucoseStatusBadge = (status: HealthStatus["glucoseStatus"]) => {
    // Set a fixed width class to make all badges the same width
    const badgeClass = "inline-flex items-center justify-center w-24 text-center"

    switch (status) {
      case "normal":
        return <Badge className={`${badgeClass} bg-green-100 text-green-800 hover:bg-green-100`}>{t('appHome.healthStatus.badges.normal')}</Badge>
      case "warning":
        return <Badge className={`${badgeClass} bg-yellow-100 text-yellow-800 hover:bg-yellow-100`}>{t('appHome.healthStatus.badges.warning')}</Badge>
      case "high":
        return <Badge className={`${badgeClass} bg-red-100 text-red-800 hover:bg-red-100`}>{t('appHome.healthStatus.badges.high')}</Badge>
      default:
        return <Badge className={`${badgeClass} bg-gray-100 text-gray-800 hover:bg-gray-100`}>{t('appHome.healthStatus.noData')}</Badge>
    }
  }

  const getGlucoseStatusIcon = (status: HealthStatus["glucoseStatus"]) => {
    switch (status) {
      case "normal":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "high":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getTrendIcon = (trend: HealthStatus["weeklyTrend"]) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-red-500" />
      case "down":
        return <TrendingUp className="h-4 w-4 text-green-500 transform rotate-180" />
      case "stable":
        return <TrendingUp className="h-4 w-4 text-blue-500 transform rotate-90" />
      default:
        return <TrendingUp className="h-4 w-4 text-gray-500" />
    }
  }

  const getTrendText = (trend: HealthStatus["weeklyTrend"]) => {
    switch (trend) {
      case "up":
        return t('appHome.healthStatus.trends.up')
      case "down":
        return t('appHome.healthStatus.trends.down')
      case "stable":
        return t('appHome.healthStatus.trends.stable')
      default:
        return t('appHome.healthStatus.trends.unavailable')
    }
  }

  const getColorCircle = (color: string, percentage: number) => {
    if (percentage > 0) {
      return (
        <div
          className="w-2 h-2 rounded-full border border-white"
          style={{ backgroundColor: `rgba(${color === 'normal' ? '165, 166, 152' : color === 'warning' ? '124, 117, 108' : '82, 67, 64'}, ${percentage / 100})` }}
        />
      )
    } else {
      return (
        <div
          className="w-2 h-2 rounded-full border border-white"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
        />
      )
    }
  }

  return (
    <AuthGuard>
      <AppLayout>
        <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {t('appHome.welcome.greeting')}{user?.displayName ? `, ${user.displayName}` : ""}!
            </h1>
            <p className="text-muted-foreground">{t('appHome.welcome.subtitle')}</p>
          </div>

          {/* Quick Actions */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${userRole === 'admin' ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4`}>
            <Link href="/app/scan">
              <Card className="border-border bg-card hover:bg-accent/5 transition-colors cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                    <Camera className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{t('appHome.quickActions.scan.title')}</CardTitle>
                  <CardDescription className="text-sm">{t('appHome.quickActions.scan.description')}</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/app/chatbot">
              <Card className="border-border bg-card hover:bg-accent/5 transition-colors cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                    <MessageCircle className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{t('appHome.quickActions.aiAssistant.title')}</CardTitle>
                  <CardDescription className="text-sm">{t('appHome.quickActions.aiAssistant.description')}</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/app/history">
              <Card className="border-border bg-card hover:bg-accent/5 transition-colors cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                    <History className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{t('appHome.quickActions.history.title')}</CardTitle>
                  <CardDescription className="text-sm">{t('appHome.quickActions.history.description')}</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/app/feedback">
              <Card className="border-border bg-card hover:bg-accent/5 transition-colors cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                    <MessageCircle className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{t('appHome.quickActions.feedback.title')}</CardTitle>
                  <CardDescription className="text-sm">{t('appHome.quickActions.feedback.description')}</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            {/* Admin Card - Only visible for admin users */}
            {!roleLoading && userRole === 'admin' && (
              <Link href="/app/admin">
                <Card className="border-border bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 hover:shadow-md transition-all cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      Admin
                    </CardTitle>
                    <CardDescription className="text-sm">{t('appHome.admin.description')}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Assistant Highlight */}
            <Card className="border-border bg-gradient-to-r from-primary/5 to-secondary/5 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {t('appHome.aiHighlight.title')}
                </CardTitle>
                <CardDescription>
                  {t('appHome.aiHighlight.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    {t('appHome.aiHighlight.features.historyBased')}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    {t('appHome.aiHighlight.features.dietTips')}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    {t('appHome.aiHighlight.features.diabetesInfo')}
                  </div>
                  <Link href="/app/chatbot">
                    <Button className="w-full mt-3">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      {t('appHome.aiHighlight.cta')}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Status Overview */}
            <Card className="border-border bg-card h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  {t('appHome.healthStatus.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {healthStatusLoading ? (
                  <>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-32 bg-gray-400" />
                      <Skeleton className="h-6 w-24 bg-gray-400" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-32 bg-gray-400" />
                      <Skeleton className="h-6 w-16 bg-gray-400" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-32 bg-gray-400" />
                      <div className="flex items-center gap-1">
                        <Skeleton className="h-4 w-4 bg-gray-400" />
                        <Skeleton className="h-4 w-24 bg-gray-400" />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t('appHome.healthStatus.lastScan')}</span>
                      <Badge variant="secondary">
                        {healthStatus.lastScanDate || t('appHome.healthStatus.noData')}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t('appHome.healthStatus.glucoseStatus')}</span>
                      <div className="flex items-center gap-2">
                        {getGlucoseStatusIcon(healthStatus.glucoseStatus)}
                        {getGlucoseStatusBadge(healthStatus.glucoseStatus)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t('appHome.healthStatus.weeklyTrend')}</span>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        {getTrendIcon(healthStatus.weeklyTrend)}
                        {getTrendText(healthStatus.weeklyTrend)}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card className="border-border bg-card h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  {t('appHome.recentActivity.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentScansLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-lg bg-gray-400" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-32 mb-1 bg-gray-400" />
                          <Skeleton className="h-3 w-24 bg-gray-400" />
                        </div>
                        <Skeleton className="h-6 w-16 bg-gray-400" />
                      </div>
                    ))}
                  </div>
                ) : recentScans.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">{t('appHome.recentActivity.noData')}</p>
                    <Link href="/app/scan">
                      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        {t('appHome.recentActivity.startFirstScan')}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentScans.map((scan) => (
                      <div key={scan.id} className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={scan.imageUrl || "/placeholder.svg"}
                            alt="Scan result"
                            className="w-10 h-10 object-cover rounded-lg"
                          />
                          <div className="absolute -bottom-1 -right-1 flex">
                            {getColorCircle('normal', scan.colorAnalysis.colorPercentages?.normal || 0)}
                            {getColorCircle('warning', scan.colorAnalysis.colorPercentages?.warning || 0)}
                            {getColorCircle('high', scan.colorAnalysis.colorPercentages?.high || 0)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {format(new Date(scan.createdAt), "dd MMM yyyy", { locale: id })}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {format(new Date(scan.createdAt), "HH:mm", { locale: id })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {getGlucoseStatusIcon(scan.colorAnalysis.glucoseLevel)}
                          {getGlucoseStatusBadge(scan.colorAnalysis.glucoseLevel)}
                        </div>
                      </div>
                    ))}
                    <Link href="/app/history">
                      <Button variant="outline" size="sm" className="w-full">
                        {t('appHome.recentActivity.viewAll')}
                        <ArrowRight className="h-3 w-3 ml-2" />
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reminder Section */}
            <Card className="border-border bg-card h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  {t('appHome.reminder.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reminderLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full bg-gray-400" />
                    <Skeleton className="h-4 w-5/6 bg-gray-400" />
                    <Skeleton className="h-4 w-3/4 bg-gray-400" />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {reminder || t('appHome.reminder.loadError')}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  )
}