/**
 * Checks if an object is a Firestore Timestamp-like object
 */
export function isFirestoreTimestamp(obj: any): boolean {
  return (
    obj &&
    typeof obj === "object" &&
    "seconds" in obj &&
    "nanoseconds" in obj &&
    typeof obj.seconds === "number" &&
    typeof obj.nanoseconds === "number"
  )
}

/**
 * Converts any timestamp-like object to a Date
 * Supports:
 * - Firestore Timestamp objects
 * - Date objects
 * - ISO strings
 * - Unix timestamps (seconds)
 */
export function toDate(timestamp: any): Date {
  if (!timestamp) return new Date()

  // If it's already a Date object
  if (timestamp instanceof Date) return timestamp

  // If it's a Firestore Timestamp object
  if (isFirestoreTimestamp(timestamp)) {
    return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000)
  }

  // If it has a toDate method (Firebase Timestamp)
  if (timestamp?.toDate instanceof Function) {
    return timestamp.toDate()
  }

  // Try parsing as a date string
  const parsed = new Date(timestamp)
  if (!isNaN(parsed.getTime())) {
    return parsed
  }

  // Fallback to current date
  return new Date()
}

/**
 * Format a date with localization support
 * @param date Date to format
 * @param locale Current locale (e.g., 'id' or 'en')
 * @param options DateTimeFormatOptions
 */
export function formatDate(date: Date | number | any, locale: string = 'id', options?: Intl.DateTimeFormatOptions): string {
  const dateObj = toDate(date)
  const localeMap: Record<string, string> = {
    id: 'id-ID',
    en: 'en-US'
  }
  
  return dateObj.toLocaleDateString(localeMap[locale] || 'id-ID', options)
}