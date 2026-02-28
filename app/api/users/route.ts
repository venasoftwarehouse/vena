import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/firebaseAdmin'
import { getAuth } from 'firebase-admin/auth'

// GET - List all users
export async function GET(request: NextRequest) {
  try {
    const listUsersResult = await auth.listUsers(1000)

    const users = listUsersResult.users.map(userRecord => ({
      uid: userRecord.uid,
      email: userRecord.email || '',
      displayName: userRecord.displayName || '',
      photoURL: userRecord.photoURL || '',
      phoneNumber: userRecord.phoneNumber || '',
      emailVerified: userRecord.emailVerified,
      disabled: userRecord.disabled,
      anonymous: userRecord.providerData.length === 0,
      metadata: {
        creationTime: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime
      },
      customClaims: userRecord.customClaims || {}
    }))

    return NextResponse.json({
      success: true,
      data: users
    })
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch users'
    }, { status: 500 })
  }
}

// POST - Create new user
// Di /api/users/route.ts - POST method
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, displayName, phoneNumber, role, photoURL } = body

    // Validation
    if (!email || !password || !displayName) {
      return NextResponse.json({
        success: false,
        error: 'Email, password, and display name are required'
      }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({
        success: false,
        error: 'Password must be at least 6 characters'
      }, { status: 400 })
    }

    if (!['admin', 'doctor', 'nurse', 'user'].includes(role)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid role. Must be admin, doctor, nurse, or user'
      }, { status: 400 })
    }

    // Create user object with optional fields
    const userRecordData: any = {
      email,
      password,
      displayName,
      emailVerified: false
    }

    // Only include phoneNumber if it's provided and not empty
    if (phoneNumber && phoneNumber.trim() !== '') {
      userRecordData.phoneNumber = phoneNumber
    }

    // Only include photoURL if it's provided and not empty
    if (photoURL && photoURL.trim() !== '') {
      userRecordData.photoURL = photoURL
    }

    // Create user
    const userRecord = await auth.createUser(userRecordData)

    // Set custom claims for role (only if not 'user')
    if (role !== 'user') {
      await auth.setCustomUserClaims(userRecord.uid, { role })
    }

    // Get updated user record with custom claims
    const updatedUserRecord = await auth.getUser(userRecord.uid)

    return NextResponse.json({
      success: true,
      data: {
        uid: updatedUserRecord.uid,
        email: updatedUserRecord.email,
        displayName: updatedUserRecord.displayName,
        photoURL: updatedUserRecord.photoURL,
        phoneNumber: updatedUserRecord.phoneNumber,
        emailVerified: updatedUserRecord.emailVerified,
        disabled: updatedUserRecord.disabled,
        customClaims: updatedUserRecord.customClaims,
        metadata: {
          creationTime: updatedUserRecord.metadata.creationTime,
          lastSignInTime: updatedUserRecord.metadata.lastSignInTime
        }
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating user:', error)

    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json({
        success: false,
        error: 'Email sudah terdaftar'
      }, { status: 400 })
    }

    if (error.code === 'auth/invalid-email') {
      return NextResponse.json({
        success: false,
        error: 'Format email tidak valid'
      }, { status: 400 })
    }

    if (error.code === 'auth/invalid-password') {
      return NextResponse.json({
        success: false,
        error: 'Password terlalu lemah'
      }, { status: 400 })
    }

    if (error.code === 'auth/invalid-phone-number') {
      return NextResponse.json({
        success: false,
        error: 'Format nomor telepon tidak valid'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create user'
    }, { status: 500 })
  }
}