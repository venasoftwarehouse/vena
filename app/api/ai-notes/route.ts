import { type NextRequest, NextResponse } from "next/server"
import { sendChatMessage, generateContextualPrompt } from "@/lib/groq-client"
import { collection, query, where, orderBy, getDocs, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { ChatMessage } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, currentScan } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get user's scan history
    let contextualPrompt = ""
    try {
      const scansQuery = query(
        collection(db, "scans"),
        where("userId", "==", userId),
        orderBy("timestamp", "desc"),
        limit(5),
      )

      const querySnapshot = await getDocs(scansQuery)
      const userScans = querySnapshot.docs.map((doc) => doc.data())

      if (userScans.length > 0) {
        // Create a summary of scan history
        const scanSummary = userScans
          .map((scan, index) => {
            const date = new Date(scan.createdAt).toLocaleDateString("id-ID")
            const glucoseLevel = scan.colorAnalysis.glucoseLevel
            const description = scan.colorAnalysis.description
            return `${index + 1}. ${date}: ${glucoseLevel} (${description})`
          })
          .join("\n")

        contextualPrompt = `Berdasarkan riwayat scan glukosa saya berikut:
${scanSummary}

Dan hasil scan terbaru saya menunjukkan:
- Kadar glukosa: ${currentScan.glucoseLevel}
- Distribusi warna: Normal ${currentScan.colorPercentages.normal}%, Warning ${currentScan.colorPercentages.warning}%, High ${currentScan.colorPercentages.high}%

Buatkan catatan analisis tentang hasil scan saya ini. Fokus pada:
1. Interpretasi hasil berdasarkan distribusi warna
2. Perbandingan dengan scan sebelumnya (jika ada)
3. Kemungkinan faktor yang mempengaruhi hasil
4. Catatan penting untuk pemantauan kesehatan

Berikan catatan dalam format paragraf yang informatif namun ringkas. Jangan gunakan sapaan atau penutup, langsung ke analisis saja.`
      } else {
        // If no history, use only current scan
        contextualPrompt = `Hasil scan glukosa saya menunjukkan:
- Kadar glukosa: ${currentScan.glucoseLevel}
- Distribusi warna: Normal ${currentScan.colorPercentages.normal}%, Warning ${currentScan.colorPercentages.warning}%, High ${currentScan.colorPercentages.high}%

Buatkan catatan analisis tentang hasil scan saya ini. Fokus pada:
1. Interpretasi hasil berdasarkan distribusi warna
2. Kemungkinan faktor yang mempengaruhi hasil
3. Catatan penting untuk pemantauan kesehatan

Berikan catatan dalam format paragraf yang informatif namun ringkas. Jangan gunakan sapaan atau penutup, langsung ke analisis saja.`
      }
    } catch (error) {
      console.error("Error fetching user scans:", error)
      return NextResponse.json({ error: "Failed to fetch user scan history" }, { status: 500 })
    }

    // Send message to Groq AI
    const chatMessages: ChatMessage[] = [
      {
        role: "user",
        content: contextualPrompt,
      },
    ]

    const response = await sendChatMessage(chatMessages)

    if (response.error) {
      return NextResponse.json(
        {
          error: response.error,
          success: false,
        },
        { status: 500 },
      )
    }

    if (!response.message) {
      return NextResponse.json(
        {
          error: "AI tidak memberikan respons yang valid",
          success: false,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      note: response.message,
    })
  } catch (error) {
    console.error("AI Notes API error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
        success: false,
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}