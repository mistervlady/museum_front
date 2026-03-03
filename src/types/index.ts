// ─── Museum / Exhibits ────────────────────────────────────────────────────────

export interface Museum {
  id: string
  name: string
  description: string
  imageUrl?: string
}

export interface Exhibit {
  id: number
  name: string
  description?: string
  imageUrl?: string
  roomNumber?: string
}

// ─── Excursion types ──────────────────────────────────────────────────────────

export type ExcursionType = 'personal' | 'infinity' | 'ready'
export type ExcursionFormat = 'with_images' | 'text_only'

// ─── Personal Excursion ───────────────────────────────────────────────────────

export interface PersonalExcursionSetupParams {
  museumId: string
  style: string
  format: ExcursionFormat
  description: string
  exhibitCount: number
}

export interface PersonalExcursionSession {
  sessionId: string
  exhibits: Exhibit[]
  mapImageUrl?: string
}

export interface ExhibitDescription {
  text: string
  audioUrl?: string
  imageUrl?: string
}

// ─── Ready Excursion ──────────────────────────────────────────────────────────

export interface ReadyExcursionSession {
  sessionId: string
  totalExhibits: number
  currentExhibitId: number
}

// ─── Infinity Excursion ───────────────────────────────────────────────────────

export type InfinityMode = 'guide' | 'expert'

export interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  content: string
  audioUrl?: string
  timestamp: Date
}

export interface InfinityExcursionSession {
  sessionId: string         // guide_id
  expertSessionId?: string  // expert_id
  mode: InfinityMode
  hasHistory: boolean
}

export interface ExhibitSuggestion {
  exhibit: Exhibit
  similarity: number
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface UploadResult {
  success: boolean
  message: string
  rowsProcessed?: number
  errors?: string[]
}
