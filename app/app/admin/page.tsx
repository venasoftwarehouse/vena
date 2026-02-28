"use client"

import { useAuth } from "@/contexts/auth-context"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useI18n } from "@/lib/i18n-context"
import { Button } from "@/components/ui/button"
import { Home, Camera, History, MessageCircle, MessageSquare } from "lucide-react"
import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Copy, Users, Search, Mail, Phone, Calendar, Shield, UserCheck, UserX, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Filter, Key } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { FirebaseUser } from "@/types/user"
import { AppLayout } from "@/components/app-layout"
import { AuthGuard } from "@/components/auth-guard"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Skeleton Component
function AdminPageSkeleton() {
    const { t } = useI18n()

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <div className="p-4 md:p-6 lg:p-8 space-y-6 lg:min-w-6xl max-w-6xl mx-auto">
                {/* Header Skeleton */}
                <div className="flex justify-between items-start">
                    <div className="space-y-2">
                        <Skeleton className="h-9 w-64 md:w-96 bg-gray-300" />
                        <Skeleton className="h-5 w-48 md:w-72 bg-gray-300" />
                    </div>
                    <Skeleton className="h-9 w-24 bg-gray-300" />
                </div>

                {/* Search and Filter Skeleton */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t("adminPage.search.placeholder")}
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
                                            <Skeleton className="h-10 w-10 rounded-full bg-gray-300" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-5 w-32 bg-gray-300" />
                                                <Skeleton className="h-4 w-40 bg-gray-300" />
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex gap-1">
                                        <Skeleton className="h-5 w-20 bg-gray-300" />
                                        <Skeleton className="h-5 w-16 bg-gray-300" />
                                    </div>
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-16 bg-gray-300" />
                                        <Skeleton className="h-4 w-32 bg-gray-300" />
                                    </div>
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-20 bg-gray-300" />
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-8 flex-1 bg-gray-300" />
                                            <Skeleton className="h-8 w-8 bg-gray-300" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-16 bg-gray-300" />
                                        <Skeleton className="h-4 w-40 bg-gray-300" />
                                    </div>
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-28 bg-gray-300" />
                                        <Skeleton className="h-4 w-40 bg-gray-300" />
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <Skeleton className="h-9 flex-1 bg-gray-300" />
                                        <Skeleton className="h-9 flex-1 bg-gray-300" />
                                        <Skeleton className="h-9 w-9 bg-gray-300" />
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
    )
}

// User Form Data Interface
interface UserFormData {
    uid?: string  // Optional for create, required for edit
    email: string
    password: string
    displayName: string
    phoneNumber: string
    role: 'admin' | 'doctor' | 'nurse' | 'user' | 'dokter' | 'suster' | 'pengguna'
    photoURL?: string
}

// Helper function to get user role with proper typing
const getUserRole = (user: FirebaseUser): 'admin' | 'doctor' | 'nurse' | 'user' | 'dokter' | 'suster' | 'pengguna' => {
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

// Helper function to create empty form data
const createEmptyFormData = (): UserFormData => ({
    email: '',
    password: '',
    displayName: '',
    phoneNumber: '',
    role: 'user',
    photoURL: ''
})

// Main Component
export default function AdminPage() {
    const { user } = useAuth()
    const { profile, loading } = useUserProfile()
    const [loadingUser, setLoadingUser] = useState(true)
    const [users, setUsers] = useState<FirebaseUser[]>([])
    const { t } = useI18n()
    const [isMounted, setIsMounted] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState<string>('all')
    const [currentPage, setCurrentPage] = useState(1)
    const usersPerPage = 9

    // Dialog states
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<FirebaseUser | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form data with refs for better input handling
    const [formData, setFormData] = useState<UserFormData>(createEmptyFormData())

    // Temporary form data for input fields
    const [tempFormData, setTempFormData] = useState<UserFormData>(createEmptyFormData())

    // Refs for input fields
    const uidRef = useRef<HTMLInputElement>(null)
    const emailRef = useRef<HTMLInputElement>(null)
    const passwordRef = useRef<HTMLInputElement>(null)
    const displayNameRef = useRef<HTMLInputElement>(null)
    const phoneNumberRef = useRef<HTMLInputElement>(null)
    const photoURLRef = useRef<HTMLInputElement>(null)

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm)
            setCurrentPage(1) // Reset to first page when searching
        }, 300)

        return () => clearTimeout(timer)
    }, [searchTerm])

    // Reset page when role filter changes
    useEffect(() => {
        setCurrentPage(1)
    }, [roleFilter])

    useEffect(() => {
        setIsMounted(true)
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            setLoadingUser(true)
            const response = await fetch('/api/users')
            const result = await response.json()

            if (result.success) {
                // Sort users by creation time (newest first)
                const sortedUsers = result.data.sort((a: FirebaseUser, b: FirebaseUser) => {
                    const dateA = new Date(a.metadata.creationTime).getTime()
                    const dateB = new Date(b.metadata.creationTime).getTime()
                    return dateB - dateA
                })
                setUsers(sortedUsers)
            } else {
                toast.error(t('adminPage.toast.fetchUsersFailed'))
            }
        } catch (error) {
            console.error(t('adminPage.toast.fetchUsersFailed'), error)
            toast.error(t('adminPage.toast.fetchError'))
        } finally {
            setLoadingUser(false)
        }
    }

    // Di AdminPage.tsx - handleCreateUser function
    const handleCreateUser = async () => {
        if (!formData.email || !formData.password || !formData.displayName) {
            toast.error(t('adminPage.toast.createValidation'))
            return
        }

        try {
            setIsSubmitting(true)

            // Only include fields that have values
            const submitData: any = {
                email: formData.email,
                password: formData.password,
                displayName: formData.displayName,
                role: formData.role
            }

            if (formData.phoneNumber && formData.phoneNumber.trim() !== '') {
                submitData.phoneNumber = formData.phoneNumber
            }

            if (formData.photoURL && formData.photoURL.trim() !== '') {
                submitData.photoURL = formData.photoURL
            }

            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitData)
            })

            const result = await response.json()

            if (result.success) {
                toast.success(t('adminPage.toast.createSuccess'))
                setIsCreateDialogOpen(false)
                resetForm()
                fetchUsers()
            } else {
                toast.error(result.error || t('adminPage.toast.createFailed'))
            }
        } catch (error) {
            console.error(t('adminPage.toast.createFailed'), error)
            toast.error(t('adminPage.toast.createError'))
        } finally {
            setIsSubmitting(false)
        }
    }

    // Di dalam handleUpdateUser function
    const handleUpdateUser = async () => {
        if (!selectedUser || !formData.displayName) {
            toast.error(t('adminPage.toast.updateValidation'))
            return
        }

        try {
            setIsSubmitting(true)
            const updateData: any = {
                displayName: formData.displayName,
                role: formData.role
            }

            // Only include phoneNumber if it's provided
            if (formData.phoneNumber && formData.phoneNumber.trim() !== '') {
                updateData.phoneNumber = formData.phoneNumber
            }

            // Only include photoURL if it's provided
            if (formData.photoURL && formData.photoURL.trim() !== '') {
                updateData.photoURL = formData.photoURL
            }

            const response = await fetch(`/api/users/${selectedUser.uid}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            })

            const result = await response.json()

            if (result.success) {
                toast.success(t('adminPage.toast.updateSuccess'))
                setIsEditDialogOpen(false)
                setSelectedUser(null)
                resetForm()
                fetchUsers()
            } else {
                toast.error(result.error || t('adminPage.toast.updateFailed'))
            }
        } catch (error) {
            console.error(t('adminPage.toast.updateFailed'), error)
            toast.error(t('adminPage.toast.updateError'))
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteUser = async () => {
        if (!selectedUser) return

        try {
            setIsSubmitting(true)
            const response = await fetch(`/api/users/${selectedUser.uid}`, {
                method: 'DELETE'
            })

            const result = await response.json()

            if (result.success) {
                toast.success(t('adminPage.toast.deleteSuccess'))
                setIsDeleteDialogOpen(false)
                setSelectedUser(null)
                fetchUsers()
            } else {
                toast.error(result.error || t('adminPage.toast.deleteFailed'))
            }
        } catch (error) {
            console.error(t('adminPage.toast.deleteFailed'), error)
            toast.error(t('adminPage.toast.deleteError'))
        } finally {
            setIsSubmitting(false)
        }
    }

    const openEditDialog = (user: FirebaseUser) => {
        setSelectedUser(user)

        const newFormData: UserFormData = {
            uid: user.uid,
            email: user.email,
            password: '',
            displayName: user.displayName,
            phoneNumber: user.phoneNumber || '',
            role: getUserRole(user),
            photoURL: user.photoURL || ''
        }

        setFormData(newFormData)
        setTempFormData(newFormData)
        setIsEditDialogOpen(true)
    }

    const openCreateDialog = () => {
        const newFormData = createEmptyFormData()

        setFormData(newFormData)
        setTempFormData(newFormData)
        setIsCreateDialogOpen(true)
    }

    const openDeleteDialog = (user: FirebaseUser) => {
        setSelectedUser(user)
        setIsDeleteDialogOpen(true)
    }

    const resetForm = () => {
        const newFormData = createEmptyFormData()
        setFormData(newFormData)
        setTempFormData(newFormData)
    }

    const handleInputChange = (field: keyof UserFormData, value: string) => {
        setTempFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleInputBlur = (field: keyof UserFormData) => {
        setFormData(prev => ({
            ...prev,
            [field]: tempFormData[field]
        }))
    }

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            toast.success(t('adminPage.toast.uidCopied'))
        } catch (error) {
            toast.error(t('adminPage.toast.uidCopyFailed'))
        }
    }

    // Filter and paginate users
    const filteredAndPaginatedUsers = useMemo(() => {
        let filtered = users.filter(user => {
            const userRole = getUserRole(user)

            // Apply role filter
            if (roleFilter !== 'all' && userRole !== roleFilter) {
                return false
            }

            // Apply search filter
            if (debouncedSearchTerm) {
                return (
                    user.displayName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                    user.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                    user.phoneNumber?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                    user.uid.includes(debouncedSearchTerm) ||
                    userRole.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                    (user.anonymous && 'anonymous'.includes(debouncedSearchTerm.toLowerCase()))
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
    }, [users, debouncedSearchTerm, roleFilter, currentPage])

    const formatDate = (dateString: string | null) => {
        if (!dateString) return t('adminPage.userCard.neverLoggedIn')
        return new Date(dateString).toLocaleDateString(t('localeDate'), {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            case 'doctor':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            case 'nurse':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            case 'user':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
        }
    }

    function handleOpenHistory(uid: string): void {
        window.location.href = `/app/admin/history/${encodeURIComponent(uid)}`
    }

    // Get unique roles for filter
    const uniqueRoles = useMemo(() => {
        const roles = new Set<string>()
        users.forEach(user => {
            const role = getUserRole(user)
            roles.add(role)
        })
        return Array.from(roles).sort()
    }, [users])

    return (
        <AuthGuard>
            <AppLayout>
                {loadingUser ? (
                    <AdminPageSkeleton />
                ) : (
                    <div className="min-h-screen bg-background flex flex-col">
                        <div className="p-4 md:p-6 lg:p-8 space-y-6 lg:min-w-6xl max-w-6xl mx-auto">
                            <div className="flex justify-between items-start sm:flex-row flex-col">
                                <div className="space-y-2 mb-5 sm:mb-0">
                                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                                        {t('adminPage.title')}{user?.displayName ? `, ${user.displayName}` : ""}
                                    </h1>
                                    <p className="text-muted-foreground">{t('adminPage.subtitle')}</p>
                                </div>
                                <Button onClick={openCreateDialog}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    {t('adminPage.buttons.addUser')}
                                </Button>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={t('adminPage.search.placeholder')}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                                    <Filter className="h-4 w-4 text-muted-foreground" />
                                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Filter Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{t('adminPage.search.allRoles')}</SelectItem>
                                            {uniqueRoles.map(role => (
                                                <SelectItem key={role} value={role}>
                                                    {t(`adminPage.roles.${role}`).charAt(0).toUpperCase() + t(`adminPage.roles.${role}`).slice(1)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {filteredAndPaginatedUsers.users.map((user) => {
                                        // Get user role from custom claims or default to 'user'
                                        const userRole = getUserRole(user)

                                        return (
                                            <Card
                                                key={user.uid}
                                                className={`hover:shadow-lg transition-shadow ${user.anonymous
                                                    ? 'border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20'
                                                    : userRole === 'user'
                                                        ? 'border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-950/20'
                                                        : ''
                                                    }`}
                                            >
                                                <CardHeader>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar>
                                                                <AvatarImage src={user.photoURL} alt={user.displayName} />
                                                                <AvatarFallback className={
                                                                    user.anonymous
                                                                        ? 'bg-orange-200 dark:bg-orange-800'
                                                                        : userRole === 'user'
                                                                            ? 'bg-gray-200 dark:bg-gray-800'
                                                                            : ''
                                                                }>
                                                                    {user.displayName ? user.displayName.substring(0, 2).toUpperCase() : user.anonymous ? 'A' : 'U'}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <CardTitle className="text-lg">
                                                                    {user.displayName || (user.anonymous ? t('adminPage.userCard.anonymousUser') : t('adminPage.userCard.noName'))}
                                                                </CardTitle>
                                                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                                    <Mail className="h-3 w-3" />
                                                                    {user.email || (user.anonymous ? t('adminPage.userCard.noEmail') : '')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-3">
                                                    <div className="flex gap-1 flex-wrap">
                                                        {user.anonymous && (
                                                            <Badge variant="secondary" className="text-xs bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200">
                                                                <UserX className="h-3 w-3 mr-1" />
                                                                {t('adminPage.userCard.anonymousUser')}
                                                            </Badge>
                                                        )}
                                                        {!user.anonymous && (
                                                            <Badge className={getRoleBadgeColor(userRole)}>
                                                                <Shield className="h-3 w-3 mr-1" />
                                                                {t(`adminPage.roles.${userRole}`).toUpperCase()}
                                                            </Badge>
                                                        )}
                                                        {user.emailVerified && (
                                                            <Badge variant="default" className="text-xs">
                                                                <UserCheck className="h-3 w-3 mr-1" />
                                                                {t('adminPage.badges.verified')}
                                                            </Badge>
                                                        )}
                                                        {user.disabled && (
                                                            <Badge variant="destructive" className="text-xs">
                                                                {t('adminPage.badges.disabled')}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {user.phoneNumber && (
                                                        <div>
                                                            <p className="text-sm font-medium text-muted-foreground">{t('adminPage.userCard.phone')}</p>
                                                            <p className="text-sm flex items-center gap-1">
                                                                <Phone className="h-3 w-3" />
                                                                {user.phoneNumber}
                                                            </p>
                                                        </div>
                                                    )}

                                                    <div>
                                                        <p className="text-sm font-medium text-muted-foreground">{t('adminPage.userCard.uid')}</p>
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
                                                        <p className="text-sm font-medium text-muted-foreground">{t('adminPage.userCard.created')}</p>
                                                        <p className="text-sm flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {formatDate(user.metadata.creationTime)}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-sm font-medium text-muted-foreground">{t('adminPage.userCard.lastLogin')}</p>
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
                                                            onClick={() => openEditDialog(user)}
                                                            className="flex-1"
                                                        >
                                                            <Edit className="h-3 w-3 mr-1" />
                                                            {t('adminPage.buttons.edit')}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleOpenHistory(user.uid)}
                                                            className="flex-1"
                                                        >
                                                            <History className="h-3 w-3 mr-1" />
                                                            {t('adminPage.buttons.history')}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => openDeleteDialog(user)}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
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
                                        <h3 className="text-lg font-medium mb-2">{t('adminPage.emptyState.title')}</h3>
                                        <p className="text-muted-foreground">
                                            {searchTerm || roleFilter !== 'all' ? t('adminPage.emptyState.descriptionWithFilter') : t('adminPage.emptyState.descriptionNoFilter')}
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
                                    {t('adminPage.pagination.showing')} {filteredAndPaginatedUsers.users.length} {t('adminPage.pagination.of')} {filteredAndPaginatedUsers.totalUsers} {t('adminPage.pagination.users')}
                                    {roleFilter !== 'all' && ` ${t('adminPage.pagination.withRole')} "${roleFilter}"`}
                                    {debouncedSearchTerm && ` ${t('adminPage.pagination.forSearch')} "${debouncedSearchTerm}"`}
                                </div>
                            </div>
                        </div>

                        {/* Create User Dialog */}
                        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
                            if (!open) {
                                resetForm()
                            }
                            setIsCreateDialogOpen(open)
                        }}>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>{t('adminPage.createDialog.title')}</DialogTitle>
                                    <DialogDescription>
                                        {t('adminPage.createDialog.description')}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="uid">{t('adminPage.createDialog.fields.uid')}</Label>
                                        <Input
                                            ref={uidRef}
                                            id="uid"
                                            value={t('adminPage.createDialog.fields.uidAutoGenerated')}
                                            disabled
                                            className="bg-muted"
                                        />
                                        <p className="text-xs text-muted-foreground">{t('adminPage.createDialog.fields.uidHelper')}</p>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">{t('adminPage.createDialog.fields.email')}</Label>
                                        <Input
                                            ref={emailRef}
                                            id="email"
                                            type="email"
                                            value={tempFormData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            onBlur={() => handleInputBlur('email')}
                                            placeholder={t('adminPage.createDialog.fields.emailPlaceholder')}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password">{t('adminPage.createDialog.fields.password')}</Label>
                                        <Input
                                            ref={passwordRef}
                                            id="password"
                                            type="password"
                                            value={tempFormData.password}
                                            onChange={(e) => handleInputChange('password', e.target.value)}
                                            onBlur={() => handleInputBlur('password')}
                                            placeholder={t('adminPage.createDialog.fields.passwordPlaceholder')}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="displayName">{t('adminPage.createDialog.fields.displayName')}</Label>
                                        <Input
                                            ref={displayNameRef}
                                            id="displayName"
                                            value={tempFormData.displayName}
                                            onChange={(e) => handleInputChange('displayName', e.target.value)}
                                            onBlur={() => handleInputBlur('displayName')}
                                            placeholder={t('adminPage.createDialog.fields.displayNamePlaceholder')}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="phoneNumber">{t('adminPage.createDialog.fields.phoneNumber')}</Label>
                                        <Input
                                            ref={phoneNumberRef}
                                            id="phoneNumber"
                                            value={tempFormData.phoneNumber}
                                            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                                            onBlur={() => handleInputBlur('phoneNumber')}
                                            placeholder={t('adminPage.createDialog.fields.phoneNumberPlaceholder')}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="role">{t('adminPage.createDialog.fields.role')}</Label>
                                        <Select
                                            value={tempFormData.role}
                                            onValueChange={(value: 'admin' | 'doctor' | 'nurse' | 'user') => {
                                                setTempFormData(prev => ({ ...prev, role: value }))
                                                setFormData(prev => ({ ...prev, role: value }))
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('adminPage.createDialog.fields.rolePlaceholder')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="user">{t('adminPage.createDialog.fields.roleList.user')}</SelectItem>
                                                <SelectItem value="nurse">{t('adminPage.createDialog.fields.roleList.nurse')}</SelectItem>
                                                <SelectItem value="doctor">{t('adminPage.createDialog.fields.roleList.doctor')}</SelectItem>
                                                <SelectItem value="admin">{t('adminPage.createDialog.fields.roleList.admin')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="photoURL">{t('adminPage.createDialog.fields.photoURL')}</Label>
                                        <Input
                                            ref={photoURLRef}
                                            id="photoURL"
                                            value={tempFormData.photoURL}
                                            onChange={(e) => handleInputChange('photoURL', e.target.value)}
                                            onBlur={() => handleInputBlur('photoURL')}
                                            placeholder={t('adminPage.createDialog.fields.photoURLPlaceholder')}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isSubmitting}>
                                        {t('adminPage.buttons.cancel')}
                                    </Button>
                                    <Button onClick={handleCreateUser} disabled={isSubmitting}>
                                        {isSubmitting ? t('adminPage.createDialog.submitting') : t('adminPage.buttons.create')}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* Edit User Dialog */}
                        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
                            if (!open) {
                                setSelectedUser(null)
                                resetForm()
                            }
                            setIsEditDialogOpen(open)
                        }}>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>{t('adminPage.editDialog.title')}</DialogTitle>
                                    <DialogDescription>
                                        {t('adminPage.editDialog.description')}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-uid">{t('adminPage.editDialog.fields.uid')}</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                ref={uidRef}
                                                id="edit-uid"
                                                value={tempFormData.uid || ''}
                                                disabled
                                                className="bg-muted flex-1"
                                            />
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => copyToClipboard(tempFormData.uid || '')}
                                                disabled={!tempFormData.uid}
                                            >
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{t('adminPage.editDialog.fields.uidHelper')}</p>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-email">{t('adminPage.editDialog.fields.email')}</Label>
                                        <Input
                                            ref={emailRef}
                                            id="edit-email"
                                            type="email"
                                            value={tempFormData.email}
                                            disabled
                                            className="bg-muted"
                                        />
                                        <p className="text-xs text-muted-foreground">{t('adminPage.editDialog.fields.emailHelper')}</p>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-displayName">{t('adminPage.editDialog.fields.displayName')}</Label>
                                        <Input
                                            ref={displayNameRef}
                                            id="edit-displayName"
                                            value={tempFormData.displayName}
                                            onChange={(e) => handleInputChange('displayName', e.target.value)}
                                            onBlur={() => handleInputBlur('displayName')}
                                            placeholder={t('adminPage.editDialog.fields.displayNamePlaceholder')}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-phoneNumber">{t('adminPage.editDialog.fields.phoneNumber')}</Label>
                                        <Input
                                            ref={phoneNumberRef}
                                            id="edit-phoneNumber"
                                            value={tempFormData.phoneNumber}
                                            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                                            onBlur={() => handleInputBlur('phoneNumber')}
                                            placeholder={t('adminPage.editDialog.fields.phoneNumberPlaceholder')}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-role">{t('adminPage.editDialog.fields.role')}</Label>
                                        <Select
                                            value={tempFormData.role}
                                            onValueChange={(value: 'admin' | 'doctor' | 'nurse' | 'user') => {
                                                setTempFormData(prev => ({ ...prev, role: value }))
                                                setFormData(prev => ({ ...prev, role: value }))
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('adminPage.editDialog.fields.rolePlaceholder')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="user">{t('adminPage.editDialog.fields.roleList.user')}</SelectItem>
                                                <SelectItem value="nurse">{t('adminPage.editDialog.fields.roleList.nurse')}</SelectItem>
                                                <SelectItem value="doctor">{t('adminPage.editDialog.fields.roleList.doctor')}</SelectItem>
                                                <SelectItem value="admin">{t('adminPage.editDialog.fields.roleList.admin')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-photoURL">{t('adminPage.editDialog.fields.photoURL')}</Label>
                                        <Input
                                            ref={photoURLRef}
                                            id="edit-photoURL"
                                            value={tempFormData.photoURL}
                                            onChange={(e) => handleInputChange('photoURL', e.target.value)}
                                            onBlur={() => handleInputBlur('photoURL')}
                                            placeholder={t('adminPage.editDialog.fields.photoURLPlaceholder')}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
                                        {t('adminPage.buttons.cancel')}
                                    </Button>
                                    <Button onClick={handleUpdateUser} disabled={isSubmitting}>
                                        {isSubmitting ? t('adminPage.editDialog.submitting') : t('adminPage.buttons.save')}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* Delete User Dialog */}
                        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{t('adminPage.deleteDialog.title')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        {t('adminPage.deleteDialog.description')} <strong>{selectedUser?.displayName}</strong>?
                                        {t('adminPage.deleteDialog.warning')}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isSubmitting}>{t('adminPage.buttons.cancel')}</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteUser} disabled={isSubmitting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        {isSubmitting ? t('adminPage.deleteDialog.submitting') : t('adminPage.buttons.delete')}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </AppLayout>
        </AuthGuard>
    )
}