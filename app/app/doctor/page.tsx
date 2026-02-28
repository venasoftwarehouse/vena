"use client"

import { useAuth } from "@/contexts/auth-context"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useI18n } from "@/lib/i18n-context"
import { Button } from "@/components/ui/button"
import { Home, Camera, History, MessageCircle, MessageSquare } from "lucide-react"
import { usePathname } from "next/navigation"
import { useEffect, useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Copy, Users, Search, Mail, Phone, Calendar, Shield, UserCheck, UserX, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { FirebaseUser } from "@/types/user"
import { AppLayout } from "@/components/doctor-layout"
import { AuthGuard } from "@/components/auth-guard"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

// Skeleton Component
function DoctorPageSkeleton() {
    const { t } = useI18n()

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <div className="p-4 md:p-6 lg:p-8 space-y-6 lg:min-w-6xl max-w-6xl mx-auto">
                {/* Header Skeleton */}
                <div className="space-y-2">
                    <Skeleton className="h-9 w-64 md:w-96 bg-gray-300" />
                    <Skeleton className="h-5 w-48 md:w-72 bg-gray-300" />
                </div>

                {/* Search and Filter Skeleton */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('doctorPage.dashboard.searchPlaceholder')}
                            disabled
                            className="pl-10 bg-muted"
                        />
                    </div>
                    <Skeleton className="h-10 w-40 bg-gray-300" />
                </div>

                {/* User Cards Skeleton */}
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                            <Card key={i} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {/* Avatar Skeleton */}
                                            <Skeleton className="h-10 w-10 rounded-full bg-gray-300" />
                                            <div className="space-y-2">
                                                {/* Name Skeleton */}
                                                <Skeleton className="h-5 w-32 bg-gray-300" />
                                                {/* Email Skeleton */}
                                                <Skeleton className="h-4 w-40 bg-gray-300" />
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {/* Badges Skeleton */}
                                    <div className="flex gap-1">
                                        <Skeleton className="h-5 w-20 bg-gray-300" />
                                        <Skeleton className="h-5 w-16 bg-gray-300" />
                                    </div>

                                    {/* Phone Skeleton */}
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-16 bg-gray-300" />
                                        <Skeleton className="h-4 w-32 bg-gray-300" />
                                    </div>

                                    {/* UID Skeleton */}
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-20 bg-gray-300" />
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-8 flex-1 bg-gray-300" />
                                            <Skeleton className="h-8 w-8 bg-gray-300" />
                                        </div>
                                    </div>

                                    {/* Created Date Skeleton */}
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-16 bg-gray-300" />
                                        <Skeleton className="h-4 w-40 bg-gray-300" />
                                    </div>

                                    {/* Last Login Skeleton */}
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-28 bg-gray-300" />
                                        <Skeleton className="h-4 w-40 bg-gray-300" />
                                    </div>

                                    {/* Button Skeleton */}
                                    <div className="pt-2">
                                        <Skeleton className="h-9 w-full bg-gray-300" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Pagination Skeleton */}
                <div className="flex justify-center">
                    <div className="flex gap-2">
                        <Skeleton className="h-9 w-9 bg-gray-300" />
                        <Skeleton className="h-9 w-9 bg-gray-300" />
                        <Skeleton className="h-9 w-9 bg-gray-300" />
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper function to get user role with proper typing
const getUserRole = (user: FirebaseUser): 'admin' | 'doctor' | 'nurse' | 'user' => {
    const role = user.customClaims?.role as string
    switch (role) {
        case 'admin':
        case 'doctor':
        case 'nurse':
            return role
        default:
            return 'user'
    }
}

// Helper function to get user status
const getUserStatus = (user: FirebaseUser): 'anonymous' | 'verified' | 'unverified' => {
    if (user.anonymous) {
        return 'anonymous'
    } else if (user.emailVerified) {
        return 'verified'
    } else {
        return 'unverified'
    }
}

// Helper function to check if user is a patient (can be viewed by doctors)
const isPatient = (user: FirebaseUser): boolean => {
    const role = getUserRole(user)
    // Only show users and admins (who might also be patients)
    // Exclude doctors and nurses as they are healthcare providers
    return role === 'user' || role === 'admin'
}

// Main Component
export default function DoctorPage() {
    const { user, logout } = useAuth()
    const { profile, loading } = useUserProfile()
    const [loadingUser, setLoadingUser] = useState(true);
    const [users, setUsers] = useState<FirebaseUser[]>([]);
    const { t } = useI18n()
    const pathname = usePathname()
    const [isMounted, setIsMounted] = useState(false)
    const [imageError, setImageError] = useState(false)
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [currentPage, setCurrentPage] = useState(1)
    const usersPerPage = 9

    // Ensure component is mounted before rendering
    useEffect(() => {
        setIsMounted(true)
        fetchUsers();
    }, [])

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm)
            setCurrentPage(1) // Reset to first page when searching
        }, 300)

        return () => clearTimeout(timer)
    }, [searchTerm])

    // Reset page when status filter changes
    useEffect(() => {
        setCurrentPage(1)
    }, [statusFilter])

    // Debug logging - only in development mode
    useEffect(() => {
        if (process.env.NODE_ENV === "development" && isMounted) {
            console.log("Profile data in AppLayout:", profile)
            console.log("Profile photo URL in AppLayout:", profile.photoURL)
            console.log("Loading state:", loading)
            console.log("Image error state:", imageError)
        }
    }, [profile, loading, isMounted, imageError])

    // Memoize navigation items to prevent unnecessary re-renders
    const navigation = useMemo(() => [
        { name: t("appLayout.navigation.home"), href: "/app", icon: Home },
        { name: t("appLayout.navigation.scan"), href: "/app/scan", icon: Camera },
        { name: t("appLayout.navigation.history"), href: "/app/history", icon: History },
        { name: t("appLayout.navigation.aiAssistant"), href: "/app/chatbot", icon: MessageCircle },
        { name: t("appLayout.navigation.feedback"), href: "/app/feedback", icon: MessageSquare },
    ], [t])

    // Memoize user initials for better performance
    const userInitials = useMemo(() => {
        if (loading) return ""
        return profile.displayName?.charAt(0) || profile.email?.charAt(0) || "U"
    }, [loading, profile.displayName, profile.email])

    // Memoize avatar alt text
    const avatarAltText = useMemo(() => {
        return profile.displayName || "User"
    }, [profile.displayName])

    // Handle logout with proper error handling
    const handleLogout = useCallback(async () => {
        try {
            await logout()
        } catch (error) {
            console.error("Logout error:", error)
        }
    }, [logout])

    // Handle image error with proper error handling
    const handleImageError = useCallback(() => {
        console.error("Failed to load profile image")
        setImageError(true)
    }, [])

    const fetchUsers = async () => {
        try {
            setLoadingUser(true);
            const response = await fetch('/api/users');
            const result = await response.json();

            if (result.success) {
                // Sort users by creation time (newest first) and filter patients only
                const sortedUsers = result.data
                    .filter((user: FirebaseUser) => isPatient(user)) // Only show patients
                    .sort((a: FirebaseUser, b: FirebaseUser) => {
                        const dateA = new Date(a.metadata.creationTime).getTime()
                        const dateB = new Date(b.metadata.creationTime).getTime()
                        return dateB - dateA
                    })
                setUsers(sortedUsers);
            } else {
                toast.error(t('doctorPage.toast.fetchFailed'));
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error(t('doctorPage.toast.fetchError'));
        } finally {
            setLoadingUser(false);
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(t('doctorPage.toast.uidCopied'));
        } catch (error) {
            toast.error(t('doctorPage.toast.uidCopyFailed'));
        }
    };

    // Filter and paginate users
    const filteredAndPaginatedUsers = useMemo(() => {
        let filtered = users.filter(user => {
            const userStatus = getUserStatus(user)

            // Apply status filter
            if (statusFilter !== 'all' && userStatus !== statusFilter) {
                return false
            }

            // Apply search filter
            if (debouncedSearchTerm) {
                return (
                    user.displayName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                    user.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                    user.phoneNumber?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                    user.uid.includes(debouncedSearchTerm) ||
                    userStatus.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
                )
            }

            return true
        })

        // Calculate pagination
        const indexOfLastUser = currentPage * usersPerPage
        const indexOfFirstUser = indexOfLastUser - usersPerPage
        const currentUsers = filtered.slice(indexOfFirstUser, indexOfLastUser)

        return {
            users: currentUsers,
            totalUsers: filtered.length,
            totalPages: Math.ceil(filtered.length / usersPerPage)
        }
    }, [users, debouncedSearchTerm, statusFilter, currentPage])

    const formatDate = (dateString: string | null) => {
        if (!dateString) return t('doctorPage.userCard.neverLoggedIn');
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    function handleOpenHistory(uid: string): void {
        window.location.href = `/app/doctor/history/${encodeURIComponent(uid)}`;
    }

    return (
        <AuthGuard>
            <AppLayout>
                {loadingUser ? (
                    <DoctorPageSkeleton />
                ) : (
                    <div className="min-h-screen bg-background flex flex-col">
                        <div className="p-4 md:p-6 lg:p-8 space-y-6 lg:min-w-6xl max-w-6xl mx-auto">
                            <div className="space-y-2">
                                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                                    {t('doctorPage.welcome.greeting')}{user?.displayName ? `, ${user.displayName}` : ""}!
                                </h1>
                                <p className="text-muted-foreground">{t('doctorPage.welcome.subtitle')}</p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={t('doctorPage.dashboard.searchPlaceholder')}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                                    <Filter className="h-4 w-4 text-muted-foreground" />
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder={t('doctorPage.dashboard.filterStatus')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{t('doctorPage.dashboard.allStatus')}</SelectItem>
                                            <SelectItem value="anonymous">{t('doctorPage.dashboard.anonymous')}</SelectItem>
                                            <SelectItem value="verified">{t('doctorPage.dashboard.verified')}</SelectItem>
                                            <SelectItem value="unverified">{t('doctorPage.dashboard.unverified')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {filteredAndPaginatedUsers.users.map((user) => {
                                        const userStatus = getUserStatus(user)
                                        const userRole = getUserRole(user)

                                        return (
                                            <Card
                                                key={user.uid}
                                                className={`hover:shadow-lg transition-shadow ${userStatus === 'anonymous'
                                                    ? 'border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20'
                                                    : ''
                                                    }`}
                                            >
                                                <CardHeader>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar>
                                                                <AvatarImage src={user.photoURL} alt={user.displayName} />
                                                                <AvatarFallback className={userStatus === 'anonymous' ? 'bg-orange-200 dark:bg-orange-800' : ''}>
                                                                    {user.displayName ? user.displayName.substring(0, 2).toUpperCase() : userStatus === 'anonymous' ? 'A' : 'U'}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <CardTitle className="text-lg">
                                                                    {user.displayName || (userStatus === 'anonymous' ? t('doctorPage.userCard.anonymousUser') : t('doctorPage.userCard.noName'))}
                                                                </CardTitle>
                                                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                                    <Mail className="h-3 w-3" />
                                                                    {user.email || (userStatus === 'anonymous' ? t('doctorPage.userCard.noEmail') : '')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-3 flex-1 flex flex-col">
                                                    <div className="flex gap-1">
                                                        {userStatus === 'anonymous' && (
                                                            <Badge variant="secondary" className="text-xs bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200">
                                                                <UserX className="h-3 w-3 mr-1" />
                                                                {t('doctorPage.badges.anonymous')}
                                                            </Badge>
                                                        )}
                                                        {userStatus === 'verified' && (
                                                            <Badge variant="default" className="text-xs">
                                                                <UserCheck className="h-3 w-3 mr-1" />
                                                                {t('doctorPage.badges.verified')}
                                                            </Badge>
                                                        )}
                                                        {userStatus === 'unverified' && (
                                                            <Badge variant="outline" className="text-xs">
                                                                <UserX className="h-3 w-3 mr-1" />
                                                                {t('doctorPage.badges.unverified')}
                                                            </Badge>
                                                        )}
                                                        {userRole === 'admin' && (
                                                            <Badge className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                                                <Shield className="h-3 w-3 mr-1" />
                                                                {t('doctorPage.badges.admin')}
                                                            </Badge>
                                                        )}
                                                        {user.disabled && (
                                                            <Badge variant="destructive" className="text-xs">
                                                                <Shield className="h-3 w-3 mr-1" />
                                                                {t('doctorPage.badges.disabled')}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {user.phoneNumber && (
                                                        <div>
                                                            <p className="text-sm font-medium text-muted-foreground">{t('doctorPage.userCard.phone')}</p>
                                                            <p className="text-sm flex items-center gap-1">
                                                                <Phone className="h-3 w-3" />
                                                                {user.phoneNumber}
                                                            </p>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-medium text-muted-foreground">{t('doctorPage.userCard.uid')}</p>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-mono bg-muted px-2 py-1 rounded flex-1 truncate">
                                                                {user.uid}
                                                            </p>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => copyToClipboard(user.uid)}
                                                            >
                                                                <Copy className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-muted-foreground">{t('doctorPage.userCard.created')}</p>
                                                        <p className="text-sm flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {formatDate(user.metadata.creationTime)}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-1 flex-col">
                                                        <p className="text-sm font-medium text-muted-foreground">{t('doctorPage.userCard.lastLogin')}</p>
                                                        <p className="text-sm flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {user?.metadata?.lastSignInTime
                                                                ? formatDate(user.metadata.lastSignInTime)
                                                                : "-"}
                                                        </p>
                                                    </div>

                                                    <div className="flex gap-2 pt-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="flex-1"
                                                            onClick={() => handleOpenHistory(user.uid)}
                                                        >
                                                            <History className="h-3 w-3 mr-1" />
                                                            {t('doctorPage.userCard.viewHistory')}
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>

                                {filteredAndPaginatedUsers.users.length === 0 && (
                                    <div className="text-center py-12">
                                        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-medium mb-2">{t('doctorPage.emptyState.title')}</h3>
                                        <p className="text-muted-foreground">
                                            {debouncedSearchTerm || statusFilter !== 'all'
                                                ? t('doctorPage.emptyState.descriptionWithFilter')
                                                : t('doctorPage.emptyState.descriptionNoData')}
                                        </p>
                                    </div>
                                )}

                                {/* Pagination */}
                                {filteredAndPaginatedUsers.totalPages > 1 && (
                                    <div className="flex justify-center items-center gap-2 mt-6">

                                        {/* Previous button */}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="flex items-center gap-1"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            <span className="max-sm:hidden">
                                                {t('adminPage.buttons.previous')}
                                            </span>
                                        </Button>

                                        {/* Page numbers */}
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: filteredAndPaginatedUsers.totalPages }, (_, i) => i + 1).map(page => (
                                                <Button
                                                    key={page}
                                                    variant={currentPage === page ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setCurrentPage(page)}
                                                    className="w-8 h-8 p-0"
                                                >
                                                    {page}
                                                </Button>
                                            ))}
                                        </div>

                                        {/* Next button */}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setCurrentPage(prev => Math.min(prev + 1, filteredAndPaginatedUsers.totalPages))
                                            }
                                            disabled={currentPage === filteredAndPaginatedUsers.totalPages}
                                            className="flex items-center gap-1"
                                        >
                                            <span className="max-sm:hidden">
                                                {t('adminPage.buttons.next')}
                                            </span>
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}

                                {/* User count info */}
                                <div className="text-center text-sm text-muted-foreground">
                                    {t('doctorPage.userCount.showing')} {filteredAndPaginatedUsers.users.length} {t('doctorPage.userCount.of')} {filteredAndPaginatedUsers.totalUsers} {t('doctorPage.userCount.patients')}
                                    {statusFilter !== 'all' && ` ${t('doctorPage.userCount.withStatus')} "${statusFilter}"`}
                                    {debouncedSearchTerm && ` ${t('doctorPage.userCount.forSearch')} "${debouncedSearchTerm}"`}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </AppLayout>
        </AuthGuard>
    )
}