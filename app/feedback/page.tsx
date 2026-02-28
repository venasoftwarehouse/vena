"use client"

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Star, Users, BarChart3, TrendingUp, ArrowRight } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, limit, getDocs, Timestamp } from "firebase/firestore"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { PublicHeader } from "@/components/public-header"
import { PublicFooter } from "@/components/public-footer"

interface FeedbackData {
  id: string
  userId: string
  userEmail: string
  userName: string
  rating: number
  category: string
  message: string
  timestamp: Timestamp
  createdAt: string
  status: string
}

const categoryLabels: Record<string, string> = {
  accuracy: "Akurasi Scan",
  usability: "Kemudahan Penggunaan",
  performance: "Performa Aplikasi",
  features: "Fitur Aplikasi",
  bug: "Laporan Bug",
  suggestion: "Saran Perbaikan",
  other: "Lainnya"
}

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

function FeedbackStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function FeedbackChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
      {[1, 2].map((i) => (
        <Card key={i} className="border-border bg-card">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((k) => (
                      <Skeleton key={k} className="h-4 w-4" />
                    ))}
                  </div>
                  <Skeleton className="flex-1 h-2" />
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function FeedbackListSkeleton() {
  return (
    <div className="mb-12">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <Skeleton key={j} className="h-4 w-4" />
                  ))}
                </div>
              </div>
              <Skeleton className="h-6 w-24 mb-3" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function CTASkeleton() {
  return (
    <Card className="border-border bg-primary/5 border-primary/20">
      <CardContent className="pt-8 pb-8 text-center">
        <Skeleton className="h-8 w-64 mx-auto mb-4" />
        <div className="space-y-2 mb-6 max-w-2xl mx-auto">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6 mx-auto" />
        </div>
        <Skeleton className="h-12 w-48 mx-auto" />
      </CardContent>
    </Card>
  )
}

export default function FeedbackPage() {
  const t = useTranslations("feedback");
  const [feedbackData, setFeedbackData] = useState<FeedbackData[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalFeedback: 0,
    averageRating: 0,
    satisfactionRate: 0,
    ratingDistribution: [0, 0, 0, 0, 0], // 1-5 stars
    categoryDistribution: {} as Record<string, number>
  })

  useEffect(() => {
    const fetchFeedbackData = async () => {
      try {
        setLoading(true)
        const q = query(collection(db, "feedback"), orderBy("timestamp", "desc"), limit(50))
        const querySnapshot = await getDocs(q)

        const data: FeedbackData[] = []
        querySnapshot.forEach((doc) => {
          data.push({
            id: doc.id,
            ...doc.data()
          } as FeedbackData)
        })

        setFeedbackData(data)

        // Calculate statistics
        if (data.length > 0) {
          const totalFeedback = data.length
          const totalRating = data.reduce((sum, item) => sum + item.rating, 0)
          const averageRating = totalRating / totalFeedback

          // Calculate satisfaction rate (4-5 star ratings)
          const satisfiedCount = data.filter(item => item.rating >= 4).length
          const satisfactionRate = (satisfiedCount / totalFeedback) * 100

          // Calculate rating distribution
          const ratingDistribution = [0, 0, 0, 0, 0]
          data.forEach(item => {
            if (item.rating >= 1 && item.rating <= 5) {
              ratingDistribution[item.rating - 1]++
            }
          })

          // Calculate category distribution
          const categoryDistribution: Record<string, number> = {}
          data.forEach(item => {
            categoryDistribution[item.category] = (categoryDistribution[item.category] || 0) + 1
          })

          setStats({
            totalFeedback,
            averageRating: Number(averageRating.toFixed(1)),
            satisfactionRate: Number(satisfactionRate.toFixed(1)),
            ratingDistribution,
            categoryDistribution
          })
        }
      } catch (error) {
        console.error("Error fetching feedback data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFeedbackData()
  }, [])

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
          }`}
      />
    ))
  }

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return "Tanggal tidak tersedia"

    const date = timestamp.toDate()
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PublicHeader />

      <main className="container mx-auto px-4 py-12">
        {/* Page Title */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
            {t("badge")}
          </Badge>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            {t("title")}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {loading ? (
          <>
            <FeedbackStatsSkeleton />
            <FeedbackChartsSkeleton />
            <FeedbackListSkeleton />
            <CTASkeleton />
          </>
        ) : (
          <>
            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card className="border-border bg-card">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-foreground">{stats.totalFeedback}</p>
                      <p className="text-muted-foreground">{t("totalFeedback")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Star className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-foreground">{stats.averageRating}</p>
                      <p className="text-muted-foreground">{t("averageRating")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-foreground">{stats.satisfactionRate}%</p>
                      <p className="text-muted-foreground">{t("satisfactionRate")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-xl">{t("ratingDistributionTitle")}</CardTitle>
                  <CardDescription>
                    {t("ratingDistributionDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center space-x-3">
                        <div className="flex items-center">
                          {renderStars(rating)}
                        </div>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{
                              width: `${stats.totalFeedback > 0 ? (stats.ratingDistribution[rating - 1] / stats.totalFeedback) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {stats.ratingDistribution[rating - 1]}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-xl">{t("categoryDistributionTitle")}</CardTitle>
                  <CardDescription>
                    {t("categoryDistributionDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(stats.categoryDistribution).map(([category, count]) => (
                      <div key={category} className="flex items-center space-x-3">
                        <span className="text-sm text-muted-foreground w-32">
                          {categoryLabels[category] || category}
                        </span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{
                              width: `${stats.totalFeedback > 0 ? (count / stats.totalFeedback) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Feedback Section */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">{t("recentFeedbackTitle")}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {feedbackData.slice(0, 6).map((feedback) => (
                  <Card key={feedback.id} className="border-border bg-card">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-foreground">{feedback.userName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(feedback.timestamp)}
                          </p>
                        </div>
                        <div className="flex items-center">
                          {renderStars(feedback.rating)}
                        </div>
                      </div>
                      <Badge variant="secondary" className="mb-3">
                        {categoryLabels[feedback.category] || feedback.category}
                      </Badge>
                      <p className="text-muted-foreground">{feedback.message}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* CTA Section */}
            <Card className="border-border bg-primary/5 border-primary/20">
              <CardContent className="pt-8 pb-8 text-center">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  {t("ctaTitle")}
                </h2>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  {t("ctaDesc")}
                </p>
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Link href="/app/feedback">
                    {t("ctaButton")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      {/* Footer */}
      <PublicFooter />
    </div>
  )
}