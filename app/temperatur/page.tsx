"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import {
  DndContext,
  PointerSensor,
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
}

function SortableUnitCard({
  unit,
  children,
}: {
  unit: TemperatureUnit
  children: ReactNode
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
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-70" : ""}
    >
      <div {...attributes} {...listeners}>
        {children}
      </div>
    </div>
  )
}

export default function TemperaturPage() {
  const router = useRouter()
  const [units, setUnits] = useState<TemperatureUnit[]>([])
  const [feil, setFeil] = useState("")
  const [status, setStatus] = useState("")
  const [isLeader, setIsLeader] = useState(false)
  const [selectedVenue, setSelectedVenue] = useState("")
  const [flytterId, setFlytterId] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor))

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
        `${url}/rest/v1/temperature_units?select=id,name,active,sort_order,venue_id&venue_id=eq.${venue}&active=eq.true&order=sort_order.asc,name.asc`,
        {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        }
      )

      const data = await res.json()

      if (!res.ok) {
        setFeil(data.message || "Kunne ikke hente enheter")
        return
      }

      setUnits(data)
    } catch (err) {
      setFeil(`Fetch-feil: ${String(err)}`)
    }
  }

  function velgEnhet(unit: TemperatureUnit) {
    localStorage.setItem("selectedTemperatureUnitId", unit.id)
    localStorage.setItem("selectedTemperatureUnitName", unit.name)
    router.push(`/temperatur/${unit.id}`)
  }

  async function saveSortOrder(updatedUnits: TemperatureUnit[]) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    for (let i = 0; i < updatedUnits.length; i++) {
      const unit = updatedUnits[i]

      const res = await fetch(`${url}/rest/v1/temperature_units?id=eq.${unit.id}`, {
        method: "PATCH",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sort_order: i + 1,
        }),
      })

      if (!res.ok) {
        const data = await res.text()
        throw new Error(data || "Kunne ikke lagre rekkefølge")
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
      setStatus("Rekkefølgen er lagret")
    } catch (err) {
      setFeil(`Feil: ${String(err)}`)
      if (selectedVenue) {
        loadUnits(selectedVenue)
      }
    } finally {
      setFlytterId(null)
    }
  }

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <h1 className="mb-10 text-center text-3xl font-bold">Temperaturkontroll</h1>

      <div className="mx-auto flex max-w-md flex-col gap-4">
        {isLeader && (
          <p className="text-sm text-zinc-400">
            Admin: hold fingeren på et kort og dra for å endre rekkefølge.
          </p>
        )}

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
                  <SortableUnitCard key={unit.id} unit={unit}>
                    <div
                      className="rounded-2xl bg-white px-6 py-6 text-left text-xl font-semibold text-black shadow-lg"
                      style={{ touchAction: "none" }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span>{unit.name}</span>
                        <span className="text-sm font-normal text-zinc-500">
                          {flytterId === unit.id ? "Flytter..." : "Dra"}
                        </span>
                      </div>

                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            velgEnhet(unit)
                          }}
                          className="rounded-lg border border-zinc-300 bg-zinc-100 px-4 py-2 text-sm font-medium text-black"
                        >
                          Åpne
                        </button>
                      </div>
                    </div>
                  </SortableUnitCard>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {units.length === 0 && !feil && (
          <p className="text-center text-zinc-400">Ingen enheter funnet</p>
        )}

        <button
          onClick={() => router.push("/")}
          className="mt-6 w-full rounded-xl border border-zinc-600 py-3 text-zinc-300"
        >
          Tilbake
        </button>
      </div>
    </main>
  )
}