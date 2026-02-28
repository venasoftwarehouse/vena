import { type NextRequest, NextResponse } from "next/server"
import { sendChatMessage, generateContextualPrompt } from "@/lib/groq-client"
import { collection, query, where, orderBy, getDocs, limit, addDoc, serverTimestamp, doc, updateDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { ChatSession, ChatMessage } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    let body
    try {
      body = await request.json()
    } catch (jsonError) {
      console.error("JSON parsing error:", jsonError)
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { message, userId, includeHistory = true, sessionId } = body

    if (!message || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let contextualMessage = message
    let currentSession: ChatSession | null = null
    let hasScanHistory = false

    // Get user's scan history if requested
    if (includeHistory) {
      try {
        console.log("Fetching scan history for user:", userId)
        // Use the correct collection path: users/{userId}/history_scan
        const scansQuery = query(
          collection(db, "users", userId, "history_scan"),
          orderBy("timestamp", "desc"),
          limit(5),
        )

        const querySnapshot = await getDocs(scansQuery)
        const userScans = querySnapshot.docs.map((doc) => {
          const data = doc.data()
          console.log("Found scan:", data)
          return {
            id: doc.id,
            ...data
          }
        })

        console.log("Total scans found:", userScans.length)

        if (userScans.length > 0) {
          hasScanHistory = true
          contextualMessage = generateContextualPrompt(userScans, message)
          console.log("Generated contextual prompt:", contextualMessage)
        } else {
          console.log("No scans found for user")
          contextualMessage = `Saya tidak memiliki riwayat scan. ${message}`
        }
      } catch (error) {
        console.error("Error fetching user scans:", error)
        contextualMessage = `Terjadi kesalahan saat mengambil riwayat scan. ${message}`
      }
    }

    // Send message to Groq AI
    const chatMessages: ChatMessage[] = [
      {
        role: "user",
        content: contextualMessage,
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

    // Save chat interaction to database
    try {
      // If sessionId is provided, update existing session
      if (sessionId) {
        const sessionRef = doc(db, "users", userId, "chat_sessions", sessionId)
        const sessionDoc = await getDoc(sessionRef)
        
        if (sessionDoc.exists()) {
          // Add user message to session
          await addDoc(collection(db, "users", userId, "chat_sessions", sessionId, "messages"), {
            role: "user",
            content: message,
            timestamp: serverTimestamp(),
          })
          
          // Add AI response to session
          await addDoc(collection(db, "users", userId, "chat_sessions", sessionId, "messages"), {
            role: "assistant",
            content: response.message,
            timestamp: serverTimestamp(),
          })
          
          // Update session timestamp
          await updateDoc(sessionRef, {
            updatedAt: serverTimestamp(),
          })
          
          currentSession = {
            id: sessionId,
            userId,
            title: sessionDoc.data().title,
            createdAt: sessionDoc.data().createdAt,
            updatedAt: serverTimestamp(),
            messages: []
          }
        }
      } else {
        // Create a new session with a title based on the first message
        const title = message.length > 30 ? message.substring(0, 30) + "..." : message
        
        const sessionRef = await addDoc(collection(db, "users", userId, "chat_sessions"), {
          userId,
          title,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        
        // Add user message to session
        await addDoc(collection(db, "users", userId, "chat_sessions", sessionRef.id, "messages"), {
          role: "user",
          content: message,
          timestamp: serverTimestamp(),
        })
        
        // Add AI response to session
        await addDoc(collection(db, "users", userId, "chat_sessions", sessionRef.id, "messages"), {
          role: "assistant",
          content: response.message,
          timestamp: serverTimestamp(),
        })
        
        currentSession = {
          id: sessionRef.id,
          userId,
          title,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          messages: []
        }
      }
      
      // Also save to the old chat_history collection for backward compatibility
      await addDoc(collection(db, "chat_history"), {
        userId,
        userMessage: message,
        aiResponse: response.message,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString(),
        hasScanHistory,
      })
    } catch (error) {
      console.error("Error saving chat history:", error)
      // Continue even if saving fails
    }

    return NextResponse.json({
      success: true,
      message: response.message,
      sessionId: currentSession?.id,
      hasScanHistory,
    })
  } catch (error) {
    console.error("Chat API error:", error)
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
