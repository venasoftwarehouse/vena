import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"

const REMINDER_STORAGE_KEY = "vena-daily-reminder"
const REMINDER_TIMESTAMP_KEY = "vena-daily-reminder-timestamp"

export function useDailyReminder() {
  const { user } = useAuth()
  const [reminder, setReminder] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchReminder = async () => {
      try {
        // Check if we have a cached reminder that's still valid for today
        const cachedReminder = localStorage.getItem(REMINDER_STORAGE_KEY)
        const cachedTimestamp = localStorage.getItem(REMINDER_TIMESTAMP_KEY)

        if (cachedReminder && cachedTimestamp) {
          const reminderDate = new Date(cachedTimestamp)
          const today = new Date()

          // Check if the cached reminder is from today
          if (
            reminderDate.getDate() === today.getDate() &&
            reminderDate.getMonth() === today.getMonth() &&
            reminderDate.getFullYear() === today.getFullYear()
          ) {
            setReminder(cachedReminder)
            setLoading(false)
            return
          }
        }

        // If no valid cached reminder, fetch a new one
        const response = await fetch("/api/daily-reminder", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: user.uid }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setReminder(data.reminder)
            // Cache the reminder with timestamp
            localStorage.setItem(REMINDER_STORAGE_KEY, data.reminder)
            localStorage.setItem(REMINDER_TIMESTAMP_KEY, data.timestamp)
          }
        }
      } catch (error) {
        console.error("Error fetching daily reminder:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchReminder()
  }, [user])

  return { reminder, loading }
}