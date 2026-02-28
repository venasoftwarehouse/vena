import { getMessaging, getToken, onMessage } from "firebase/messaging"
import app from "@/lib/firebase"
import type { User } from "firebase/auth"

// --- FCM Initialization and Token Management ---

export async function initializeFcm(user: User | null) {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    const messaging = getMessaging(app)

    const permission = await requestNotificationPermission()
    if (permission) {
      try {
        // Register the Firebase messaging service worker and wait until
        // it's active before requesting the push subscription.
        // Using `navigator.serviceWorker.ready` ensures the registration
        // has an active worker (avoids "no active Service Worker" AbortError).
        let swRegistration: ServiceWorkerRegistration | undefined
        try {
          // Prefer the standard firebase messaging SW file in the public/ root.
          const swPath = "/firebase-messaging-sw.js"
          // Try to register the worker. If it's already registered this is fine.
          await navigator.serviceWorker.register(swPath)
          // Wait until a worker is active for this scope.
          swRegistration = await navigator.serviceWorker.ready
        } catch (swErr) {
          console.warn("Service worker registration / ready failed:", swErr)
          swRegistration = undefined
        }

        const currentToken = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: swRegistration,
        })
        if (currentToken) {
          if (user) {
            await saveTokenToServer(user.uid, currentToken)
          }
        } else {
          console.log("No registration token available. Request permission to generate one.")
        }
      } catch (error) {
        console.error("An error occurred while retrieving token. ", error)
      }
    }

    onMessage(messaging, (payload) => {
      console.log("Foreground message received. ", payload)
      showNotification(payload.notification?.title || "", {
        body: payload.notification?.body || "",
        icon: payload.notification?.icon || "/favicon.svg",
      })
    })
  }
}

async function saveTokenToServer(userId: string, token: string) {
  try {
    await fetch("/api/fcm-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, token }),
    })
  } catch (error) {
    console.error("Error saving FCM token to server: ", error)
  }
}

// --- Notification Display and Permission ---

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    console.log("This browser does not support notifications")
    return false
  }

  if (Notification.permission === "granted") {
    return true
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission()
    return permission === "granted"
  }

  return false
}

export function showNotification(title: string, options?: NotificationOptions): boolean {
  if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") {
    return false
  }

  try {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(title, {
        icon: "/favicon.svg",
        badge: "/favicon.svg",
        ...options,
      })
    });
    return true
  } catch (error) {
    console.error("Error showing notification:", error)
    return false
  }
}


// --- Client-Side Notification Scheduling ---

interface AndroidInterface {
  scheduleScanReminder(hours: number): void;
  scheduleDailyReminder(hour: number, minute: number): void;
  cancelAllReminders(): void;
  hasCameraPermission?(): boolean;
  hasNotificationPermission?(): boolean;
  requestCameraPermission?(): void;
  requestNotificationPermission?(): void;
}

declare global {
  interface Window {
    Android?: AndroidInterface;
  }
}

export function scheduleScanReminder(hours: number = 2) {
  console.log(`Scheduling scan reminder in ${hours} hours.`)
  if (window.Android && window.Android.scheduleScanReminder) {
    console.log("Using native Android scheduling for scan reminder.")
    window.Android.scheduleScanReminder(hours)
  } else {
    console.log("Using client-side JS scheduling for scan reminder.")
    const reminderTime = new Date().getTime() + hours * 60 * 60 * 1000
    localStorage.setItem("vena-scan-reminder-time", reminderTime.toString())

    setTimeout(() => {
      showNotification("Pengingat Scan Glukosa", {
        body: "Sudah 2 jam sejak scan terakhir Anda. Waktunya untuk scan lagi!",
        tag: "scan-reminder",
      })
    }, hours * 60 * 60 * 1000)
  }
}

export function scheduleDailyReminder(hour: number = 8, minute: number = 0) {
  console.log(`Scheduling daily reminder for ${hour}:${minute}.`)
  if (window.Android && window.Android.scheduleDailyReminder) {
    console.log("Using native Android scheduling for daily reminder.")
    window.Android.scheduleDailyReminder(hour, minute)
  } else {
    console.log("Using client-side JS scheduling for daily reminder.")
    const now = new Date()
    const reminder = new Date()
    reminder.setHours(hour, minute, 0, 0)

    if (now > reminder) {
      reminder.setDate(reminder.getDate() + 1)
    }

    const timeout = reminder.getTime() - now.getTime()

    setTimeout(async () => {
      try {
        const response = await fetch("/api/daily-reminder", { method: "POST", body: JSON.stringify({ userId: "" }) });
        const data = await response.json();
        if (data.success) {
          showNotification("Pengingat Harian Vena", {
            body: data.reminder,
            tag: "daily-reminder",
          });
        }
      } catch (error) {
        console.error("Could not fetch daily reminder", error);
      }
      // Reschedule for the next day
      scheduleDailyReminder(hour, minute)
    }, timeout)
  }
}

export function cancelAllReminders() {
  console.log("Cancelling all reminders.")
  if (window.Android && window.Android.cancelAllReminders) {
    console.log("Using native Android cancellation.")
    window.Android.cancelAllReminders()
  } else {
    // This is tricky with setTimeout. For now, we can only clear future schedules if we had stored their IDs.
    // A more robust web-only solution would involve the service worker.
    console.log("Web-based cancellation is not fully implemented in this version.")
  }
}

// Alias for cancelAllReminders to maintain compatibility
export function clearScanReminders() {
  console.log("Clearing scan reminders...")
  if (window.Android && window.Android.cancelAllReminders) {
    window.Android.cancelAllReminders()
  } else {
    // Clear any stored reminder times
    localStorage.removeItem("vena-scan-reminder-time")
    console.log("Cleared scan reminders from localStorage")
  }
}

// Add missing functions
export function initializeNotifications() {
  console.log("Initializing notifications...")
  if (typeof window !== "undefined") {
    // Check if we're in an Android environment
    if (window.Android) {
      console.log("Android environment detected")
      // Request permissions if needed
      if (!window.Android.hasNotificationPermission?.()) {
        window.Android.requestNotificationPermission?.()
      }
    } else {
      console.log("Web environment detected")
      // Request notification permission for web
      requestNotificationPermission()
    }
  }
}