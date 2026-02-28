"use client"

import { useEffect } from "react"
import { useAppSettings } from "@/contexts/app-settings-context"
import { initializeNotifications, scheduleScanReminder, cancelAllReminders } from "@/lib/notification-service"

export function useNotifications() {
  const { settings } = useAppSettings()

  // Initialize notifications on mount
  useEffect(() => {
    initializeNotifications()
  }, [])

  // Handle notification settings changes
  useEffect(() => {
    if (settings.notifications) {
      // Schedule a reminder for 2 hours from now
      scheduleScanReminder(120)
    } else {
      // Clear any scheduled reminders
      cancelAllReminders()
    }
  }, [settings.notifications])

  return {
    enabled: settings.notifications,
  }
}