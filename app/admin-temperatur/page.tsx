"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
  sort_order: number
  image_url: string | null
  venue_id?: string | null
}

function SortableUnitCard({
  unit,
  onDelete,
  flytterId,
}: {
  unit: TemperatureUnit
  onDelete: (unit: TemperatureUnit) => void
  flytterId: string | null
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
    opacity: isDragging ? 0.6 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div className="rounded-xl bg-white p-4 text-black">
        <div className="flex w-full items-start justify-between gap-4">
          <div className="flex-1">
            <span className="font-medium">{unit.name}</span>

            {unit.image_url && (
              <img
                src={unit.image_url}
                alt={unit.name}
                className="mt-3 max-h-40 w-full rounded-xl object-cover"
              />
            )}
          </div>

          <div className="flex flex-col gap-2">
            {/* Dra */}
            <button
              {...attributes}
              {...listeners}
              onPointerDown={(e) => e.stopPropagation()}
              className="rounded-lg bg-zinc-200 px-3 py-2 text-sm font-semibold text-black"
              style={{ cursor: "grab" }}
            >
              {flytterId === unit.id ? "Flytter..." : "Dra"}
            </button>

            {/* Slett */}
            <button
              onClick={() => onDelete(unit)}
              className="rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white"
            >
              Slett
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminTemperaturPage() {
  const router = useRouter()
  const [units, setUnits] = useState<TemperatureUnit[]>([])
  const [feil, setFeil] = useState("")
  const [status, setStatus] = useState("")
  const [nyEnhet, setNyEnhet] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [laster, setLaster] = useState(false)
  const [flytterId, setFlytterId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    })
  )

  useEffect(() => {
    const employeeId = localStorage.getItem("selectedEmployeeId")
    const employeeRole = localStorage.getItem("selectedEmployeeRole")
    const selectedVenue = localStorage.getItem("selectedVenue")

    if (!selectedVenue) return router.replace("/velg-sted")
    if (!employeeId) return router.replace("/ansatt")
    if (employeeRole !== "leader") return router.replace("/")

    loadUnits(selectedVenue)
  }, [router])

  async function loadUnits(venue: string) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const res = await fetch(
      `${url}/rest/v1/temperature_units?select=*&venue_id=eq.${venue}&order=sort_order.asc`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      }
    )

    const data = await res.json()
    setUnits(data || [])
  }

  function onPickImage(file: File | null) {
    setImageFile(file)
    if (file) setPreviewUrl(URL.createObjectURL(file))
  }

  async function uploadImageIfNeeded() {
    if (!imageFile) return null

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const filename = `temperature-${Date.now()}.jpg`

    await fetch(`${url}/storage/v1/object/temperature-images/${filename}`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "image/jpeg",
      },
      body: imageFile,
    })

    return `${url}/storage/v1/object/public/temperature-images/${filename}`
  }

  async function leggTilEnhet() {
    const venue = localStorage.getItem("selectedVenue")
    if (!venue) return

    const imageUrl = await uploadImageIfNeeded()

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    await fetch(`${url}/rest/v1/temperature_units`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: nyEnhet,
        active: true,
        sort_order: units.length + 1,
        image_url: imageUrl,
        venue_id: venue,
      }),
    })

    setNyEnhet("")
    setImageFile(null)
    setPreviewUrl(null)
    loadUnits(venue)
  }

  async function slettEnhet(unit: TemperatureUnit) {
    const venue = localStorage.getItem("selectedVenue")
    if (!venue) return

    await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/temperature_units?id=eq.${unit.id}`,
      {
        method: "PATCH",
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ active: false }),
      }
    )

    loadUnits(venue)
  }

  async function saveSortOrder(updated: TemperatureUnit[]) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    for (let i = 0; i < updated.length; i++) {
      await fetch(`${url}/rest/v1/temperature_units?id=eq.${updated[i].id}`, {
        method: "PATCH",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sort_order: i + 1 }),
      })
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = units.findIndex((u) => u.id === active.id)
    const newIndex = units.findIndex((u) => u.id === over.id)

    const newUnits = arrayMove(units, oldIndex, newIndex)
    setUnits(newUnits)

    setFlytterId(String(active.id))
    await saveSortOrder(newUnits)
    setFlytterId(null)
  }

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <h1 className="mb-8 text-center text-3xl font-bold">
        Administrer temperatur
      </h1>

      <div className="mx-auto max-w-md space-y-6">
        <div className="rounded-xl bg-zinc-900 p-4 space-y-3">
          <input
            value={nyEnhet}
            onChange={(e) => setNyEnhet(e.target.value)}
            placeholder="Navn på enhet"
            className="w-full rounded-xl bg-white p-3 text-black"
          />

          <input type="file" onChange={(e) => onPickImage(e.target.files?.[0] || null)} />

          {previewUrl && <img src={previewUrl} className="rounded-xl" />}

          <button onClick={leggTilEnhet} className="w-full bg-white text-black rounded-xl py-3">
            Legg til
          </button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={units.map((u) => u.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-4">
              {units.filter(u => u.active).map((unit) => (
                <SortableUnitCard
                  key={unit.id}
                  unit={unit}
                  onDelete={slettEnhet}
                  flytterId={flytterId}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <button
          onClick={() => router.push("/")}
          className="w-full border border-zinc-600 rounded-xl py-3"
        >
          Tilbake
        </button>
      </div>
    </main>
  )
}