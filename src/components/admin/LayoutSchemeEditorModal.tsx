import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, DoorOpen, Plus, X, Layers3, ChevronRight } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import type {
  GridPosition,
  LayoutBuilding,
  LayoutFloor,
  LayoutHall,
  MuseumLayoutScheme,
} from '@/types'

interface LayoutSchemeEditorModalProps {
  isOpen: boolean
  initialLayout: MuseumLayoutScheme
  saving: boolean
  onClose: () => void
  onSave: (layout: MuseumLayoutScheme) => void | Promise<void>
}

type EditorMode = 'buildings' | 'halls'

const createId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

const cloneLayout = (layout: MuseumLayoutScheme): MuseumLayoutScheme =>
  JSON.parse(JSON.stringify(layout)) as MuseumLayoutScheme

const getBuildingAtNode = (layout: MuseumLayoutScheme, node: GridPosition): LayoutBuilding | null =>
  Object.values(layout.buildings).find(
    (building) => building.position.row === node.row && building.position.col === node.col,
  ) ?? null

const getHallAtNode = (floor: LayoutFloor, node: GridPosition): LayoutHall | null =>
  Object.values(floor.halls).find(
    (hall) => hall.position.row === node.row && hall.position.col === node.col,
  ) ?? null

const createDefaultFloor = (index: number): LayoutFloor => {
  const id = createId('floor')
  return {
    id,
    name: `Этаж ${index}`,
    grid: { rows: 5, cols: 5 },
    halls: {},
  }
}

export default function LayoutSchemeEditorModal({
  isOpen,
  initialLayout,
  saving,
  onClose,
  onSave,
}: LayoutSchemeEditorModalProps) {
  const [draft, setDraft] = useState<MuseumLayoutScheme>(cloneLayout(initialLayout))
  const [mode, setMode] = useState<EditorMode>('buildings')
  const [activeBuildingId, setActiveBuildingId] = useState<string | null>(null)
  const [activeFloorId, setActiveFloorId] = useState<string | null>(null)
  const [pendingNode, setPendingNode] = useState<GridPosition | null>(null)
  const [pendingName, setPendingName] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setDraft(cloneLayout(initialLayout))
    setMode('buildings')
    setActiveBuildingId(null)
    setActiveFloorId(null)
    setPendingNode(null)
    setPendingName('')
  }, [initialLayout, isOpen])

  useEffect(() => {
    if (!isOpen) return

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [isOpen, onClose])

  const activeBuilding = useMemo(
    () => (activeBuildingId ? draft.buildings[activeBuildingId] ?? null : null),
    [activeBuildingId, draft.buildings],
  )

  const activeFloor = useMemo(() => {
    if (!activeBuilding || !activeFloorId) return null
    return activeBuilding.floors[activeFloorId] ?? null
  }, [activeBuilding, activeFloorId])

  const openBuilding = (buildingId: string) => {
    const building = draft.buildings[buildingId]
    if (!building) return
    setMode('halls')
    setActiveBuildingId(buildingId)
    setActiveFloorId(building.floorOrder[0] ?? null)
    setPendingNode(null)
    setPendingName('')
  }

  const handleBuildingNodeClick = (node: GridPosition) => {
    const existing = getBuildingAtNode(draft, node)
    if (existing) {
      openBuilding(existing.id)
      return
    }

    setPendingNode(node)
    setPendingName('')
  }

  const handleHallNodeClick = (node: GridPosition) => {
    if (!activeFloor) return

    const existing = getHallAtNode(activeFloor, node)
    if (existing) {
      setPendingNode(null)
      setPendingName('')
      return
    }

    setPendingNode(node)
    setPendingName('')
  }

  const addBuilding = () => {
    if (!pendingNode || !pendingName.trim()) return

    const firstFloor = createDefaultFloor(1)
    const id = createId('building')

    setDraft((prev) => ({
      ...prev,
      buildings: {
        ...prev.buildings,
        [id]: {
          id,
          name: pendingName.trim(),
          position: pendingNode,
          floorOrder: [firstFloor.id],
          floors: {
            [firstFloor.id]: firstFloor,
          },
        },
      },
    }))

    setPendingNode(null)
    setPendingName('')
  }

  const addHall = () => {
    if (!activeBuilding || !activeFloor || !pendingNode || !pendingName.trim()) return
    if (getHallAtNode(activeFloor, pendingNode)) return

    const hallId = createId('hall')

    setDraft((prev) => {
      const building = prev.buildings[activeBuilding.id]
      if (!building) return prev
      const floor = building.floors[activeFloor.id]
      if (!floor) return prev

      return {
        ...prev,
        buildings: {
          ...prev.buildings,
          [building.id]: {
            ...building,
            floors: {
              ...building.floors,
              [floor.id]: {
                ...floor,
                halls: {
                  ...floor.halls,
                  [hallId]: {
                    id: hallId,
                    name: pendingName.trim(),
                    position: pendingNode,
                  },
                },
              },
            },
          },
        },
      }
    })

    setPendingNode(null)
    setPendingName('')
  }

  const addFloor = () => {
    if (!activeBuilding) return

    const floor = createDefaultFloor(activeBuilding.floorOrder.length + 1)

    setDraft((prev) => {
      const building = prev.buildings[activeBuilding.id]
      if (!building) return prev

      return {
        ...prev,
        buildings: {
          ...prev.buildings,
          [building.id]: {
            ...building,
            floorOrder: [...building.floorOrder, floor.id],
            floors: {
              ...building.floors,
              [floor.id]: floor,
            },
          },
        },
      }
    })

    setActiveFloorId(floor.id)
  }

  const switchFloor = (floorId: string) => {
    setActiveFloorId(floorId)
    setPendingNode(null)
    setPendingName('')
  }

  const backToBuildings = () => {
    setMode('buildings')
    setActiveBuildingId(null)
    setActiveFloorId(null)
    setPendingNode(null)
    setPendingName('')
  }

  const buildingCount = Object.keys(draft.buildings).length
  const hallCount = Object.values(draft.buildings).reduce((acc, building) => {
    return (
      acc +
      building.floorOrder.reduce((floorAcc, floorId) => {
        const floor = building.floors[floorId]
        return floor ? floorAcc + Object.keys(floor.halls).length : floorAcc
      }, 0)
    )
  }, 0)

  if (!isOpen) return null

  const canAddBuilding = mode === 'buildings' && pendingNode !== null && pendingName.trim().length > 0
  const canAddHall = mode === 'halls' && pendingNode !== null && pendingName.trim().length > 0 && !!activeFloor

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12 }}
        className="relative w-full max-w-6xl h-[88vh] rounded-3xl border border-museum-700 bg-museum-950 shadow-2xl shadow-black/60 overflow-hidden flex flex-col"
      >
        <div className="px-6 py-4 border-b border-museum-800 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-museum-500">Админка / схема залов</p>
            <h3 className="text-xl font-serif font-bold text-museum-50">Настроить схему расположения залов</h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-museum-700 text-museum-400 hover:text-museum-100 hover:border-museum-500 transition-colors flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-museum-800 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-museum-300">
            <button onClick={backToBuildings} className="hover:text-gold transition-colors">Корпуса</button>
            {activeBuilding && (
              <>
                <ChevronRight className="w-4 h-4 text-museum-600" />
                <span className="text-gold">{activeBuilding.name}</span>
                {activeFloor && (
                  <>
                    <ChevronRight className="w-4 h-4 text-museum-600" />
                    <span className="text-museum-200">{activeFloor.name}</span>
                  </>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-museum-400">
            <span className="inline-flex items-center gap-1"><Building2 className="w-3.5 h-3.5 text-gold" /> {buildingCount} корпусов</span>
            <span className="inline-flex items-center gap-1"><DoorOpen className="w-3.5 h-3.5 text-gold" /> {hallCount} залов</span>
          </div>
        </div>

        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-[1fr_320px]">
          <div className="p-5 overflow-auto">
            {mode === 'buildings' && (
              <GridView
                rows={draft.buildingGrid.rows}
                cols={draft.buildingGrid.cols}
                getNode={(node) => getBuildingAtNode(draft, node)}
                onNodeClick={handleBuildingNodeClick}
                pendingNode={pendingNode}
              />
            )}

            {mode === 'halls' && activeBuilding && (
              <>
                <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    {activeBuilding.floorOrder.map((floorId) => {
                      const floor = activeBuilding.floors[floorId]
                      if (!floor) return null
                      return (
                        <button
                          key={floorId}
                          onClick={() => switchFloor(floorId)}
                          className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                            activeFloorId === floorId
                              ? 'border-gold text-gold bg-gold/10'
                              : 'border-museum-700 text-museum-300 hover:border-museum-500'
                          }`}
                        >
                          {floor.name}
                        </button>
                      )
                    })}
                  </div>

                  <Button size="sm" variant="secondary" onClick={addFloor}>
                    <Layers3 className="w-4 h-4" />
                    Добавить этаж
                  </Button>
                </div>

                {activeFloor ? (
                  <GridView
                    rows={activeFloor.grid.rows}
                    cols={activeFloor.grid.cols}
                    getNode={(node) => getHallAtNode(activeFloor, node)}
                    onNodeClick={handleHallNodeClick}
                    pendingNode={pendingNode}
                  />
                ) : (
                  <Card className="text-museum-400 text-sm">В корпусе пока нет этажей</Card>
                )}
              </>
            )}
          </div>

          <div className="border-l border-museum-800 p-5 overflow-auto bg-museum-950/70">
            <Card className="p-4 bg-museum-900/60">
              <p className="text-sm font-semibold text-museum-100 mb-1">Работа с узлом</p>
              <p className="text-xs text-museum-500 mb-3">
                Нажми на пустой узел в сетке, затем добавь название и сохрани сущность.
              </p>

              {pendingNode ? (
                <div className="space-y-3">
                  <p className="text-xs text-museum-400">
                    Узел: <span className="text-gold">{pendingNode.row + 1}:{pendingNode.col + 1}</span>
                  </p>
                  <input
                    className="input"
                    value={pendingName}
                    onChange={(e) => setPendingName(e.target.value)}
                    placeholder={mode === 'buildings' ? 'Название корпуса' : 'Название зала'}
                  />

                  {mode === 'buildings' ? (
                    <Button fullWidth onClick={addBuilding} disabled={!canAddBuilding}>
                      <Plus className="w-4 h-4" />
                      Добавить корпус
                    </Button>
                  ) : (
                    <Button fullWidth onClick={addHall} disabled={!canAddHall}>
                      <Plus className="w-4 h-4" />
                      Добавить зал
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-museum-500">Выбери узел в сетке для добавления.</p>
              )}
            </Card>

            <AnimatePresence>
              {activeBuilding && mode === 'halls' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="mt-3"
                >
                  <Card className="p-4 bg-museum-900/60">
                    <p className="text-sm font-semibold text-museum-100 mb-1">Текущий корпус</p>
                    <p className="text-sm text-gold">{activeBuilding.name}</p>
                    <p className="text-xs text-museum-500 mt-1">Этажей: {activeBuilding.floorOrder.length}</p>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-museum-800 flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button onClick={() => onSave(draft)} loading={saving}>
            Сохранить схему
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

interface GridViewProps<TNode> {
  rows: number
  cols: number
  getNode: (node: GridPosition) => TNode | null
  onNodeClick: (node: GridPosition) => void
  pendingNode: GridPosition | null
}

function GridView<TNode extends { name: string }>({
  rows,
  cols,
  getNode,
  onNodeClick,
  pendingNode,
}: GridViewProps<TNode>) {
  const nodes = [] as JSX.Element[]

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const position = { row, col }
      const entity = getNode(position)
      const isPending = pendingNode?.row === row && pendingNode.col === col

      nodes.push(
        <button
          key={`${row}-${col}`}
          onClick={() => onNodeClick(position)}
          className={`min-h-16 rounded-xl border p-2 text-left transition-all ${
            entity
              ? 'border-gold/60 bg-gold/10 hover:bg-gold/15'
              : 'border-museum-700 bg-museum-900/60 hover:border-museum-500'
          } ${isPending ? 'ring-2 ring-gold/40' : ''}`}
        >
          <span className="text-[11px] text-museum-500">{row + 1}:{col + 1}</span>
          <p className={`text-sm mt-1 truncate ${entity ? 'text-gold' : 'text-museum-500'}`}>
            {entity ? entity.name : 'Пусто'}
          </p>
        </button>,
      )
    }
  }

  return (
    <div
      className="grid gap-2"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      }}
    >
      {nodes}
    </div>
  )
}
