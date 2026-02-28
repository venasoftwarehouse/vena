import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getUserScans, type ScanRecord } from "@/lib/scan-service"

export function useRecentScans(limit = 3) {
  const { user } = useAuth()
  const [scans, setScans] = useState<ScanRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchRecentScans = async () => {
      try {
        setLoading(true)
        const userScans = await getUserScans(user.uid)
        // Sort by createdAt in descending order and take the most recent ones
        const sortedScans = userScans
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit)
        setScans(sortedScans)
      } catch (error) {
        console.error("Error fetching recent scans:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentScans()
  }, [user, limit])

  return { scans, loading }
}