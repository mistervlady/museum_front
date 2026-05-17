import api from './client'
import { isMockEnabled, mockApi } from './mock'
import type {
  AuthSession,
  LoginPayload,
  Museum,
  PersonalExcursionSetupParams,
  PersonalExcursionSession,
  ExhibitDescription,
  ReadyExcursionSession,
  UploadResult,
  MuseumLayoutScheme,
  MuseumLayoutPayload,
  ExcursionEventResponse,
  RegisterPayload,
  StaffInvite,
  StaffMember,
  StaffMuseum,
  StaffUser,
} from '@/types'

const AUDIO_FORMAT = 'with_audio'

const useMocks = isMockEnabled()

const withMock = <T>(realCall: () => Promise<T>, mockCall: () => Promise<T>) =>
  useMocks ? mockCall() : realCall()

const toExhibitDescription = (event: ExcursionEventResponse): ExhibitDescription => ({
  text: event.description ?? event.text ?? '',
  audioUrl: event.audio_url,
  imageUrl: event.exhibit?.image_url,
  exhibitId: event.exhibit_id ?? event.exhibit?.id,
})

// ─── Auth / Staff ──────────────────────────────────────────────────────────────

interface AuthSessionResponse {
  token?: string
  access_token?: string
  user?: StaffUser
}

const toAuthSession = (payload: AuthSessionResponse): AuthSession => ({
  token: payload.token ?? payload.access_token ?? '',
  user: payload.user,
})

export const registerStaff = (payload: RegisterPayload) =>
  withMock(
    () => api.post<AuthSessionResponse>('/auth/register', payload).then((r) => toAuthSession(r.data)),
    () => mockApi.registerStaff(payload),
  )

export const loginStaff = (payload: LoginPayload) =>
  withMock(
    () => api.post<AuthSessionResponse>('/auth/login', payload).then((r) => toAuthSession(r.data)),
    () => mockApi.loginStaff(payload),
  )

export const getCurrentUser = () =>
  withMock(
    () => api.get<StaffUser>('/auth/me').then((r) => r.data),
    () => mockApi.getCurrentUser(),
  )

export const getStaffMuseums = () =>
  withMock(
    () =>
      api.get<{ items?: StaffMuseum[]; museums?: StaffMuseum[] } | StaffMuseum[]>('/staff/museums').then((r) => {
        const data = r.data
        if (Array.isArray(data)) return data
        return data.items ?? data.museums ?? []
      }),
    () => mockApi.getStaffMuseums(),
  )

export const createMuseum = (payload: { name: string; description?: string }) =>
  withMock(
    () => api.post<StaffMuseum>('/museums', payload).then((r) => r.data),
    () => mockApi.createMuseum(payload),
  )

interface InviteResponse {
  token?: string
  invite_token?: string
  url?: string
  invite_url?: string
  expires_at?: string
}

export const createMuseumInvite = (museumId: number) =>
  withMock(
    () =>
      api.post<InviteResponse>(`/museums/${museumId}/invites`).then((r) => ({
        token: r.data.token ?? r.data.invite_token ?? '',
        url: r.data.url ?? r.data.invite_url,
        expiresAt: r.data.expires_at,
      }) satisfies StaffInvite),
    () => mockApi.createMuseumInvite(museumId),
  )

export const acceptInvite = (token: string) =>
  withMock(
    () => api.post('/invites/accept', { token }).then((r) => r.data),
    () => mockApi.acceptInvite(),
  )

export const getMuseumStaff = (museumId: number) =>
  withMock(
    () =>
      api
        .get<{ items?: StaffMember[]; staff?: StaffMember[] } | StaffMember[]>(`/museums/${museumId}/staff`)
        .then((r) => {
          const data = r.data
          if (Array.isArray(data)) return data
          return data.items ?? data.staff ?? []
        }),
    () => mockApi.getMuseumStaff(museumId),
  )

// ─── Museums ─────────────────────────────────────────────────────────────────

export const getMuseums = () =>
  withMock(
    () => api.get<{ items: Museum[] }>('/museums').then((r) => r.data.items),
    () => mockApi.getMuseums(),
  )

// ─── Personal Excursion ───────────────────────────────────────────────────────

export const startPersonalExcursion = (params: PersonalExcursionSetupParams) =>
  withMock(
    () =>
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
        }),
    () => mockApi.startPersonalExcursion({ museumId: params.museumId, exhibitCount: params.exhibitCount }),
  )

export const getPersonalExhibitDescription = (sessionId: string) =>
  withMock(
    () =>
      api
        .get<ExcursionEventResponse>('/excursion/personal/exhibit', {
          headers: { 'x-session-id': sessionId },
        })
        .then((r) => toExhibitDescription(r.data)),
    () => mockApi.getPersonalExhibitDescription(sessionId),
  )

export const nextPersonalExhibit = (sessionId: string) =>
  withMock(
    () =>
      api
        .get<ExcursionEventResponse>('/excursion/personal/next', {
          headers: { 'x-session-id': sessionId },
        })
        .then((r) => toExhibitDescription(r.data)),
    () => mockApi.nextPersonalExhibit(sessionId),
  )

export const askPersonalQuestion = (sessionId: string, question: string) =>
  withMock(
    () =>
      api
        .post<ExcursionEventResponse>(
          '/excursion/personal/message',
          { text: question },
          { headers: { 'x-session-id': sessionId } },
        )
        .then((r) => ({ answer: r.data.text ?? '', audioUrl: r.data.audio_url })),
    () => mockApi.askPersonalQuestion(question),
  )

export const trackExhibitQuestion = (userId: number, exhibitId: number) =>
  withMock(
    () => api.post('/exhibit-question', { user_id: userId, exhibit_id: exhibitId }).then((r) => r.data),
    () => mockApi.trackExhibitQuestion(),
  )

export const getMostInteresting = (userId: number) =>
  withMock(
    () => api.get(`/users/${userId}/most-interesting-exhibit`).then((r) => r.data),
    () => mockApi.getMostInteresting(),
  )

// ─── Ready Excursion ──────────────────────────────────────────────────────────

export const startReadyExcursion = (museumId: number, format: string) =>
  withMock(
    () =>
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
        }),
    () => mockApi.startReadyExcursion(),
  )

export const getReadyExhibit = (sessionId: string) =>
  withMock(
    () =>
      api
        .get<ExcursionEventResponse>('/excursion/ready/exhibit', {
          headers: { 'x-session-id': sessionId },
        })
        .then((r) => toExhibitDescription(r.data)),
    () => mockApi.getReadyExhibit(sessionId),
  )

export const nextReadyExhibit = (sessionId: string) =>
  withMock(
    () =>
      api
        .get<ExcursionEventResponse>('/excursion/ready/next', {
          headers: { 'x-session-id': sessionId },
        })
        .then((r) => toExhibitDescription(r.data)),
    () => mockApi.nextReadyExhibit(sessionId),
  )

// ─── Infinity Excursion ───────────────────────────────────────────────────────

export const startInfinityExcursion = (payload: {
  userId: number
  museumId: number
  action?: string
}) =>
  withMock(
    () =>
      api
        .post<ExcursionEventResponse>('/excursion/infinity/start', {
          user_id: payload.userId,
          museum_id: payload.museumId,
          audio_format: AUDIO_FORMAT,
          action: payload.action,
        })
        .then((r) => r.data),
    () => mockApi.startInfinityExcursion({ action: payload.action }),
  )

export const sendInfinityMessage = (sessionId: string, text: string) =>
  withMock(
    () =>
      api
        .post<ExcursionEventResponse>(
          '/excursion/infinity/message',
          { text },
          { headers: { 'x-session-id': sessionId } },
        )
        .then((r) => r.data),
    () => mockApi.sendInfinityMessage(sessionId, text),
  )

export const requestExhibitSuggestions = (sessionId: string) =>
  withMock(
    () =>
      api
        .post<ExcursionEventResponse>('/excursion/infinity/suggest-exhibits', null, {
          headers: { 'x-session-id': sessionId },
        })
        .then((r) => r.data),
    () => mockApi.requestExhibitSuggestions(sessionId),
  )

export const chooseExhibit = (sessionId: string, exhibitId: number) =>
  withMock(
    () =>
      api
        .post<ExcursionEventResponse>(
          '/excursion/infinity/choose-exhibit',
          { exhibit_id: exhibitId },
          { headers: { 'x-session-id': sessionId } },
        )
        .then((r) => r.data),
    () => mockApi.chooseExhibit(sessionId, exhibitId),
  )

export const returnToGuide = (sessionId: string) =>
  withMock(
    () =>
      api
        .post<ExcursionEventResponse>('/excursion/infinity/return-to-guide', null, {
          headers: { 'x-session-id': sessionId },
        })
        .then((r) => r.data),
    () => mockApi.returnToGuide(sessionId),
  )

// ─── STT ─────────────────────────────────────────────────────────────────────

export const transcribeAudio = (blob: Blob) =>
  withMock(
    () => {
      const form = new FormData()
      form.append('file', blob, 'recording.webm')
      return api
        .post<{ text: string }>('/stt/transcribe', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data.text)
    },
    () => mockApi.transcribeAudio(),
  )

// ─── Admin ────────────────────────────────────────────────────────────────────

export const uploadExcelFile = (file: File, museumId?: number) =>
  withMock(
    () => {
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
    },
    () => mockApi.uploadExcelFile(file),
  )

export const getAdminStats = () =>
  withMock(
    () => api.get<{ museums: number; exhibits: number; sessions: number }>('/admin/stats').then((r) => r.data),
    () => mockApi.getAdminStats(),
  )

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
  withMock(
    () =>
      api
        .get<MuseumLayoutScheme>('/admin/layout', {
          params: museumId ? { museum_id: museumId } : undefined,
        })
        .then((r) => normalizeLayoutScheme(r.data)),
    () => mockApi.getMuseumLayout(museumId).then((layout) => normalizeLayoutScheme(layout)),
  )

export const saveMuseumLayout = (layout: MuseumLayoutScheme, museumId?: number) =>
  withMock(
    () =>
      api
        .post<{ success: boolean; message: string }>(
          '/admin/layout',
          toLayoutPayload(layout),
          { params: museumId ? { museum_id: museumId } : undefined },
        )
        .then((r) => r.data),
    () => mockApi.saveMuseumLayout(layout, museumId),
  )
