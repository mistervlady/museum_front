// ─── Museum / Exhibits ────────────────────────────────────────────────────────

export interface Museum {
  id: number
  name: string
  description?: string
  accent?: string
  imageUrl?: string
}

export interface Exhibit {
  id: number
  museumId?: number
  name: string
  imageUrl?: string
  building?: string
  hall?: string
}

// ─── Excursion types ──────────────────────────────────────────────────────────

export type ExcursionType = 'personal' | 'infinity' | 'ready'
export type ExcursionFormat = 'with_images' | 'without_images'

// ─── Personal Excursion ───────────────────────────────────────────────────────

export interface PersonalExcursionSetupParams {
  museumId: number
  style: string
  format: ExcursionFormat
  description: string
  exhibitCount: number
}

export interface PersonalExcursionSession {
  sessionId: string
  routeIds: number[]
  totalExhibits: number
  greeting?: string
}

export interface ExhibitDescription {
  text: string
  audioUrl?: string
  imageUrl?: string
  exhibitId?: number
}

// ─── Ready Excursion ──────────────────────────────────────────────────────────

export interface ReadyExcursionSession {
  sessionId: string
  totalExhibits: number
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
  sessionId: string
}

export interface ExhibitSuggestion {
  exhibit: Exhibit
  similarity?: number
}

export type ExcursionMode = 'personal' | 'ready' | 'infinity'

export interface ExcursionEventResponse {
  event: string
  session_id: string
  mode: ExcursionMode
  stage: string
  museum_id?: number
  message?: string
  text?: string
  greeting?: string
  route_ids?: number[]
  exhibit_id?: number
  exhibit?: {
    id: number
    museum_id?: number
    name?: string
    image_url?: string
    building?: string
    hall?: string
  }
  exhibits?: Array<{ id: number; name: string }>
  description?: string
  audio_url?: string
  audio_enabled?: boolean
  format_id?: number
  actions?: string[]
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface UploadResult {
  success: boolean
  message: string
  rowsProcessed?: number
  errors?: string[]
}

export interface GridSize {
  rows: number
  cols: number
}

export interface GridPosition {
  row: number
  col: number
}

export interface LayoutHall {
  id: string
  name: string
  position: GridPosition
}

export interface LayoutHallLink {
  fromHallId: string
  toHallId: string
}

export interface LayoutFloor {
  id: string
  name: string
  grid: GridSize
  halls: Record<string, LayoutHall>
  hallLinks: LayoutHallLink[]
}

export interface LayoutBuilding {
  id: string
  name: string
  position: GridPosition
  floorOrder: string[]
  floors: Record<string, LayoutFloor>
}

export interface MuseumLayoutScheme {
  version: 1
  buildingGrid: GridSize
  buildings: Record<string, LayoutBuilding>
}

export interface MuseumLayoutPayload extends MuseumLayoutScheme {
  indexes: {
    buildingsByNode: Record<string, string>
    hallsByNode: Record<string, Record<string, string>>
    hallGraphByFloor: Record<string, Record<string, string[]>>
  }
}
