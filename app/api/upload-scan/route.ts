import { type NextRequest, NextResponse } from "next/server"
import { uploadImage } from "@/lib/cloudflare-r2"
import { addDoc, collection, doc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()
    const { imageData, colorAnalysis, userId, aiTips, aiNote } = body

    // Validate required fields
    if (!imageData || !colorAnalysis || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Upload image to Cloudflare R2
    const uploadResult = await uploadImage(imageData, userId)

    // Create user history collection reference
    const userHistoryRef = collection(db, "users", userId, "history_scan")

    // Save scan record to Firestore
    const scanRecord = {
      userId,
      imageUrl: uploadResult.publicUrl,
      imageKey: uploadResult.key,
      colorAnalysis: {
        dominantColor: colorAnalysis.dominantColor,
        glucoseLevel: colorAnalysis.glucoseLevel,
        confidence: colorAnalysis.confidence,
        description: colorAnalysis.description,
        recommendation: colorAnalysis.recommendation,
        colorPercentages: colorAnalysis.colorPercentages,
      },
      aiTips: aiTips || [],
      aiNote: aiNote || "",
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
    }

    const docRef = await addDoc(userHistoryRef, scanRecord)

    return NextResponse.json({
      success: true,
      scanId: docRef.id,
      imageUrl: uploadResult.publicUrl,
      message: "Scan berhasil disimpan",
    })
  } catch (error) {
    console.error("Upload scan error:", error)
    return NextResponse.json({ error: "Failed to save scan" }, { status: 500 })
  }
}
