/**
 * Deep Link Handler for Android WebView Authentication
 * 
 * This utility handles deep links and URL parameters for authentication
 * flows in Android WebViews, particularly for OAuth callbacks.
 */

/**
 * Check if the current URL contains authentication parameters
 */
export function hasAuthParams(): boolean {
  if (typeof window === 'undefined') return false;
  
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has('code') || urlParams.has('state') || urlParams.has('error');
}

/**
 * Extract authentication parameters from the URL
 */
export function extractAuthParams(): {
  code?: string;
  state?: string;
  error?: string;
  errorDescription?: string;
} {
  if (typeof window === 'undefined') {
    return {};
  }

  const urlParams = new URLSearchParams(window.location.search);
  
  return {
    code: urlParams.get('code') || undefined,
    state: urlParams.get('state') || undefined,
    error: urlParams.get('error') || undefined,
    errorDescription: urlParams.get('error_description') || undefined,
  };
}

/**
 * Handle deep links for authentication
 */
export function handleDeepLink(): void {
  if (typeof window === 'undefined') return;

  // Check if we have authentication parameters in the URL
  if (hasAuthParams()) {
    const params = extractAuthParams();
    
    if (params.error) {
      // Handle authentication error
      console.error('Authentication error:', params.error, params.errorDescription);
      
      // Dispatch an event that the Android app can listen to
      window.dispatchEvent(new CustomEvent('authError', {
        detail: {
          error: params.error,
          errorDescription: params.errorDescription,
        }
      }));
      
      return;
    }

    if (params.code) {
      // Handle successful authentication
      console.log('Authentication code received:', params.code);
      
      // Dispatch an event that the Android app can listen to
      window.dispatchEvent(new CustomEvent('authSuccess', {
        detail: {
          code: params.code,
          state: params.state,
        }
      }));
      
      // Clean up the URL by removing the auth parameters
      const url = new URL(window.location.href);
      url.searchParams.delete('code');
      url.searchParams.delete('state');
      window.history.replaceState({}, document.title, url.toString());
    }
  }
}

/**
 * Create a deep link URL for authentication
 */
export function createAuthDeepLink(authUrl: string): string {
  // In a real implementation, this would create a deep link that
  // the Android app can intercept and handle
  return authUrl;
}

/**
 * Send a message to the Android WebView
 */
export function sendToAndroidWebView(type: string, data: any): void {
  if (typeof window === 'undefined') return;

  // Try to communicate with the Android WebView
  if (typeof (window as any).AndroidWebView !== 'undefined') {
    (window as any).AndroidWebView.postMessage(JSON.stringify({
      type,
      data,
    }));
  } else {
    // Fallback: dispatch a custom event
    window.dispatchEvent(new CustomEvent('messageToAndroid', {
      detail: {
        type,
        data,
      }
    }));
  }
}

/**
 * Listen for messages from the Android WebView
 */
export function listenForAndroidMessages(callback: (message: any) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleMessage = (event: MessageEvent) => {
    // Check if the message is from the Android WebView
    if (event.data && typeof event.data === 'string') {
      try {
        const message = JSON.parse(event.data);
        if (message.type && message.data) {
          callback(message);
        }
      } catch (error) {
        console.error('Error parsing message from Android WebView:', error);
      }
    }
  };

  window.addEventListener('message', handleMessage);

  // Also listen for custom events
  const handleCustomEvent = (event: any) => {
    if (event.detail && event.detail.type && event.detail.data) {
      callback(event.detail);
    }
  };

  window.addEventListener('messageFromAndroid', handleCustomEvent);

  return () => {
    window.removeEventListener('message', handleMessage);
    window.removeEventListener('messageFromAndroid', handleCustomEvent);
  };
}