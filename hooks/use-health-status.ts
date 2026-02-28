import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getUserScans, type ScanRecord } from "@/lib/scan-service"
import { format } from "date-fns"
import { id } from "date-fns/locale"

export interface HealthStatus {
  lastScanDate: string | null
  glucoseStatus: "normal" | "warning" | "high" | null
  weeklyTrend: "up" | "down" | "stable" | null
  lastScanConfidence: number | null
}

export function useHealthStatus() {
  const { user } = useAuth()
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    lastScanDate: null,
    glucoseStatus: null,
    weeklyTrend: null,
    lastScanConfidence: null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchHealthStatus = async () => {
      try {
        setLoading(true)
        const userScans = await getUserScans(user.uid)
        
        if (userScans.length === 0) {
          setHealthStatus({
            lastScanDate: null,
            glucoseStatus: null,
            weeklyTrend: null,
            lastScanConfidence: null,
          })
          return
        }

        // Sort by createdAt in descending order
        const sortedScans = userScans.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )

        // Get the most recent scan
        const mostRecentScan = sortedScans[0]
        
        // Format the date
        const lastScanDate = format(new Date(mostRecentScan.createdAt), "dd MMM yyyy, HH:mm", { locale: id })
        
        // Get glucose status
        const glucoseStatus = mostRecentScan.colorAnalysis.glucoseLevel
        
        // Get confidence
        const lastScanConfidence = mostRecentScan.colorAnalysis.confidence
        
        // Calculate weekly trend
        let weeklyTrend: "up" | "down" | "stable" | null = null
        
        // Get scans from the last 7 days
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        
        const weeklyScans = sortedScans.filter(
          scan => new Date(scan.createdAt) >= oneWeekAgo
        )
        
        if (weeklyScans.length > 1) {
          // Calculate average glucose level for the first half and second half of the week
          const halfPoint = Math.floor(weeklyScans.length / 2)
          const firstHalf = weeklyScans.slice(halfPoint)
          const secondHalf = weeklyScans.slice(0, halfPoint)
          
          // Calculate average scores for each half
          const calculateAverageScore = (scans: ScanRecord[]) => {
            const total = scans.reduce((sum, scan) => {
              const percentages = scan.colorAnalysis.colorPercentages
              // Calculate a score where higher red percentage = higher score
              const score = (percentages.red * 3 + percentages.yellow * 2 + percentages.green * 1) / 6
              return sum + score
            }, 0)
            return total / scans.length
          }
          
          const firstHalfAvg = calculateAverageScore(firstHalf)
          const secondHalfAvg = calculateAverageScore(secondHalf)
          
          // Determine trend
          const diff = firstHalfAvg - secondHalfAvg
          if (diff > 5) {
            weeklyTrend = "up"
          } else if (diff < -5) {
            weeklyTrend = "down"
          } else {
            weeklyTrend = "stable"
          }
        }
        
        setHealthStatus({
          lastScanDate,
          glucoseStatus,
          weeklyTrend,
          lastScanConfidence,
        })
      } catch (error) {
        console.error("Error fetching health status:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchHealthStatus()
  }, [user])

  return { healthStatus, loading }
}