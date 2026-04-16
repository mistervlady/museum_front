import api from './client'
import type {
  Museum,
  PersonalExcursionSetupParams,
  PersonalExcursionSession,
  ExhibitDescription,
  ReadyExcursionSession,
  InfinityExcursionSession,
  ChatMessage,
  ExhibitSuggestion,
  UploadResult,
  Exhibit,
  MuseumLayoutScheme,
  MuseumLayoutPayload,
} from '@/types'

// ─── Museums ─────────────────────────────────────────────────────────────────

export const getMuseums = () =>
  api.get<Museum[]>('/museums').then((r) => r.data)

// ─── Personal Excursion ───────────────────────────────────────────────────────

export const startPersonalExcursion = (params: PersonalExcursionSetupParams) =>
  api.post<PersonalExcursionSession>('/excursion/personal/start', params).then((r) => r.data)

export const getPersonalExhibitDescription = (sessionId: string) =>
  api
    .get<ExhibitDescription>('/excursion/personal/exhibit', { params: { session_id: sessionId } })
    .then((r) => r.data)

export const nextPersonalExhibit = (sessionId: string) =>
  api.post<ExhibitDescription>('/excursion/personal/next', { session_id: sessionId }).then((r) => r.data)

export const askPersonalQuestion = (sessionId: string, question: string) =>
  api
    .post<{ answer: string; audioUrl?: string }>('/excursion/personal/ask', {
      session_id: sessionId,
      question,
    })
    .then((r) => r.data)

// ─── Ready Excursion ──────────────────────────────────────────────────────────

export const startReadyExcursion = (museumId: string, format: string) =>
  api
    .post<ReadyExcursionSession>('/excursion/ready/start', { museum_id: museumId, format })
    .then((r) => r.data)

export const getReadyExhibit = (sessionId: string, exhibitId: number) =>
  api
    .get<ExhibitDescription>('/excursion/ready/exhibit', {
      params: { session_id: sessionId, exhibit_id: exhibitId },
    })
    .then((r) => r.data)

// ─── Infinity Excursion ───────────────────────────────────────────────────────

export const startInfinityExcursion = (userId: string) =>
  api.post<InfinityExcursionSession>('/excursion/infinity/start', { user_id: userId }).then((r) => r.data)

export const sendGuideMessage = (sessionId: string, message: string) =>
  api
    .post<ChatMessage>('/excursion/infinity/guide/message', {
      session_id: sessionId,
      message,
    })
    .then((r) => r.data)

export const requestExhibitSuggestions = (sessionId: string) =>
  api
    .get<ExhibitSuggestion[]>('/excursion/infinity/guide/suggest', {
      params: { session_id: sessionId },
    })
    .then((r) => r.data)

export const startExpertSession = (guideSessionId: string, exhibitId: number) =>
  api
    .post<{ expertSessionId: string; exhibit: Exhibit }>('/excursion/infinity/expert/start', {
      guide_session_id: guideSessionId,
      exhibit_id: exhibitId,
    })
    .then((r) => r.data)

export const sendExpertMessage = (expertSessionId: string, message: string) =>
  api
    .post<ChatMessage>('/excursion/infinity/expert/message', {
      expert_session_id: expertSessionId,
      message,
    })
    .then((r) => r.data)

export const returnToGuide = (guideSessionId: string, expertSessionId: string) =>
  api
    .post<ChatMessage>('/excursion/infinity/expert/return', {
      guide_session_id: guideSessionId,
      expert_session_id: expertSessionId,
    })
    .then((r) => r.data)

// ─── STT ─────────────────────────────────────────────────────────────────────

export const transcribeAudio = (blob: Blob) => {
  const form = new FormData()
  form.append('audio', blob, 'recording.webm')
  return api
    .post<{ text: string }>('/stt/transcribe', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data.text)
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export const uploadExcelFile = (file: File, museumId?: string) => {
  const form = new FormData()
  form.append('file', file)
  if (museumId) form.append('museum_id', museumId)
  return api
    .post<UploadResult>('/admin/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data)
}

export const getAdminStats = () =>
  api.get<{ museums: number; exhibits: number; sessions: number }>('/admin/stats').then((r) => r.data)

const toNodeKey = (row: number, col: number) => `${row}:${col}`

const toLayoutPayload = (layout: MuseumLayoutScheme): MuseumLayoutPayload => {
  const buildingsByNode: Record<string, string> = {}
  const hallsByNode: Record<string, Record<string, string>> = {}

  Object.values(layout.buildings).forEach((building) => {
    buildingsByNode[toNodeKey(building.position.row, building.position.col)] = building.id

    building.floorOrder.forEach((floorId) => {
      const floor = building.floors[floorId]
      if (!floor) return

      const floorKey = `${building.id}:${floor.id}`
      hallsByNode[floorKey] = {}

      Object.values(floor.halls).forEach((hall) => {
        hallsByNode[floorKey][toNodeKey(hall.position.row, hall.position.col)] = hall.id
      })
    })
  })

  return {
    ...layout,
    indexes: {
      buildingsByNode,
      hallsByNode,
    },
  }
}

export const getMuseumLayout = () =>
  api.get<MuseumLayoutScheme>('/admin/layout').then((r) => r.data)

export const saveMuseumLayout = (layout: MuseumLayoutScheme) =>
  api.post<{ success: boolean; message: string }>('/admin/layout', toLayoutPayload(layout)).then((r) => r.data)
