"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/language"
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

type TemperatureUnit = {
  id: string
  name: string
  active: boolean
  sort_order?: number | null
  venue_id?: string | null
  image_url?: string | null
}

type UiLanguage = "no" | "en" | "es" | "ru"

const temperaturePageTexts: Record<
  UiLanguage,
  {
    moving: string
    drag: string
    couldNotFetchUnits: string
    fetchError: string
    couldNotSaveOrder: string
    orderSaved: string
    error: string
    title: string
    adminHelp: string
    noUnitsFound: string
    back: string
  }
> = {
  no: {
    moving: "Flytter...",
    drag: "Dra",
    couldNotFetchUnits: "Kunne ikke hente enheter",
    fetchError: "Fetch-feil",
    couldNotSaveOrder: "Kunne ikke lagre rekkefølge",
    orderSaved: "Rekkefølgen er lagret",
    error: "Feil",
    title: "Temperaturkontroll",
    adminHelp: 'Admin: bruk "Dra"-knappen oppe til høyre for å endre rekkefølge.',
    noUnitsFound: "Ingen enheter funnet",
    back: "Tilbake",
  },
  en: {
    moving: "Moving...",
    drag: "Drag",
    couldNotFetchUnits: "Could not fetch units",
    fetchError: "Fetch error",
    couldNotSaveOrder: "Could not save order",
    orderSaved: "Order saved",
    error: "Error",
    title: "Temperature control",
    adminHelp: 'Admin: use the "Drag" button in the top right to change the order.',
    noUnitsFound: "No units found",
    back: "Back",
  },
  es: {
    moving: "Moviendo...",
    drag: "Arrastrar",
    couldNotFetchUnits: "No se pudieron obtener las unidades",
    fetchError: "Error de carga",
    couldNotSaveOrder: "No se pudo guardar el orden",
    orderSaved: "Orden guardado",
    error: "Error",
    title: "Control de temperatura",
    adminHelp:
      'Admin: usa el botón "Arrastrar" arriba a la derecha para cambiar el orden.',
    noUnitsFound: "No se encontraron unidades",
    back: "Volver",
  },
  ru: {
    moving: "Перемещение...",
    drag: "Перетащить",
    couldNotFetchUnits: "Не удалось получить единицы",
    fetchError: "Ошибка загрузки",
    couldNotSaveOrder: "Не удалось сохранить порядок",
    orderSaved: "Порядок сохранён",
    error: "Ошибка",
    title: "Контроль температуры",
    adminHelp: 'Админ: используйте кнопку "Перетащить" справа вверху для изменения порядка.',
    noUnitsFound: "Единицы не найдены",
    back: "Назад",
  },
}

function SortableUnitCard({
  unit,
  flytterId,
  onOpen,
  text,
}: {
  unit: TemperatureUnit
  flytterId: string | null
  onOpen: (unit: TemperatureUnit) => void
  text: {
    moving: string
    drag: string
  }
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: unit.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onOpen(unit)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onOpen(unit)
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="rounded-2xl bg-white px-6 py-6 text-left text-xl font-semibold text-black shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <span>{unit.name}</span>

          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            {...attributes}
            {...listeners}
            className="rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-600"
            style={{
              cursor: "grab",
              touchAction: "none",
              flexShrink: 0,
            }}
          >
            {flytterId === unit.id ? text.moving : text.drag}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TemperaturPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const currentLanguage: UiLanguage =
    language === "en" || language === "es" || language === "ru" ? language : "no"
  const text = temperaturePageTexts[currentLanguage]

  const [units, setUnits] = useState<TemperatureUnit[]>([])
  const [feil, setFeil] = useState("")
  const [status, setStatus] = useState("")
  const [isLeader, setIsLeader] = useState(false)
  const [selectedVenue, setSelectedVenue] = useState("")
  const [flytterId, setFlytterId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    })
  )

  useEffect(() => {
    const venue = localStorage.getItem("selectedVenue")
    const employeeId = localStorage.getItem("selectedEmployeeId")
    const employeeRole = localStorage.getItem("selectedEmployeeRole")

    if (!venue) {
      router.replace("/velg-sted")
      return
    }

    if (!employeeId) {
      router.replace("/ansatt")
      return
    }

    setSelectedVenue(venue)
    setIsLeader(employeeRole === "leader")
    loadUnits(venue)
  }, [router])

  async function loadUnits(venue: string) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      setFeil("")

      const res = await fetch(
        `${url}/rest/v1/temperature_units?select=id,name,active,sort_order,venue_id,image_url&venue_id=eq.${venue}&active=eq.true&order=sort_order.asc,name.asc`,
        {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        }
      )

      const data = await res.json()

      if (!res.ok) {
        setFeil(data.message || text.couldNotFetchUnits)
        return
      }

      setUnits(data)
    } catch (err) {
      setFeil(`${text.fetchError}: ${String(err)}`)
    }
  }

  function velgEnhet(unit: TemperatureUnit) {
    localStorage.setItem("selectedTemperatureUnitId", unit.id)
    localStorage.setItem("selectedTemperatureUnitName", unit.name)

    if (unit.image_url) {
      localStorage.setItem("selectedTemperatureUnitImageUrl", unit.image_url)
    } else {
      localStorage.removeItem("selectedTemperatureUnitImageUrl")
    }

    router.push(`/temperatur/${unit.id}`)
  }

  async function saveSortOrder(updatedUnits: TemperatureUnit[]) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    for (let i = 0; i < updatedUnits.length; i++) {
      const unit = updatedUnits[i]

      const res = await fetch(
        `${url}/rest/v1/temperature_units?id=eq.${unit.id}`,
        {
          method: "PATCH",
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sort_order: i + 1,
          }),
        }
      )

      if (!res.ok) {
        const data = await res.text()
        throw new Error(data || text.couldNotSaveOrder)
      }
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = units.findIndex((unit) => unit.id === active.id)
    const newIndex = units.findIndex((unit) => unit.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const movedUnits = arrayMove(units, oldIndex, newIndex).map((unit, index) => ({
      ...unit,
      sort_order: index + 1,
    }))

    setUnits(movedUnits)

    try {
      setFeil("")
      setStatus("")
      setFlytterId(String(active.id))

      await saveSortOrder(movedUnits)
      setStatus(text.orderSaved)
    } catch (err) {
      setFeil(`${text.error}: ${String(err)}`)
      if (selectedVenue) {
        loadUnits(selectedVenue)
      }
    } finally {
      setFlytterId(null)
    }
  }

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <h1 className="mb-10 text-center text-3xl font-bold">{text.title}</h1>

      <div className="mx-auto flex max-w-md flex-col gap-4">
        {isLeader && <p className="text-sm text-zinc-400">{text.adminHelp}</p>}

        {status && <p className="text-green-400">{status}</p>}
        {feil && <p className="text-red-400">{feil}</p>}

        {!isLeader &&
          units.map((unit) => (
            <button
              key={unit.id}
              onClick={() => velgEnhet(unit)}
              className="rounded-2xl bg-white px-6 py-6 text-left text-xl font-semibold text-black shadow-lg transition active:scale-95"
            >
              {unit.name}
            </button>
          ))}

        {isLeader && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={units.map((unit) => unit.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-4">
                {units.map((unit) => (
                  <SortableUnitCard
                    key={unit.id}
                    unit={unit}
                    flytterId={flytterId}
                    onOpen={velgEnhet}
                    text={text}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {units.length === 0 && !feil && (
          <p className="text-center text-zinc-400">{text.noUnitsFound}</p>
        )}

        <button
          onClick={() => router.push("/")}
          className="mt-6 w-full rounded-xl border border-zinc-600 py-3 text-zinc-300"
        >
          {text.back}
        </button>
      </div>
    </main>
  )
}