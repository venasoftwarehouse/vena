"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AppLayout } from "@/components/app-layout"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MessageSquare, Send, CheckCircle, Star, Users, BarChart3, TrendingUp, Clock, Calendar, Trash2, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { saveFeedback, getUserFeedback, deleteFeedback, type FeedbackData } from "@/lib/feedback-service"
import Link from "next/link"
import { useI18n } from "@/lib/i18n-context"

export default function FeedbackPage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [rating, setRating] = useState("")
  const [category, setCategory] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  // State for user feedback history
  const [userFeedback, setUserFeedback] = useState<FeedbackData[]>([])
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(true)
  const [deletingFeedbackId, setDeletingFeedbackId] = useState<string | null>(null)

  // Auto-populate user data if authenticated and not anonymous
  useEffect(() => {
    if (user && user.displayName && !user.displayName.includes("Anonymous")) {
      setName(user.displayName)
    }
    if (user && user.email) {
      setEmail(user.email)
    }
  }, [user])

  // Fetch user feedback history
  useEffect(() => {
    const fetchUserFeedback = async () => {
      if (user) {
        try {
          setIsLoadingFeedback(true)
          const feedback = await getUserFeedback(user.uid)
          setUserFeedback(feedback)
        } catch (error) {
          console.error("Error fetching user feedback:", error)
          toast({
            title: t('feedback.toast.error.title'),
            description: t('feedback.toast.error.loadFailed'),
            variant: "destructive",
          })
        } finally {
          setIsLoadingFeedback(false)
        }
      }
    }

    fetchUserFeedback()
  }, [user, toast, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!rating || !category || !message.trim()) {
      toast({
        title: t('feedback.toast.error.title'),
        description: t('feedback.toast.error.incomplete'),
        variant: "destructive",
      })
      return
    }

    if (!user) {
      toast({
        title: t('feedback.toast.error.title'),
        description: t('feedback.toast.error.notLoggedIn'),
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const feedbackData = {
        userId: user.uid,
        userEmail: user.email || "anonymous",
        userName: name || user.displayName || "Anonymous User",
        rating: Number.parseInt(rating),
        category,
        message: message.trim(),
        timestamp: new Date(),
        createdAt: new Date().toISOString()
      }

      // Save feedback to both databases
      await saveFeedback(feedbackData)

      setSubmitted(true)
      toast({
        title: t('feedback.toast.success.title'),
        description: t('feedback.toast.success.submitted'),
      })

      // Reset form (except name and email which are auto-populated)
      setRating("")
      setCategory("")
      setMessage("")
    } catch (error) {
      console.error("Submit feedback error:", error)
      toast({
        title: t('feedback.toast.error.title'),
        description: t('feedback.toast.error.submitFailed'),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteFeedback = async (feedbackId: string) => {
    if (!user) return

    try {
      setDeletingFeedbackId(feedbackId)
      
      // Show confirmation dialog
      if (!confirm(t('feedback.history.deleteConfirm'))) {
        return
      }

      const success = await deleteFeedback(user.uid, feedbackId)
      
      if (success) {
        // Update the UI by removing the deleted feedback
        setUserFeedback(prev => prev.filter(feedback => feedback.id !== feedbackId))
        
        toast({
          title: t('feedback.toast.success.title'),
          description: t('feedback.toast.success.deleted'),
        })
      } else {
        throw new Error("Failed to delete feedback")
      }
    } catch (error) {
      console.error("Delete feedback error:", error)
      toast({
        title: t('feedback.toast.error.title'),
        description: t('feedback.toast.error.deleteFailed'),
        variant: "destructive",
      })
    } finally {
      setDeletingFeedbackId(null)
    }
  }

  const categoryOptions = [
    { value: "accuracy", label: t('feedback.form.fields.category.options.accuracy') },
    { value: "usability", label: t('feedback.form.fields.category.options.usability') },
    { value: "performance", label: t('feedback.form.fields.category.options.performance') },
    { value: "features", label: t('feedback.form.fields.category.options.features') },
    { value: "bug", label: t('feedback.form.fields.category.options.bug') },
    { value: "suggestion", label: t('feedback.form.fields.category.options.suggestion') },
    { value: "other", label: t('feedback.form.fields.category.options.other') },
  ]

  // Function to get category label from value
  const getCategoryLabel = (value: string) => {
    const category = categoryOptions.find(option => option.value === value)
    return category ? category.label : value
  }

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Function to render star rating
  const renderStarRating = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    )
  }

  // Check if user is authenticated and not anonymous
  const isUserAuthenticatedAndNotAnonymous = user && user.displayName && !user.displayName.includes("Anonymous")

  const importancePoints = Array.isArray(t('feedback.importance.points')) 
    ? (t('feedback.importance.points') as unknown as string[]) 
    : [t('feedback.importance.points') as string]
  const rawNextSteps = t('feedback.nextSteps.steps')
  const nextSteps = Array.isArray(rawNextSteps)
    ? rawNextSteps
    : [rawNextSteps]

  if (submitted) {
    return (
      <AuthGuard>
        <AppLayout>
          <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
            <Card className="border-border bg-card max-w-md mx-auto">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{t('feedback.success.title')}</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      {t('feedback.success.message')}
                    </p>
                  </div>
                  <Button onClick={() => setSubmitted(false)} className="w-full">
                    {t('feedback.success.sendAgain')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </AppLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <AppLayout>
        <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-8">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
              {t('feedback.badge')}
            </Badge>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              {t('feedback.title')}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('feedback.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Feedback Form */}
            <Card className="border-border bg-card w-full">
              <CardHeader>
                <CardTitle className="text-xl">{t('feedback.form.title')}</CardTitle>
                <CardDescription>
                  {t('feedback.form.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('feedback.form.fields.name.label')}</Label>
                    <Input 
                      id="name" 
                      placeholder={t('feedback.form.fields.name.placeholder')}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!!isUserAuthenticatedAndNotAnonymous}
                    />
                    {isUserAuthenticatedAndNotAnonymous && (
                      <p className="text-xs text-muted-foreground">{t('feedback.form.fields.name.autoFilled')}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('feedback.form.fields.email.label')}</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder={t('feedback.form.fields.email.placeholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={!!user?.email}
                    />
                    {user?.email && (
                      <p className="text-xs text-muted-foreground">{t('feedback.form.fields.email.autoFilled')}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">{t('feedback.form.fields.category.label')}</Label>
                    <select 
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="">{t('feedback.form.fields.category.placeholder')}</option>
                      {categoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rating">{t('feedback.form.fields.rating.label')}</Label>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`h-6 w-6 cursor-pointer ${
                            star <= Number.parseInt(rating || "0")
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground hover:text-yellow-400"
                          }`}
                          onClick={() => setRating(star.toString())}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">{t('feedback.form.fields.message.label')}</Label>
                    <Textarea
                      id="message"
                      placeholder={t('feedback.form.fields.message.placeholder')}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        {t('feedback.form.submitting')}
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        {t('feedback.form.submit')}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* User Feedback History */}
            <Card className="border-border bg-card w-full">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5 text-primary" />
                  {t('feedback.history.title')}
                </CardTitle>
                <CardDescription>
                  {t('feedback.history.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingFeedback ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2" />
                    <span className="text-muted-foreground">{t('feedback.history.loading')}</span>
                  </div>
                ) : userFeedback.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">{t('feedback.history.empty.title')}</h3>
                    <p className="text-muted-foreground">
                      {t('feedback.history.empty.description')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {userFeedback.map((feedback) => (
                      <div key={feedback.id} className="border border-border rounded-lg p-4 bg-card">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {getCategoryLabel(feedback.category)}
                              </Badge>
                              <div className="flex items-center">
                                {renderStarRating(feedback.rating)}
                              </div>
                            </div>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>{formatDate(feedback.createdAt)}</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteFeedback(feedback.id)}
                            disabled={deletingFeedbackId === feedback.id}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          >
                            {deletingFeedbackId === feedback.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-destructive" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        <p className="text-sm text-foreground mt-2 line-clamp-3">
                          {feedback.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Info Section */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  {t('feedback.importance.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  {t('feedback.importance.description')}
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  {importancePoints.map((point, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="mr-2 h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-xl">{t('feedback.nextSteps.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  {t('feedback.nextSteps.description')}
                </p>
                <ol className="space-y-3 text-muted-foreground">
                  {nextSteps.map((step, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                        <span className="text-xs font-bold text-primary-foreground">{index + 1}</span>
                      </div>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  )
}