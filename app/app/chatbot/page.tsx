"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AppLayout } from "@/components/app-layout"
import { useAuth } from "@/contexts/auth-context"
import { useUserProfile } from "@/hooks/use-user-profile"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Send, Bot, User, Lightbulb, Heart, History, MessageSquare, Plus, Trash2, MoreVertical, Loader2, X } from "lucide-react"
import { formatAIText } from "@/lib/format-ai-text"
import { useToast } from "@/hooks/use-toast"
import type { UIChatMessage, ChatSession, ChatMessage } from "@/lib/types"
import { useI18n } from "@/lib/i18n-context"
import { formatDate } from "@/lib/format-timestamp"

export default function ChatbotPage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const { profile } = useUserProfile()
  const { toast } = useToast()
  const [messages, setMessages] = useState<UIChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState<"idle" | "fetching" | "processing">("idle")
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showQuickQuestions, setShowQuickQuestions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Debug logging
  useEffect(() => {
    console.log("Profile data in chatbot page:", profile)
    console.log("Profile photo URL in chatbot page:", profile.photoURL)
  }, [profile])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getWelcomeMessage = () => {
    const features = [
      t('chatbot.welcome.features.diabetes'),
      t('chatbot.welcome.features.lifestyle'),
      t('chatbot.welcome.features.diet'),
      t('chatbot.welcome.features.usage'),
      t('chatbot.welcome.features.motivation')
    ]

    return `${t('chatbot.welcome.greeting')}

${features.map(f => `• ${f}`).join('\n')}

${t('chatbot.welcome.question')}`
  }

  useEffect(() => {
    // Add welcome message
    const welcomeMessage: UIChatMessage = {
      id: "welcome",
      role: "assistant",
      content: getWelcomeMessage(),
      timestamp: new Date(),
    }
    setMessages([welcomeMessage])
  }, [t])

  // Load chat history when component mounts
  useEffect(() => {
    if (user) {
      loadChatHistory()
    }
  }, [user])

  const loadChatHistory = async () => {
    if (!user) return

    setIsLoadingHistory(true)
    try {
      const response = await fetch(`/api/chat-history?userId=${user.uid}`)
      if (response.ok) {
        const data = await response.json()
        setChatSessions(data.sessions || [])
        console.log("Loaded chat sessions:", data.sessions || [])
      } else {
        console.error("Failed to load chat history")
      }
    } catch (error) {
      console.error("Error loading chat history:", error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const loadChatSession = async (sessionId: string) => {
    if (!user) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/chat-history?userId=${user.uid}`)
      if (response.ok) {
        const data = await response.json()
        const session = data.sessions.find((s: ChatSession) => s.id === sessionId)

        if (session) {
          // Convert session messages to UI format
          const uiMessages: UIChatMessage[] = session.messages.map((msg: ChatMessage, index: number) => ({
            id: `msg-${index}`,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp?.toDate?.() || Date.now()),
          }))

          setMessages(uiMessages)
          setSessionId(sessionId)
          setIsHistoryOpen(false)
          setShowQuickQuestions(false)
        }
      }
    } catch (error) {
      console.error("Error loading chat session:", error)
      toast({
        title: t('chatbot.toast.loadError.title'),
        description: t('chatbot.toast.loadError.description'),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createNewChat = () => {
    // Reset to initial state with welcome message
    const welcomeMessage: UIChatMessage = {
      id: "welcome",
      role: "assistant",
      content: getWelcomeMessage(),
      timestamp: new Date(),
    }
    setMessages([welcomeMessage])
    setSessionId(null)
    setIsHistoryOpen(false)
    setShowQuickQuestions(true)
  }

  const deleteChatSession = async (sessionIdToDelete: string) => {
    if (!user) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/chat-history?userId=${user.uid}&sessionId=${sessionIdToDelete}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // If we're deleting the current session, reset to welcome message
        if (sessionIdToDelete === sessionId) {
          createNewChat()
        }

        // Refresh chat history
        await loadChatHistory()

        toast({
          title: t('chatbot.toast.deleteSuccess.title'),
          description: t('chatbot.toast.deleteSuccess.description'),
        })
      } else {
        throw new Error("Failed to delete chat session")
      }
    } catch (error) {
      console.error("Error deleting chat session:", error)
      toast({
        title: t('chatbot.toast.deleteError.title'),
        description: t('chatbot.toast.deleteError.description'),
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const deleteAllChatHistory = async () => {
    if (!user) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/chat-history?userId=${user.uid}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Reset to welcome message
        createNewChat()

        // Refresh chat history
        await loadChatHistory()

        toast({
          title: t('chatbot.toast.deleteAllSuccess.title'),
          description: t('chatbot.toast.deleteAllSuccess.description'),
        })
      } else {
        throw new Error("Failed to delete all chat history")
      }
    } catch (error) {
      console.error("Error deleting all chat history:", error)
      toast({
        title: t('chatbot.toast.deleteAllError.title'),
        description: t('chatbot.toast.deleteAllError.description'),
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || !user) return

    const userMessage: UIChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)
    setLoadingStage("fetching")
    setShowQuickQuestions(false)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputMessage.trim(),
          userId: user.uid,
          includeHistory: true,
          sessionId: sessionId,
        }),
      })

      const contentType = response.headers.get("content-type")
      let data

      if (contentType && contentType.includes("application/json")) {
        data = await response.json()
      } else {
        // If not JSON, treat as plain text error
        const text = await response.text()
        throw new Error(text || "Server returned non-JSON response")
      }

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`)
      }

      if (!data.message) {
        throw new Error("Invalid response format from server")
      }

      // Update session ID if it's a new session
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId)
        // Refresh chat history
        loadChatHistory()
      }

      // Change loading stage to processing after data is fetched
      setLoadingStage("processing")

      // Add a small delay to show the processing state
      await new Promise(resolve => setTimeout(resolve, 500))

      const assistantMessage: UIChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Chat error:", error)
      toast({
        title: t('chatbot.toast.sendError.title'),
        description: t('chatbot.toast.sendError.description'),
        variant: "destructive",
      })

      const errorMessage: UIChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: t('chatbot.error.message'),
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setLoadingStage("idle")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const quickQuestions = t('chatbot.quickQuestions.questions') as string[]

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question)
  }

  return (
    <AuthGuard>
      <AppLayout>
        <div className="flex flex-col h-[calc(100vh-8rem)]">
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 p-4 border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/30">
            <div className="flex flex-row md:items-center md:justify-between gap-3">
              <div className="flex flex-1 items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-foreground">{t('chatbot.header.title')}</h1>
                  <p className="text-sm text-muted-foreground">{t('chatbot.header.subtitle')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {t('chatbot.header.status')}
                </Badge>

                {/* Chat History Button */}
                <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <History className="h-4 w-4" />
                      <span className="sr-only">Chat History</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        {t('chatbot.history.title')}
                      </SheetTitle>
                    </SheetHeader>

                    <div className="flex flex-col items-center">
                      {/* New Chat Button - Full Width */}
                      <Button
                        onClick={createNewChat}
                        variant="outline"
                        className="w-[calc(100%-1rem)] justify-start mb-4"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {t('chatbot.history.newChat')}
                      </Button>

                      {isLoadingHistory ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                      ) : chatSessions.length > 0 ? (
                        <div className="space-y-2 max-h-[calc(100vh-10rem)] overflow-y-auto">
                          {chatSessions.map((session) => (
                            <div key={session.id} className="flex items-center group">
                              <Button
                                variant="ghost"
                                className="flex-1 justify-start text-left h-auto py-3 px-3"
                                onClick={() => loadChatSession(session.id)}
                              >
                                <div className="flex flex-col items-start w-full">
                                  <span className="font-medium text-sm truncate w-full">
                                    {session.title}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(session.updatedAt, t('locale'), {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </span>
                                </div>
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="p-1 h-auto"
                                    disabled={isDeleting}
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onSelect={(e) => e.preventDefault()}>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        {t('chatbot.history.delete')}
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>{t('chatbot.history.deleteDialog.title')}</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          {t('chatbot.history.deleteDialog.description')}
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>{t('chatbot.history.deleteDialog.cancel')}</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteChatSession(session.id)} disabled={isDeleting}>
                                          {isDeleting ? t('chatbot.history.deleteDialog.deleting') : t('chatbot.history.deleteDialog.confirm')}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          ))}

                          {/* Delete All History Option */}
                          <div className="pt-2 mt-2 border-t border-border">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive" disabled={isDeleting}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {t('chatbot.history.deleteAll')}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t('chatbot.history.deleteAllDialog.title')}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t('chatbot.history.deleteAllDialog.description')}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t('chatbot.history.deleteAllDialog.cancel')}</AlertDialogCancel>
                                  <AlertDialogAction onClick={deleteAllChatHistory} disabled={isDeleting}>
                                    {isDeleting ? t('chatbot.history.deleteAllDialog.deleting') : t('chatbot.history.deleteAllDialog.confirm')}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <p className="text-sm">{t('chatbot.history.empty.title')}</p>
                          <p className="text-xs mt-1">{t('chatbot.history.empty.subtitle')}</p>
                        </div>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] md:max-w-[70%] rounded-lg p-3 ${message.role === "user"
                      ? "bg-primary text-primary-foreground ml-auto"
                      : "bg-muted text-muted-foreground"
                    }`}
                >
                  <div className="text-sm">
                    {message.role === "assistant"
                      ? formatAIText(message.content)
                      : message.content}
                  </div>
                  <p
                    className={`text-xs mt-2 ${message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground/70"
                      }`}
                  >
                    {message.timestamp.toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {message.role === "user" && (
                  <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
                    <AvatarImage
                      src={profile.photoURL || undefined}
                      alt={profile.displayName || "User"}
                    />
                    <AvatarFallback>
                      <User className="h-4 w-4 text-secondary" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      {loadingStage === "fetching" ? t('chatbot.loading.fetching') : t('chatbot.loading.typing')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {showQuickQuestions && messages.length <= 1 && (
            <div className="p-4 border-t border-border">
              <div className="mb-3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    {t('chatbot.quickQuestions.title')}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQuickQuestions(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {quickQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickQuestion(question)}
                      className="justify-start text-left h-auto py-2 px-3"
                    >
                      <span className="text-xs">{question}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-border bg-card/50">
            <Alert className="mb-3">
              <Heart className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {t('chatbot.disclaimer.message')}
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('chatbot.input.placeholder')}
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={sendMessage} disabled={isLoading || !inputMessage.trim()} size="sm">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  )
}