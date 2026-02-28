export interface ColorAnalysis {
  dominantColor: string
  glucoseLevel: "normal" | "warning" | "high"
  confidence: number
  description: string
  recommendation: string
  colorPercentages: {
    normal: number
    warning: number
    high: number
  }
  aiTips?: string[]
  aiNote?: string
}

export interface RGBColor {
  r: number
  g: number
  b: number
}

// Reference colors for diabetes detection
const REFERENCE_COLORS = {
  normal: { r: 165, g: 166, b: 152 }, // #a5a698
  warning: { r: 124, g: 117, b: 108 }, // #7c756c
  high: { r: 82, g: 67, b: 64 }, // #524340
}

// Convert hex to RGB
function hexToRgb(hex: string): RGBColor | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

// Calculate color distance using Euclidean distance
function colorDistance(color1: RGBColor, color2: RGBColor): number {
  return Math.sqrt(
    Math.pow(color1.r - color2.r, 2) +
      Math.pow(color1.g - color2.g, 2) +
      Math.pow(color1.b - color2.b, 2)
  )
}

// Convert RGB to HSL for better color analysis
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return [h * 360, s * 100, l * 100]
}

// Analyze color distribution in the image based on reference colors
function analyzeColorDistribution(imageData: ImageData): {
  normal: number
  warning: number
  high: number
} {
  const data = imageData.data
  let normalCount = 0
  let warningCount = 0
  let highCount = 0
  let totalValidPixels = 0

  // Sample every 4th pixel for performance
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const alpha = data[i + 3]

    // Skip transparent pixels
    if (alpha < 128) continue

    const pixelColor = { r, g, b }

    // Calculate distance to each reference color
    const normalDistance = colorDistance(pixelColor, REFERENCE_COLORS.normal)
    const warningDistance = colorDistance(pixelColor, REFERENCE_COLORS.warning)
    const highDistance = colorDistance(pixelColor, REFERENCE_COLORS.high)

    // Find the closest reference color
    const minDistance = Math.min(normalDistance, warningDistance, highDistance)
    
    // Only count if the color is reasonably close to one of the reference colors
    if (minDistance < 100) { // Threshold for color similarity
      if (minDistance === normalDistance) {
        normalCount++
      } else if (minDistance === warningDistance) {
        warningCount++
      } else {
        highCount++
      }
      totalValidPixels++
    }
  }

  // Calculate percentages
  const total = normalCount + warningCount + highCount
  const normalPercentage = total > 0 ? (normalCount / total) * 100 : 0
  const warningPercentage = total > 0 ? (warningCount / total) * 100 : 0
  const highPercentage = total > 0 ? (highCount / total) * 100 : 0

  return {
    normal: normalPercentage,
    warning: warningPercentage,
    high: highPercentage,
  }
}

// Get average color from the image
function getAverageColor(imageData: ImageData): RGBColor {
  const data = imageData.data
  let rSum = 0
  let gSum = 0
  let bSum = 0
  let pixelCount = 0

  // Sample every 4th pixel for performance
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const alpha = data[i + 3]

    // Skip transparent pixels
    if (alpha < 128) continue

    rSum += r
    gSum += g
    bSum += b
    pixelCount++
  }

  return {
    r: pixelCount > 0 ? Math.round(rSum / pixelCount) : 0,
    g: pixelCount > 0 ? Math.round(gSum / pixelCount) : 0,
    b: pixelCount > 0 ? Math.round(bSum / pixelCount) : 0,
  }
}

// Analyze color and determine glucose level based on color distribution
export function analyzeColor(canvas: HTMLCanvasElement): ColorAnalysis {
  const context = canvas.getContext("2d")
  if (!context) {
    throw new Error("Cannot get canvas context")
  }

  // Get image data from true center area (where patch should be)
  const scanWidth = canvas.width * 0.3
  const scanHeight = canvas.height * 0.3
  const centerX = (canvas.width - scanWidth) / 2
  const centerY = (canvas.height - scanHeight) / 2
  const imageData = context.getImageData(centerX, centerY, scanWidth, scanHeight)

  // Analyze color distribution
  const colorPercentages = analyzeColorDistribution(imageData)

  // Get average color for display
  const avgColor = getAverageColor(imageData)

  // Determine glucose level based on color distribution
  let glucoseLevel: "normal" | "warning" | "high" = "normal"
  let confidence = 0
  let description = ""
  let recommendation = ""

  // Determine glucose level based on dominant color percentage
  if (colorPercentages.normal >= 40) {
    glucoseLevel = "normal"
    confidence = Math.min(95, 60 + colorPercentages.normal / 2)
    description = "Kadar glukosa dalam rentang normal"
    recommendation = "Pertahankan pola hidup sehat dengan diet seimbang dan olahraga teratur."
  } else if (colorPercentages.warning >= 40) {
    glucoseLevel = "warning"
    confidence = Math.min(90, 50 + colorPercentages.warning / 2)
    description = "Kadar glukosa sedikit tinggi - perlu perhatian"
    recommendation = "Kurangi konsumsi gula dan karbohidrat. Konsultasikan dengan dokter jika berlanjut."
  } else if (colorPercentages.high >= 40) {
    glucoseLevel = "high"
    confidence = Math.min(95, 55 + colorPercentages.high / 2)
    description = "Kadar glukosa tinggi - segera konsultasi dokter"
    recommendation = "Segera hubungi dokter. Hindari makanan manis dan pantau gejala diabetes."
  } else if (colorPercentages.high > colorPercentages.warning && colorPercentages.high > colorPercentages.normal) {
    glucoseLevel = "high"
    confidence = Math.min(85, 45 + colorPercentages.high)
    description = "Kadar glukosa tinggi - segera konsultasi dokter"
    recommendation = "Segera hubungi dokter. Hindari makanan manis dan pantau gejala diabetes."
  } else if (colorPercentages.warning > colorPercentages.normal) {
    glucoseLevel = "warning"
    confidence = Math.min(80, 40 + colorPercentages.warning)
    description = "Kadar glukosa sedikit tinggi - perlu perhatian"
    recommendation = "Kurangi konsumsi gula dan karbohidrat. Konsultasikan dengan dokter jika berlanjut."
  } else {
    // Fallback for unclear colors
    confidence = 30
    description = "Warna patch tidak dapat diidentifikasi dengan jelas"
    recommendation = "Pastikan pencahayaan cukup dan patch terlihat jelas. Coba scan ulang."
  }

  return {
    dominantColor: `rgb(${avgColor.r}, ${avgColor.g}, ${avgColor.b})`,
    glucoseLevel,
    confidence,
    description,
    recommendation,
    colorPercentages,
  }
}

// Compress image for storage
export function compressImage(dataUrl: string, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!

      // Calculate new dimensions (max 800px width)
      const maxWidth = 800
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
      canvas.width = img.width * ratio
      canvas.height = img.height * ratio

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL("image/jpeg", quality))
    }
    img.src = dataUrl
  })
}
