import api from './client'
import type {
  Museum,
  PersonalExcursionSetupParams,
  PersonalExcursionSession,
  ExhibitDescription,
  ReadyExcursionSession,
  UploadResult,
  MuseumLayoutScheme,
  MuseumLayoutPayload,
  ExcursionEventResponse,
} from '@/types'

const AUDIO_FORMAT = 'with_audio'

const toExhibitDescription = (event: ExcursionEventResponse): ExhibitDescription => ({
  text: event.description ?? event.text ?? '',
  audioUrl: event.audio_url,
  imageUrl: event.exhibit?.image_url,
  exhibitId: event.exhibit_id ?? event.exhibit?.id,
})

// ─── Museums ─────────────────────────────────────────────────────────────────

export const getMuseums = () =>
  api.get<{ items: Museum[] }>('/museums').then((r) => r.data.items)

// ─── Personal Excursion ───────────────────────────────────────────────────────

export const startPersonalExcursion = (params: PersonalExcursionSetupParams) =>
  api
    .post<ExcursionEventResponse>('excursion/personal/start', {
      museum_id: params.museumId,
      style: params.style,
      format: params.format,
      audio_format: AUDIO_FORMAT,
      user_description: params.description,
      route_length: params.exhibitCount,
    })
    .then((r) => {
      const routeIds = r.data.route_ids ?? []
      return {
        sessionId: r.data.session_id,
        routeIds,
        totalExhibits: routeIds.length || params.exhibitCount,
        greeting: r.data.greeting,
      } satisfies PersonalExcursionSession
    })

export const getPersonalExhibitDescription = (sessionId: string) =>
  api
    .get<ExcursionEventResponse>('/excursion/personal/exhibit', {
      headers: { 'x-session-id': sessionId },
    })
    .then((r) => toExhibitDescription(r.data))

export const nextPersonalExhibit = (sessionId: string) =>
  api
    .get<ExcursionEventResponse>('/excursion/personal/next', {
      headers: { 'x-session-id': sessionId },
    })
    .then((r) => toExhibitDescription(r.data))

export const askPersonalQuestion = (sessionId: string, question: string) =>
  api
    .post<ExcursionEventResponse>(
      '/excursion/personal/message',
      { text: question },
      { headers: { 'x-session-id': sessionId } },
    )
    .then((r) => ({ answer: r.data.text ?? '', audioUrl: r.data.audio_url }))

export const trackExhibitQuestion = (userId: number, exhibitId: number) =>
  api.post('/exhibit-question', { user_id: userId, exhibit_id: exhibitId }).then((r) => r.data)

export const getMostInteresting = (userId: number) =>
  api.get(`/users/${userId}/most-interesting-exhibit`).then((r) => r.data)

// ─── Ready Excursion ──────────────────────────────────────────────────────────

export const startReadyExcursion = (museumId: number, format: string) =>
  api
    .post<ExcursionEventResponse>('/excursion/ready/start', {
      museum_id: museumId,
      format,
      audio_format: AUDIO_FORMAT,
    })
    .then((r) => {
      const routeIds = r.data.route_ids ?? []
      return {
        sessionId: r.data.session_id,
        totalExhibits: routeIds.length || 5,
      } satisfies ReadyExcursionSession
    })

export const getReadyExhibit = (sessionId: string) =>
  api
    .get<ExcursionEventResponse>('/excursion/ready/exhibit', {
      headers: { 'x-session-id': sessionId },
    })
    .then((r) => toExhibitDescription(r.data))

export const nextReadyExhibit = (sessionId: string) =>
  api
    .get<ExcursionEventResponse>('/excursion/ready/next', {
      headers: { 'x-session-id': sessionId },
    })
    .then((r) => toExhibitDescription(r.data))

// ─── Infinity Excursion ───────────────────────────────────────────────────────

export const startInfinityExcursion = (payload: {
  userId: number
  museumId: number
  action?: string
}) =>
  api
    .post<ExcursionEventResponse>('/excursion/infinity/start', {
      user_id: payload.userId,
      museum_id: payload.museumId,
      audio_format: AUDIO_FORMAT,
      action: payload.action,
    })
    .then((r) => r.data)

export const sendInfinityMessage = (sessionId: string, text: string) =>
  api
    .post<ExcursionEventResponse>(
      '/excursion/infinity/message',
      { text },
      { headers: { 'x-session-id': sessionId } },
    )
    .then((r) => r.data)

export const requestExhibitSuggestions = (sessionId: string) =>
  api
    .post<ExcursionEventResponse>('/excursion/infinity/suggest-exhibits', null, {
      headers: { 'x-session-id': sessionId },
    })
    .then((r) => r.data)

export const chooseExhibit = (sessionId: string, exhibitId: number) =>
  api
    .post<ExcursionEventResponse>(
      '/excursion/infinity/choose-exhibit',
      { exhibit_id: exhibitId },
      { headers: { 'x-session-id': sessionId } },
    )
    .then((r) => r.data)

export const returnToGuide = (sessionId: string) =>
  api
    .post<ExcursionEventResponse>('/excursion/infinity/return-to-guide', null, {
      headers: { 'x-session-id': sessionId },
    })
    .then((r) => r.data)

// ─── STT ─────────────────────────────────────────────────────────────────────

export const transcribeAudio = (blob: Blob) => {
  const form = new FormData()
  form.append('file', blob, 'recording.webm')
  return api
    .post<{ text: string }>('/stt/transcribe', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data.text)
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export const uploadExcelFile = (file: File, museumId?: number) => {
  const form = new FormData()
  form.append('file', file)
  return api
    .post<{ success: boolean; message: string; rows_processed?: number; errors?: string[] }>(
      '/admin/upload',
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: museumId ? { museum_id: museumId } : undefined,
      },
    )
    .then((r) => ({
      success: r.data.success,
      message: r.data.message,
      rowsProcessed: r.data.rows_processed,
      errors: r.data.errors,
    } satisfies UploadResult))
}

export const getAdminStats = () =>
  api.get<{ museums: number; exhibits: number; sessions: number }>('/admin/stats').then((r) => r.data)

const toNodeKey = (row: number, col: number) => `${row}:${col}`

const normalizeLayoutScheme = (layout: MuseumLayoutScheme): MuseumLayoutScheme => {
  const buildings = Object.fromEntries(
    Object.entries(layout.buildings).map(([buildingId, building]) => {
      const floors = Object.fromEntries(
        Object.entries(building.floors).map(([floorId, floor]) => [
          floorId,
          {
            ...floor,
            hallLinks: floor.hallLinks ?? [],
          },
        ]),
      )

      return [
        buildingId,
        {
          ...building,
          floors,
        },
      ]
    }),
  )

  return {
    ...layout,
    buildings,
  }
}

const toLayoutPayload = (layout: MuseumLayoutScheme): MuseumLayoutPayload => {
  const buildingsByNode: Record<string, string> = {}
  const hallsByNode: Record<string, Record<string, string>> = {}
  const hallGraphByFloor: Record<string, Record<string, string[]>> = {}

  const normalizedLayout = normalizeLayoutScheme(layout)

  Object.values(normalizedLayout.buildings).forEach((building) => {
    buildingsByNode[toNodeKey(building.position.row, building.position.col)] = building.id

    building.floorOrder.forEach((floorId) => {
      const floor = building.floors[floorId]
      if (!floor) return

      const floorKey = `${building.id}:${floor.id}`
      hallsByNode[floorKey] = {}
      hallGraphByFloor[floorKey] = {}

      Object.values(floor.halls).forEach((hall) => {
        hallsByNode[floorKey][toNodeKey(hall.position.row, hall.position.col)] = hall.id
        hallGraphByFloor[floorKey][hall.id] = []
      })

      floor.hallLinks.forEach((link) => {
        const fromExists = !!floor.halls[link.fromHallId]
        const toExists = !!floor.halls[link.toHallId]
        if (!fromExists || !toExists || link.fromHallId === link.toHallId) return

        if (!hallGraphByFloor[floorKey][link.fromHallId].includes(link.toHallId)) {
          hallGraphByFloor[floorKey][link.fromHallId].push(link.toHallId)
        }

        if (!hallGraphByFloor[floorKey][link.toHallId].includes(link.fromHallId)) {
          hallGraphByFloor[floorKey][link.toHallId].push(link.fromHallId)
        }
      })
    })
  })

  return {
    ...normalizedLayout,
    indexes: {
      buildingsByNode,
      hallsByNode,
      hallGraphByFloor,
    },
  }
}

export const getMuseumLayout = (museumId?: number) =>
  api
    .get<MuseumLayoutScheme>('/admin/layout', {
      params: museumId ? { museum_id: museumId } : undefined,
    })
    .then((r) => normalizeLayoutScheme(r.data))

export const saveMuseumLayout = (layout: MuseumLayoutScheme, museumId?: number) =>
  api
    .post<{ success: boolean; message: string }>(
      '/admin/layout',
      toLayoutPayload(layout),
      { params: museumId ? { museum_id: museumId } : undefined },
    )
    .then((r) => r.data)
