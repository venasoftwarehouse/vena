import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getAuth } from "firebase/auth"

interface UserProfile {
  photoURL: string | null
  displayName: string | null
  email: string | null
  isAnonymous: boolean
}

export function useUserProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile>({
    photoURL: null,
    displayName: null,
    email: null,
    isAnonymous: true,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setProfile({
          photoURL: null,
          displayName: null,
          email: null,
          isAnonymous: true,
        })
        setLoading(false)
        return
      }

      try {
        // Get the current user directly from Firebase Auth to ensure we have the latest data
        const auth = getAuth()
        const currentUser = auth.currentUser

        console.log("Current User from Auth:", currentUser)
        
        // Use data from Firebase Auth currentUser as the primary source
        let photoURL = currentUser?.photoURL || null
        console.log("Photo URL from Auth:", photoURL)
        let displayName = currentUser?.displayName || null
        let email = currentUser?.email || null
        let isAnonymous = currentUser?.isAnonymous || false

        // Only check Firestore if we don't have a photoURL from Firebase Auth
        if (!photoURL) {
          const userDocRef = doc(db, "users", user.uid)
          const userDoc = await getDoc(userDocRef)

          // If we have additional data in Firestore, use that
          if (userDoc.exists()) {
            const userData = userDoc.data()
            if (userData.photoURL) {
              photoURL = userData.photoURL
            }
            if (!displayName && userData.displayName) {
              displayName = userData.displayName
            }
          }
        }

        console.log("Final profile data being set:", { photoURL, displayName, email, isAnonymous })
        
        setProfile({
          photoURL,
          displayName,
          email,
          isAnonymous,
        })
      } catch (error) {
        console.error("Error fetching user profile:", error)
        // Fallback to Firebase Auth data
        const auth = getAuth()
        const currentUser = auth.currentUser
        
        setProfile({
          photoURL: currentUser?.photoURL || null,
          displayName: currentUser?.displayName || null,
          email: currentUser?.email || null,
          isAnonymous: currentUser?.isAnonymous || false,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [user])

  return { profile, loading }
}