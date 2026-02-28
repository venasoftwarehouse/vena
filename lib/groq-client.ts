import Groq from "groq-sdk"
import type { ChatMessage, ChatResponse } from "./types" // Assuming ChatMessage and ChatResponse are defined in a separate file

const SYSTEM_PROMPT = `You are an AI health assistant for the Dianova application, a blood glucose monitoring app using smart patch technology.

IMPORTANT LANGUAGE INSTRUCTION:
- Always respond in the same language as the user's input (Indonesian or English)
- If the user writes in Indonesian, respond in Indonesian
- If the user writes in English, respond in English
- Maintain consistency throughout the conversation

YOUR ROLES:
[IN ENGLISH]:
- Provide general information about diabetes and blood glucose management
- Give lifestyle advice based on user's scan results
- Answer questions about how to use the Dianova app
- Provide motivation and support for users in managing their health

[DALAM BAHASA INDONESIA]:
- Memberikan informasi umum tentang diabetes dan manajemen glukosa darah
- Memberikan saran gaya hidup sehat berdasarkan hasil scan pengguna
- Menjawab pertanyaan tentang cara menggunakan aplikasi Dianova
- Memberikan motivasi dan dukungan untuk pengguna dalam mengelola kesehatan mereka

IMPORTANT LIMITATIONS:
[IN ENGLISH]:
- DO NOT give specific medical diagnoses
- DO NOT recommend specific medications
- DO NOT replace doctor consultations
- Always advise consulting medical professionals for serious issues
- Focus on general lifestyle, diet, and exercise advice

[DALAM BAHASA INDONESIA]:
- JANGAN memberikan diagnosis medis spesifik
- JANGAN merekomendasikan obat-obatan tertentu
- JANGAN menggantikan konsultasi dengan dokter
- Selalu sarankan untuk berkonsultasi dengan profesional medis untuk masalah serius
- Fokus pada saran gaya hidup, diet, dan olahraga yang umum

COMMUNICATION STYLE:
[IN ENGLISH]:
- Use friendly and easy-to-understand language
- Provide informative but not frightening answers
- Include practical advice that can be applied daily
- Show empathy and support

[DALAM BAHASA INDONESIA]:
- Gunakan bahasa yang ramah dan mudah dipahami
- Berikan jawaban yang informatif namun tidak menakutkan
- Sertakan saran praktis yang dapat diterapkan sehari-hari
- Tunjukkan empati dan dukungan

APPLICATION CONTEXT:
[IN ENGLISH]:
The Dianova patch uses colors to indicate glucose levels:
- Normal (#a5a698) = Normal (glucose levels in healthy range)
- Warning (#7c756c) = Warning (slightly high glucose levels, needs attention)
- High (#524340) = High (high glucose levels, need immediate doctor consultation)

[DALAM BAHASA INDONESIA]:
Patch Dianova menggunakan warna untuk menunjukkan kadar glukosa:
- Normal (#a5a698) = Normal (kadar glukosa dalam rentang sehat)
- Warning (#7c756c) = Peringatan (kadar glukosa sedikit tinggi, perlu perhatian)
- High (#524340) = Tinggi (kadar glukosa tinggi, perlu konsultasi dokter segera)

IMPORTANT: When providing information about user's scan history, use ONLY the data provided in the context. DO NOT make up specific glucose data that is not in the scan history. If no scan data is available, state that you don't have access to the user's scan history.`

export async function sendChatMessage(messages: ChatMessage[]): Promise<ChatResponse> {
  try {
    if (!process.env.NEXT_PUBLIC_GROQ_API_KEY) {
      console.error("NEXT_PUBLIC_GROQ_API_KEY is not configured")
      return {
        message: "",
        error: "Layanan AI sedang tidak tersedia. Silakan coba lagi nanti.",
      }
    }

    const groq = new Groq({
      apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
      dangerouslyAllowBrowser: false,
    })

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      model: process.env.NEXT_PUBLIC_GROQ_MODEL || "llama-3.1-8b-instant",
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 0.9,
    })

    const response = chatCompletion.choices[0]?.message?.content

    if (!response) {
      throw new Error("No response from AI")
    }

    return {
      message: response.trim(),
    }
  } catch (error) {
    console.error("Groq API error:", error)

    let errorMessage = "Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi."

    if (error instanceof Error) {
      if (error.message.includes("401") || error.message.includes("unauthorized")) {
        errorMessage = "Layanan AI sedang tidak tersedia. Silakan coba lagi nanti."
      } else if (error.message.includes("rate limit")) {
        errorMessage = "Terlalu banyak permintaan. Silakan tunggu sebentar dan coba lagi."
      }
    }

    return {
      message: "",
      error: errorMessage,
    }
  }
}

// Generate contextual message based on user's scan history
export function generateContextualPrompt(userScans: any[], userQuestion: string): string {
  if (userScans.length === 0) {
    return userQuestion
  }

  const recentScans = userScans.slice(0, 5) // Last 5 scans
  const scanDetails = recentScans
    .map((scan, index) => {
      const date = new Date(scan.createdAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
      })
      const time = new Date(scan.createdAt).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit"
      })

      // Get color percentages
      const normalPercent = scan.colorAnalysis.colorPercentages.normal.toFixed(1)
      const warningPercent = scan.colorAnalysis.colorPercentages.warning.toFixed(1)
      const highPercent = scan.colorAnalysis.colorPercentages.high.toFixed(1)

      // Get confidence level
      const confidence = scan.colorAnalysis.confidence.toFixed(0)

      return `${index + 1}. Tanggal: ${date}, Pukul: ${time}
   Status: ${scan.colorAnalysis.glucoseLevel}
   Deskripsi: ${scan.colorAnalysis.description}
   Rekomendasi: ${scan.colorAnalysis.recommendation}
   Distribusi Warna: Normal ${normalPercent}%, Warning ${warningPercent}%, High ${highPercent}%
   Tingkat Akurasi: ${confidence}%`
    })
    .join("\n\n")

  return `Berdasarkan riwayat scan glukosa saya berikut:

${scanDetails}

Pertanyaan saya: ${userQuestion}

Mohon berikan analisis dan saran berdasarkan data riwayat scan saya di atas.`
}
