import type { ColorAnalysis } from "./color-detection"

export interface ScanRecord {
  id: string
  userId: string
  imageUrl: string
  imageKey: string
  colorAnalysis: ColorAnalysis
  aiTips?: string[]
  aiNote?: string
  timestamp: any // Firestore timestamp
  createdAt: string
}

export interface PaginatedScansResult {
  scans: ScanRecord[]
  hasMore: boolean
  lastVisible?: any
  count?: number // Add count property for total items
}

// Save scan result to database and storage
export async function saveScanResult(
  imageData: string,
  colorAnalysis: ColorAnalysis,
  userId: string,
  aiTips?: string[],
  aiNote?: string,
): Promise<{ success: boolean; scanId?: string; error?: string }> {
  try {
    const response = await fetch("/api/upload-scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageData,
        colorAnalysis,
        userId,
        aiTips,
        aiNote,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || "Failed to save scan")
    }

    return {
      success: true,
      scanId: result.scanId,
    }
  } catch (error) {
    console.error("Save scan error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Delete scan record and associated image
export async function deleteScanRecord(scanId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Attempting to delete scan record ${scanId} for user ${userId}`)
    
    const response = await fetch("/api/delete-scan", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        scanId,
        userId,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || "Failed to delete scan")
    }

    console.log(`Successfully deleted scan record ${scanId} and associated image`)
    return { success: true }
  } catch (error) {
    console.error(`Delete scan error for scan ${scanId}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Fetch user's scan history with pagination
export async function getUserScansPaginated(
  userId: string, 
  pageSize: number = 10,
  lastVisible?: any
): Promise<PaginatedScansResult> {
  try {
    const url = new URL("/api/user-scans", window.location.origin)
    url.searchParams.append("userId", userId)
    url.searchParams.append("limit", pageSize.toString())
    
    if (lastVisible) {
      url.searchParams.append("lastVisible", JSON.stringify(lastVisible))
    }

    const response = await fetch(url.toString())

    if (!response.ok) {
      throw new Error("Failed to fetch scans")
    }

    const result = await response.json()
    return {
      scans: result.scans || [],
      hasMore: result.hasMore || false,
      lastVisible: result.lastVisible,
      count: result.count // Include count from API response
    }
  } catch (error) {
    console.error("Fetch scans error:", error)
    return {
      scans: [],
      hasMore: false,
    }
  }
}

// Fetch user's scan history (legacy function for backward compatibility)
export async function getUserScans(userId: string): Promise<ScanRecord[]> {
  try {
    const response = await fetch(`/api/user-scans?userId=${userId}`)

    if (!response.ok) {
      throw new Error("Failed to fetch scans")
    }

    const result = await response.json()
    return result.scans || []
  } catch (error) {
    console.error("Fetch scans error:", error)
    return []
  }
}

// Fetch single scan record by ID
export async function getScanById(userId: string, scanId: string): Promise<ScanRecord | null> {
  try {
    const response = await fetch(`/api/scan-detail?userId=${userId}&scanId=${scanId}`)

    if (!response.ok) {
      throw new Error("Failed to fetch scan")
    }

    const result = await response.json()
    return result.scan || null
  } catch (error) {
    console.error("Fetch scan error:", error)
    return null
  }
}
