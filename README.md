# Музейный Гид — Веб-приложение

Веб-версия интерактивного AI-музейного гида. Полностью самостоятельный React-фронтенд, не зависящий от Telegram-бота.

## Стек

| Инструмент | Назначение |
|------------|-----------|
| React 18 + TypeScript | Основа фронтенда |
| Vite 5 | Dev-сервер + сборщик |
| Tailwind CSS 3 | Стили |
| Framer Motion | Анимации |
| React Router v6 | Маршрутизация |
| Axios | HTTP-запросы к API |
| react-dropzone | Загрузка файлов в adminka |
| lucide-react | Иконки |
| react-markdown | Рендеринг markdown из AI |

---

## Структура проекта

```
src/
├── api/
│   ├── client.ts          # Axios instance
│   └── endpoints.ts       # Все API-функции
├── components/
│   ├── layout/
│   │   ├── Header.tsx     # Фиксированный хедер
│   │   └── PageLayout.tsx # Обёртка страницы
│   └── ui/
│       ├── AudioPlayer.tsx    # Плеер для TTS-аудио
│       ├── Button.tsx         # Кнопка (4 варианта)
│       ├── Card.tsx           # Карточка (с hover/selected)
│       ├── MarkdownContent.tsx # Рендер AI-текста
│       ├── Spinner.tsx        # Лоадер
│       ├── TypingIndicator.tsx # Анимация «печатает»
│       └── VoiceRecorder.tsx  # Запись голоса (STT)
├── pages/
│   ├── WelcomePage.tsx          # Главная + выбор музея
│   ├── ExcursionTypePage.tsx    # Выбор типа экскурсии
│   ├── ReadyExcursionPage.tsx   # Готовая экскурсия
│   ├── PersonalExcursionPage.tsx # Персональная экскурсия
│   ├── InfinityExcursionPage.tsx # Бесконечная экскурсия
│   ├── AdminPage.tsx            # Adminka
│   └── NotFoundPage.tsx
├── types/
│   └── index.ts           # TypeScript-типы
├── App.tsx                # Роутер
├── main.tsx
└── index.css              # Глобальные стили + Tailwind
```

---

## Функциональность

### Гость-приложение

#### Главная (`/`)
- Приветствие
- Список музеев для выбора

#### Выбор типа экскурсии (`/excursion-type`)
- Персональная, Бесконечная, Готовая

#### Готовая экскурсия (`/excursion/ready`)
1. Выбор формата (с фото / без)
2. Подтверждение готовности
3. Переход по экспонатам (прогресс-бар, текст, фото, аудио)
4. Финальный экран

#### Персональная экскурсия (`/excursion/personal`)
1. Выбор стиля рассказчика (текст или голос)
2. Формат (с фото / без)
3. Описание интересов
4. Выбор количества экспонатов (3 / 5 / 7 / 10)
5. Карта маршрута + список экспонатов
6. Экспонат с текстом, аудио, Q&A (текст + голос)
7. Финальный экран

#### Бесконечная экскурсия (`/excursion/infinity`)
- **Режим гида** — живой чат с AI, кнопка «Предложи экспонаты»
- **Выбор экспоната** — список рекомендаций
- **Режим эксперта** — чат с экспертом по конкретному экспонату, показ фото
- Переключение обратно к гиду с автоматическим резюме

### Adminка (`/admin`)
- Просмотр текущей статистики (музеи / экспонаты / сессии)
- Загрузка `.xlsx` файла через drag&drop или клик
- Результат загрузки с деталями и ошибками
- Описание ожидаемого формата файла

---

## Настройка и запуск

### 1. Установить зависимости

```bash
npm install
```

### 2. Запустить dev-сервер

```bash
npm run dev
```

Приложение запустится на `http://localhost:3000`.

### 3. Настройка API

По умолчанию все запросы к `/api/*` проксируются на `http://localhost:8000`.  
Это поведение настраивается в [vite.config.ts](vite.config.ts):

```ts
proxy: {
  '/api': {
    target: 'http://localhost:8000',  // ← URL вашего бэкенда
    changeOrigin: true,
  },
},
```

Все эндпоинты описаны в [src/api/endpoints.ts](src/api/endpoints.ts).

### 4. Сборка для продакшена

```bash
npm run build
```

---

## API-эндпоинты (ожидаемые)

| Метод | Путь | Назначение |
|-------|------|-----------|
| GET | `/api/museums` | Список музеев |
| POST | `/api/excursion/personal/start` | Начать персональную |
| GET | `/api/excursion/personal/exhibit` | Текущий экспонат |
| POST | `/api/excursion/personal/next` | Следующий экспонат |
| POST | `/api/excursion/personal/ask` | Вопрос по экспонату |
| POST | `/api/excursion/ready/start` | Начать готовую |
| GET | `/api/excursion/ready/exhibit` | Получить экспонат |
| POST | `/api/excursion/infinity/start` | Начать бесконечную |
| POST | `/api/excursion/infinity/guide/message` | Сообщение гиду |
| GET | `/api/excursion/infinity/guide/suggest` | Предложить экспонаты |
| POST | `/api/excursion/infinity/expert/start` | Начать режим эксперта |
| POST | `/api/excursion/infinity/expert/message` | Сообщение эксперту |
| POST | `/api/excursion/infinity/expert/return` | Вернуться к гиду |
| POST | `/api/stt/transcribe` | Распознавание голоса |
| POST | `/api/admin/upload` | Загрузка Excel |
| GET | `/api/admin/stats` | Статистика |

---

## Рекомендации по настройке редактора (VSCode)

Если в VSCode вы видите красные подчёркивания или проблемы с разрешением типов (например для `clsx`, `vite.config.ts` или `@types/node`), выполните следующие шаги:

- Перезапустите TypeScript Server: откройте командную палитру (Ctrl+Shift+P) → "TypeScript: Restart TS Server".
- Убедитесь, что в проекте установлены dev-зависимости типов: `@types/node` и (при необходимости) `@types/*` для используемых библиотек.
- В настройках рабочей области можно указать `typescript.tsdk` на папку с TypeScript в `node_modules` (обычно `./node_modules/typescript/lib`).
- Рекомендуется использовать форматирование и автоисправления при сохранении. Пример настроек в `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

Если нужно — могу добавить эти настройки в проект как шаблон `.vscode/settings.json`.
