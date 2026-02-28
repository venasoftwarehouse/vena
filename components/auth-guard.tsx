"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  allowedRoles?: string[]
}

export function AuthGuard({ children, requireAuth = true, allowedRoles }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [roleLoading, setRoleLoading] = useState(true)

  // Fetch user role dari custom claims
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const idTokenResult = await user.getIdTokenResult()
          setUserRole(idTokenResult.claims.role as string || null)
        } catch (error) {
          console.error("Error fetching user role:", error)
          setUserRole(null)
        }
      } else {
        setUserRole(null)
      }
      setRoleLoading(false)
    }

    if (!loading) {
      fetchUserRole()
    }
  }, [user, loading])

  // Check authentication
  useEffect(() => {
    if (!loading && requireAuth && !user) {
      router.push("/app/login")
    }
  }, [user, loading, requireAuth, router])

  // Check role-based access untuk /app/doctor/
  useEffect(() => {
    if (!loading && !roleLoading && user) {
      const isDoctorPath = pathname?.startsWith("/app/doctor/")
      const isPatientPath = pathname === "/app/" || pathname === "/app"
      const allowedDoctorRoles = ["admin", "doctor", "nurse"]
      
      // Jika doctor/nurse akses /app/ (patient area), redirect ke /app/doctor/
      if (isPatientPath && userRole && (userRole === "doctor" || userRole === "nurse")) {
        router.push("/app/doctor/")
        return
      }
      
      // Jika patient (tanpa role atau role lain) akses /app/doctor/, redirect ke /app/
      if (isDoctorPath && (!userRole || !allowedDoctorRoles.includes(userRole))) {
        router.push("/app/")
        return
      }
    }
  }, [user, loading, roleLoading, userRole, pathname, router])

  // Check custom allowedRoles jika ada
  useEffect(() => {
    if (!loading && !roleLoading && user && allowedRoles && allowedRoles.length > 0) {
      if (!userRole || !allowedRoles.includes(userRole)) {
        router.push("/app/")
      }
    }
  }, [user, loading, roleLoading, userRole, allowedRoles, router])

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (requireAuth && !user) {
    return null
  }

  return <>{children}</>
}