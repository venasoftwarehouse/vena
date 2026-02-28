// Chat message interface for API communication (server-side)
export interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
  timestamp?: any
}

// Chat message interface for UI components (client-side)
export interface UIChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

// Chat response interface from AI service
export interface ChatResponse {
  message: string
  error?: string
}

// Scan data interface for contextual prompts
export interface ScanData {
  userId: string
  colorAnalysis: {
    glucoseLevel: string
    description: string
  }
  createdAt: string
  timestamp: any
}

// Chat history interface for database storage (old format)
export interface ChatHistory {
  userId: string
  userMessage: string
  aiResponse: string
  timestamp: any
  createdAt: string
}

// Chat session interface for database storage (new format)
export interface ChatSession {
  id: string
  userId: string
  title: string
  createdAt: any
  updatedAt: any
  messages: ChatMessage[]
}

// Chat message in database format
export interface ChatMessageDB {
  role: "user" | "assistant"
  content: string
  timestamp: any
}
