"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AppLayout } from "@/components/app-layout"
import { CameraScanner } from "@/components/camera-scanner"
import { ImageUploader } from "@/components/image-uploader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Camera, Info, Lightbulb, Bot, Loader2, FileText, Upload } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useAppSettings } from "@/contexts/app-settings-context"
import { scheduleScanReminder } from "@/lib/notification-service"
import { useToast } from "@/hooks/use-toast"
import { formatAIText } from "@/lib/format-ai-text"
import { ReadMore } from "@/components/read-more"
import { saveScanResult } from "@/lib/scan-service"
import type { ColorAnalysis } from "@/lib/color-detection"
import { useI18n } from "@/lib/i18n-context"

export default function ScanPage() {
  const [showScanner, setShowScanner] = useState(false)
  const [showImageUploader, setShowImageUploader] = useState(false)
  const [lastResult, setLastResult] = useState<ColorAnalysis | null>(null)
  const [aiTips, setAiTips] = useState<string[]>([])
  const [aiNote, setAiNote] = useState<string>("")
  const [isTipsLoading, setIsTipsLoading] = useState(false)
  const [isNoteLoading, setIsNoteLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const { settings } = useAppSettings()
  const { t } = useI18n()

  const handleScanComplete = async (result: ColorAnalysis, imageData: string) => {
    setLastResult(result)
    setShowScanner(false)
    
    // Generate AI tips and note based on the new scan result
    if (user) {
      setIsTipsLoading(true)
      setIsNoteLoading(true)
      
      try {
        // Generate AI tips and note in parallel
        const [tipsResponse, noteResponse] = await Promise.all([
          fetch("/api/ai-tips", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: user.uid,
              currentScan: result,
            }),
          }),
          fetch("/api/ai-notes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: user.uid,
              currentScan: result,
            }),
          }),
        ])

        const tipsData = await tipsResponse.json()
        const noteData = await noteResponse.json()

        if (tipsResponse.ok && tipsData.success) {
          setAiTips(tipsData.tips)
        } else {
          console.error("Failed to generate AI tips:", tipsData.error)
        }

        if (noteResponse.ok && noteData.success) {
          setAiNote(noteData.note)
        } else {
          console.error("Failed to generate AI note:", noteData.error)
          setAiNote(getStaticNote(result.glucoseLevel))
        }

        // Save scan result with AI tips and note only after AI has responded
        setIsSaving(true)
        const saveResult = await saveScanResult(
          imageData,
          result,
          user.uid,
          tipsData.success ? tipsData.tips : [],
          noteData.success ? noteData.note : getStaticNote(result.glucoseLevel)
        )

        if (saveResult.success) {
          toast({
            title: t("scan.toast.success.saveTitle"),
            description: t("scan.toast.success.saveDescription"),
          })
          if (settings.notifications) {
            scheduleScanReminder(2) // Schedule reminder for 2 hours later
            toast({
              title: t("scan.toast.success.reminderTitle"),
              description: t("scan.toast.success.reminderDescription"),
            })
          }
        } else {
          toast({
            title: t("scan.toast.error.saveTitle"),
            description: t("scan.toast.error.saveDescription"),
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error generating AI content or saving scan:", error)
        toast({
          title: t("scan.toast.error.processTitle"),
          description: t("scan.toast.error.processDescription"),
          variant: "destructive",
        })
      } finally {
        setIsTipsLoading(false)
        setIsNoteLoading(false)
        setIsSaving(false)
      }
    }

    // Here you would typically save to database/storage
    console.log("Scan completed:", { result, imageData })
  }

  // Fallback static note based on glucose level
  const getStaticNote = (glucoseLevel: string) => {
    switch (glucoseLevel) {
      case "normal":
        return t("scan.staticNotes.normal")
      case "warning":
        return t("scan.staticNotes.warning")
      case "high":
        return t("scan.staticNotes.high")
      default:
        return t("scan.staticNotes.unknown")
    }
  }

  const tips = [
    t("scan.tips.items.1"),
    t("scan.tips.items.2"),
    t("scan.tips.items.3"),
    t("scan.tips.items.4"),
    t("scan.tips.items.5"),
    t("scan.tips.items.6"),
  ]

  return (
    <AuthGuard>
      <AppLayout>
        <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t("scan.title")}</h1>
            <p className="text-muted-foreground">{t("scan.description")}</p>
          </div>

          {/* Last Result */}
          {lastResult && (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg">{t("scan.lastResult.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="font-medium">{lastResult.description}</p>
                      <p className="text-sm text-muted-foreground">{t("scan.lastResult.accuracy")}: {lastResult.confidence.toFixed(0)}%</p>
                    </div>
                    {/* Color distribution indicator instead of single dominant color */}
                    <div className="flex items-center gap-1">
                      <div 
                        className="w-3 h-3 rounded-full border border-border"
                        style={{ backgroundColor: `rgba(165, 166, 152, ${(lastResult.colorPercentages?.normal || 0) / 100})` }}
                        title={`${t("scan.status.normal")}: ${(lastResult.colorPercentages?.normal || 0).toFixed(1)}%`}
                      />
                      <div 
                        className="w-3 h-3 rounded-full border border-border"
                        style={{ backgroundColor: `rgba(124, 117, 108, ${(lastResult.colorPercentages?.warning || 0) / 100})` }}
                        title={`${t("scan.status.warning")}: ${(lastResult.colorPercentages?.warning || 0).toFixed(1)}%`}
                      />
                      <div 
                        className="w-3 h-3 rounded-full border border-border"
                        style={{ backgroundColor: `rgba(82, 67, 64, ${(lastResult.colorPercentages?.high || 0) / 100})` }}
                        title={`${t("scan.status.high")}: ${(lastResult.colorPercentages?.high || 0).toFixed(1)}%`}
                      />
                    </div>
                  </div>
                   
                  {/* Color distribution visualization */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{t("scan.lastResult.colorDistribution")}</span>
                      <span>N: {(lastResult.colorPercentages?.normal || 0).toFixed(1)}% | W: {(lastResult.colorPercentages?.warning || 0).toFixed(1)}% | H: {(lastResult.colorPercentages?.high || 0).toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden flex">
                      <div 
                        className="h-full" 
                        style={{ width: `${lastResult.colorPercentages?.normal || 0}%`, backgroundColor: "#a5a698" }}
                      />
                      <div 
                        className="h-full" 
                        style={{ width: `${lastResult.colorPercentages?.warning || 0}%`, backgroundColor: "#7c756c" }}
                      />
                      <div 
                        className="h-full" 
                        style={{ width: `${lastResult.colorPercentages?.high || 0}%`, backgroundColor: "#524340" }}
                      />
                    </div>
                  </div>

                  {/* AI Assistant Tips */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="font-medium text-green-800 dark:text-green-300">{t("scan.aiSection.tipsTitle")}</h3>
                      </div>
                      <Badge variant="outline" className="text-xs border-green-300 text-green-700 dark:border-green-700 dark:text-green-300">
                        {lastResult.glucoseLevel === "normal" ? t("scan.status.normal") : lastResult.glucoseLevel === "warning" ? t("scan.status.warning") : t("scan.status.high")}
                      </Badge>
                    </div>
                    
                    {isTipsLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-green-500 mr-2" />
                        <span className="text-sm text-green-700 dark:text-green-300">{t("scan.aiSection.loadingTips")}</span>
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {aiTips.map((tip, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-green-700 dark:text-green-300">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                            {formatAIText(tip)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* AI Notes */}
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="font-medium text-amber-800 dark:text-amber-300">{t("scan.aiSection.notesTitle")}</h3>
                      </div>
                      <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300">
                        {lastResult.glucoseLevel === "normal" ? t("scan.status.normal") : lastResult.glucoseLevel === "warning" ? t("scan.status.warning") : t("scan.status.high")}
                      </Badge>
                    </div>
                    
                    {isNoteLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-amber-500 mr-2" />
                        <span className="text-sm text-amber-700 dark:text-amber-300">{t("scan.aiSection.loadingNotes")}</span>
                      </div>
                    ) : (
                      <div className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
                        <ReadMore text={aiNote} maxLength={150} />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scan Options */}
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="text-center space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{t("scan.methods.title")}</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {t("scan.methods.description")}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Camera Scan Option */}
                  <div className="border rounded-lg p-6 space-y-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <Camera className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-2">{t("scan.methods.camera.title")}</h4>
                      <p className="text-muted-foreground text-sm">
                        {t("scan.methods.camera.description")}
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowScanner(true)}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          {t("scan.methods.saving")}
                        </>
                      ) : (
                        <>
                          <Camera className="h-5 w-5 mr-2" />
                          {t("scan.methods.camera.button")}
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {/* Image Upload Option */}
                  <div className="border rounded-lg p-6 space-y-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-2">{t("scan.methods.upload.title")}</h4>
                      <p className="text-muted-foreground text-sm">
                        {t("scan.methods.upload.description")}
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowImageUploader(true)}
                      variant="outline"
                      className="w-full"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          {t("scan.methods.saving")}
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5 mr-2" />
                          {t("scan.methods.upload.button")}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Instructions */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  {t("scan.instructions.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 min-w-[1.5rem] bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium mt-0.5">
                      1
                    </div>
                    <p className="text-sm text-muted-foreground">{t("scan.instructions.steps.1")}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 min-w-[1.5rem] bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium mt-0.5">
                      2
                    </div>
                    <p className="text-sm text-muted-foreground">{t("scan.instructions.steps.2")}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 min-w-[1.5rem] bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium mt-0.5">
                      3
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("scan.instructions.steps.3")}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 min-w-[1.5rem] bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium mt-0.5">
                      4
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("scan.instructions.steps.4")}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 min-w-[1.5rem] bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium mt-0.5">
                      5
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("scan.instructions.steps.5")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  {t("scan.tips.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Camera Scanner Modal */}
        {showScanner && <CameraScanner onScanComplete={handleScanComplete} onClose={() => setShowScanner(false)} />}
        
        {/* Image Uploader Modal */}
        {showImageUploader && <ImageUploader onImageUploaded={handleScanComplete} onClose={() => setShowImageUploader(false)} />}
      </AppLayout>
    </AuthGuard>
  )
}