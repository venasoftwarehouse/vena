"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  signInWithCredential,
  signInWithCustomToken,
} from "firebase/auth"
import { auth } from "@/lib/firebase"
import { CredentialManagerAuth } from "@/lib/chrome-custom-tabs-auth"

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authInitialized, setAuthInitialized] = useState(false)
  const [isAndroidWebView, setIsAndroidWebView] = useState(false)
  const [webViewAuthInitialized, setWebViewAuthInitialized] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
      setAuthInitialized(true)
    })

    return unsubscribe
  }, [])

  // Initialize Chrome Custom Tabs Auth if in Android WebView
  useEffect(() => {
    const initializeWebViewAuth = () => {
      const config = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
        googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
      };

      const chromeAuth = CredentialManagerAuth.initialize(config);
      setIsAndroidWebView(chromeAuth.isInAndroidWebView());
      setWebViewAuthInitialized(true);

      const handleAuthSuccess = (event: any) => {
        const { code } = event.detail;
        if (code) {
          signInWithGoogleOAuthCode(code);
        }
      };

      const handleAuthError = (event: any) => {
        console.error('Authentication error:', event.detail);
      };

      window.addEventListener('authSuccess', handleAuthSuccess);
      window.addEventListener('authError', handleAuthError);

      return () => {
        window.removeEventListener('authSuccess', handleAuthSuccess);
        window.removeEventListener('authError', handleAuthError);
      };
    };

    if (typeof window !== 'undefined') {
      initializeWebViewAuth();
    }
  }, []);

  const handleGoogleSignIn = () => {
    if (isAndroidWebView && webViewAuthInitialized) {
      // In Android WebView, this will be handled by the Chrome Custom Tabs flow
      // The actual sign-in will happen when the auth code is received
      const config = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
        googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
      }

      const chromeAuth = CredentialManagerAuth.initialize(config)
      chromeAuth.handleGoogleSignIn()
    }
  }

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password)
  }

  const signInWithGoogle = async () => {
    if (isAndroidWebView) {
      // Use Chrome Custom Tabs for Android WebView
      handleGoogleSignIn()
    } else {
      // Use standard Firebase auth for regular browsers
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    }
  }

  const signInWithGoogleIdToken = async (idToken: string) => {
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const response = await fetch(`${apiBaseUrl}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (data.customToken) {
        await signInWithCustomToken(auth, data.customToken);
      } else {
        throw new Error(data.error || 'Failed to get custom token');
      }
    } catch (error) {
      console.error('Error signing in with Google ID token:', error);
      throw error;
    }
  };

  const signInAsAnonymous = async () => {
    await signInAnonymously(auth)
  }

  const logout = async () => {
    await signOut(auth)
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
