import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Database,
  Image,
  Map,
  Users,
  X,
  AlertCircle,
} from 'lucide-react'
import clsx from 'clsx'
import Header from '@/components/layout/Header'
import PageLayout from '@/components/layout/PageLayout'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import LayoutSchemeEditorModal from '@/components/admin/LayoutSchemeEditorModal'
import { uploadExcelFile, getAdminStats, getMuseumLayout, saveMuseumLayout } from '@/api/endpoints'
import type { UploadResult, MuseumLayoutScheme } from '@/types'

interface Stats {
  museums: number
  exhibits: number
  sessions: number
}

const createEmptyLayoutScheme = (): MuseumLayoutScheme => ({
  version: 1,
  buildingGrid: { rows: 4, cols: 5 },
  buildings: {},
})

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

export default function AdminPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [layoutOpen, setLayoutOpen] = useState(false)
  const [layoutScheme, setLayoutScheme] = useState<MuseumLayoutScheme>(createEmptyLayoutScheme())
  const [layoutLoading, setLayoutLoading] = useState(false)
  const [layoutSaving, setLayoutSaving] = useState(false)
  const [layoutLoadedOnce, setLayoutLoadedOnce] = useState(false)
  const [layoutResult, setLayoutResult] = useState<{ success: boolean; message: string } | null>(null)

  // Load stats
  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setStatsLoading(false))
  }, [result])

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0])
      setResult(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: false,
  })

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setResult(null)
    try {
      const res = await uploadExcelFile(file)
      setResult(res)
      if (res.success) setFile(null)
    } catch (e) {
      setResult({ success: false, message: (e as Error).message })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenLayoutEditor = async () => {
    setLayoutOpen(true)

    if (layoutLoadedOnce || layoutLoading) return

    setLayoutLoading(true)
    try {
      const layout = await getMuseumLayout()
      setLayoutScheme(layout)
      setLayoutLoadedOnce(true)
      setLayoutResult(null)
    } catch {
      setLayoutScheme(createMockLayoutScheme())
      setLayoutLoadedOnce(true)
      setLayoutResult({
        success: true,
        message: 'Сервер схемы пока недоступен. Загружена моковая схема для работы.',
      })
    } finally {
      setLayoutLoading(false)
    }
  }

  const handleSaveLayout = async (nextLayout: MuseumLayoutScheme) => {
    setLayoutSaving(true)
    try {
      const response = await saveMuseumLayout(nextLayout)
      setLayoutScheme(nextLayout)
      setLayoutLoadedOnce(true)
      setLayoutResult({
        success: response.success,
        message: response.message,
      })
      if (response.success) {
        setLayoutOpen(false)
      }
    } catch (e) {
      setLayoutResult({
        success: false,
        message: `Не удалось сохранить схему: ${(e as Error).message}`,
      })
    } finally {
      setLayoutSaving(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <>
      <Header title="Администратор" showBack backTo="/" />
      <PageLayout>
        <div className="py-6 flex flex-col gap-6">

          {/* Stats */}
          <div>
            <h2 className="section-title">Обзор базы данных</h2>
            {statsLoading ? (
              <div className="flex justify-center py-4"><Spinner /></div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Map, label: 'Музеев', value: stats?.museums ?? '—' },
                  { icon: Image, label: 'Экспонатов', value: stats?.exhibits ?? '—' },
                  { icon: Users, label: 'Сессий', value: stats?.sessions ?? '—' },
                ].map(({ icon: Icon, label, value }) => (
                  <Card key={label} className="text-center py-4">
                    <Icon className="w-6 h-6 text-gold mx-auto mb-2" />
                    <p className="text-2xl font-serif font-bold text-museum-50">{value}</p>
                    <p className="text-museum-500 text-xs mt-1">{label}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="divider" />

          {/* Upload */}
          <div>
            <h2 className="section-title">Загрузить данные</h2>
            <p className="section-subtitle mb-4">
              Загрузите Excel-файл с данными об экспонатах. Файл должен содержать колонки:
              <code className="ml-1 text-gold">id</code>,
              <code className="ml-1 text-gold">name</code>,
              <code className="ml-1 text-gold">description</code>,
              <code className="ml-1 text-gold">image_url</code>,
              <code className="ml-1 text-gold">room</code>.
            </p>

            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={clsx(
                'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200',
                isDragActive
                  ? 'border-gold bg-gold/10'
                  : 'border-museum-700 hover:border-museum-500',
              )}
            >
              <input {...getInputProps()} />
              <FileSpreadsheet
                className={clsx(
                  'w-12 h-12 mx-auto mb-3 transition-colors',
                  isDragActive ? 'text-gold' : 'text-museum-600',
                )}
              />
              {isDragActive ? (
                <p className="text-gold font-medium">Отпустите файл здесь</p>
              ) : (
                <div>
                  <p className="text-museum-300 font-medium mb-1">
                    Перетащите .xlsx файл сюда
                  </p>
                  <p className="text-museum-600 text-sm">или нажмите для выбора</p>
                </div>
              )}
            </div>

            {/* Selected file */}
            <AnimatePresence>
              {file && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 flex items-center gap-3 bg-museum-900 border border-museum-700 rounded-xl px-4 py-3"
                >
                  <FileSpreadsheet className="w-5 h-5 text-gold shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-museum-100 text-sm font-medium truncate">{file.name}</p>
                    <p className="text-museum-500 text-xs">{formatBytes(file.size)}</p>
                  </div>
                  <button
                    onClick={() => { setFile(null); setResult(null) }}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-museum-500 hover:text-museum-200 hover:bg-museum-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Upload button */}
            <Button
              fullWidth
              className="mt-3"
              loading={loading}
              disabled={!file}
              onClick={handleUpload}
            >
              <Upload className="w-4 h-4" />
              Загрузить на сервер
            </Button>

            <Button
              fullWidth
              variant="secondary"
              className="mt-3 !border-[#2BCB4E]/70 !text-[#8BFFAE] hover:!border-[#2BCB4E] hover:!text-[#B7FFCB]"
              loading={layoutLoading}
              onClick={handleOpenLayoutEditor}
            >
              <Map className="w-4 h-4" />
              Настроить схему расположения залов
            </Button>

            <p className="text-xs text-museum-500 mt-2">
              Редактор откроет сетку корпусов, затем вложенные сетки залов по этажам внутри корпуса.
            </p>
          </div>

          {/* Result */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={clsx(
                  'rounded-2xl border p-4',
                  result.success
                    ? 'bg-green-950/40 border-green-700/50'
                    : 'bg-red-950/40 border-red-700/50',
                )}
              >
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={clsx('font-semibold text-sm', result.success ? 'text-green-300' : 'text-red-300')}>
                      {result.success ? 'Загрузка успешна!' : 'Ошибка загрузки'}
                    </p>
                    <p className={clsx('text-sm mt-0.5', result.success ? 'text-green-400/80' : 'text-red-400/80')}>
                      {result.message}
                    </p>
                    {result.rowsProcessed !== undefined && (
                      <p className="text-green-400/60 text-xs mt-1">
                        Обработано строк: {result.rowsProcessed}
                      </p>
                    )}
                    {result.errors && result.errors.length > 0 && (
                      <div className="mt-2 flex flex-col gap-1">
                        {result.errors.map((err, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                            <p className="text-red-400/70 text-xs">{err}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {layoutResult && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={clsx(
                  'rounded-2xl border p-4',
                  layoutResult.success
                    ? 'bg-green-950/40 border-green-700/50'
                    : 'bg-red-950/40 border-red-700/50',
                )}
              >
                <div className="flex items-start gap-3">
                  {layoutResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className={clsx('font-semibold text-sm', layoutResult.success ? 'text-green-300' : 'text-red-300')}>
                      {layoutResult.success ? 'Схема обновлена' : 'Ошибка схемы'}
                    </p>
                    <p className={clsx('text-sm mt-0.5', layoutResult.success ? 'text-green-400/80' : 'text-red-400/80')}>
                      {layoutResult.message}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Format hint */}
          <Card className="bg-museum-900/50">
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-gold mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-museum-200 text-sm mb-2">Формат Excel-файла</p>
                <div className="overflow-x-auto">
                  <table className="text-xs text-museum-400 border-collapse">
                    <thead>
                      <tr>
                        {['id', 'name', 'description', 'image_url', 'room'].map((col) => (
                          <th key={col} className="border border-museum-700 px-3 py-1.5 text-gold font-mono text-left">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {['1', 'Название экспоната', 'Описание…', 'https://…/img.jpg', '3'].map((v, i) => (
                          <td key={i} className="border border-museum-800 px-3 py-1.5 whitespace-nowrap text-museum-500">
                            {v}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Card>

        </div>
      </PageLayout>

      <AnimatePresence>
        {layoutOpen && (
          <LayoutSchemeEditorModal
            isOpen={layoutOpen}
            initialLayout={layoutScheme}
            saving={layoutSaving}
            onClose={() => setLayoutOpen(false)}
            onSave={handleSaveLayout}
          />
        )}
      </AnimatePresence>
    </>
  )
}
