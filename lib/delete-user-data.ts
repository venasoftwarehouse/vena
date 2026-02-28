// Hapus semua data user dari Firestore dan storage
// Pastikan sudah setup Firebase SDK di lib/firebase.ts
import { db } from "@/lib/firebase"
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore"

/**
 * Menghapus semua data user dari Firestore (misal: koleksi scans, profile, dsb)
 * @param userId string - UID user dari Firebase Auth
 */
export async function deleteUserData(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Hapus semua scan milik user
    const scansRef = collection(db, "scans")
    const userScans = await getDocs(scansRef)
  const batchDeletes: Promise<void>[] = []
    userScans.forEach((scanDoc) => {
      const data = scanDoc.data()
      if (data.userId === userId) {
        batchDeletes.push(deleteDoc(doc(db, "scans", scanDoc.id)))
      }
    })
    await Promise.all(batchDeletes)

    // Hapus profile user
    await deleteDoc(doc(db, "users", userId))

    // Tambahkan penghapusan data lain jika perlu

    return { success: true }
  } catch (error) {
    console.error("Delete user data error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
