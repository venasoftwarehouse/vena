"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { useAuth } from "@/contexts/auth-context";

interface DeepLinkHandlerProps {
  children: React.ReactNode;
}

export function DeepLinkHandler({ children }: DeepLinkHandlerProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).handleFcmToken = async (token: string) => {
        if (user && token) {
          try {
            await fetch("/api/fcm-token", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ userId: user.uid, token }),
            });
          } catch (error) {
            console.error("Error saving FCM token from native: ", error);
          }
        }
      };
    }
  }, [user]);

  useEffect(() => {
    // Check if user is on Android
    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroidDevice = userAgent.indexOf("android") > -1;
    
    if (isAndroidDevice && pathname === "/app") {
      // Try to open the app via deep link
      try {
        // Create an iframe to attempt opening the app
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = "dianova://app"; // Deep link URL scheme
        
        document.body.appendChild(iframe);
        
        // Set a timeout to check if the app opened
        const timeout = setTimeout(() => {
          // If we're still here, the app didn't open
          document.body.removeChild(iframe);
          
          // Check if we should show the app suggestion popup
          const hasClosedPopup = localStorage.getItem("dianova-popup-closed");
          if (!hasClosedPopup) {
            // The popup will be shown by the AppSuggestionPopup component
          }
        }, 500);
        
        // Listen for the page visibility change
        const handleVisibilityChange = () => {
          if (document.hidden) {
            // The page was hidden, likely because the app opened
            clearTimeout(timeout);
            document.body.removeChild(iframe);
          }
        };
        
        document.addEventListener("visibilitychange", handleVisibilityChange);
        
        return () => {
          clearTimeout(timeout);
          document.removeEventListener("visibilitychange", handleVisibilityChange);
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        };
      } catch (error) {
        console.error("Error attempting to open app:", error);
      }
    }
  }, [pathname]);

  return <>{children}</>;
}