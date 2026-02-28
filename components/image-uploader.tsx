"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, X, CheckCircle, AlertTriangle, AlertCircle, Loader2 } from "lucide-react"
import { analyzeColor, compressImage, type ColorAnalysis } from "@/lib/color-detection"
import { useI18n } from "@/lib/i18n-context"

interface ImageUploaderProps {
  onImageUploaded?: (result: ColorAnalysis, imageData: string) => void
  onClose?: () => void
}

export function ImageUploader({ onImageUploaded, onClose }: ImageUploaderProps) {
  const { t } = useI18n()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<ColorAnalysis | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAnalyzeImage = async () => {
    if (!selectedImage) return

    try {
      setIsAnalyzing(true)
      
      // Create a temporary image element to get the image data
      const img = new Image()
      img.src = selectedImage
      
      await new Promise((resolve) => {
        img.onload = resolve
      })
      
      // Create a canvas to draw the image
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error(t("imageUploader.errors.canvasContext"))
      }
      
      // Set canvas dimensions to match the image
      canvas.width = img.width
      canvas.height = img.height
      
      // Draw the image on the canvas
      ctx.drawImage(img, 0, 0)
      
      // Analyze the color
      const analysis = analyzeColor(canvas)
      
      // Compress the image
      const compressedImage = await compressImage(selectedImage, 0.7)
      
      setResult(analysis)
      
      // Call the callback if analysis confidence is good enough
      if (analysis.confidence > 30 && onImageUploaded) {
        onImageUploaded(analysis, compressedImage)
      }
    } catch (error) {
      console.error(t("imageUploader.errors.analyzing"), error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleReset = () => {
    setSelectedImage(null)
    setResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
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

  const getResultColor = (level: string) => {
    switch (level) {
      case "normal":
        return "bg-green-50 border-green-200 text-green-800"
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800"
      case "high":
        return "bg-red-50 border-red-200 text-red-800"
      default:
        return "bg-gray-50 border-gray-200 text-gray-800"
    }
  }

  if (result) {
    // If confidence <= 30, show error message
    if (result.confidence <= 30) {
      return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  {t("imageUploader.results.title")}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <img
                  src={selectedImage || "/placeholder.svg"}
                  alt="Uploaded patch"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div
                  className="absolute top-2 right-2 w-6 h-6 rounded-full border-2 border-white"
                  style={{ backgroundColor: result.dominantColor }}
                />
              </div>

              <div className="p-4 rounded-lg border bg-gray-50 border-gray-200 text-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{t("imageUploader.results.lowConfidence.title")}</span>
                  <Badge variant="secondary">
                    {t("imageUploader.results.accurate") + { percent: result.confidence.toFixed(0) }}
                  </Badge>
                </div>
                <p className="text-sm mb-2">{t("imageUploader.results.lowConfidence.description")}</p>
              </div>

              {/* Color Distribution */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-medium mb-3">{t("imageUploader.results.colorDistribution")}</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#a5a698" }}></div>
                        {t("imageUploader.results.normal")}
                      </span>
                      <span className="text-sm font-medium">{result.colorPercentages.normal.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full" 
                        style={{ width: `${result.colorPercentages.normal}%`, backgroundColor: "#a5a698" }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#7c756c" }}></div>
                        {t("imageUploader.results.warning")}
                      </span>
                      <span className="text-sm font-medium">{result.colorPercentages.warning.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full" 
                        style={{ width: `${result.colorPercentages.warning}%`, backgroundColor: "#7c756c" }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#524340" }}></div>
                        {t("imageUploader.results.high")}
                      </span>
                      <span className="text-sm font-medium">{result.colorPercentages.high.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full" 
                        style={{ width: `${result.colorPercentages.high}%`, backgroundColor: "#524340" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleReset} variant="outline" className="flex-1 bg-transparent">
                  <Upload className="h-4 w-4 mr-2" />
                  {t("imageUploader.buttons.selectAnother")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
    
    // Show normal result UI
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {getResultIcon(result.glucoseLevel)}
                {t("imageUploader.results.title")}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <img
                src={selectedImage || "/placeholder.svg"}
                alt="Uploaded patch"
                className="w-full h-48 object-cover rounded-lg"
              />
              <div
                className="absolute top-2 right-2 w-6 h-6 rounded-full border-2 border-white"
                style={{ backgroundColor: result.dominantColor }}
              />
            </div>

            <div className={`p-4 rounded-lg border ${getResultColor(result.glucoseLevel)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{t("imageUploader.results.glucoseStatus")}</span>
                <Badge variant="secondary">
                  {t("imageUploader.results.accurate") + { percent: result.confidence.toFixed(0) }}
                </Badge>
              </div>
              <p className="text-sm mb-2">{result.description}</p>
              <p className="text-xs">{result.recommendation}</p>
            </div>

            {/* Color Distribution */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-medium mb-3">{t("imageUploader.results.colorDistribution")}</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#a5a698" }}></div>
                      {t("imageUploader.results.normal")}
                    </span>
                    <span className="text-sm font-medium">{result.colorPercentages.normal.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ width: `${result.colorPercentages.normal}%`, backgroundColor: "#a5a698" }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#7c756c" }}></div>
                      {t("imageUploader.results.warning")}
                    </span>
                    <span className="text-sm font-medium">{result.colorPercentages.warning.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ width: `${result.colorPercentages.warning}%`, backgroundColor: "#7c756c" }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#524340" }}></div>
                      {t("imageUploader.results.high")}
                    </span>
                    <span className="text-sm font-medium">{result.colorPercentages.high.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ width: `${result.colorPercentages.high}%`, backgroundColor: "#524340" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleReset} variant="outline" className="flex-1 bg-transparent">
                <Upload className="h-4 w-4 mr-2" />
                {t("imageUploader.buttons.selectAnother")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {t("imageUploader.title")}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!selectedImage ? (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  {t("imageUploader.upload.description")}
                </p>
              </div>
              
              <div className="flex justify-center">
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {t("imageUploader.upload.clickToUpload")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t("imageUploader.upload.fileTypes")}
                  </p>
                </div>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  {t("imageUploader.upload.imageSelected")}
                </p>
              </div>
              
              <div className="relative">
                <img
                  src={selectedImage}
                  alt="Selected patch"
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleAnalyzeImage} 
                  disabled={isAnalyzing}
                  className="flex-1"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t("imageUploader.buttons.analyzing")}
                    </>
                  ) : (
                    t("imageUploader.buttons.analyze")
                  )}
                </Button>
                <Button 
                  onClick={handleReset} 
                  variant="outline"
                  disabled={isAnalyzing}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}