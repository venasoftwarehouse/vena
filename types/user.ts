export interface FirebaseUser {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber: string;
  photoURL: string;
  emailVerified: boolean;
  disabled: boolean;
  anonymous: boolean;
  role: string[]; // Added role field
  metadata: {
    creationTime: string;
    lastSignInTime: string | null;
  };
  customClaims: Record<string, any>;
  providerData: Array<{
    uid: string;
    displayName: string | null;
    email: string | null;
    phoneNumber: string | null;
    photoURL: string | null;
    providerId: string;
  }>;
}

export interface CreateUserData {
  email: string;
  password: string;
  displayName?: string;
  phoneNumber?: string;
  disabled?: boolean;
  anonymous?: boolean;
  role?: string; // Added role field
}

export interface UpdateUserData {
  email?: string;
  displayName?: string;
  phoneNumber?: string;
  disabled?: boolean;
  emailVerified?: boolean;
  anonymous?: boolean;
  role?: string; // Added role field
}

export interface ConvertAnonymousData {
  uid: string;
  email: string;
  password: string;
  displayName?: string;
  phoneNumber?: string;
  role?: string; // Added role field
}