"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/contexts/auth-context"
import { type ScanRecord } from "@/lib/scan-service"
import { Camera, History, Trash2, Calendar, CheckCircle, AlertTriangle, AlertCircle, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, getDocs, limit, startAfter, DocumentSnapshot, deleteDoc, doc, DocumentData } from "firebase/firestore"
import { useI18n } from "@/lib/i18n-context"

export default function HistoryPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { t } = useI18n()
  const [scans, setScans] = useState<ScanRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot<DocumentData> | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    if (user) {
      loadScans()
    }
  }, [user])

  const loadScans = async (page = 1, useLastVisible: DocumentSnapshot<DocumentData> | null = null) => {
    if (!user) return

    try {
      setLoading(true)

      // Get total count of scans for this user
      if (page === 1) {
        const countQuery = query(
          collection(db, "users", user.uid, "history_scan"),
          where("userId", "==", user.uid)
        )
        const countSnapshot = await getDocs(countQuery)
        setTotalCount(countSnapshot.size)
      }

      // Build the query
      let scansQuery

      if (page === 1) {
        // First page - no pagination
        scansQuery = query(
          collection(db, "users", user.uid, "history_scan"),
          where("userId", "==", user.uid),
          orderBy("timestamp", "desc"),
          limit(pageSize)
        )
      } else if (useLastVisible) {
        // Going forward - use the last visible document
        scansQuery = query(
          collection(db, "users", user.uid, "history_scan"),
          where("userId", "==", user.uid),
          orderBy("timestamp", "desc"),
          startAfter(useLastVisible),
          limit(pageSize)
        )
      } else {
        // Going back - recalculate from the beginning
        const allDocsQuery = query(
          collection(db, "users", user.uid, "history_scan"),
          where("userId", "==", user.uid),
          orderBy("timestamp", "desc")
        )

        const allDocsSnapshot = await getDocs(allDocsQuery)
        const startIndex = (page - 1) * pageSize

        if (startIndex >= allDocsSnapshot.size) {
          // Requested page is beyond available data
          setScans([])
          setHasMore(false)
          setCurrentPage(page)
          setLoading(false)
          return
        }

        // Get the document just before our start index to use as our cursor
        const startDoc = startIndex > 0 ? allDocsSnapshot.docs[startIndex - 1] : null

        // Now query with pagination
        if (startDoc) {
          scansQuery = query(
            collection(db, "users", user.uid, "history_scan"),
            where("userId", "==", user.uid),
            orderBy("timestamp", "desc"),
            startAfter(startDoc),
            limit(pageSize)
          )
        } else {
          scansQuery = query(
            collection(db, "users", user.uid, "history_scan"),
            where("userId", "==", user.uid),
            orderBy("timestamp", "desc"),
            limit(pageSize)
          )
        }
      }

      const querySnapshot = await getDocs(scansQuery)
      const scansData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ScanRecord[]

      // Replace the current scans with the new page data
      setScans(scansData)

      // Get the last visible document for pagination
      const newLastVisible = querySnapshot.docs.length > 0
        ? querySnapshot.docs[querySnapshot.docs.length - 1]
        : null

      setLastVisible(newLastVisible)
      setCurrentPage(page)

      // Check if there are more documents
      let hasMoreData = false
      if (newLastVisible) {
        const nextQuery = query(
          collection(db, "users", user.uid, "history_scan"),
          where("userId", "==", user.uid),
          orderBy("timestamp", "desc"),
          startAfter(newLastVisible),
          limit(1)
        )
        const nextSnapshot = await getDocs(nextQuery)
        hasMoreData = !nextSnapshot.empty
      }

      setHasMore(hasMoreData)
    } catch (error) {
      console.error("Error loading scans:", error)
      toast({
        title: t("history.toast.error.title"),
        description: t("history.toast.error.loadFailed"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!user) return

    try {
      setDeletingId(id)

      // Delete the document directly from Firestore
      await deleteDoc(doc(db, "users", user.uid, "history_scan", id))

      // Remove the deleted scan from the state
      setScans(scans.filter((scan) => scan.id !== id))
      // Update total count
      setTotalCount(prev => Math.max(0, prev - 1))
      toast({
        title: t("history.toast.success.title"),
        description: t("history.toast.success.deleteSuccess"),
      })
      // Reload the current page to maintain proper pagination
      loadScans(currentPage)
    } catch (error) {
      console.error("Error deleting scan:", error)
      toast({
        title: t("history.toast.error.title"),
        description: t("history.toast.error.deleteFailed"),
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleNextPage = () => {
    if (hasMore && !loading) {
      loadScans(currentPage + 1, lastVisible)
    }
  }

  const handlePreviousPage = () => {
    if (currentPage > 1 && !loading) {
      loadScans(currentPage - 1)
    }
  }

  const getGlucoseStatusBadge = (level: string) => {
    // Set a fixed width class to make all badges the same width
    const badgeClass = "inline-flex items-center justify-center text-center"

    switch (level) {
      case "normal":
        return <Badge className={`${badgeClass} bg-green-100 text-green-800 hover:bg-green-100 `}>{t("history.status.normal")}</Badge>
      case "warning":
        return <Badge className={`${badgeClass} bg-yellow-100 text-yellow-800 hover:bg-yellow-100`}>{t("history.status.warning")}</Badge>
      case "high":
        return <Badge className={`${badgeClass} bg-red-100 text-red-800 hover:bg-red-100`}>{t("history.status.high")}</Badge>
      default:
        return <Badge className={`${badgeClass} bg-gray-100 text-gray-800 hover:bg-gray-100`}>{t("history.status.unknown")}</Badge>
    }
  }

  const getGlucoseStatusIcon = (level: string) => {
    switch (level) {
      case "normal":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "high":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getColorCircle = (color: string, percentage: number) => {
    if (percentage > 0) {
      return (
        <div
          className="w-4 h-4 rounded-full border border-border"
          style={{ backgroundColor: `rgba(${color === 'normal' ? '165, 166, 152' : color === 'warning' ? '124, 117, 108' : '82, 67, 64'}, ${percentage / 100})` }}
          title={`${color === 'normal' ? t("history.colorLabels.normal") : color === 'warning' ? t("history.colorLabels.warning") : t("history.colorLabels.high")}: ${percentage.toFixed(1)}%`}
        />
      )
    } else {
      return (
        <div
          className="w-4 h-4 rounded-full border border-border"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
        />
      )
    }
  }

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <AuthGuard>
      <AppLayout>
        <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t("history.title")}</h1>
            <p className="text-muted-foreground">{t("history.description")}</p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <Link href="/app/scan">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
                <Camera className="h-4 w-4 mr-2" />
                {t("history.buttons.newScan")}
              </Button>
            </Link>
            {scans.length > 0 && (
              <Button variant="outline" onClick={() => loadScans(1)} disabled={loading} className="w-full sm:w-auto">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <History className="h-4 w-4 mr-2" />}
                {t("history.buttons.refresh")}
              </Button>
            )}
          </div>

          {/* Scans List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-border bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-16 h-16 rounded-lg bg-gray-400" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32 bg-gray-400" />
                        <Skeleton className="h-3 w-24 bg-gray-400" />
                        <div className="flex gap-2">
                          <Skeleton className="h-6 w-16 bg-gray-400" />
                          <Skeleton className="h-6 w-16 bg-gray-400" />
                        </div>
                      </div>
                      <Skeleton className="h-9 w-9 bg-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : scans.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <History className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">{t("history.empty.title")}</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  {t("history.empty.description")}
                </p>
                <Link href="/app/scan">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Camera className="h-4 w-4 mr-2" />
                    {t("history.empty.action")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-4">
                {scans.map((scan) => (
                  <Card key={scan.id} className="border-border bg-card hover:shadow-sm transition-shadow py-3">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img
                            src={scan.imageUrl || "/placeholder.svg"}
                            alt="Scan result"
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="absolute -bottom-1 -right-1 flex">
                            {getColorCircle('normal', scan.colorAnalysis.colorPercentages?.normal || 0)}
                            {getColorCircle('warning', scan.colorAnalysis.colorPercentages?.warning || 0)}
                            {getColorCircle('high', scan.colorAnalysis.colorPercentages?.high || 0)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getGlucoseStatusIcon(scan.colorAnalysis.glucoseLevel)}
                            <h3 className="font-medium text-foreground truncate">
                              {format(new Date(scan.createdAt), "dd MMM yyyy", { locale: id })}
                            </h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {format(new Date(scan.createdAt), "HH:mm", { locale: id })} • {t("history.info.accuracy")}: {scan.colorAnalysis.confidence.toFixed(0)}%
                          </p>
                          <div className="flex items-center gap-2">
                            {getGlucoseStatusBadge(scan.colorAnalysis.glucoseLevel)}
                            <span className="text-xs text-muted-foreground">
                              N: {(scan.colorAnalysis.colorPercentages?.normal || 0).toFixed(1)}% • W: {(scan.colorAnalysis.colorPercentages?.warning || 0).toFixed(1)}% • H: {(scan.colorAnalysis.colorPercentages?.high || 0).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Link href={`/app/history/${scan.id}`} passHref>
                            <Button variant="outline" size="sm" className="w-full">
                              {t("history.buttons.detail")}
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(scan.id)}
                            disabled={deletingId === scan.id}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            {deletingId === scan.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Simplified Pagination Controls */}
              <div className="flex flex-col items-center gap-4 pt-6 border-t border-border">
                {/* Results Info */}
                <div className="text-sm text-muted-foreground">
                  {t("history.info.showing")} {scans.length} {t("history.info.of")} {totalCount} {t("history.info.results")}
                </div>

                {/* Pagination Buttons */}
                <div className="flex items-center justify-center gap-4 w-full">

                  {/* Previous */}
                  <Button
                    variant="outline"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1 || loading}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="max-sm:hidden">
                      {t("history.buttons.previous")}
                    </span>
                  </Button>

                  {/* Page Indicator */}
                  <div className="flex items-center justify-center px-4 py-2 bg-muted rounded-md min-w-[120px]">
                    <span className="text-sm font-medium flex items-center gap-1">
                      {/* Halaman (hidden on small) */}
                      <span className="max-sm:hidden">
                        {t("history.info.page")}
                      </span>

                      {/* Current Page */}
                      {currentPage}

                      {/* of / dari */}
                      {' ' + t("history.info.of") + ' '}

                      {/* Total pages */}
                      {totalPages}
                    </span>
                  </div>

                  {/* Next */}
                  <Button
                    variant="outline"
                    onClick={handleNextPage}
                    disabled={!hasMore || loading}
                    className="flex items-center gap-1"
                  >
                    <span className="max-sm:hidden">
                      {t("history.buttons.next")}
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </AppLayout>
    </AuthGuard>
  )
}