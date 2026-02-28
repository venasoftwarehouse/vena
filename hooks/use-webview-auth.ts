"use client";

import { useEffect, useState } from "react";
import { CredentialManagerAuth } from "@/lib/chrome-custom-tabs-auth";
import { handleDeepLink } from "@/lib/deep-link-handler";

export function useWebViewAuth() {
  const [isAndroidWebView, setIsAndroidWebView] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    // Initialize Chrome Custom Tabs Auth
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
    };

    const chromeAuth = CredentialManagerAuth.initialize(firebaseConfig);
    setIsAndroidWebView(chromeAuth.isInAndroidWebView());

    // Listen for custom events from Android WebView
    const handleAuthResult = (event: any) => {
      if (event.detail && event.detail.type === "authResult") {
        // Process the authentication result
        const { credential } = event.detail;
        if (credential) {
          // Sign in with the credential
          // This would need to be implemented based on how the Android app passes the credential
          console.log("Auth credential received:", credential);
        }
      }
    };

    window.addEventListener("authResult", handleAuthResult);

    // Check for deep links on initial load
    handleDeepLink();

    setAuthInitialized(true);

    return () => {
      window.removeEventListener("authResult", handleAuthResult);
    };
  }, []);

  const handleGoogleSignIn = () => {
    if (isAndroidWebView) {
      // Use Chrome Custom Tabs for Android WebView
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
      };

      const chromeAuth = CredentialManagerAuth.initialize(firebaseConfig);
      chromeAuth.handleGoogleSignIn();
    } else {
      // This will be handled by the component using the hook
      // The component will call the appropriate signInWithGoogle method from useAuth
      console.log("Not in Android WebView, component should handle standard Google sign-in");
    }
  };

  return {
    isAndroidWebView,
    authInitialized,
    handleGoogleSignIn,
  };
}