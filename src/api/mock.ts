import type {
  AuthSession,
  Exhibit,
  ExhibitDescription,
  ExcursionEventResponse,
  LoginPayload,
  Museum,
  MuseumLayoutScheme,
  PersonalExcursionSession,
  ReadyExcursionSession,
  RegisterPayload,
  StaffInvite,
  StaffMember,
  StaffMuseum,
  StaffUser,
  UploadResult,
} from '@/types'

const MOCK_AUDIO_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'

const mockMuseums: Museum[] = [
  {
    id: 1,
    name: 'Красноярский художественный музей',
    description: 'Классическое и современное искусство Сибири',
    accent: 'от XVIII века до современности',
    imageUrl: 'https://placehold.co/800x500/png?text=Музей+1',
  },
  {
    id: 2,
    name: 'Музей науки и технологий',
    description: 'Интерактивные экспозиции и эксперименты',
    accent: 'достижения науки',
    imageUrl: 'https://placehold.co/800x500/png?text=Музей+2',
  },
]

const mockExhibits: Exhibit[] = [
  {
    id: 101,
    name: 'Картина «Северная легенда»',
    imageUrl: 'https://placehold.co/700x450/png?text=Экспонат+1',
    building: 'Корпус А',
    hall: 'Зал 101',
  },
  {
    id: 102,
    name: 'Скульптура «Тайга»',
    imageUrl: 'https://placehold.co/700x450/png?text=Экспонат+2',
    building: 'Корпус А',
    hall: 'Зал 102',
  },
  {
    id: 103,
    name: 'Интерактивная инсталляция «Свет»',
    imageUrl: 'https://placehold.co/700x450/png?text=Экспонат+3',
    building: 'Корпус B',
    hall: 'Зал 201',
  },
  {
    id: 104,
    name: 'Архивный экспонат «История города»',
    imageUrl: 'https://placehold.co/700x450/png?text=Экспонат+4',
    building: 'Корпус B',
    hall: 'Зал 202',
  },
  {
    id: 105,
    name: 'Мультимедийный стенд «Экспедиции»',
    imageUrl: 'https://placehold.co/700x450/png?text=Экспонат+5',
    building: 'Корпус C',
    hall: 'Зал 301',
  },
]

let mockMuseumIdCounter = 3
let mockUserIdCounter = 4

let mockCurrentUser: StaffUser = {
  id: 1,
  email: 'demo@museum.ru',
  name: 'Демо-сотрудник',
  role: 'superadmin',
}

let mockCurrentToken = 'mock-token'

const mockRegisteredUsers = new Map<string, StaffUser>([
  [
    'demo@museum.ru',
    {
      id: 1,
      email: 'demo@museum.ru',
      name: 'Демо-сотрудник',
      role: 'superadmin',
    },
  ],
])

const staffMuseums: StaffMuseum[] = [
  {
    id: 1,
    name: 'Красноярский художественный музей',
    description: 'Галерея живописи и графики',
    role: 'owner',
  },
  {
    id: 2,
    name: 'Музей науки и технологий',
    description: 'Экспериментальная площадка',
    role: 'editor',
  },
]

const staffMembersByMuseum = new Map<number, StaffMember[]>([
  [
    1,
    [
      { id: 1, name: 'Демо-сотрудник', email: 'demo@museum.ru', role: 'superadmin' },
      { id: 2, name: 'Марина', email: 'marina@museum.ru', role: 'editor' },
    ],
  ],
  [
    2,
    [
      { id: 3, name: 'Сергей', email: 'sergey@museum.ru', role: 'editor' },
      { id: 4, name: 'Илья', email: 'ilya@museum.ru', role: 'viewer' },
    ],
  ],
])

const personalSessions = new Map<string, { index: number; exhibits: ExhibitDescription[] }>()
const readySessions = new Map<string, { index: number; exhibits: ExhibitDescription[] }>()
const infinitySessions = new Set<string>()

const layoutByMuseum = new Map<number, MuseumLayoutScheme>()

const createMockLayoutScheme = (): MuseumLayoutScheme => ({
  version: 1,
  buildingGrid: { rows: 4, cols: 5 },
  buildings: {
    mock_building_1: {
      id: 'mock_building_1',
      name: 'Корпус А',
      position: { row: 1, col: 1 },
      floorOrder: ['mock_floor_1'],
      floors: {
        mock_floor_1: {
          id: 'mock_floor_1',
          name: 'Этаж 1',
          grid: { rows: 5, cols: 5 },
          halls: {
            mock_hall_1: {
              id: 'mock_hall_1',
              name: 'Зал 101',
              position: { row: 1, col: 1 },
            },
            mock_hall_2: {
              id: 'mock_hall_2',
              name: 'Зал 102',
              position: { row: 1, col: 2 },
            },
            mock_hall_3: {
              id: 'mock_hall_3',
              name: 'Зал 103',
              position: { row: 2, col: 2 },
            },
          },
          hallLinks: [
            { fromHallId: 'mock_hall_1', toHallId: 'mock_hall_2' },
            { fromHallId: 'mock_hall_2', toHallId: 'mock_hall_3' },
          ],
        },
      },
    },
  },
})

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))

const withDelay = async <T>(value: T, ms?: number) => {
  await delay(ms)
  return value
}

let mockSessionIdCounter = 0

const nextId = (prefix: string) => `${prefix}_${++mockSessionIdCounter}`

const buildExhibitDescription = (exhibit: Exhibit, index: number): ExhibitDescription => ({
  exhibitId: exhibit.id,
  text: `### Экспонат ${index + 1}: ${exhibit.name}\n\nОписание сейчас генерируется в мок-режиме. ` +
    'Здесь появится история экспоната, интересные факты и детали маршрута.',
  imageUrl: exhibit.imageUrl,
  audioUrl: MOCK_AUDIO_URL,
})

const buildExhibitList = (count: number) =>
  Array.from({ length: count }).map((_, index) => {
    const exhibit = mockExhibits[index % mockExhibits.length]
    return buildExhibitDescription(exhibit, index)
  })

const getNextExhibit = (
  sessionMap: Map<string, { index: number; exhibits: ExhibitDescription[] }>,
  sessionId: string,
  startFromFirst: boolean,
) => {
  const session = sessionMap.get(sessionId)
  if (!session) {
    const exhibits = buildExhibitList(5)
    sessionMap.set(sessionId, { index: 1, exhibits })
    return exhibits[0]
  }
  const index = startFromFirst ? 0 : session.index
  const next = session.exhibits[index] ?? session.exhibits[session.exhibits.length - 1]
  session.index = Math.min(index + 1, session.exhibits.length)
  return next
}

export const isMockEnabled = () => import.meta.env.VITE_USE_MOCKS !== 'false'

export const mockApi = {
  getMuseums: async () => withDelay([...mockMuseums]),

  registerStaff: async (payload: RegisterPayload): Promise<AuthSession> => {
    const newUser: StaffUser = {
      id: ++mockUserIdCounter,
      email: payload.email,
      name: payload.name ?? 'Новый сотрудник',
      role: 'editor',
    }
    mockRegisteredUsers.set(payload.email, newUser)
    mockCurrentUser = newUser
    mockCurrentToken = nextId('mock-token')
    return withDelay({ token: mockCurrentToken, user: mockCurrentUser })
  },

  loginStaff: async (payload: LoginPayload): Promise<AuthSession> => {
    const user = mockRegisteredUsers.get(payload.email)
    if (user) {
      mockCurrentUser = user
    } else {
      mockCurrentUser = {
        id: ++mockUserIdCounter,
        email: payload.email,
        name: 'Сотрудник',
        role: 'editor',
      }
      mockRegisteredUsers.set(payload.email, mockCurrentUser)
    }
    mockCurrentToken = nextId('mock-token')
    return withDelay({ token: mockCurrentToken, user: mockCurrentUser })
  },

  getCurrentUser: async (): Promise<StaffUser> => withDelay(mockCurrentUser),

  getStaffMuseums: async (): Promise<StaffMuseum[]> => withDelay([...staffMuseums]),

  createMuseum: async (payload: { name: string; description?: string }): Promise<StaffMuseum> => {
    const museum: StaffMuseum = {
      id: ++mockMuseumIdCounter,
      name: payload.name,
      description: payload.description,
      role: 'Владелец',
    }
    staffMuseums.unshift(museum)
    mockMuseums.unshift({
      id: museum.id,
      name: museum.name,
      description: museum.description,
      accent: 'Новый музей',
      imageUrl: 'https://placehold.co/800x500/png?text=Новый+музей',
    })
    return withDelay(museum)
  },

  createMuseumInvite: async (museumId: number): Promise<StaffInvite> =>
    withDelay({
      token: nextId(`invite_${museumId}`),
      url: `https://museum.local/invite/${museumId}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }),

  acceptInvite: async () => withDelay({ success: true }),

  getMuseumStaff: async (museumId: number): Promise<StaffMember[]> => {
    const staff = staffMembersByMuseum.get(museumId)
    return withDelay(staff ? [...staff] : [])
  },

  startPersonalExcursion: async (params: { museumId: number; exhibitCount: number }): Promise<PersonalExcursionSession> => {
    const sessionId = nextId('personal')
    const exhibits = buildExhibitList(params.exhibitCount)
    personalSessions.set(sessionId, { index: 0, exhibits })
    return withDelay({
      sessionId,
      routeIds: exhibits.map((exhibit) => exhibit.exhibitId ?? 0),
      totalExhibits: exhibits.length,
      greeting: 'Отлично! Начинаем персональную экскурсию в мок-режиме.',
    })
  },

  getPersonalExhibitDescription: async (sessionId: string): Promise<ExhibitDescription> =>
    withDelay(getNextExhibit(personalSessions, sessionId, true)),

  nextPersonalExhibit: async (sessionId: string): Promise<ExhibitDescription> =>
    withDelay(getNextExhibit(personalSessions, sessionId, false)),

  askPersonalQuestion: async (question: string): Promise<{ answer: string; audioUrl?: string }> =>
    withDelay({
      answer: `В мок-режиме отвечаю на вопрос: «${question}».`,
      audioUrl: MOCK_AUDIO_URL,
    }),

  trackExhibitQuestion: async () => withDelay({ success: true }),

  getMostInteresting: async () => withDelay({ name: mockExhibits[0]?.name ?? 'Экспонат' }),

  startReadyExcursion: async (): Promise<ReadyExcursionSession> => {
    const sessionId = nextId('ready')
    const exhibits = buildExhibitList(5)
    readySessions.set(sessionId, { index: 0, exhibits })
    return withDelay({ sessionId, totalExhibits: exhibits.length })
  },

  getReadyExhibit: async (sessionId: string): Promise<ExhibitDescription> =>
    withDelay(getNextExhibit(readySessions, sessionId, true)),

  nextReadyExhibit: async (sessionId: string): Promise<ExhibitDescription> =>
    withDelay(getNextExhibit(readySessions, sessionId, false)),

  startInfinityExcursion: async (payload: { action?: string }): Promise<ExcursionEventResponse> => {
    const sessionId = nextId('infinity')
    infinitySessions.add(sessionId)
    const text =
      payload.action === 'guide_continue_chat'
        ? 'Продолжаем разговор! Я помню нашу историю.'
        : payload.action === 'guide_new_chat'
          ? 'Начинаем новую бесконечную экскурсию.'
          : 'Привет! Я ваш AI-гид. Задавайте вопросы или попросите подборку экспонатов.'
    return withDelay({
      event: 'infinity_start',
      session_id: sessionId,
      mode: 'infinity',
      stage: 'guide',
      text,
    })
  },

  sendInfinityMessage: async (sessionId: string, text: string): Promise<ExcursionEventResponse> =>
    withDelay({
      event: 'infinity_message',
      session_id: sessionId,
      mode: 'infinity',
      stage: 'guide',
      text: `Я получила сообщение: «${text}». Хотите посмотреть экспонаты?`,
    }),

  requestExhibitSuggestions: async (sessionId: string): Promise<ExcursionEventResponse> =>
    withDelay({
      event: 'infinity_suggestions',
      session_id: sessionId,
      mode: 'infinity',
      stage: 'guide',
      exhibits: mockExhibits.map((exhibit) => ({ id: exhibit.id, name: exhibit.name })),
    }),

  chooseExhibit: async (sessionId: string, exhibitId: number): Promise<ExcursionEventResponse> => {
    const exhibit = mockExhibits.find((item) => item.id === exhibitId) ?? mockExhibits[0]
    return withDelay({
      event: 'infinity_expert',
      session_id: sessionId,
      mode: 'infinity',
      stage: 'expert',
      text: `Вы выбрали «${exhibit.name}». Вот подробный рассказ об экспонате в мок-режиме.`,
      exhibit: {
        id: exhibit.id,
        name: exhibit.name,
        image_url: exhibit.imageUrl,
      },
      audio_url: MOCK_AUDIO_URL,
    })
  },

  returnToGuide: async (sessionId: string): Promise<ExcursionEventResponse> =>
    withDelay({
      event: 'infinity_return',
      session_id: sessionId,
      mode: 'infinity',
      stage: 'guide',
      text: 'Возвращаемся к гиду. Что вас интересует дальше?',
    }),

  transcribeAudio: async (): Promise<string> => withDelay('Голосовое сообщение (мок).'),

  uploadExcelFile: async (file: File): Promise<UploadResult> =>
    withDelay({
      success: true,
      message: `Файл «${file.name}» успешно обработан в мок-режиме.`,
      rowsProcessed: Math.max(3, Math.round(file.size / 512)),
    }),

  getAdminStats: async () => withDelay({ museums: mockMuseums.length, exhibits: 128, sessions: 54 }),

  getMuseumLayout: async (museumId?: number) => {
    const key = museumId ?? 0
    const existing = layoutByMuseum.get(key)
    if (existing) return withDelay(existing)
    const created = createMockLayoutScheme()
    layoutByMuseum.set(key, created)
    return withDelay(created)
  },

  saveMuseumLayout: async (layout: MuseumLayoutScheme, museumId?: number) => {
    const key = museumId ?? 0
    layoutByMuseum.set(key, layout)
    return withDelay({ success: true, message: 'Схема сохранена (мок-режим).' })
  },
}
