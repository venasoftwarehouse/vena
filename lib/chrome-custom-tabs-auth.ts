/**
 * Android WebView Authentication Helper for Credential Manager
 * 
 * This utility helps handle Firebase Authentication in Android WebViews
 * by using the Android Credential Manager for OAuth flows, which avoids the
 * "disallowed_useragent" error and maintains proper authentication state.
 */

export interface CredentialManagerAuthConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId?: string;
  googleClientId?: string;
}

export class CredentialManagerAuth {
  private config: CredentialManagerAuthConfig;
  private isAndroidWebView: boolean;

  constructor(config: CredentialManagerAuthConfig) {
    this.config = config;
    this.isAndroidWebView = this.detectAndroidWebView();
  }

  /**
   * Detect if the app is running in an Android WebView
   */
  private detectAndroidWebView(): boolean {
    if (typeof navigator === 'undefined' || !navigator.userAgent) {
      return false;
    }

    const userAgent = navigator.userAgent.toLowerCase();
    return (
      userAgent.includes('wv') || 
      userAgent.includes('webview') ||
      userAgent.includes('android') && 
      userAgent.includes('version') && 
      userAgent.includes('chrome')
    );
  }

  /**
   * Check if we're in an Android WebView environment
   */
  isInAndroidWebView(): boolean {
    return this.isAndroidWebView;
  }

  /**
   * Handle Google Sign-In in Android WebView using Credential Manager
   */
  handleGoogleSignIn(): void {
    if (!this.isAndroidWebView) {
      return;
    }

    // For Android WebView, we use the native Android interface
    // @ts-ignore
    if (window.Android && typeof window.Android.signInWithGoogle === 'function') {
      // @ts-ignore
      window.Android.signInWithGoogle();
      console.log('Called Android.signInWithGoogle for Google Sign-In with Credential Manager');
    } else {
      console.error('Android interface not found or signInWithGoogle method not available.');
    }
  }

  /**
   * Initialize the authentication helper
   */
  static initialize(config: CredentialManagerAuthConfig): CredentialManagerAuth {
    return new CredentialManagerAuth(config);
  }
}

/**
 * Hook to use Credential Manager authentication in React components
 */
export function useCredentialManagerAuth() {
  if (typeof window !== 'undefined') {
    // Listen for authentication results from Credential Manager
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'authResult') {
        // Handle the authentication result
        console.log('Authentication result received:', event.data);
      }
    });
  }
}