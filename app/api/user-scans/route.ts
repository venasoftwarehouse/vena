import { type NextRequest, NextResponse } from "next/server"
import { collection, query, where, orderBy, getDocs, limit, startAfter, DocumentSnapshot, count } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Force this route to be dynamic to prevent static rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Use NextRequest's built-in searchParams instead of creating a new URL
    const userId = request.nextUrl.searchParams.get("userId")
    const limitCount = Number.parseInt(request.nextUrl.searchParams.get("limit") || "10")
    const lastVisibleParam = request.nextUrl.searchParams.get("lastVisible")

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 })
    }

    // Get total count of scans for this user
    const countQuery = query(
      collection(db, "users", userId, "history_scan"),
      where("userId", "==", userId)
    )
    const countSnapshot = await getDocs(countQuery)
    const totalCount = countSnapshot.size

    // Build the base query
    let scansQuery = query(
      collection(db, "users", userId, "history_scan"),
      orderBy("timestamp", "desc"),
      limit(limitCount),
    )

    // Add pagination if lastVisible is provided
    if (lastVisibleParam) {
      try {
        const lastVisible = JSON.parse(lastVisibleParam)
        scansQuery = query(
          collection(db, "users", userId, "history_scan"),
          orderBy("timestamp", "desc"),
          startAfter(lastVisible),
          limit(limitCount),
        )
      } catch (error) {
        console.error("Error parsing lastVisible parameter:", error)
        // Continue without pagination if there's an error
      }
    }

    const querySnapshot = await getDocs(scansQuery)
    const scans = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    // Get the last visible document for pagination
    const lastVisible = querySnapshot.docs.length > 0 
      ? querySnapshot.docs[querySnapshot.docs.length - 1] 
      : null

    // Check if there are more documents
    let hasMore = false
    if (lastVisible) {
      const nextQuery = query(
        collection(db, "users", userId, "history_scan"),
        orderBy("timestamp", "desc"),
        startAfter(lastVisible),
        limit(1),
      )
      const nextSnapshot = await getDocs(nextQuery)
      hasMore = !nextSnapshot.empty
    }

    return NextResponse.json({
      success: true,
      scans,
      count: totalCount,
      hasMore,
      lastVisible: lastVisible ? {
        id: lastVisible.id,
        path: lastVisible.ref.path,
        timestamp: lastVisible.data().timestamp
      } : null,
    })
  } catch (error) {
    console.error("Fetch user scans error:", error)
    return NextResponse.json({ error: "Failed to fetch scans" }, { status: 500 })
  }
}
