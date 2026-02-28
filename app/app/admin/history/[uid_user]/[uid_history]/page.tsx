"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { AppLayout } from "@/components/app-layout"
import { useAuth } from "@/contexts/auth-context"
import { getScanById, type ScanRecord } from "@/lib/scan-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Calendar, CheckCircle, AlertTriangle, AlertCircle, Bot, FileText, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatAIText } from "@/lib/format-ai-text"
import { ReadMore } from "@/components/read-more"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { useI18n } from "@/lib/i18n-context"

export default function ScanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const { t } = useI18n()
  const [scan, setScan] = useState<ScanRecord | null>(null)
  const [loading, setLoading] = useState(true)
  
  const uidHistory = params.uid_history as string
  const uidUser = params.uid_user as string

  useEffect(() => {
    if (uidUser && uidHistory) {
      loadScanDetail()
    }
  }, [uidUser, uidHistory])

  const loadScanDetail = async () => {
    if (!uidUser || !uidHistory) return

    try {
      setLoading(true)
      const scanData = await getScanById(uidUser, uidHistory)

      if (scanData) {
        setScan(scanData)
      } else {
        toast({
          title: t("history.toast.error.title"),
          description: t("history.toast.error.notFound"),
          variant: "destructive",
        })
        router.push(`/app/admin/history/${uidUser}`)
      }
    } catch (error) {
      console.error("Error loading scan detail:", error)
      toast({
        title: t("history.toast.error.title"),
        description: t("history.toast.error.loadDetailFailed"),
        variant: "destructive",
      })
      router.push(`/app/admin/history/${uidUser}`)
    } finally {
      setLoading(false)
    }
  }

  const getResultIcon = (level: string) => {
    switch (level) {
      case "normal":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "high":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getResultBadge = (level: string) => {
    switch (level) {
      case "normal":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{t("history.status.normal")}</Badge>
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{t("history.status.warning")}</Badge>
      case "high":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{t("history.status.high")}</Badge>
      default:
        return <Badge variant="secondary">{t("history.status.unknown")}</Badge>
    }
  }

  const getColorCircle = (color: string, percentage: number) => {
    if (percentage > 0) {
      return (
        <div 
          className="w-4 h-4 rounded-full border border-border"
          style={{ backgroundColor: `rgba(${color === 'normal' ? '165, 166, 152' : color === 'warning' ? '124, 117, 108' : '82, 67, 64'}, ${percentage / 100})` }}
          title={`${color === 'normal' ? t("history.colorLabels.normal") : color === 'warning' ? t("history.colorLabels.warning") : t("history.colorLabels.high")}: ${percentage.toFixed(1)}%`}
        />
      )
    } else {
      return (
        <div 
          className="w-4 h-4 rounded-full border border-border"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
        />
      )
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <AppLayout>
          <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
            {/* Header Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-9 w-24 bg-gray-100" />
              <div>
                <Skeleton className="h-8 w-40 mb-2 bg-gray-100" />
                <Skeleton className="h-4 w-64 bg-gray-100" />
              </div>
            </div>

            {/* Scan Detail Skeleton */}
            <Card className="border-border bg-card">
              <CardHeader>
                <Skeleton className="h-6 w-32 bg-gray-100" />
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Image Skeleton */}
                <div className="flex flex-col items-center">
                  <Skeleton className="w-full max-w-md h-64 rounded-lg bg-gray-100" />
                  <div className="flex items-center gap-1 mt-4">
                    <Skeleton className="w-4 h-4 rounded-full bg-gray-100" />
                    <Skeleton className="w-4 h-4 rounded-full bg-gray-100" />
                    <Skeleton className="w-4 h-4 rounded-full bg-gray-100" />
                    <Skeleton className="h-3 w-48 ml-2 bg-gray-100" />
                  </div>
                </div>

                {/* Result Info Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-5 bg-gray-100" />
                      <Skeleton className="h-6 w-20 bg-gray-100" />
                    </div>
                    <Skeleton className="h-4 w-40 bg-gray-100" />
                    <Skeleton className="h-4 w-32 bg-gray-100" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32 bg-gray-100" />
                    <Skeleton className="h-4 w-full bg-gray-100" />
                    <Skeleton className="h-4 w-3/4 bg-gray-100" />
                  </div>
                </div>

                {/* Color Distribution Visualization Skeleton */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40 bg-gray-100" />
                  <Skeleton className="w-full h-3 rounded-full bg-gray-100" />
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-16 bg-gray-100" />
                    <Skeleton className="h-3 w-16 bg-gray-100" />
                    <Skeleton className="h-3 w-16 bg-gray-100" />
                  </div>
                </div>

                {/* AI Assistant Tips Skeleton */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-3">
                    <Skeleton className="w-8 h-8 rounded-full bg-gray-100" />
                    <Skeleton className="h-5 w-48 bg-gray-100" />
                    <Skeleton className="h-5 w-16 ml-auto bg-gray-100" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Skeleton className="w-1.5 h-1.5 rounded-full mt-2 bg-gray-100" />
                      <Skeleton className="h-4 w-full bg-gray-100" />
                    </div>
                    <div className="flex items-start gap-2">
                      <Skeleton className="w-1.5 h-1.5 rounded-full mt-2 bg-gray-100" />
                      <Skeleton className="h-4 w-5/6 bg-gray-100" />
                    </div>
                  </div>
                </div>

                {/* AI Notes Skeleton */}
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 mb-3">
                    <Skeleton className="w-8 h-8 rounded-full bg-gray-100" />
                    <Skeleton className="h-5 w-32 bg-gray-100" />
                    <Skeleton className="h-5 w-16 ml-auto bg-gray-100" />
                  </div>
                  
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full bg-gray-100" />
                    <Skeleton className="h-4 w-full bg-gray-100" />
                    <Skeleton className="h-4 w-3/4 bg-gray-100" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </AppLayout>
      </AuthGuard>
    )
  }

  if (!scan) {
    return (
      <AuthGuard>
        <AppLayout>
          <div className="p-4 flex items-center justify-center md:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{t("history.detail.notFound.title")}</h3>
              <p className="text-muted-foreground mb-4">
                {t("history.detail.notFound.description")}
              </p>
              <Button onClick={() => router.push("/app/admin/history")}>
                {t("history.buttons.backToHistory")}
              </Button>
            </div>
          </div>
        </AppLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <AppLayout>
        <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="space-y-2">
            <Button variant="ghost" size="sm" onClick={() => router.push("/app/admin/history/" + uidUser)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("history.buttons.back")}
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t("history.detail.title")}</h1>
              <p className="text-muted-foreground">{t("history.detail.description")}</p>
            </div>
          </div>

          {/* Scan Detail */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg">{t("history.detail.scanResult")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Image */}
              <div className="flex flex-col items-center">
                <img
                  src={scan.imageUrl || "/placeholder.svg"}
                  alt="Scan result"
                  className="w-full max-w-md object-cover rounded-lg"
                />
                <div className="flex items-center gap-1 mt-4">
                  {getColorCircle('normal', scan.colorAnalysis.colorPercentages?.normal || 0)}
                  {getColorCircle('warning', scan.colorAnalysis.colorPercentages?.warning || 0)}
                  {getColorCircle('high', scan.colorAnalysis.colorPercentages?.high || 0)}
                  <span className="text-sm text-muted-foreground ml-2">
                    N: {(scan.colorAnalysis.colorPercentages?.normal || 0).toFixed(1)}% | W: {(scan.colorAnalysis.colorPercentages?.warning || 0).toFixed(1)}% | H: {(scan.colorAnalysis.colorPercentages?.high || 0).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Result Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getResultIcon(scan.colorAnalysis.glucoseLevel)}
                    {getResultBadge(scan.colorAnalysis.glucoseLevel)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    {format(new Date(scan.createdAt), "dd MMM yyyy, HH:mm", { locale: id })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("history.info.accuracy")}: {scan.colorAnalysis.confidence.toFixed(0)}%
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">{t("history.detail.resultAnalysis")}</p>
                  <p className="text-sm text-muted-foreground">{scan.colorAnalysis.description}</p>
                  <p className="text-sm text-muted-foreground">{scan.colorAnalysis.recommendation}</p>
                </div>
              </div>

              {/* Color Distribution Visualization */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">{t("history.detail.colorDistribution")}</p>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full" 
                    style={{ width: `${scan.colorAnalysis.colorPercentages?.normal || 0}%`, backgroundColor: "#a5a698" }}
                  />
                  <div 
                    className="h-full" 
                    style={{ width: `${scan.colorAnalysis.colorPercentages?.warning || 0}%`, backgroundColor: "#7c756c" }}
                  />
                  <div 
                    className="h-full" 
                    style={{ width: `${scan.colorAnalysis.colorPercentages?.high || 0}%`, backgroundColor: "#524340" }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t("history.colorLabels.normal")}: {(scan.colorAnalysis.colorPercentages?.normal || 0).toFixed(1)}%</span>
                  <span>{t("history.colorLabels.warning")}: {(scan.colorAnalysis.colorPercentages?.warning || 0).toFixed(1)}%</span>
                  <span>{t("history.colorLabels.high")}: {(scan.colorAnalysis.colorPercentages?.high || 0).toFixed(1)}%</span>
                </div>
              </div>

              {/* AI Assistant Tips */}
              {scan.aiTips && scan.aiTips.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-medium text-green-800 dark:text-green-300">{t("history.detail.aiTipsTitle")}</h3>
                    <Badge variant="outline" className="ml-auto text-xs border-green-300 text-green-700 dark:border-green-700 dark:text-green-300">
                      {scan.colorAnalysis.glucoseLevel === "normal" ? t("history.status.normal") : scan.colorAnalysis.glucoseLevel === "warning" ? t("history.status.warning") : t("history.status.high")}
                    </Badge>
                  </div>
                  
                  <ul className="space-y-2">
                    {scan.aiTips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-green-700 dark:text-green-300">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                        {formatAIText(tip)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* AI Notes */}
              {scan.aiNote && (
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-medium text-amber-800 dark:text-amber-300">{t("history.detail.aiNotesTitle")}</h3>
                    <Badge variant="outline" className="ml-auto text-xs border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300">
                      {scan.colorAnalysis.glucoseLevel === "normal" ? t("history.status.normal") : scan.colorAnalysis.glucoseLevel === "warning" ? t("history.status.warning") : t("history.status.high")}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
                    <ReadMore text={scan.aiNote} maxLength={200} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </AuthGuard>
  )
}