
import { type NextRequest, NextResponse } from "next/server"
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export async function POST(request: NextRequest) {
  try {
    const { userId, token } = await request.json()

    if (!userId || !token) {
      return NextResponse.json({ error: "Missing userId or token" }, { status: 400 })
    }

    // Check if the token already exists for the user
    const tokensQuery = query(
      collection(db, "users", userId, "fcm_tokens"),
      where("token", "==", token)
    )
    const querySnapshot = await getDocs(tokensQuery)

    if (!querySnapshot.empty) {
      return NextResponse.json({ success: true, message: "Token already exists" })
    }

    // Add the new token
    await addDoc(collection(db, "users", userId, "fcm_tokens"), {
      token,
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, message: "Token saved successfully" })
  } catch (error) {
    console.error("Error saving FCM token:", error)
    return NextResponse.json({ error: "Failed to save FCM token" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId, token } = await request.json()

    if (!userId || !token) {
      return NextResponse.json({ error: "Missing userId or token" }, { status: 400 })
    }

    // Find and delete the token
    const tokensQuery = query(
      collection(db, "users", userId, "fcm_tokens"),
      where("token", "==", token)
    )
    const querySnapshot = await getDocs(tokensQuery)

    if (querySnapshot.empty) {
      return NextResponse.json({ success: true, message: "Token not found" })
    }

    const deletePromises = querySnapshot.docs.map((docSnapshot) =>
      deleteDoc(doc(db, "users", userId, "fcm_tokens", docSnapshot.id))
    )
    await Promise.all(deletePromises)

    return NextResponse.json({ success: true, message: "Token deleted successfully" })
  } catch (error) {
    console.error("Error deleting FCM token:", error)
    return NextResponse.json({ error: "Failed to delete FCM token" }, { status: 500 })
  }
}
