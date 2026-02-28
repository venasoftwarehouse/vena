"use client"

import { useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useAppSettings } from "@/contexts/app-settings-context"
import { initializeFcm, scheduleDailyReminder } from "@/lib/notification-service"

export function NotificationInitializer() {
  const { user } = useAuth()
  const { settings } = useAppSettings()

  useEffect(() => {
    if (typeof window !== "undefined" && user) {
      initializeFcm(user)
    }
  }, [user])

  useEffect(() => {
    if (settings.notifications) {
      // Schedule daily reminder for 8:00 AM
      scheduleDailyReminder(8, 0)
    }
  }, [settings.notifications])

  return null
}