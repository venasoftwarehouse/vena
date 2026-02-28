"use client"

import { useState, useEffect } from "react"
import { collection, query, where, orderBy, getDocs, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface ChatHistoryItem {
  id: string
  userId: string
  userMessage: string
  aiResponse: string
  timestamp: any
  createdAt: string
}

export function useChatHistory(userId: string | undefined, limitCount = 20) {
  const [history, setHistory] = useState<ChatHistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadHistory = async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      const historyQuery = query(
        collection(db, "chat_history"),
        where("userId", "==", userId),
        orderBy("timestamp", "desc"),
        limit(limitCount),
      )

      const querySnapshot = await getDocs(historyQuery)
      const historyData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ChatHistoryItem[]

      setHistory(historyData)
    } catch (err) {
      console.error("Error loading chat history:", err)
      setError("Failed to load chat history")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [userId])

  return {
    history,
    loading,
    error,
    reload: loadHistory,
  }
}
