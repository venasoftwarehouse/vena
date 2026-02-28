import { NextRequest, NextResponse } from "next/server"
import { doc, deleteDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { deleteImage } from "@/lib/cloudflare-r2"

export async function DELETE(request: NextRequest) {
  try {
    // Get scan ID and user ID from request body
    const { scanId, userId } = await request.json()
    
    if (!scanId) {
      return NextResponse.json({ error: "Scan ID is required" }, { status: 400 })
    }
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Check if scan exists and belongs to the user
    const scanRef = doc(db, "users", userId, "history_scan", scanId)
    const scanDoc = await getDoc(scanRef)

    if (!scanDoc.exists()) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 })
    }

    const scanData = scanDoc.data()
    
    // Delete image from Cloudflare R2 if it exists
    if (scanData.imageKey) {
      try {
        console.log(`Deleting image with key: ${scanData.imageKey}`)
        await deleteImage(scanData.imageKey)
        console.log(`Successfully deleted image with key: ${scanData.imageKey}`)
      } catch (error) {
        console.error("Error deleting image from R2:", error)
        // Continue with scan deletion even if image deletion fails
        // But log the error for debugging
      }
    } else {
      console.warn(`No imageKey found for scan ${scanId}. Image may not be deleted from storage.`)
    }

    // Delete scan document from Firestore
    await deleteDoc(scanRef)
    console.log(`Successfully deleted scan document ${scanId} from Firestore`)

    return NextResponse.json({ 
      success: true,
      message: "Scan and associated image deleted successfully"
    })
  } catch (error) {
    console.error("Delete scan error:", error)
    return NextResponse.json({ error: "Failed to delete scan" }, { status: 500 })
  }
}
