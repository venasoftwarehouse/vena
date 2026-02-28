import { type NextRequest, NextResponse } from "next/server"
import { collection, query, where, orderBy, getDocs, doc, getDoc, updateDoc, serverTimestamp, addDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { ChatSession, ChatMessageDB } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get all chat sessions for the user
    const sessionsQuery = query(
      collection(db, "users", userId, "chat_sessions"),
      orderBy("updatedAt", "desc")
    )

    const querySnapshot = await getDocs(sessionsQuery)
    const sessions: ChatSession[] = []

    for (const docSnapshot of querySnapshot.docs) {
      const sessionData = docSnapshot.data()
      
      // Get messages for this session
      const messagesQuery = query(
        collection(db, "users", userId, "chat_sessions", docSnapshot.id, "messages"),
        orderBy("timestamp", "asc")
      )
      
      const messagesSnapshot = await getDocs(messagesQuery)
      const messages = messagesSnapshot.docs.map(msgDoc => {
        const msgData = msgDoc.data()
        return {
          role: msgData.role,
          content: msgData.content,
          timestamp: msgData.timestamp
        }
      })

      sessions.push({
        id: docSnapshot.id,
        userId: sessionData.userId,
        title: sessionData.title,
        createdAt: sessionData.createdAt,
        updatedAt: sessionData.updatedAt,
        messages
      })
    }

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error("Error fetching chat history:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      {
        status: 500,
      }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, title, messages } = body

    if (!userId || !title || !messages) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create a new chat session
    const sessionRef = await addDoc(collection(db, "users", userId, "chat_sessions"), {
      userId,
      title,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    // Add messages to the session
    for (const message of messages) {
      await addDoc(collection(db, "users", userId, "chat_sessions", sessionRef.id, "messages"), {
        role: message.role,
        content: message.content,
        timestamp: serverTimestamp(),
      })
    }

    return NextResponse.json({
      success: true,
      sessionId: sessionRef.id,
    })
  } catch (error) {
    console.error("Error creating chat session:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      {
        status: 500,
      }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const sessionId = searchParams.get("sessionId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    if (sessionId) {
      // Delete a specific chat session
      const sessionRef = doc(db, "users", userId, "chat_sessions", sessionId)
      
      // Get all messages in this session
      const messagesQuery = query(collection(db, "users", userId, "chat_sessions", sessionId, "messages"))
      const messagesSnapshot = await getDocs(messagesQuery)
      
      // Delete all messages in the session
      for (const messageDoc of messagesSnapshot.docs) {
        await deleteDoc(messageDoc.ref)
      }
      
      // Delete the session
      await deleteDoc(sessionRef)
      
      return NextResponse.json({ success: true, message: "Chat session deleted successfully" })
    } else {
      // Delete all chat sessions for the user
      const sessionsQuery = query(collection(db, "users", userId, "chat_sessions"))
      const sessionsSnapshot = await getDocs(sessionsQuery)
      
      // Delete all sessions and their messages
      for (const sessionDoc of sessionsSnapshot.docs) {
        const sessionId = sessionDoc.id
        
        // Get all messages in this session
        const messagesQuery = query(collection(db, "users", userId, "chat_sessions", sessionId, "messages"))
        const messagesSnapshot = await getDocs(messagesQuery)
        
        // Delete all messages in the session
        for (const messageDoc of messagesSnapshot.docs) {
          await deleteDoc(messageDoc.ref)
        }
        
        // Delete the session
        await deleteDoc(sessionDoc.ref)
      }
      
      return NextResponse.json({ success: true, message: "All chat history deleted successfully" })
    }
  } catch (error) {
    console.error("Error deleting chat history:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      {
        status: 500,
      }
    )
  }
}