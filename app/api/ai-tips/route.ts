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

Berikan 4 tips spesifik untuk membantu mengelola kadar glukosa darah dengan format berikut:
1. [Tips tentang diet dan nutrisi]
2. [Tips tentang aktivitas fisik]
3. [Tips tentang gaya hidup sehari-hari]
4. [Tips tentang pemantauan kesehatan]

PENTING:
- Jangan gunakan sapaan pembuka atau penutup
- Jangan berikan penjelasan tambahan di luar 4 tips
- Hanya berikan 4 poin tips sesuai format di atas
- Setiap tips harus singkat dan langsung ke intinya`
      } else {
        // If no history, use only current scan
        contextualPrompt = `Hasil scan glukosa saya menunjukkan:
- Kadar glukosa: ${currentScan.glucoseLevel}
- Distribusi warna: Normal ${currentScan.colorPercentages.normal}%, Warning ${currentScan.colorPercentages.warning}%, High ${currentScan.colorPercentages.high}%

Berikan 4 tips spesifik untuk membantu mengelola kadar glukosa darah dengan format berikut:
1. [Tips tentang diet dan nutrisi]
2. [Tips tentang aktivitas fisik]
3. [Tips tentang gaya hidup sehari-hari]
4. [Tips tentang pemantauan kesehatan]

PENTING:
- Jangan gunakan sapaan pembuka atau penutup
- Jangan berikan penjelasan tambahan di luar 4 tips
- Hanya berikan 4 poin tips sesuai format di atas
- Setiap tips harus singkat dan langsung ke intinya`
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

    // Parse the AI response to extract tips
    // First, split by lines and filter out empty lines
    const lines = response.message
      .split("\n")
      .filter(line => line.trim())
    
    // Then extract only the numbered tips (1., 2., 3., 4.)
    const tips = lines
      .filter(line => /^\d+\./.test(line))
      .map(line => line.replace(/^\d+\.\s*/, "").trim())
      .filter(line => line.length > 0)
      .slice(0, 4) // Ensure we only take 4 tips

    return NextResponse.json({
      success: true,
      tips: tips.length > 0 ? tips : getStaticTips(currentScan.glucoseLevel),
    })
  } catch (error) {
    console.error("AI Tips API error:", error)
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

// Fallback static tips based on glucose level
function getStaticTips(glucoseLevel: string) {
  switch (glucoseLevel) {
    case "normal":
      return [
        "Pertahankan pola makan sehat dengan keseimbangan nutrisi",
        "Lakukan aktivitas fisik minimal 30 menit setiap hari",
        "Konsumsi makanan dengan indeks glikemik rendah",
        "Cek kadar glukosa secara rutin untuk memantau kesehatan"
      ]
    case "warning":
      return [
        "Kurangi konsumsi makanan manis dan karbohidrat sederhana",
        "Tambahkan serat dalam diet seperti sayuran dan biji-bijian",
        "Atur jadwal makan teratur untuk menghindari lonjakan gula darah",
        "Pertimbangkan konsultasi dengan ahli gizi untuk penyesuaian diet"
      ]
    case "high":
      return [
        "Segera konsultasi dengan dokter untuk evaluasi lebih lanjut",
        "Hindari makanan dengan gula tinggi dan karbohidrat olahan",
        "Monitor asupan karbohidrat dan pilih yang kompleks",
        "Pertimbangkan untuk mengatur pola makan dengan bantuan profesional"
      ]
    default:
      return [
        "Lakukan scan ulang untuk hasil yang lebih akurat",
        "Pastikan patch menempel dengan baik dan pencahayaan cukup",
        "Ikuti petunjuk penggunaan dengan benar"
      ]
  }
}