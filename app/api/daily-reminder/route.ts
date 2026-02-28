import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    // In a real implementation, you would call an AI service to generate a personalized reminder
    // For now, we'll return a static reminder based on the time of day
    const hour = new Date().getHours()
    
    let reminder = ""
    
    if (hour >= 5 && hour < 10) {
      reminder = "Selamat pagi! Jangan lupa untuk sarapan sehat dan periksa kadar glukosa Anda setelah makan. Pastikan untuk minum cukup air hari ini."
    } else if (hour >= 10 && hour < 15) {
      reminder = "Waktu istirahat sejenak! Berjalan-jalan selama 5-10 menit dapat membantu mengontrol kadar gula darah Anda. Jangan lupa untuk minum air."
    } else if (hour >= 15 && hour < 18) {
      reminder = "Sore hari sudah tiba! Pertimbangkan untuk camilan sehat seperti buah atau kacang-kacangan. Hindari makanan manis dan berkarbohidrat tinggi."
    } else if (hour >= 18 && hour < 22) {
      reminder = "Waktu makan malam! Pilihlah makanan dengan indeks glikemik rendah dan jangan makan terlalu dekat dengan waktu tidur Anda."
    } else {
      reminder = "Waktu istirahat! Pastikan Anda cukup tidur malam ini, karena kurang tidur dapat mempengaruhi sensitivitas insulin Anda."
    }

    return NextResponse.json({
      success: true,
      reminder,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Error generating daily reminder:", error)
    return NextResponse.json(
      { error: "Failed to generate daily reminder" },
      { status: 500 }
    )
  }
}