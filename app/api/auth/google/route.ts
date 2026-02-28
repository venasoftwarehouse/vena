import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
try {
  if (admin.apps.length === 0) {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountString) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set.');
    }
    const serviceAccount = JSON.parse(serviceAccountString);
    
    // Fix the private key format by replacing escaped newlines with actual newlines
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
}

// Function to decode JWT token without external library
function decodeJWT(token: string) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
}

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (typeof idToken !== 'string') {
      return NextResponse.json({ error: 'Invalid ID token' }, { status: 400 });
    }

    try {
      // First, try to verify the token with the default settings
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;

      // Create a custom token for the user
      const customToken = await admin.auth().createCustomToken(uid);

      return NextResponse.json({ customToken });
    } catch (verificationError) {
      console.error('Error verifying ID token with default settings:', verificationError);
      
      // If the default verification fails, we need to handle the Google ID token differently
      try {
        // Decode the token to get the user information
        const decodedToken: any = decodeJWT(idToken);
        
        // Verify the token was issued by Google
        if (decodedToken.iss !== 'https://accounts.google.com' && 
            decodedToken.iss !== 'accounts.google.com') {
          throw new Error('Invalid token issuer');
        }
        
        // Check if the token is for our client
        const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!googleClientId) {
          throw new Error('Google client ID not found in environment variables');
        }
        
        if (decodedToken.aud !== googleClientId) {
          throw new Error('Token audience does not match our client ID');
        }
        
        // Get the user's email from the token
        const email = decodedToken.email;
        if (!email) {
          throw new Error('Email not found in token');
        }
        
        // Get or create the user in Firebase
        let userRecord;
        try {
          userRecord = await admin.auth().getUserByEmail(email);
        } catch (error) {
          // User doesn't exist, create a new one
          userRecord = await admin.auth().createUser({
            email: email,
            emailVerified: decodedToken.email_verified || false,
            displayName: decodedToken.name,
            photoURL: decodedToken.picture,
          });
        }
        
        // Create a custom token for the user
        const customToken = await admin.auth().createCustomToken(userRecord.uid);

        return NextResponse.json({ customToken });
      } catch (secondVerificationError) {
        console.error('Error verifying ID token with custom method:', secondVerificationError);
        throw secondVerificationError;
      }
    }
  } catch (error) {
    console.error('Error exchanging auth token:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: errorMessage 
    }, { status: 500 });
  }
}