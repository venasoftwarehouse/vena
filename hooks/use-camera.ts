"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"

export interface CameraHook {
  isOpen: boolean
  stream: MediaStream | null
  error: string | null
  permissionDenied: boolean
  currentCamera: "front" | "back"
  startCamera: () => Promise<void>
  stopCamera: () => void
  switchCamera: () => Promise<void>
  capturePhoto: () => string | null
  videoRef: React.RefObject<HTMLVideoElement>
  canvasRef: React.RefObject<HTMLCanvasElement>
}

export function useCamera(): CameraHook {
  const [isOpen, setIsOpen] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentCamera, setCurrentCamera] = useState<"front" | "back">("back")
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Refs for managing cleanup and preventing race conditions
  const cleanupFunctionsRef = useRef<Array<() => void>>([])
  const playPromiseRef = useRef<Promise<void> | null>(null)
  const mountedRef = useRef(true)

  // Cleanup function to remove all event listeners and timeouts
  const runCleanup = useCallback(() => {
    cleanupFunctionsRef.current.forEach(cleanup => {
      try {
        cleanup()
      } catch (err) {
        console.warn("Cleanup function error:", err)
      }
    })
    cleanupFunctionsRef.current = []
  }, [])

  // Add cleanup function to the list
  const addCleanup = useCallback((cleanupFn: () => void) => {
    cleanupFunctionsRef.current.push(cleanupFn)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    
    return () => {
      mountedRef.current = false
      runCleanup()
      
      // Stop all tracks if stream exists
      if (stream) {
        stream.getTracks().forEach((track) => {
          try {
            track.stop()
          } catch (err) {
            console.warn("Error stopping track:", err)
          }
        })
      }
    }
  }, [stream, runCleanup])

  const startCamera = useCallback(async (cameraType: "front" | "back" = "back") => {
    if (isStarting || !mountedRef.current) return

    try {
      setIsStarting(true)
      setError(null)
      setPermissionDenied(false)
      setIsPlaying(false)
      setCurrentCamera(cameraType)

      runCleanup()

      if (stream) {
        stream.getTracks().forEach((track) => {
          try {
            track.stop()
          } catch (err) {
            console.warn("Error stopping existing track:", err)
          }
        })
        setStream(null)
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Browser Anda tidak mendukung akses kamera. Silakan gunakan browser yang lebih modern.")
      }

      // --- PATCH: Android WebView permission auto-retry ---
      let mediaStream: MediaStream | null = null
      let triedRequestPermission = false
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: cameraType === "back" ? "environment" : "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })
      } catch (e: any) {
        // Jika Android WebView dan permission ditolak, request permission lalu retry
        if ((e.name === "NotAllowedError" || e.name === "PermissionDeniedError") && window.Android && typeof window.Android.requestCameraPermission === "function" && !triedRequestPermission) {
          triedRequestPermission = true
          await new Promise(resolve => {
            if (window.Android && typeof window.Android.requestCameraPermission === "function") {
              window.Android.requestCameraPermission();
            }
            setTimeout(resolve, 1200); // tunggu dialog permission
          });
          // Retry getUserMedia
          try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
          } catch (e2) {
            throw e2;
          }
        } else {
          console.warn("Failed to get camera with preferred settings, trying fallback:", e)
          try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
          } catch (e2) {
            throw e // throw original error if fallback also fails
          }
        }
      }

      if (!mountedRef.current) {
        mediaStream?.getTracks().forEach(track => track.stop())
        return
      }

      setStream(mediaStream)
      setIsOpen(true)

      if (videoRef.current && mediaStream) {
        const video = videoRef.current
        video.srcObject = null
        await new Promise(resolve => setTimeout(resolve, 100))
        if (!mountedRef.current) return
        video.srcObject = mediaStream

        let hasPlayed = false
        let playAttempted = false

        const handleLoadedMetadata = async () => {
          if (!mountedRef.current || !video || hasPlayed || playAttempted) return
          playAttempted = true
          console.log("Video metadata loaded, attempting to play...")
          try {
            if (playPromiseRef.current) {
              try {
                await playPromiseRef.current
              } catch (err) {
                if (err instanceof Error && err.name !== 'AbortError') {
                  console.warn("Previous play promise error:", err)
                }
              }
            }
            if (video.paused && video.readyState >= 2) {
              playPromiseRef.current = video.play()
              await playPromiseRef.current
              if (mountedRef.current) {
                setIsPlaying(true)
                hasPlayed = true
                console.log("Video started playing successfully")
                video.style.transform = "scaleX(1)"
              }
            }
          } catch (e) {
            if (mountedRef.current && e instanceof Error && e.name !== 'AbortError') {
              console.error("Error playing video:", e)
              setError("Gagal memutar video kamera. Silakan coba lagi.")
            }
          } finally {
            playPromiseRef.current = null
          }
        }

        const handleCanPlay = async () => {
          if (!hasPlayed && !playAttempted && video.readyState >= 3) {
            await handleLoadedMetadata()
          }
        }

        const handlePlay = () => {
          if (mountedRef.current) {
            setIsPlaying(true)
            hasPlayed = true
            console.log("Video play event fired")
          }
        }

        const handlePause = () => {
          if (mountedRef.current) {
            setIsPlaying(false)
            console.log("Video paused")
          }
        }

        const handleError = (e: Event) => {
          if (mountedRef.current) {
            console.error("Video error event:", e)
            setError("Terjadi kesalahan pada video kamera.")
          }
        }

        video.addEventListener("loadedmetadata", handleLoadedMetadata, { passive: true })
        video.addEventListener("canplay", handleCanPlay, { passive: true })
        video.addEventListener("play", handlePlay, { passive: true })
        video.addEventListener("pause", handlePause, { passive: true })
        video.addEventListener("error", handleError, { passive: true })

        addCleanup(() => {
          video.removeEventListener("loadedmetadata", handleLoadedMetadata)
          video.removeEventListener("canplay", handleCanPlay)
          video.removeEventListener("play", handlePlay)
          video.removeEventListener("pause", handlePause)
          video.removeEventListener("error", handleError)
        })

        const checkVideoTimeout = setTimeout(() => {
          if (!mountedRef.current) return
          if (video && mediaStream && video.videoWidth === 0 && isOpen) {
            console.warn("Video has no dimensions after timeout")
            setError("Kamera berhasil diakses, tapi tidak ada gambar. Pastikan kamera tidak digunakan aplikasi lain dan coba refresh halaman.")
          }
        }, 3000)

        addCleanup(() => {
          clearTimeout(checkVideoTimeout)
        })

        if (video.readyState >= 2 && !hasPlayed && !playAttempted) {
          setTimeout(() => handleLoadedMetadata(), 100)
        }
      }

    } catch (err: any) {
      if (!mountedRef.current) return
      console.error("Camera access error:", err)
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError("Izin kamera ditolak. Silakan berikan izin kamera di pengaturan aplikasi Anda.")
        setPermissionDenied(true)
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setError("Tidak dapat menemukan kamera. Pastikan kamera terhubung dan tidak digunakan oleh aplikasi lain.")
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setError("Kamera sedang digunakan oleh aplikasi lain. Silakan tutup aplikasi lain yang menggunakan kamera.")
      } else if (err.name === "OverconstrainedError" || err.name === "ConstraintNotSatisfiedError") {
        setError("Kamera tidak memenuhi persyaratan yang dibutuhkan. Silakan coba dengan kamera lain.")
      } else if (err.name === "TypeError") {
        setError("Terjadi kesalahan saat mengakses kamera. Silakan refresh halaman dan coba lagi.")
      } else {
        setError(`Tidak dapat mengakses kamera: ${err.message || 'Unknown error'}`)
      }
    } finally {
      if (mountedRef.current) {
        setIsStarting(false)
      }
    }
  }, [stream, isStarting, isOpen, runCleanup, addCleanup])

  const switchCamera = useCallback(async () => {
    if (isStarting || !mountedRef.current) return
    
    try {
      setIsStarting(true)
      setError(null)
      
      // Determine which camera to switch to
      const newCameraType = currentCamera === "back" ? "front" : "back"
      
      // Stop current stream
      if (stream) {
        stream.getTracks().forEach((track) => {
          try {
            track.stop()
          } catch (err) {
            console.warn("Error stopping track:", err)
          }
        })
        setStream(null)
      }
      
      // Start camera with new type
      await startCamera(newCameraType)
    } catch (err: any) {
      if (!mountedRef.current) return
      
      console.error("Camera switch error:", err)
      setError(`Gagal mengganti kamera: ${err.message || 'Unknown error'}`)
    } finally {
      if (mountedRef.current) {
        setIsStarting(false)
      }
    }
  }, [currentCamera, isStarting, stream, startCamera])

  const stopCamera = useCallback(() => {
    // Cancel any pending play promises
    if (playPromiseRef.current) {
      playPromiseRef.current.catch(() => {}) // Ignore any errors
      playPromiseRef.current = null
    }

    // Clean up all event listeners and timeouts
    runCleanup()

    // Stop stream tracks
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop()
        } catch (err) {
          console.warn("Error stopping track:", err)
        }
      })
      setStream(null)
    }

    // Clear video source
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    // Reset all states
    setIsOpen(false)
    setIsPlaying(false)
    setError(null)
    setPermissionDenied(false)
  }, [stream, runCleanup])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      console.warn("Video or canvas ref not available")
      return null
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context) {
      console.warn("Cannot get canvas 2D context")
      return null
    }

    // Check if video is ready and has valid dimensions
    if (video.readyState < video.HAVE_CURRENT_DATA) {
      console.warn("Video not ready for capture, readyState:", video.readyState)
      return null
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn("Video has no dimensions:", { width: video.videoWidth, height: video.videoHeight })
      return null
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    try {
      // Clear canvas first
      context.clearRect(0, 0, canvas.width, canvas.height)
      
      // For front camera, we need to flip the image horizontally to match what the user sees
      // Since we've disabled mirroring with CSS, we need to manually flip the captured image
      if (currentCamera === "front") {
        context.save()
        context.translate(canvas.width, 0)
        context.scale(-1, 1)
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        context.restore()
      } else {
        // For back camera, draw normally
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
      }
      
      // Convert to data URL
      return canvas.toDataURL("image/jpeg", 0.8)
    } catch (err) {
      console.error("Canvas capture error:", err)
      return null
    }
  }, [currentCamera])

  return {
    isOpen,
    stream,
    error,
    permissionDenied,
    currentCamera,
    startCamera,
    stopCamera,
    switchCamera,
    capturePhoto,
    videoRef,
    canvasRef,
  }
}