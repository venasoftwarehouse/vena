import { type NextRequest, NextResponse } from "next/server"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Force this route to be dynamic to prevent static rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Use NextRequest's built-in searchParams instead of creating a new URL
    const userId = request.nextUrl.searchParams.get("userId")
    const scanId = request.nextUrl.searchParams.get("scanId")

    if (!userId || !scanId) {
      return NextResponse.json({ error: "Missing userId or scanId parameter" }, { status: 400 })
    }

    // Get specific scan document from Firestore using new structure
    const scanDocRef = doc(db, "users", userId, "history_scan", scanId)
    const scanDoc = await getDoc(scanDocRef)

    if (!scanDoc.exists()) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 })
    }

    const scanData = {
      id: scanDoc.id,
      ...scanDoc.data(),
    }

    return NextResponse.json({
      success: true,
      scan: scanData,
    })
  } catch (error) {
    console.error("Fetch scan detail error:", error)
    return NextResponse.json({ error: "Failed to fetch scan detail" }, { status: 500 })
  }
}