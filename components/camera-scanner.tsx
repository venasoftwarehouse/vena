"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useCamera } from "@/hooks/use-camera"
import { analyzeColor, compressImage, type ColorAnalysis } from "@/lib/color-detection"
import { useAuth } from "@/contexts/auth-context"
import { useAppSettings } from "@/contexts/app-settings-context"
import { useNotifications } from "@/hooks/use-notifications"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, X, RotateCcw, CheckCircle, AlertTriangle, AlertCircle, Save, Shield, RefreshCw, Camera as CameraIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useI18n } from "@/lib/i18n-context"
import Script from 'next/script'

// Declare global cv variable for TypeScript
declare global {
  interface Window {
    cv: any
  }
}

interface PatchDetection {
  found: boolean
  confidence: number
  boundingBox?: {
    x: number
    y: number
    width: number
    height: number
  }
  center?: {
    x: number
    y: number
  }
  dominantColor?: string
}

interface CameraScannerProps {
  onScanComplete?: (result: ColorAnalysis, imageData: string) => void
  onClose?: () => void
}

export function CameraScanner({ onScanComplete, onClose }: CameraScannerProps) {
  const { t } = useI18n()
  // OpenCV.js loader state
  const [cvReady, setCvReady] = useState(false);
  const [opencvLoading, setOpencvLoading] = useState(true);

  // State variables
  const [videoPlaying, setVideoPlaying] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<ColorAnalysis | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [cameraInitialized, setCameraInitialized] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const [patchDetection, setPatchDetection] = useState<PatchDetection>({ found: false, confidence: 0 })
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false)

  // Refs
  const trackingCanvasRef = useRef<HTMLCanvasElement>(null)
  const detectionCanvasRef = useRef<HTMLCanvasElement>(null)
  const retryCount = useRef(0)
  const maxRetries = 3
  const initializationRef = useRef(false)
  const playPromiseRef = useRef<Promise<void> | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)
  const whiteBoxRef = useRef<HTMLDivElement>(null)

  // Initialize OpenCV.js
  useEffect(() => {
    const checkOpenCVReady = () => {
      if (typeof window !== 'undefined' && window.cv && window.cv.Mat) {
        setCvReady(true);
        setOpencvLoading(false);
        console.log('OpenCV.js is ready');
      } else if (opencvLoading) {
        // Still loading, check again later
        setTimeout(checkOpenCVReady, 100);
      }
    };

    // Start checking if OpenCV is ready
    checkOpenCVReady();

    // Set up a timeout for OpenCV loading
    const timeoutId = setTimeout(() => {
      if (opencvLoading) {
        console.warn('OpenCV.js loading timeout');
        setOpencvLoading(false);
        // Continue without OpenCV
      }
    }, 10000); // 10 seconds timeout

    return () => clearTimeout(timeoutId);
  }, [opencvLoading]);

  // Enhanced patch detection using OpenCV
  const detectPatch = useCallback((canvas: HTMLCanvasElement): PatchDetection => {
    if (!cvReady || !window.cv) {
      return { found: false, confidence: 0 };
    }

    try {
      const cv = window.cv;
      const src = cv.imread(canvas);
      const gray = new cv.Mat();
      const blurred = new cv.Mat();
      const edges = new cv.Mat();
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();

      // Convert to grayscale
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

      // Apply Gaussian blur to reduce noise
      cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

      // Apply Canny edge detection
      cv.Canny(blurred, edges, 50, 150);

      // Find contours
      cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      let bestContour = null;
      let maxArea = 0;
      let bestBoundingBox = null;
      let bestCenter = null;

      // Iterate through contours to find the best match for a patch
      for (let i = 0; i < contours.size(); i++) {
        const cnt = contours.get(i);
        const area = cv.contourArea(cnt);

        // Filter out very small or very large contours
        if (area > 100 && area < src.rows * src.cols * 0.5) {
          // Calculate perimeter
          const perimeter = cv.arcLength(cnt, true);

          // Approximate contour to a polygon
          const approx = new cv.Mat();
          cv.approxPolyDP(cnt, approx, 0.04 * perimeter, true);

          // Check if contour is roughly circular or rectangular
          const vertices = approx.rows;

          // Calculate aspect ratio for bounding rectangle
          const rect = cv.boundingRect(cnt);
          const aspectRatio = rect.width / rect.height;

          // Calculate circularity (4*pi*area/perimeter^2)
          const circularity = (4 * Math.PI * area) / (perimeter * perimeter);

          // Score based on shape characteristics
          let shapeScore = 0;

          // Circular patches (acne patch style)
          if (circularity > 0.7 && vertices >= 4 && vertices <= 8) {
            shapeScore = circularity;
          }

          // Rectangular patches
          if (vertices === 4 && aspectRatio > 0.8 && aspectRatio < 1.2) {
            shapeScore = 0.8;
          }

          // Update best contour if this one scores higher
          if (shapeScore > 0.6 && area > maxArea) {
            maxArea = area;
            bestContour = cnt;
            bestBoundingBox = rect;
            bestCenter = {
              x: rect.x + rect.width / 2,
              y: rect.y + rect.height / 2
            };
          }

          approx.delete();
        }

        cnt.delete();
      }

      // Clean up OpenCV objects
      gray.delete();
      blurred.delete();
      edges.delete();
      contours.delete();
      hierarchy.delete();

      if (bestContour && bestBoundingBox && bestCenter) {
        // Extract dominant color from the detected patch area
        const patchROI = src.roi(new cv.Rect(bestBoundingBox.x, bestBoundingBox.y, bestBoundingBox.width, bestBoundingBox.height));
        const dominantColor = getDominantColor(patchROI, cv);
        patchROI.delete();

        return {
          found: true,
          confidence: Math.min(0.95, 0.6 + (maxArea / (src.rows * src.cols)) * 2),
          boundingBox: bestBoundingBox,
          center: bestCenter,
          dominantColor
        };
      }

      return { found: false, confidence: 0 };
    } catch (err) {
      console.error('Patch detection error:', err);
      return { found: false, confidence: 0 };
    }
  }, [cvReady]);

  // Helper function to get dominant color from a region
  const getDominantColor = (roi: any, cv: any): string => {
    try {
      // Convert to HSV for better color analysis
      const hsv = new cv.Mat();
      cv.cvtColor(roi, hsv, cv.COLOR_RGBA2RGB);
      cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);

      // Calculate mean color in HSV space
      const mean = cv.mean(hsv);
      hsv.delete();

      // Convert HSV to RGB for display
      const hsvScalar = new cv.Scalar(mean[0], mean[1], mean[2], 255);
      const rgbScalar = new cv.Mat(1, 1, cv.CV_8UC3, hsvScalar);
      cv.cvtColor(rgbScalar, rgbScalar, cv.COLOR_HSV2RGB);

      const rgbPixel = rgbScalar.data;
      const r = rgbPixel[0];
      const g = rgbPixel[1];
      const b = rgbPixel[2];

      rgbScalar.delete();

      return `rgb(${r},${g},${b})`;
    } catch (err) {
      console.error('Error getting dominant color:', err);
      return '#000000';
    }
  };

  // OpenCV processing with enhanced patch detection
  useEffect(() => {
    if (!cvReady || !canvasRef.current || !window.cv || !videoPlaying) return;

    try {
      const detection = detectPatch(canvasRef.current);
      setPatchDetection(detection);

      // Visualize detection on tracking canvas
      const canvas = trackingCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (detection.found && detection.boundingBox) {
        const { x, y, width, height } = detection.boundingBox;

        // Scale coordinates to canvas size
        const video = videoRef.current;
        if (!video) return;

        const videoRect = video.getBoundingClientRect();
        const scaleX = canvas.width / video.videoWidth;
        const scaleY = canvas.height / video.videoHeight;

        const scaledX = x * scaleX;
        const scaledY = y * scaleY;
        const scaledWidth = width * scaleX;
        const scaledHeight = height * scaleY;

        // Draw bounding box (hidden for production)
        // ctx.strokeStyle = detection.confidence > 0.8 ? '#4ade80' : detection.confidence > 0.6 ? '#facc15' : '#f87171';
        // ctx.lineWidth = 3;
        // ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);

        // Draw confidence indicator (hidden for production)
        // ctx.fillStyle = ctx.strokeStyle;
        // ctx.font = '14px Arial';
        // ctx.fillText(`${Math.round(detection.confidence * 100)}%`, scaledX, scaledY - 5);

        // Draw center point (hidden for production)
        // if (detection.center) {
        //   const centerX = detection.center.x * scaleX;
        //   const centerY = detection.center.y * scaleY;

        //   ctx.beginPath();
        //   ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
        //   ctx.fillStyle = ctx.strokeStyle;
        //   ctx.fill();
        // }

        // Draw dominant color indicator (hidden for production)
        // if (detection.dominantColor) {
        //   ctx.fillStyle = detection.dominantColor;
        //   ctx.fillRect(scaledX + scaledWidth - 20, scaledY - 25, 20, 20);
        //   ctx.strokeStyle = '#ffffff';
        //   ctx.lineWidth = 1;
        //   ctx.strokeRect(scaledX + scaledWidth - 20, scaledY - 25, 20, 20);
        // }
      }
    } catch (err) {
      console.error('OpenCV processing error:', err);
    }
  }, [cvReady, videoPlaying, detectPatch]);

  const { isOpen, error, startCamera, stopCamera, capturePhoto, videoRef, canvasRef, permissionDenied, currentCamera, switchCamera } = useCamera()

  // Real-time tracking box overlay, responsive to video size
  useEffect(() => {
    let animationFrameId: number;
    const drawTrackingBox = () => {
      const video = videoRef.current;
      const canvas = trackingCanvasRef.current;
      const whiteBox = whiteBoxRef.current;
      if (!video || !canvas || !whiteBox) {
        animationFrameId = requestAnimationFrame(drawTrackingBox);
        return;
      }

      // Get actual video display size (not just videoWidth/videoHeight)
      const videoRect = video.getBoundingClientRect();
      canvas.width = videoRect.width;
      canvas.height = videoRect.height;
      canvas.style.width = `${videoRect.width}px`;
      canvas.style.height = `${videoRect.height}px`;

      // Get white box position and size
      const whiteBoxRect = whiteBox.getBoundingClientRect();

      // Calculate position relative to video
      const relativeX = whiteBoxRect.left - videoRect.left;
      const relativeY = whiteBoxRect.top - videoRect.top;

      // If patch detection is not ready, draw the default tracking box that matches the white box
      if (!patchDetection.found) {
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          animationFrameId = requestAnimationFrame(drawTrackingBox);
          return;
        }

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw tracking box that exactly matches the white box (hidden for production)
        // ctx.save();
        // ctx.strokeStyle = 'red';
        // ctx.lineWidth = 4;
        // ctx.globalAlpha = 0.8;
        // ctx.strokeRect(relativeX, relativeY, whiteBoxRect.width, whiteBoxRect.height);
        // ctx.restore();
      }

      animationFrameId = requestAnimationFrame(drawTrackingBox);
    };

    drawTrackingBox();
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [videoPlaying, videoError, isOpen, patchDetection.found]);

  // Contexts and hooks
  const { user } = useAuth()
  const { toast } = useToast()
  const { settings } = useAppSettings()
  const { enabled: notificationsEnabled } = useNotifications()

  // Fallback UI for fatal camera errors
  if (error) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              {t("cameraScanner.errors.cameraError")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button onClick={startCamera} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                {t("cameraScanner.errors.tryAgain")}
              </Button>
              <Button variant="outline" onClick={onClose} className="flex-1">
                {t("cameraScanner.errors.close")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Stable callback for video events
  const handleVideoPlay = useCallback(() => {
    console.log("Video started playing successfully")
    setVideoError(false)
    setVideoPlaying(true)
  }, [])

  const handleVideoError = useCallback((e: Event) => {
    console.error("Video error event:", e)
    setVideoError(true)
    setVideoPlaying(false)
  }, [])

  const handleVideoStalled = useCallback(() => {
    console.warn("Video stalled")
    setVideoError(true)
  }, [])

  const handleVideoWaiting = useCallback(() => {
    console.warn("Video waiting for data")
  }, [])

  // Initialize camera with proper cleanup
  useEffect(() => {
    if (initializationRef.current) return;
    initializationRef.current = true;

    const initializeCamera = async () => {
      try {
        console.log("Initializing camera...");
        await startCamera();
        setCameraInitialized(true);
      } catch (error) {
        console.error("Failed to initialize camera:", error);
        setVideoError(true);
      }
    };

    initializeCamera();

    // Cleanup function
    return () => {
      console.log("Cleaning up camera...");
      if (cleanupRef.current) {
        cleanupRef.current();
      }
      stopCamera();
      initializationRef.current = false;
    };
  }, []); // Only run once on mount

  // Handle video events with proper cleanup
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Clear previous cleanup if exists
    if (cleanupRef.current) {
      cleanupRef.current()
    }

    console.log("Setting up video event listeners")

    video.addEventListener("play", handleVideoPlay, { passive: true })
    video.addEventListener("error", handleVideoError, { passive: true })
    video.addEventListener("stalled", handleVideoStalled, { passive: true })
    video.addEventListener("waiting", handleVideoWaiting, { passive: true })

    // Store cleanup function
    cleanupRef.current = () => {
      console.log("Removing video event listeners")
      video.removeEventListener("play", handleVideoPlay)
      video.removeEventListener("error", handleVideoError)
      video.removeEventListener("stalled", handleVideoStalled)
      video.removeEventListener("waiting", handleVideoWaiting)
    }

    // Handle video play with proper promise management
    const handleVideoPlayAsync = async () => {
      if (!video || video.readyState < 2) return

      try {
        // Cancel previous play promise if exists
        if (playPromiseRef.current) {
          try {
            await playPromiseRef.current
          } catch (err) {
            // Ignore interruption errors from previous play attempts
            if (typeof err === 'object' && err !== null && 'name' in err && (err as any).name !== 'AbortError') {
              console.warn("Previous play promise error:", err)
            }
          }
        }

        // Only attempt to play if video is paused
        if (video.paused) {
          console.log("Attempting to play video...")
          playPromiseRef.current = video.play()
          await playPromiseRef.current
          playPromiseRef.current = null
        }
      } catch (err) {
        // Only log non-abort errors
        if (typeof err === 'object' && err !== null && 'name' in err && (err as any).name !== 'AbortError') {
          console.error("Error playing video:", err)
          setVideoError(true)
        }
      }
    }

    // Check if video should be playing
    const checkAndPlayVideo = () => {
      if (video.readyState >= 2 && video.paused && !videoError) {
        handleVideoPlayAsync()
      }
    }

    // Set up video ready state monitoring
    if (video.readyState >= 2) {
      checkAndPlayVideo()
    } else {
      const handleLoadedData = () => {
        checkAndPlayVideo()
        video.removeEventListener("loadeddata", handleLoadedData)
      }
      video.addEventListener("loadeddata", handleLoadedData, { once: true })
    }

    return cleanupRef.current
  }, [videoRef, handleVideoPlay, handleVideoError, handleVideoStalled, handleVideoWaiting, videoError])

  // Monitor video playing status
  useEffect(() => {
    if (!isOpen || !videoRef.current || videoError) return

    const checkVideoStatus = () => {
      const video = videoRef.current
      if (!video) return

      const hasValidDimensions = video.videoWidth > 0 && video.videoHeight > 0
      const isReady = video.readyState >= 2
      const shouldBePlaying = !video.paused && !video.ended

      if (hasValidDimensions && isReady) {
        if (!shouldBePlaying && !videoError) {
          console.warn("Video has valid dimensions but is not playing")
          setVideoError(true)
        }
      }
    }

    const interval = setInterval(checkVideoStatus, 2000) // Check less frequently

    return () => clearInterval(interval)
  }, [isOpen, videoRef, videoError])

  const handleRetryCamera = async () => {
    if (retryCount.current >= maxRetries) {
      toast({
        title: t("cameraScanner.errors.cameraError"),
        description: t("cameraScanner.warnings.retryFailed"),
        variant: "destructive",
      })
      return
    }

    setIsRetrying(true)
    retryCount.current += 1

    try {
      console.log(`Retrying camera (attempt ${retryCount.current}/${maxRetries})`)

      // Cancel any pending play promises
      if (playPromiseRef.current) {
        try {
          await playPromiseRef.current
        } catch (err) {
          // Ignore abort errors
        }
        playPromiseRef.current = null
      }

      // Clean up current camera
      if (cleanupRef.current) {
        cleanupRef.current()
      }
      stopCamera()

      // Wait before restarting
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Restart camera
      await startCamera()
      setVideoError(false)
      setVideoPlaying(false)
    } catch (error) {
      console.error("Failed to retry camera:", error)
      setVideoError(true)
    } finally {
      setIsRetrying(false)
    }
  }

  const handleSwitchCamera = async () => {
    if (isSwitchingCamera) return

    try {
      setIsSwitchingCamera(true)
      await switchCamera()
    } catch (error) {
      console.error("Failed to switch camera:", error)
      toast({
        title: t("cameraScanner.errors.cameraError"),
        description: t("cameraScanner.errors.switchCameraError"),
        variant: "destructive",
      })
    } finally {
      setIsSwitchingCamera(false)
    }
  }

  const handleCapture = async () => {
    if (!videoPlaying && !videoError) {
      toast({
        title: t("cameraScanner.warnings.title"),
        description: t("cameraScanner.warnings.videoNotReady"),
        variant: "destructive",
      })
      return
    }

    try {
      setIsAnalyzing(true)
      let imageData = null
      let attempts = 0
      const maxAttempts = 3

      while (!imageData && attempts < maxAttempts) {
        imageData = capturePhoto()
        if (!imageData) {
          await new Promise((resolve) => setTimeout(resolve, 200))
          attempts++
        }
      }

      if (!imageData || !canvasRef.current) {
        throw new Error("Gagal mengambil foto. Silakan coba lagi.")
      }

      const analysis = analyzeColor(canvasRef.current)

      // Enhance analysis with patch detection data
      if (patchDetection.dominantColor) {
        analysis.dominantColor = patchDetection.dominantColor;
      }
      // Adjust confidence based on patch detection confidence
      if (patchDetection.found) {
        analysis.confidence = Math.min(0.95, analysis.confidence * (0.7 + patchDetection.confidence * 0.3));
      }

      // Use different compression quality based on settings
      const compressionQuality = settings.highQuality ? 0.9 : 0.7
      const compressedImage = await compressImage(imageData, compressionQuality)

      setResult(analysis)
      setCapturedImage(compressedImage)

      // Only call onScanComplete and save if confidence > 30
      if (analysis.confidence > 30 && onScanComplete) {
        onScanComplete(analysis, compressedImage)
      }
    } catch (err) {
      console.error("Capture error:", err)
      toast({
        title: t("cameraScanner.errors.cameraError"),
        description: t("cameraScanner.errors.captureError"),
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleRetry = () => {
    setResult(null)
    setCapturedImage(null)
    retryCount.current = 0
    setVideoError(false)
    setVideoPlaying(false)
    setPatchDetection({ found: false, confidence: 0 })
    setCameraInitialized(false)
    initializationRef.current = false

    // Stop and restart camera for a fresh scan
    stopCamera()
    startCamera()
  }

  const handleClose = () => {
    // Cancel any pending operations
    if (playPromiseRef.current) {
      playPromiseRef.current.catch(() => { }) // Ignore any errors
      playPromiseRef.current = null
    }

    // Clean up event listeners
    if (cleanupRef.current) {
      cleanupRef.current()
      cleanupRef.current = null
    }

    stopCamera()

    if (onClose) {
      onClose()
    }
  }

  const handleRequestPermission = () => {
    retryCount.current = 0
    setVideoError(false)
    startCamera()
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

  // Rest of the render logic remains the same...
  if (permissionDenied) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-destructive" />
              {t("cameraScanner.permission.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                {t("cameraScanner.permission.description")}
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Button onClick={handleRequestPermission} className="w-full">
                {t("cameraScanner.permission.grantPermission")}
              </Button>
              <Button variant="outline" onClick={handleClose} className="w-full">
                {t("cameraScanner.permission.cancel")}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground text-center">
              {t("cameraScanner.permission.hint")}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !permissionDenied) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              {t("cameraScanner.errors.cameraError")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button onClick={handleRetryCamera} className="flex-1">
                {t("cameraScanner.errors.tryAgain")}
              </Button>
              <Button variant="outline" onClick={handleClose}>
                {t("cameraScanner.errors.close")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (result && capturedImage) {
    // If confidence <= 30, show static tips and only Scan Ulang button
    if (result.confidence <= 30) {
      return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  {t("cameraScanner.results.title")}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={handleClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Image preview */}
              <div className="relative">
                <img
                  src={capturedImage || "/placeholder.svg"}
                  alt="Captured patch"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div
                  className="absolute top-2 right-2 w-6 h-6 rounded-full border-2 border-white"
                  style={{ backgroundColor: result.dominantColor }}
                />
              </div>

              <div className="p-4 rounded-lg border bg-gray-50 border-gray-200 text-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">
                    {t("cameraScanner.results.lowConfidence.title")}
                  </span>
                  <Badge variant="secondary">
                    {t("cameraScanner.results.accurate") + ` ${result.confidence.toFixed(0)}%`}
                  </Badge>
                </div>
                <p className="text-sm mb-2">
                  {t("cameraScanner.results.lowConfidence.description")}
                </p>
              </div>

              {/* Color Distribution */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-medium mb-3">{t("cameraScanner.results.colorDistribution")}</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#a5a698" }}></div>
                        {t("cameraScanner.results.normal")}
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
                        {t("cameraScanner.results.warning")}
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
                        {t("cameraScanner.results.high")}
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
                <Button onClick={handleRetry} variant="outline" className="flex-1 bg-transparent">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {t("cameraScanner.results.scanAgain")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
    // Else, show normal result UI
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {getResultIcon(result.glucoseLevel)}
                {t("cameraScanner.results.title")}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <img
                src={capturedImage || "/placeholder.svg"}
                alt="Captured patch"
                className="w-full h-48 object-cover rounded-lg"
              />
              <div
                className="absolute top-2 right-2 w-6 h-6 rounded-full border-2 border-white"
                style={{ backgroundColor: result.dominantColor }}
              />
            </div>

            <div className={`p-4 rounded-lg border ${getResultColor(result.glucoseLevel)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{t("cameraScanner.results.glucoseStatus")}</span>
                <Badge variant="secondary">
                  {t("cameraScanner.results.accurate") + ` ${result.confidence.toFixed(0)}%`}
                </Badge>
              </div>
              <p className="text-sm mb-2">{result.description}</p>
              <p className="text-xs">{result.recommendation}</p>
            </div>

            {/* Color Distribution */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-medium mb-3">{t("cameraScanner.results.colorDistribution")}</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#a5a698" }}></div>
                      {t("cameraScanner.results.badges.normal")}
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
                      {t("cameraScanner.results.badges.warning")}
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
                      {t("cameraScanner.results.badges.high")}
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
              <Button onClick={handleRetry} variant="outline" className="flex-1 bg-transparent">
                <RotateCcw className="h-4 w-4 mr-2" />
                {t("cameraScanner.results.scanAgain")}
              </Button>
            </div>
            {notificationsEnabled && (
              <div className="text-center text-sm text-muted-foreground">
                {t("cameraScanner.results.reminderNotification")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <Script
        src="https://docs.opencv.org/4.5.0/opencv.js"
        strategy="lazyOnload"
        onLoad={() => {
          console.log('OpenCV.js script loaded');
          setOpencvLoading(false);
        }}
        onError={() => {
          console.error('Failed to load OpenCV.js');
          setOpencvLoading(false);
        }}
      />
      <div className="fixed inset-0 bg-black flex flex-col z-50">
        <div className="flex-1 relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(1)' }} // Explicitly disable mirroring
          />
          {/* Debug tracking box overlay */}
          <canvas
            ref={trackingCanvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          />

          {videoError && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-4">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-white text-lg font-medium mb-2">
                {t("cameraScanner.errors.cameraIssue")}
              </h3>
              <p className="text-gray-300 text-center mb-4">
                {retryCount.current === 0
                  ? t("cameraScanner.errors.cameraNotAvailable")
                  : t("cameraScanner.errors.stillHasIssue") +` ${retryCount.current} / ${maxRetries}`
                }
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleRetryCamera}
                  disabled={isRetrying || retryCount.current >= maxRetries}
                  className="flex items-center gap-2"
                >
                  {isRetrying ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {retryCount.current >= maxRetries
                    ? t("cameraScanner.errors.refreshPage")
                    : t("cameraScanner.errors.retryAttempt") + ` ${retryCount.current} / ${maxRetries}`
                  }
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  {t("cameraScanner.errors.close")}
                </Button>
              </div>
            </div>
          )}

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div
                ref={whiteBoxRef}
                className="w-64 h-64 border-2 border-white rounded-lg bg-transparent"
              >
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg" />
              </div>
              <p className="text-white text-center mt-4 text-sm">
                {patchDetection.found
                  ? t("cameraScanner.scanning.patchDetected") + ` ${Math.round(patchDetection.confidence * 100)}%`
                  : t("cameraScanner.scanning.positionPatch")
                }
              </p>
            </div>
          </div>

          <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
            <Button variant="ghost" size="sm" onClick={handleClose} className="text-white hover:bg-white/20">
              <X className="h-5 w-5" />
            </Button>
            <div className="text-white text-sm bg-black/50 px-3 py-1 rounded-full">
              {t("cameraScanner.scanning.title")} {videoPlaying ? t("cameraScanner.scanning.live") : ""} {currentCamera === "front" ? t("cameraScanner.scanning.frontCamera") : t("cameraScanner.scanning.backCamera")}
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-black/80">
          <div className="flex justify-center items-center">
            <div className="relative">
              <Button
                onClick={handleCapture}
                disabled={!isOpen || isAnalyzing || videoError}
                size="lg"
                className={`w-16 h-16 rounded-full ${patchDetection.found ? 'bg-green-500 hover:bg-green-600' : 'bg-white hover:bg-gray-100'} text-black disabled:opacity-50`}
              >
                {isAnalyzing ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black" />
                ) : (
                  <Camera className="h-6 w-6" />
                )}
              </Button>
              <Button
                onClick={handleSwitchCamera}
                disabled={isSwitchingCamera || !videoPlaying}
                size="lg"
                variant="ghost"
                className="absolute -right-20 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full text-white hover:bg-white/20 disabled:opacity-50"
              >
                {isSwitchingCamera ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <RefreshCw className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-white text-center text-sm mt-4">
            {isAnalyzing
              ? t("cameraScanner.scanning.analyzing")
              : videoError
                ? t("cameraScanner.scanning.cameraNotAvailable")
                : videoPlaying
                  ? patchDetection.found
                    ? t("cameraScanner.scanning.patchDetectedReady")
                    : t("cameraScanner.scanning.positionAndPress")
                  : opencvLoading
                    ? t("cameraScanner.scanning.loadingLibrary")
                    : t("cameraScanner.scanning.waitingCamera")
            }
          </p>
        </div>

        <canvas ref={canvasRef} className="hidden" />
        <canvas ref={detectionCanvasRef} className="hidden" />
      </div>
    </>
  )
}