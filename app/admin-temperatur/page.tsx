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
  sort_order: number
  image_url: string | null
  venue_id?: string | null
}

type UiLanguage = "no" | "en" | "es"

const adminTemperatureTexts: Record<
  UiLanguage,
  {
    title: string
    moving: string
    drag: string
    delete: string
    unitNamePlaceholder: string
    add: string
    back: string
    imageAlt: string
    missingVenue: string
    missingName: string
    loading: string
    adding: string
    deleting: string
    orderSaved: string
    couldNotFetchUnits: string
    couldNotUploadImage: string
    couldNotAddUnit: string
    couldNotDeleteUnit: string
    couldNotSaveOrder: string
    fetchError: string
  }
> = {
  no: {
    title: "Administrer temperatur",
    moving: "Flytter...",
    drag: "Dra",
    delete: "Slett",
    unitNamePlaceholder: "Navn på enhet",
    add: "Legg til",
    back: "Tilbake",
    imageAlt: "Temperaturenhet",
    missingVenue: "Fant ikke valgt sted",
    missingName: "Skriv navn på enhet",
    loading: "Laster...",
    adding: "Legger til...",
    deleting: "Sletter...",
    orderSaved: "Rekkefølgen er lagret",
    couldNotFetchUnits: "Kunne ikke hente temperaturenheter",
    couldNotUploadImage: "Kunne ikke laste opp bilde",
    couldNotAddUnit: "Kunne ikke legge til enhet",
    couldNotDeleteUnit: "Kunne ikke slette enhet",
    couldNotSaveOrder: "Kunne ikke lagre rekkefølge",
    fetchError: "Fetch-feil",
  },
  en: {
    title: "Manage temperature",
    moving: "Moving...",
    drag: "Drag",
    delete: "Delete",
    unitNamePlaceholder: "Unit name",
    add: "Add",
    back: "Back",
    imageAlt: "Temperature unit",
    missingVenue: "Could not find selected venue",
    missingName: "Enter unit name",
    loading: "Loading...",
    adding: "Adding...",
    deleting: "Deleting...",
    orderSaved: "Order saved",
    couldNotFetchUnits: "Could not fetch temperature units",
    couldNotUploadImage: "Could not upload image",
    couldNotAddUnit: "Could not add unit",
    couldNotDeleteUnit: "Could not delete unit",
    couldNotSaveOrder: "Could not save order",
    fetchError: "Fetch error",
  },
  es: {
    title: "Administrar temperatura",
    moving: "Moviendo...",
    drag: "Arrastrar",
    delete: "Eliminar",
    unitNamePlaceholder: "Nombre de la unidad",
    add: "Agregar",
    back: "Volver",
    imageAlt: "Unidad de temperatura",
    missingVenue: "No se encontró el local seleccionado",
    missingName: "Escribe el nombre de la unidad",
    loading: "Cargando...",
    adding: "Agregando...",
    deleting: "Eliminando...",
    orderSaved: "Orden guardado",
    couldNotFetchUnits: "No se pudieron obtener las unidades de temperatura",
    couldNotUploadImage: "No se pudo subir la imagen",
    couldNotAddUnit: "No se pudo agregar la unidad",
    couldNotDeleteUnit: "No se pudo eliminar la unidad",
    couldNotSaveOrder: "No se pudo guardar el orden",
    fetchError: "Error de carga",
  },
}

function SortableUnitCard({
  unit,
  onDelete,
  flytterId,
  text,
}: {
  unit: TemperatureUnit
  onDelete: (unit: TemperatureUnit) => void
  flytterId: string | null
  text: {
    moving: string
    drag: string
    delete: string
    imageAlt: string
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
                alt={text.imageAlt}
                className="mt-3 max-h-40 w-full rounded-xl object-cover"
              />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button
              {...attributes}
              {...listeners}
              onPointerDown={(e) => e.stopPropagation()}
              className="rounded-lg bg-zinc-200 px-3 py-2 text-sm font-semibold text-black"
              style={{ cursor: "grab" }}
            >
              {flytterId === unit.id ? text.moving : text.drag}
            </button>

            <button
              onClick={() => onDelete(unit)}
              className="rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white"
            >
              {text.delete}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminTemperaturPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const currentLanguage: UiLanguage =
    language === "en" || language === "es" ? language : "no"
  const text = adminTemperatureTexts[currentLanguage]

  const [units, setUnits] = useState<TemperatureUnit[]>([])
  const [feil, setFeil] = useState("")
  const [status, setStatus] = useState("")
  const [nyEnhet, setNyEnhet] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
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

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  async function loadUnits(venue: string) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      setFeil("")
      setStatus(text.loading)

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

      if (!res.ok) {
        setFeil(data.message || text.couldNotFetchUnits)
        setStatus("")
        return
      }

      setUnits(data || [])
      setStatus("")
    } catch (err) {
      setFeil(`${text.fetchError}: ${String(err)}`)
      setStatus("")
    }
  }

  function onPickImage(file: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl)

    setImageFile(file)

    if (file) {
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      setPreviewUrl(null)
    }
  }

  async function uploadImageIfNeeded() {
    if (!imageFile) return null

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const filename = `temperature-${Date.now()}.jpg`

    const res = await fetch(`${url}/storage/v1/object/temperature-images/${filename}`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "image/jpeg",
      },
      body: imageFile,
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(errorText || text.couldNotUploadImage)
    }

    return `${url}/storage/v1/object/public/temperature-images/${filename}`
  }

  async function leggTilEnhet() {
    const venue = localStorage.getItem("selectedVenue")
    if (!venue) {
      setFeil(text.missingVenue)
      return
    }

    if (!nyEnhet.trim()) {
      setFeil(text.missingName)
      return
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      setFeil("")
      setStatus(text.adding)

      const imageUrl = await uploadImageIfNeeded()

      const res = await fetch(`${url}/rest/v1/temperature_units`, {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: nyEnhet.trim(),
          active: true,
          sort_order: units.filter((u) => u.active).length + 1,
          image_url: imageUrl,
          venue_id: venue,
        }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        setFeil(errorText || text.couldNotAddUnit)
        setStatus("")
        return
      }

      setNyEnhet("")
      setImageFile(null)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      setStatus("")
      loadUnits(venue)
    } catch (err) {
      setFeil(`${text.fetchError}: ${String(err)}`)
      setStatus("")
    }
  }

  async function slettEnhet(unit: TemperatureUnit) {
    const venue = localStorage.getItem("selectedVenue")
    if (!venue) {
      setFeil(text.missingVenue)
      return
    }

    try {
      setFeil("")
      setStatus(text.deleting)

      const res = await fetch(
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

      if (!res.ok) {
        const errorText = await res.text()
        setFeil(errorText || text.couldNotDeleteUnit)
        setStatus("")
        return
      }

      setStatus("")
      loadUnits(venue)
    } catch (err) {
      setFeil(`${text.fetchError}: ${String(err)}`)
      setStatus("")
    }
  }

  async function saveSortOrder(updated: TemperatureUnit[]) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    for (let i = 0; i < updated.length; i++) {
      const res = await fetch(`${url}/rest/v1/temperature_units?id=eq.${updated[i].id}`, {
        method: "PATCH",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sort_order: i + 1 }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || text.couldNotSaveOrder)
      }
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const visibleUnits = units.filter((u) => u.active)
    const oldIndex = visibleUnits.findIndex((u) => u.id === active.id)
    const newIndex = visibleUnits.findIndex((u) => u.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const reorderedVisible = arrayMove(visibleUnits, oldIndex, newIndex).map((unit, index) => ({
      ...unit,
      sort_order: index + 1,
    }))

    const reorderedIds = new Set(reorderedVisible.map((u) => u.id))
    const hiddenUnits = units.filter((u) => !reorderedIds.has(u.id))

    setUnits([...reorderedVisible, ...hiddenUnits])

    try {
      setFeil("")
      setStatus("")
      setFlytterId(String(active.id))
      await saveSortOrder(reorderedVisible)
      setStatus(text.orderSaved)
    } catch (err) {
      setFeil(`${text.fetchError}: ${String(err)}`)
      const venue = localStorage.getItem("selectedVenue")
      if (venue) {
        loadUnits(venue)
      }
    } finally {
      setFlytterId(null)
    }
  }

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <h1 className="mb-8 text-center text-3xl font-bold">{text.title}</h1>

      <div className="mx-auto max-w-md space-y-6">
        {feil && <p className="text-red-400">{feil}</p>}
        {status && <p className="text-green-400">{status}</p>}

        <div className="space-y-3 rounded-xl bg-zinc-900 p-4">
          <input
            value={nyEnhet}
            onChange={(e) => setNyEnhet(e.target.value)}
            placeholder={text.unitNamePlaceholder}
            className="w-full rounded-xl bg-white p-3 text-black"
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => onPickImage(e.target.files?.[0] || null)}
          />

          {previewUrl && (
            <img
              src={previewUrl}
              alt={text.imageAlt}
              className="rounded-xl"
            />
          )}

          <button
            onClick={leggTilEnhet}
            className="w-full rounded-xl bg-white py-3 text-black"
          >
            {text.add}
          </button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={units.filter((u) => u.active).map((u) => u.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-4">
              {units
                .filter((u) => u.active)
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((unit) => (
                  <SortableUnitCard
                    key={unit.id}
                    unit={unit}
                    onDelete={slettEnhet}
                    flytterId={flytterId}
                    text={text}
                  />
                ))}
            </div>
          </SortableContext>
        </DndContext>

        <button
          onClick={() => router.push("/")}
          className="w-full rounded-xl border border-zinc-600 py-3"
        >
          {text.back}
        </button>
      </div>
    </main>
  )
}