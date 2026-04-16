import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, DoorOpen, Plus, X, Layers3, ChevronRight, Link2, Unlink } from 'lucide-react'
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
    hallLinks: [],
  }
}

const sortHallPair = (a: string, b: string) => (a < b ? [a, b] : [b, a])

const hasHallLink = (floor: LayoutFloor, hallAId: string, hallBId: string) => {
  const [fromId, toId] = sortHallPair(hallAId, hallBId)
  return floor.hallLinks.some((link) => link.fromHallId === fromId && link.toHallId === toId)
}

const getHallLinksCount = (floor: LayoutFloor, hallId: string) =>
  floor.hallLinks.reduce((acc, link) => {
    if (link.fromHallId === hallId || link.toHallId === hallId) return acc + 1
    return acc
  }, 0)

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
  const [linkMode, setLinkMode] = useState(false)
  const [linkSourceHallId, setLinkSourceHallId] = useState<string | null>(null)
  const [selectedHallId, setSelectedHallId] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setDraft(cloneLayout(initialLayout))
    setMode('buildings')
    setActiveBuildingId(null)
    setActiveFloorId(null)
    setPendingNode(null)
    setPendingName('')
    setLinkMode(false)
    setLinkSourceHallId(null)
    setSelectedHallId(null)
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

    if (linkMode) {
      if (!existing) return

      if (!linkSourceHallId) {
        setLinkSourceHallId(existing.id)
        setSelectedHallId(existing.id)
        setPendingNode(null)
        setPendingName('')
        return
      }

      if (linkSourceHallId === existing.id) {
        setLinkSourceHallId(null)
        setSelectedHallId(existing.id)
        return
      }

      const firstId = linkSourceHallId
      const secondId = existing.id

      setDraft((prev) => {
        const building = activeBuilding ? prev.buildings[activeBuilding.id] : null
        if (!building || !activeFloor) return prev
        const floor = building.floors[activeFloor.id]
        if (!floor) return prev

        if (hasHallLink(floor, firstId, secondId)) {
          return prev
        }

        const [fromHallId, toHallId] = sortHallPair(firstId, secondId)

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
                  hallLinks: [...floor.hallLinks, { fromHallId, toHallId }],
                },
              },
            },
          },
        }
      })

      setLinkSourceHallId(null)
      setSelectedHallId(existing.id)
      return
    }

    if (existing) {
      setSelectedHallId(existing.id)
      setPendingNode(null)
      setPendingName('')
      return
    }

    setSelectedHallId(null)
    setPendingNode(node)
    setPendingName('')
  }

  const removeHall = () => {
    if (!activeBuilding || !activeFloor || !selectedHallId) return

    const hallToDeleteId = selectedHallId

    setDraft((prev) => {
      const building = prev.buildings[activeBuilding.id]
      if (!building) return prev
      const floor = building.floors[activeFloor.id]
      if (!floor || !floor.halls[hallToDeleteId]) return prev

      const nextHalls = { ...floor.halls }
      delete nextHalls[hallToDeleteId]

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
                halls: nextHalls,
                hallLinks: floor.hallLinks.filter(
                  (link) => link.fromHallId !== hallToDeleteId && link.toHallId !== hallToDeleteId,
                ),
              },
            },
          },
        },
      }
    })

    setSelectedHallId(null)
    if (linkSourceHallId === hallToDeleteId) {
      setLinkSourceHallId(null)
    }
  }

  const renameActiveBuilding = (name: string) => {
    if (!activeBuilding) return

    setDraft((prev) => {
      const building = prev.buildings[activeBuilding.id]
      if (!building) return prev

      return {
        ...prev,
        buildings: {
          ...prev.buildings,
          [building.id]: {
            ...building,
            name,
          },
        },
      }
    })
  }

  const removeActiveBuilding = () => {
    if (!activeBuilding) return

    const buildingId = activeBuilding.id

    setDraft((prev) => {
      if (!prev.buildings[buildingId]) return prev

      const nextBuildings = { ...prev.buildings }
      delete nextBuildings[buildingId]

      return {
        ...prev,
        buildings: nextBuildings,
      }
    })

    backToBuildings()
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

  const renameActiveFloor = (name: string) => {
    if (!activeBuilding || !activeFloor) return

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
                name,
              },
            },
          },
        },
      }
    })
  }

  const removeHallLink = (fromHallId: string, toHallId: string) => {
    if (!activeBuilding || !activeFloor) return
    const [fromId, toId] = sortHallPair(fromHallId, toHallId)

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
                hallLinks: floor.hallLinks.filter(
                  (link) => !(link.fromHallId === fromId && link.toHallId === toId),
                ),
              },
            },
          },
        },
      }
    })
  }

  const switchFloor = (floorId: string) => {
    setActiveFloorId(floorId)
    setPendingNode(null)
    setPendingName('')
    setLinkSourceHallId(null)
    setSelectedHallId(null)
  }

  const backToBuildings = () => {
    setMode('buildings')
    setActiveBuildingId(null)
    setActiveFloorId(null)
    setPendingNode(null)
    setPendingName('')
    setLinkMode(false)
    setLinkSourceHallId(null)
    setSelectedHallId(null)
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
        className="relative w-full max-w-6xl h-[88vh] rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-[#04160e] via-[#0a2a1d] to-[#051d14] shadow-2xl shadow-black/60 overflow-hidden flex flex-col"
      >
        <div className="px-6 py-4 border-b border-emerald-500/20 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-emerald-300/50">Админка / схема залов</p>
            <h3 className="text-xl font-serif font-bold text-emerald-50">Настроить схему расположения залов</h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-emerald-500/30 text-emerald-200/70 hover:text-emerald-50 hover:border-emerald-400/70 transition-colors flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-emerald-500/20 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-emerald-100/80">
            <button onClick={backToBuildings} className="hover:text-emerald-300 transition-colors">Корпуса</button>
            {activeBuilding && (
              <>
                <ChevronRight className="w-4 h-4 text-emerald-200/40" />
                <span className="text-emerald-300">{activeBuilding.name}</span>
                {activeFloor && (
                  <>
                    <ChevronRight className="w-4 h-4 text-emerald-200/40" />
                    <span className="text-emerald-100">{activeFloor.name}</span>
                  </>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-emerald-100/70">
            <span className="inline-flex items-center gap-1"><Building2 className="w-3.5 h-3.5 text-[#21A038]" /> {buildingCount} корпусов</span>
            <span className="inline-flex items-center gap-1"><DoorOpen className="w-3.5 h-3.5 text-[#21A038]" /> {hallCount} залов</span>
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
                              ? 'border-[#2BCB4E] text-[#7DFFA1] bg-[#21A038]/20'
                              : 'border-emerald-500/30 text-emerald-100/80 hover:border-[#2BCB4E]/70'
                          }`}
                        >
                          {floor.name}
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={linkMode ? 'primary' : 'secondary'}
                      className={linkMode
                        ? '!bg-[#21A038] hover:!bg-[#1B8E32] !text-white'
                        : '!border-[#2BCB4E]/60 !text-[#8BFFAE] hover:!border-[#2BCB4E]'}
                      onClick={() => {
                        setLinkMode((prev) => !prev)
                        setLinkSourceHallId(null)
                        setPendingNode(null)
                        setPendingName('')
                        setSelectedHallId(null)
                      }}
                    >
                      <Link2 className="w-4 h-4" />
                      {linkMode ? 'Режим связей: вкл' : 'Связать залы'}
                    </Button>

                    <Button
                      size="sm"
                      variant="secondary"
                      className="!border-[#2BCB4E]/60 !text-[#8BFFAE] hover:!border-[#2BCB4E]"
                      onClick={addFloor}
                    >
                      <Layers3 className="w-4 h-4" />
                      Добавить этаж/крыло
                    </Button>
                  </div>
                </div>

                {activeFloor && (
                  <div className="mb-3">
                    <label className="text-xs text-emerald-100/60 block mb-1">Название этажа</label>
                    <input
                      className="input !bg-[#082317] !border-emerald-500/30 !text-emerald-50 !placeholder-emerald-200/35"
                      value={activeFloor.name}
                      onChange={(e) => renameActiveFloor(e.target.value)}
                      placeholder="Введите название этажа"
                    />
                  </div>
                )}

                {activeFloor ? (
                  <GridView
                    rows={activeFloor.grid.rows}
                    cols={activeFloor.grid.cols}
                    getNode={(node) => getHallAtNode(activeFloor, node)}
                    onNodeClick={handleHallNodeClick}
                    pendingNode={pendingNode}
                    selectedEntityId={linkSourceHallId}
                    getEntityMetaText={(entity) => `Связей: ${getHallLinksCount(activeFloor, entity.id)}`}
                    edges={activeFloor.hallLinks.map((link) => ({ fromId: link.fromHallId, toId: link.toHallId }))}
                  />
                ) : (
                  <Card className="text-emerald-100/70 text-sm !bg-[#082317]/70 !border-emerald-500/30">В корпусе пока нет этажей</Card>
                )}
              </>
            )}
          </div>

          <div className="border-l border-emerald-500/20 p-5 overflow-auto bg-[#061a12]/50">
            <Card className="p-4 !bg-[#082317]/70 !border-emerald-500/30">
              <p className="text-sm font-semibold text-emerald-50 mb-1">Работа с узлом</p>
              <p className="text-xs text-emerald-100/60 mb-3">
                {linkMode
                  ? 'Режим связей: нажмите на первый зал, затем на второй, чтобы создать ребро.'
                  : 'Нажмите на пустой узел в сетке, затем добавьте название и сохраните сущность.'}
              </p>

              {linkMode ? (
                <div className="space-y-2 text-sm text-emerald-100/80">
                  <p>
                    Стартовый зал:{' '}
                    <span className="text-green-300">
                      {linkSourceHallId && activeFloor?.halls[linkSourceHallId]
                        ? activeFloor.halls[linkSourceHallId].name
                        : 'не выбран'}
                    </span>
                  </p>
                  <p className="text-xs text-emerald-100/60">
                    Повторный клик по выбранному залу сбрасывает выбор.
                  </p>
                </div>
              ) : pendingNode ? (
                <div className="space-y-3">
                  <p className="text-xs text-emerald-100/80">
                    Узел: <span className="text-[#7DFFA1]">{pendingNode.row + 1}:{pendingNode.col + 1}</span>
                  </p>
                  <input
                    className="input !bg-[#082317] !border-emerald-500/30 !text-emerald-50 !placeholder-emerald-200/35"
                    value={pendingName}
                    onChange={(e) => setPendingName(e.target.value)}
                    placeholder={mode === 'buildings' ? 'Название корпуса' : 'Название зала'}
                  />

                  {mode === 'buildings' ? (
                    <Button
                      fullWidth
                      className="!bg-[#21A038] hover:!bg-[#1B8E32] !text-white"
                      onClick={addBuilding}
                      disabled={!canAddBuilding}
                    >
                      <Plus className="w-4 h-4" />
                      Добавить корпус
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      className="!bg-[#21A038] hover:!bg-[#1B8E32] !text-white"
                      onClick={addHall}
                      disabled={!canAddHall}
                    >
                      <Plus className="w-4 h-4" />
                      Добавить зал
                    </Button>
                  )}
                </div>
              ) : selectedHallId && activeFloor?.halls[selectedHallId] ? (
                <div className="space-y-3">
                  <p className="text-sm text-emerald-100/85">
                    Выбран зал: <span className="text-[#7DFFA1]">{activeFloor.halls[selectedHallId].name}</span>
                  </p>
                  <p className="text-xs text-emerald-100/60">
                    Связей у зала: {getHallLinksCount(activeFloor, selectedHallId)}
                  </p>
                  <Button fullWidth variant="danger" onClick={removeHall}>
                    Удалить зал
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-emerald-100/60">Выберите узел в сетке для добавления.</p>
              )}
            </Card>

            {activeFloor && activeFloor.hallLinks.length > 0 && (
              <Card className="p-4 !bg-[#082317]/70 !border-emerald-500/30 mt-3">
                <p className="text-sm font-semibold text-emerald-50 mb-2">Связанные залы</p>
                <div className="space-y-2 max-h-44 overflow-auto pr-1">
                  {activeFloor.hallLinks.map((link) => {
                    const fromHall = activeFloor.halls[link.fromHallId]
                    const toHall = activeFloor.halls[link.toHallId]
                    if (!fromHall || !toHall) return null

                    return (
                      <div key={`${link.fromHallId}-${link.toHallId}`} className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-green-300 truncate">
                          {fromHall.name} ↔ {toHall.name}
                        </span>
                        <button
                          onClick={() => removeHallLink(link.fromHallId, link.toHallId)}
                          className="w-7 h-7 rounded-full border border-emerald-500/30 text-emerald-100/60 hover:text-red-300 hover:border-red-500/60 transition-colors flex items-center justify-center"
                          title="Удалить связь"
                        >
                          <Unlink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}

            <AnimatePresence>
              {activeBuilding && mode === 'halls' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="mt-3"
                >
                  <Card className="p-4 !bg-[#082317]/70 !border-emerald-500/30">
                    <p className="text-sm font-semibold text-emerald-50 mb-1">Текущий корпус</p>
                    <input
                      className="input !bg-[#082317] !border-emerald-500/30 !text-emerald-50 !placeholder-emerald-200/35"
                      value={activeBuilding.name}
                      onChange={(e) => renameActiveBuilding(e.target.value)}
                      placeholder="Введите название корпуса"
                    />
                    <p className="text-xs text-emerald-100/60 mt-2">Этажей: {activeBuilding.floorOrder.length}</p>
                    <Button className="w-full mt-3" variant="danger" onClick={removeActiveBuilding}>
                      Удалить корпус
                    </Button>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-emerald-500/20 flex items-center justify-end gap-2">
          <Button variant="ghost" className="!text-emerald-100/75 hover:!text-emerald-50 hover:!bg-emerald-500/10" onClick={onClose}>Отмена</Button>
          <Button className="!bg-[#21A038] hover:!bg-[#1B8E32] !text-white" onClick={() => onSave(draft)} loading={saving}>
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
  selectedEntityId?: string | null
  getEntityMetaText?: (node: TNode) => string
  edges?: Array<{ fromId: string; toId: string }>
}

function GridView<TNode extends { id: string; name: string }>({
  rows,
  cols,
  getNode,
  onNodeClick,
  pendingNode,
  selectedEntityId,
  getEntityMetaText,
  edges = [],
}: GridViewProps<TNode>) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const entityRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [segments, setSegments] = useState<
    Array<{ key: string; x1: number; y1: number; x2: number; y2: number }>
  >([])
  const segmentsSignatureRef = useRef('')
  const nodes = [] as JSX.Element[]

  useLayoutEffect(() => {
    const updateSegments = () => {
      const container = containerRef.current
      if (!container) {
        setSegments([])
        return
      }

      const containerRect = container.getBoundingClientRect()

      const nextSegments = edges
        .map((edge) => {
          const fromNode = entityRefs.current[edge.fromId]
          const toNode = entityRefs.current[edge.toId]
          if (!fromNode || !toNode) return null

          const fromRect = fromNode.getBoundingClientRect()
          const toRect = toNode.getBoundingClientRect()

          const fromCenterX = fromRect.left - containerRect.left + fromRect.width / 2
          const fromCenterY = fromRect.top - containerRect.top + fromRect.height / 2
          const toCenterX = toRect.left - containerRect.left + toRect.width / 2
          const toCenterY = toRect.top - containerRect.top + toRect.height / 2

          return {
            key: `${edge.fromId}-${edge.toId}`,
            x1: fromCenterX,
            y1: fromCenterY,
            x2: toCenterX,
            y2: toCenterY,
          }
        })
        .filter(
          (segment): segment is {
            key: string
            x1: number
            y1: number
            x2: number
            y2: number
          } => segment !== null,
        )

      const nextSignature = nextSegments
        .map((segment) => {
          const x1 = Math.round(segment.x1 * 10) / 10
          const y1 = Math.round(segment.y1 * 10) / 10
          const x2 = Math.round(segment.x2 * 10) / 10
          const y2 = Math.round(segment.y2 * 10) / 10
          return `${segment.key}:${x1}:${y1}:${x2}:${y2}`
        })
        .join('|')

      if (nextSignature === segmentsSignatureRef.current) return

      segmentsSignatureRef.current = nextSignature
      setSegments(nextSegments)
    }

    updateSegments()
    window.addEventListener('resize', updateSegments)
    return () => window.removeEventListener('resize', updateSegments)
  }, [edges, rows, cols])

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const position = { row, col }
      const entity = getNode(position)
      const isPending = pendingNode?.row === row && pendingNode.col === col
      const isSelected = !!entity && selectedEntityId === entity.id

      nodes.push(
        <button
          key={`${row}-${col}`}
          ref={(element) => {
            if (!entity) return
            entityRefs.current[entity.id] = element
          }}
          onClick={() => onNodeClick(position)}
          className={`min-h-16 rounded-xl border p-2 text-left transition-all ${
            entity
              ? 'border-[#2BCB4E]/70 bg-[#0D3A27]/70 hover:bg-[#114830]/80'
              : 'border-emerald-300/20 bg-[#082317]/75 hover:border-emerald-300/45'
          } ${isPending ? 'ring-2 ring-[#7DFFA1]/50' : ''} ${isSelected ? 'ring-2 ring-[#7DFFA1]/80' : ''}`}
        >
          <span className="text-[11px] text-emerald-100/55">{row + 1}:{col + 1}</span>
          <p className={`text-sm mt-3 truncate ${entity ? 'text-[#92FFB4]' : 'text-emerald-100/45'}`}>
            {entity ? entity.name : 'Пусто'}
          </p>
          {entity && getEntityMetaText && (
            <p className="text-[11px] mt-1 text-emerald-100/80 truncate">{getEntityMetaText(entity)}</p>
          )}
        </button>,
      )
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {segments.length > 0 && (
        <>
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" aria-hidden>
            {segments.map((segment) => (
              <line
                key={`outer-${segment.key}`}
                x1={segment.x1}
                y1={segment.y1}
                x2={segment.x2}
                y2={segment.y2}
                stroke="#165C28"
                strokeOpacity={0.34}
                strokeWidth={8}
                strokeLinecap="round"
              />
            ))}
          </svg>

          <svg className="absolute inset-0 w-full h-full pointer-events-none z-30" aria-hidden>
            {segments.map((segment) => (
              <motion.line
                key={`mid-${segment.key}`}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.72 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                x1={segment.x1}
                y1={segment.y1}
                x2={segment.x2}
                y2={segment.y2}
                stroke="#7DFFA1"
                strokeWidth={2.8}
                strokeLinecap="round"
              />
            ))}
          </svg>

          <svg className="absolute inset-0 w-full h-full pointer-events-none z-40" aria-hidden>
            {segments.map((segment) => (
              <line
                key={`dash-${segment.key}`}
                x1={segment.x1}
                y1={segment.y1}
                x2={segment.x2}
                y2={segment.y2}
                stroke="#C7FFD7"
                strokeOpacity={0.78}
                strokeWidth={1.2}
                strokeDasharray="5 5"
                strokeLinecap="round"
              />
            ))}
          </svg>
        </>
      )}

      <div
        className="relative z-10 grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        }}
      >
        {nodes}
      </div>
    </div>
  )
}
