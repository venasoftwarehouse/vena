import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/firebaseAdmin'

// PUT - Update user
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { displayName, phoneNumber, role, photoURL } = body

    // Validation
    if (!displayName) {
      return NextResponse.json({
        success: false,
        error: 'Display name is required'
      }, { status: 400 })
    }

    if (role && !['admin', 'doctor', 'nurse', 'user'].includes(role)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid role. Must be admin, doctor, nurse, or user'
      }, { status: 400 })
    }

    // Update user properties
    const updateData: any = {
      displayName,
    }

    // Only include phoneNumber if it's provided and not empty
    if (phoneNumber !== undefined && phoneNumber !== null && phoneNumber.trim() !== '') {
      updateData.phoneNumber = phoneNumber
    } else if (phoneNumber === '') {
      // Explicitly remove phone number if empty string is sent
      updateData.phoneNumber = null
    }

    // Only include photoURL if it's provided
    if (photoURL !== undefined) {
      updateData.photoURL = photoURL || null
    }

    await auth.updateUser(id, updateData)

    // Update custom claims for role
    if (role !== undefined) {
      if (role === 'user') {
        // Remove custom claims for user role
        await auth.setCustomUserClaims(id, {})
      } else {
        // Set custom claims for other roles
        await auth.setCustomUserClaims(id, { role })
      }
    }

    // Get updated user record
    const updatedUserRecord = await auth.getUser(id)

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUserRecord.uid,
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
    })
  } catch (error: any) {
    console.error('Error updating user:', error)
    
    // Handle specific Firebase errors
    if (error.code === 'auth/user-not-found') {
      return NextResponse.json({
        success: false,
        error: 'User tidak ditemukan'
      }, { status: 404 })
    }

    if (error.code === 'auth/invalid-phone-number') {
      return NextResponse.json({
        success: false,
        error: 'Format nomor telepon tidak valid'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update user'
    }, { status: 500 })
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    await auth.deleteUser(id)

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting user:', error)
    
    // Handle specific Firebase errors
    if (error.code === 'auth/user-not-found') {
      return NextResponse.json({
        success: false,
        error: 'User tidak ditemukan'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete user'
    }, { status: 500 })
  }
}