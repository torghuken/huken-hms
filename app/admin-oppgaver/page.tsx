"use client"

import { useEffect, useMemo, useState } from "react"
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

type Task = {
  id: string
  name: string
  active: boolean
  sort_order: number | null
  list_id: string | null
  image_url: string | null
  requires_photo: boolean
  hide_for_6_hours: boolean
  show_monday: boolean
  show_tuesday: boolean
  show_wednesday: boolean
  show_thursday: boolean
  show_friday: boolean
  show_saturday: boolean
  show_sunday: boolean
  task_lists: {
    id: string
    name: string
    venue_id?: string | null
  } | null
}

type TaskList = {
  id: string
  name: string
}

type DaysState = {
  monday: boolean
  tuesday: boolean
  wednesday: boolean
  thursday: boolean
  friday: boolean
  saturday: boolean
  sunday: boolean
}

const defaultDays: DaysState = {
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: true,
  sunday: true,
}

function SortableTaskCard({
  task,
  flytterId,
  sletterId,
  skjulerId,
  onDelete,
  onToggleHideMode,
}: {
  task: Task
  flytterId: string | null
  sletterId: string | null
  skjulerId: string | null
  onDelete: (task: Task) => void
  onToggleHideMode: (task: Task) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  }

  function formatDays(task: Task) {
    const activeDays: string[] = []
    if (task.show_monday) activeDays.push("Mandag")
    if (task.show_tuesday) activeDays.push("Tirsdag")
    if (task.show_wednesday) activeDays.push("Onsdag")
    if (task.show_thursday) activeDays.push("Torsdag")
    if (task.show_friday) activeDays.push("Fredag")
    if (task.show_saturday) activeDays.push("Lørdag")
    if (task.show_sunday) activeDays.push("Søndag")

    if (activeDays.length === 7) return "Alle dager"
    return activeDays.join(" • ")
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div className="rounded-xl bg-white p-4 text-black">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <span className="font-medium">{task.name}</span>
            <p className="mt-1 text-xs text-zinc-500">
              Bruk Dra-knappen for å flytte
            </p>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                onToggleHideMode(task)
              }}
              disabled={
                flytterId === task.id ||
                sletterId === task.id ||
                skjulerId === task.id
              }
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {skjulerId === task.id
                ? "Lagrer..."
                : task.hide_for_6_hours
                ? "Skjul 6t"
                : "Vis alltid"}
            </button>

            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                onDelete(task)
              }}
              disabled={
                flytterId === task.id ||
                sletterId === task.id ||
                skjulerId === task.id
              }
              className="rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {sletterId === task.id ? "Fjerner..." : "Slett"}
            </button>

            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              {...attributes}
              {...listeners}
              className="rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-700"
              style={{ touchAction: "none", cursor: "grab" }}
            >
              {flytterId === task.id ? "Flytter..." : "Dra"}
            </button>
          </div>
        </div>

        <p className="mt-2 text-sm text-zinc-600">{formatDays(task)}</p>
        <p className="mt-1 text-sm text-zinc-600">
          {task.requires_photo ? "Må ta bilde" : "Må bekreftes"}
        </p>
        <p className="mt-1 text-sm text-zinc-600">
          {task.hide_for_6_hours
            ? "Skjules i 6 timer etter utføring"
            : "Vises hele tiden"}
        </p>

        {task.image_url && (
          <img
            src={task.image_url}
            alt="Oppgavebilde"
            className="mt-3 max-h-40 rounded-xl"
          />
        )}
      </div>
    </div>
  )
}

export default function AdminOppgaverPage() {
  const router = useRouter()

  const [tasks, setTasks] = useState<Task[]>([])
  const [taskLists, setTaskLists] = useState<TaskList[]>([])
  const [feil, setFeil] = useState("")
  const [status, setStatus] = useState("")
  const [nyOppgave, setNyOppgave] = useState("")
  const [valgtListeId, setValgtListeId] = useState("")
  const [requiresPhoto, setRequiresPhoto] = useState(true)
  const [days, setDays] = useState<DaysState>(defaultDays)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [sletterId, setSletterId] = useState<string | null>(null)
  const [flytterId, setFlytterId] = useState<string | null>(null)
  const [skjulerId, setSkjulerId] = useState<string | null>(null)

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
    const employeeId = localStorage.getItem("selectedEmployeeId")
    const employeeRole = localStorage.getItem("selectedEmployeeRole")
    const selectedVenue = localStorage.getItem("selectedVenue")

    if (!selectedVenue) {
      router.replace("/velg-sted")
      return
    }

    if (!employeeId) {
      router.replace("/ansatt")
      return
    }

    if (employeeRole !== "leader") {
      router.replace("/")
      return
    }

    loadTaskLists(selectedVenue)
    loadTasks(selectedVenue)
  }, [router])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const alleDagerValgt = useMemo(() => {
    return Object.values(days).every(Boolean)
  }, [days])

  async function loadTaskLists(selectedVenue: string) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      setFeil("")

      const res = await fetch(
        `${url}/rest/v1/task_lists?select=id,name&venue_id=eq.${selectedVenue}&order=name`,
        {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        }
      )

      const data = await res.json()

      if (!res.ok) {
        setFeil(data.message || "Kunne ikke hente oppgavetyper")
        return
      }

      setTaskLists(data)

      if (data.length > 0 && !valgtListeId) {
        const andre = data.find(
          (item: TaskList) =>
            item.name === "Andre oppgaver" || item.name === "Daglige oppgaver"
        )
        setValgtListeId(andre ? andre.id : data[0].id)
      }
    } catch (err) {
      setFeil(`Fetch-feil: ${String(err)}`)
    }
  }

  async function loadTasks(selectedVenue: string) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      setFeil("")

      const res = await fetch(
        `${url}/rest/v1/tasks?select=id,name,active,sort_order,list_id,image_url,requires_photo,hide_for_6_hours,show_monday,show_tuesday,show_wednesday,show_thursday,show_friday,show_saturday,show_sunday,task_lists!inner(id,name,venue_id)&task_lists.venue_id=eq.${selectedVenue}&order=list_id.asc,sort_order.asc,name.asc`,
        {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        }
      )

      const data = await res.json()

      if (!res.ok) {
        setFeil(data.message || "Kunne ikke hente oppgaver")
        return
      }

      setTasks(data)
    } catch (err) {
      setFeil(`Fetch-feil: ${String(err)}`)
    }
  }

  async function deleteTask(task: Task) {
    const confirmed = window.confirm(
      `Er du sikker på at du vil fjerne oppgaven "${task.name}"? Den blir satt som inaktiv.`
    )

    if (!confirmed) return

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const selectedVenue = localStorage.getItem("selectedVenue")

    try {
      setFeil("")
      setStatus("")
      setSletterId(task.id)

      const res = await fetch(`${url}/rest/v1/tasks?id=eq.${task.id}`, {
        method: "PATCH",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          active: false,
        }),
      })

      if (!res.ok) {
        const data = await res.text()
        setFeil(data || "Kunne ikke fjerne oppgave")
        return
      }

      setTasks((prev) => prev.filter((item) => item.id !== task.id))
      setStatus(`Oppgaven "${task.name}" er fjernet`)
    } catch (err) {
      setFeil(`Fetch-feil: ${String(err)}`)
    } finally {
      setSletterId(null)
      if (selectedVenue) {
        loadTasks(selectedVenue)
      }
    }
  }

  async function toggleHideMode(task: Task) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const selectedVenue = localStorage.getItem("selectedVenue")
    const nyttValg = !task.hide_for_6_hours

    try {
      setFeil("")
      setStatus("")
      setSkjulerId(task.id)

      const res = await fetch(`${url}/rest/v1/tasks?id=eq.${task.id}`, {
        method: "PATCH",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          hide_for_6_hours: nyttValg,
        }),
      })

      if (!res.ok) {
        const data = await res.text()
        setFeil(data || "Kunne ikke oppdatere visning")
        return
      }

      setTasks((prev) =>
        prev.map((item) =>
          item.id === task.id
            ? { ...item, hide_for_6_hours: nyttValg }
            : item
        )
      )

      setStatus(
        nyttValg
          ? `Oppgaven "${task.name}" skjules i 6 timer etter utføring`
          : `Oppgaven "${task.name}" vises hele tiden`
      )
    } catch (err) {
      setFeil(`Fetch-feil: ${String(err)}`)
    } finally {
      setSkjulerId(null)
      if (selectedVenue) {
        loadTasks(selectedVenue)
      }
    }
  }

  function toggleDay(day: keyof DaysState) {
    setDays((prev) => ({
      ...prev,
      [day]: !prev[day],
    }))
  }

  function setAlleDager(value: boolean) {
    setDays({
      monday: value,
      tuesday: value,
      wednesday: value,
      thursday: value,
      friday: value,
      saturday: value,
      sunday: value,
    })
  }

  function onPickImage(file: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl)

    setImageFile(file)

    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }

  async function uploadImageIfNeeded(): Promise<string | null> {
    if (!imageFile) return null

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const ext = imageFile.name.split(".").pop()?.toLowerCase() || "jpg"
    const filename = `task-template-${Date.now()}.${ext}`

    const res = await fetch(`${url}/storage/v1/object/hms-images/${filename}`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": imageFile.type || "image/jpeg",
      },
      body: imageFile,
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || "Kunne ikke laste opp bilde")
    }

    return `${url}/storage/v1/object/public/hms-images/${filename}`
  }

  function getNextSortOrderForList(listId: string) {
    const sammeListe = tasks.filter((task) => task.list_id === listId)
    if (sammeListe.length === 0) return 1

    const høyeste = Math.max(
      ...sammeListe.map((task) => Number(task.sort_order ?? 0))
    )

    return høyeste + 1
  }

  async function leggTilOppgave() {
    const selectedVenue = localStorage.getItem("selectedVenue")

    if (!selectedVenue) {
      setFeil("Fant ikke valgt sted")
      return
    }

    if (!nyOppgave.trim()) {
      setFeil("Skriv navn på oppgaven")
      return
    }

    if (!valgtListeId) {
      setFeil("Velg oppgavetype")
      return
    }

    if (!Object.values(days).some(Boolean)) {
      setFeil("Velg minst én dag")
      return
    }

    if (!imageFile) {
      setFeil("Velg eksempelbilde")
      return
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const nesteSortOrder = getNextSortOrderForList(valgtListeId)

    try {
      setFeil("")
      setStatus("Lagrer oppgave...")

      const imageUrl = await uploadImageIfNeeded()

      const res = await fetch(`${url}/rest/v1/tasks`, {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          name: nyOppgave.trim(),
          list_id: valgtListeId,
          active: true,
          sort_order: nesteSortOrder,
          image_url: imageUrl,
          requires_photo: requiresPhoto,
          hide_for_6_hours: false,
          show_monday: days.monday,
          show_tuesday: days.tuesday,
          show_wednesday: days.wednesday,
          show_thursday: days.thursday,
          show_friday: days.friday,
          show_saturday: days.saturday,
          show_sunday: days.sunday,
        }),
      })

      if (!res.ok) {
        const data = await res.text()
        setFeil(data || "Kunne ikke legge til oppgave")
        setStatus("")
        return
      }

      setNyOppgave("")
      setRequiresPhoto(true)
      setDays(defaultDays)
      setImageFile(null)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      setStatus("Oppgaven er lagret")

      loadTasks(selectedVenue)
      loadTaskLists(selectedVenue)
    } catch (err) {
      setFeil(`Feil: ${String(err)}`)
      setStatus("")
    }
  }

  function getTasksForList(listName: string) {
    return tasks
      .filter((task) => task.active && task.task_lists?.name === listName)
      .sort((a, b) => {
        const aOrder = Number(a.sort_order ?? 0)
        const bOrder = Number(b.sort_order ?? 0)
        if (aOrder !== bOrder) return aOrder - bOrder
        return a.name.localeCompare(b.name)
      })
  }

  async function saveSortOrderForList(updatedListTasks: Task[]) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    for (let i = 0; i < updatedListTasks.length; i++) {
      const task = updatedListTasks[i]

      const res = await fetch(`${url}/rest/v1/tasks?id=eq.${task.id}`, {
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

  async function handleDragEndForList(
    listName: string,
    event: DragEndEvent
  ) {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const listTasks = getTasksForList(listName)
    const oldIndex = listTasks.findIndex((task) => task.id === active.id)
    const newIndex = listTasks.findIndex((task) => task.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const movedList = arrayMove(listTasks, oldIndex, newIndex)
    const movedIds = new Set(movedList.map((task) => task.id))

    const updatedMovedList = movedList.map((task, index) => ({
      ...task,
      sort_order: index + 1,
    }))

    setTasks((prev) => [
      ...prev.filter((task) => !movedIds.has(task.id)),
      ...updatedMovedList,
    ])

    try {
      setFeil("")
      setStatus("")
      setFlytterId(String(active.id))

      await saveSortOrderForList(updatedMovedList)
      setStatus(`Rekkefølgen for "${listName}" er lagret`)
    } catch (err) {
      setFeil(`Feil: ${String(err)}`)
      const selectedVenue = localStorage.getItem("selectedVenue")
      if (selectedVenue) {
        loadTasks(selectedVenue)
      }
    } finally {
      setFlytterId(null)
    }
  }

  const dagligeOppgaver = getTasksForList("Daglige oppgaver")
  const andreOppgaver = getTasksForList("Andre oppgaver")
  const andreListerOppgaver = tasks
    .filter(
      (task) =>
        task.active &&
        task.task_lists?.name !== "Daglige oppgaver" &&
        task.task_lists?.name !== "Andre oppgaver"
    )
    .sort((a, b) => {
      const aOrder = Number(a.sort_order ?? 0)
      const bOrder = Number(b.sort_order ?? 0)
      if (a.task_lists?.name !== b.task_lists?.name) {
        return (a.task_lists?.name || "").localeCompare(b.task_lists?.name || "")
      }
      if (aOrder !== bOrder) return aOrder - bOrder
      return a.name.localeCompare(b.name)
    })

  function renderSortableSection(title: string, sectionTasks: Task[]) {
    return (
      <div>
        <h2 className="mb-3 text-xl font-semibold">{title}</h2>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event) => handleDragEndForList(title, event)}
        >
          <SortableContext
            items={sectionTasks.map((task) => task.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {sectionTasks.length === 0 && (
                <div className="rounded-xl bg-zinc-900 p-4 text-zinc-300">
                  Ingen oppgaver enda
                </div>
              )}

              {sectionTasks.map((task) => (
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  flytterId={flytterId}
                  sletterId={sletterId}
                  skjulerId={skjulerId}
                  onDelete={deleteTask}
                  onToggleHideMode={toggleHideMode}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <h1 className="mb-8 text-center text-3xl font-bold">Administrer oppgaver</h1>

      <div className="mx-auto max-w-md space-y-8">
        {feil && <p className="text-red-400">{feil}</p>}
        {status && <p className="text-green-400">{status}</p>}

        <div className="rounded-2xl bg-zinc-900 p-4">
          <h2 className="mb-4 text-xl font-semibold">Legg til oppgave</h2>

          <div className="space-y-3">
            <input
              value={nyOppgave}
              onChange={(e) => setNyOppgave(e.target.value)}
              placeholder="Navn på oppgave"
              className="w-full rounded-xl border border-zinc-700 bg-white p-3 text-black outline-none"
            />

            <select
              value={valgtListeId}
              onChange={(e) => setValgtListeId(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-white p-3 text-black outline-none"
            >
              <option value="">Velg oppgavetype</option>
              {taskLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>

            <div className="rounded-xl bg-zinc-800 p-3">
              <p className="mb-3 text-sm text-zinc-300">Hvordan skal oppgaven registreres?</p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRequiresPhoto(true)}
                  className={`flex-1 rounded-lg px-3 py-3 text-sm font-semibold ${
                    requiresPhoto ? "bg-white text-black" : "bg-zinc-700 text-white"
                  }`}
                >
                  Må ta bilde
                </button>

                <button
                  type="button"
                  onClick={() => setRequiresPhoto(false)}
                  className={`flex-1 rounded-lg px-3 py-3 text-sm font-semibold ${
                    !requiresPhoto ? "bg-white text-black" : "bg-zinc-700 text-white"
                  }`}
                >
                  Må bekreftes
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-zinc-800 p-3">
              <p className="mb-3 text-sm text-zinc-300">Vises på disse dagene</p>

              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setAlleDager(true)}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                    alleDagerValgt ? "bg-white text-black" : "bg-zinc-700 text-white"
                  }`}
                >
                  Alle dager
                </button>

                <button
                  type="button"
                  onClick={() => setAlleDager(false)}
                  className="rounded-lg bg-zinc-700 px-3 py-2 text-sm font-semibold text-white"
                >
                  Nullstill
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  ["monday", "Mandag"],
                  ["tuesday", "Tirsdag"],
                  ["wednesday", "Onsdag"],
                  ["thursday", "Torsdag"],
                  ["friday", "Fredag"],
                  ["saturday", "Lørdag"],
                  ["sunday", "Søndag"],
                ].map(([key, label]) => {
                  const dayKey = key as keyof DaysState
                  const active = days[dayKey]

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleDay(dayKey)}
                      className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                        active ? "bg-green-500 text-white" : "bg-zinc-700 text-white"
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="rounded-xl bg-zinc-800 p-3">
              <p className="mb-3 text-sm text-zinc-300">Eksempelbilde</p>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => onPickImage(e.target.files?.[0] || null)}
                className="w-full rounded-xl bg-white p-2 text-black"
              />

              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Forhåndsvisning"
                  className="mt-3 max-h-48 rounded-xl"
                />
              )}
            </div>

            <button
              type="button"
              onClick={leggTilOppgave}
              className="w-full rounded-xl bg-white px-4 py-3 text-lg font-semibold text-black"
            >
              Legg til
            </button>
          </div>
        </div>

        {renderSortableSection("Daglige oppgaver", dagligeOppgaver)}
        {renderSortableSection("Andre oppgaver", andreOppgaver)}

        {andreListerOppgaver.length > 0 && (
          <div>
            <h2 className="mb-3 text-xl font-semibold">Flere oppgaver</h2>

            <div className="space-y-6">
              {Array.from(
                new Set(
                  andreListerOppgaver.map(
                    (task) => task.task_lists?.name || "Uten kategori"
                  )
                )
              ).map((listName) => {
                const sectionTasks = andreListerOppgaver.filter(
                  (task) => (task.task_lists?.name || "Uten kategori") === listName
                )

                return (
                  <div key={listName}>
                    {renderSortableSection(listName, sectionTasks)}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => router.push("/")}
          className="w-full rounded-xl border border-zinc-600 px-4 py-3 text-zinc-200"
        >
          Tilbake
        </button>
      </div>
    </main>
  )
}