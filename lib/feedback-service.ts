import { collection, query, where, orderBy, getDocs, addDoc, doc, deleteDoc, DocumentData } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface FeedbackData {
  id: string
  userId: string
  userEmail: string
  userName: string
  rating: number
  category: string
  message: string
  timestamp: any
  createdAt: string
}

// Save feedback to both public and user-specific databases
export const saveFeedback = async (feedbackData: Omit<FeedbackData, 'id'>): Promise<string> => {
  try {
    // Generate a unique ID for this feedback
    const feedbackRef = doc(collection(db, "feedback"))
    const feedbackId = feedbackRef.id
    
    // Prepare the data with the generated ID
    const dataWithId = {
      ...feedbackData,
      id: feedbackId
    }
    
    // Save to public database
    await addDoc(collection(db, "feedback"), dataWithId)
    
    // Save to user-specific database
    await addDoc(collection(db, "users", feedbackData.userId, "feedback_post"), dataWithId)
    
    return feedbackId
  } catch (error) {
    console.error("Error saving feedback:", error)
    throw error
  }
}

// Get user feedback from user-specific database
export const getUserFeedback = async (userId: string): Promise<FeedbackData[]> => {
  try {
    const feedbackQuery = query(
      collection(db, "users", userId, "feedback_post"),
      orderBy("timestamp", "desc")
    )
    
    const querySnapshot = await getDocs(feedbackQuery)
    const feedbackList: FeedbackData[] = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as DocumentData
      feedbackList.push({
        id: data.id || "",
        userId: data.userId || "",
        userEmail: data.userEmail || "",
        userName: data.userName || "",
        rating: data.rating || 0,
        category: data.category || "",
        message: data.message || "",
        timestamp: data.timestamp || null,
        createdAt: data.createdAt || ""
      })
    })
    
    return feedbackList
  } catch (error) {
    console.error("Error fetching user feedback:", error)
    return []
  }
}

// Delete feedback from both public and user-specific databases
export const deleteFeedback = async (userId: string, feedbackId: string): Promise<boolean> => {
  try {
    // Delete from public database
    const publicFeedbackQuery = query(
      collection(db, "feedback"),
      where("id", "==", feedbackId)
    )
    
    const publicQuerySnapshot = await getDocs(publicFeedbackQuery)
    const deletePromises = publicQuerySnapshot.docs.map(doc => deleteDoc(doc.ref))
    
    // Delete from user-specific database
    const userFeedbackQuery = query(
      collection(db, "users", userId, "feedback_post"),
      where("id", "==", feedbackId)
    )
    
    const userQuerySnapshot = await getDocs(userFeedbackQuery)
    const userDeletePromises = userQuerySnapshot.docs.map(doc => deleteDoc(doc.ref))
    
    // Execute all delete operations
    await Promise.all([...deletePromises, ...userDeletePromises])
    
    return true
  } catch (error) {
    console.error("Error deleting feedback:", error)
    return false
  }
}