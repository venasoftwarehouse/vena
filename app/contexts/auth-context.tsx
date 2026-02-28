"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  signInWithCustomToken,
  signInAnonymously,
} from "firebase/auth"
import { auth } from "@/lib/firebase"
import { CredentialManagerAuth, CredentialManagerAuthConfig } from "@/lib/chrome-custom-tabs-auth"

interface AuthContextType {
  user: User | null
  loading: boolean
  isAndroidWebView: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithGoogleIdToken: (idToken: string) => Promise<void>
  signInAsAnonymous: () => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authInitialized, setAuthInitialized] = useState(false)
  const [isAndroidWebView, setIsAndroidWebView] = useState(false)
  const [credentialManagerAuth, setCredentialManagerAuth] = useState<CredentialManagerAuth | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize Credential Manager Auth
      const config: CredentialManagerAuthConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      }
      
      const credentialAuth = CredentialManagerAuth.initialize(config)
      setCredentialManagerAuth(credentialAuth)
      setIsAndroidWebView(credentialAuth.isInAndroidWebView())
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
      setAuthInitialized(true)
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const signUp = async (email: string, password: string) => {
    setLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      await sendEmailVerification(userCredential.user)
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const signInWithGoogle = async () => {
    setLoading(true)
    try {
      if (isAndroidWebView && credentialManagerAuth) {
        // Use Credential Manager for Android WebView
        credentialManagerAuth.handleGoogleSignIn()
        // The actual success/error handling will be done in the event listeners in the login page
        return
      } else {
        // Use standard Firebase auth for regular browsers
        const provider = new GoogleAuthProvider()
        await signInWithPopup(auth, provider)
      }
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const signInWithGoogleIdToken = async (idToken: string) => {
    setLoading(true)
    try {
      // Exchange the Google ID token for a Firebase custom token via our API
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to exchange token')
      }

      if (data.customToken) {
        await signInWithCustomToken(auth, data.customToken)
      } else {
        throw new Error(data.error || 'Failed to get custom token')
      }
    } catch (error) {
      console.error('Error signing in with Google ID token:', error)
      throw error
    }
  }

  const signInAsAnonymous = async () => {
    await signInAnonymously(auth)
  }

  const logout = async () => {
    await signOut(auth)
  }

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email)
  }

  const value = {
    user,
    loading: loading || !authInitialized,
    isAndroidWebView,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithGoogleIdToken,
    signInAsAnonymous,
    logout,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}