"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

type Task = {
  id: string
  name: string
  active: boolean
  list_id: string | null
  image_url: string | null
  requires_photo: boolean
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

  useEffect(() => {
    const employeeId = localStorage.getItem("selectedEmployeeId")
    const employeeRole = localStorage.getItem("selectedEmployeeRole")

    if (!employeeId) {
      router.replace("/ansatt")
      return
    }

    if (employeeRole !== "leader") {
      router.replace("/")
      return
    }

    loadTaskLists()
    loadTasks()
  }, [router])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const alleDagerValgt = useMemo(() => {
    return Object.values(days).every(Boolean)
  }, [days])

  async function loadTaskLists() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      const res = await fetch(
        `${url}/rest/v1/task_lists?select=id,name&order=name`,
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
        const andre = data.find((item: TaskList) => item.name === "Andre oppgaver")
        setValgtListeId(andre ? andre.id : data[0].id)
      }
    } catch (err) {
      setFeil(`Fetch-feil: ${String(err)}`)
    }
  }

  async function loadTasks() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      const res = await fetch(
        `${url}/rest/v1/tasks?select=id,name,active,list_id,image_url,requires_photo,show_monday,show_tuesday,show_wednesday,show_thursday,show_friday,show_saturday,show_sunday,task_lists(id,name)&order=name`,
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

  async function toggleActive(task: Task) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      const res = await fetch(`${url}/rest/v1/tasks?id=eq.${task.id}`, {
        method: "PATCH",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          active: !task.active,
        }),
      })

      if (!res.ok) {
        const data = await res.text()
        setFeil(data || "Kunne ikke endre oppgave")
        return
      }

      loadTasks()
    } catch (err) {
      setFeil(`Fetch-feil: ${String(err)}`)
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

  async function leggTilOppgave() {
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
          image_url: imageUrl,
          requires_photo: requiresPhoto,
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
      loadTasks()
    } catch (err) {
      setFeil(`Feil: ${String(err)}`)
      setStatus("")
    }
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

  const dagligeOppgaver = tasks.filter(
    (task) => task.task_lists?.name === "Daglige oppgaver"
  )

  const andreOppgaver = tasks.filter(
    (task) => task.task_lists?.name === "Andre oppgaver"
  )

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
                  onClick={() => setRequiresPhoto(true)}
                  className={`flex-1 rounded-lg px-3 py-3 text-sm font-semibold ${
                    requiresPhoto ? "bg-white text-black" : "bg-zinc-700 text-white"
                  }`}
                >
                  Må ta bilde
                </button>

                <button
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
                  onClick={() => setAlleDager(true)}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                    alleDagerValgt ? "bg-white text-black" : "bg-zinc-700 text-white"
                  }`}
                >
                  Alle dager
                </button>

                <button
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
              onClick={leggTilOppgave}
              className="w-full rounded-xl bg-white px-4 py-3 text-lg font-semibold text-black"
            >
              Legg til
            </button>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-semibold">Daglige oppgaver</h2>

          <div className="space-y-3">
            {dagligeOppgaver.map((task) => (
              <div
                key={task.id}
                className="rounded-xl bg-white p-4 text-black"
              >
                <div className="flex items-center justify-between gap-4">
                  <span>{task.name}</span>

                  <button
                    onClick={() => toggleActive(task)}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                      task.active
                        ? "bg-green-500 text-white"
                        : "bg-zinc-400 text-white"
                    }`}
                  >
                    {task.active ? "På" : "Av"}
                  </button>
                </div>

                <p className="mt-2 text-sm text-zinc-600">{formatDays(task)}</p>
                <p className="mt-1 text-sm text-zinc-600">
                  {task.requires_photo ? "Må ta bilde" : "Må bekreftes"}
                </p>

                {task.image_url && (
                  <img
                    src={task.image_url}
                    alt="Oppgavebilde"
                    className="mt-3 max-h-40 rounded-xl"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-semibold">Andre oppgaver</h2>

          <div className="space-y-3">
            {andreOppgaver.map((task) => (
              <div
                key={task.id}
                className="rounded-xl bg-white p-4 text-black"
              >
                <div className="flex items-center justify-between gap-4">
                  <span>{task.name}</span>

                  <button
                    onClick={() => toggleActive(task)}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                      task.active
                        ? "bg-green-500 text-white"
                        : "bg-zinc-400 text-white"
                    }`}
                  >
                    {task.active ? "På" : "Av"}
                  </button>
                </div>

                <p className="mt-2 text-sm text-zinc-600">{formatDays(task)}</p>
                <p className="mt-1 text-sm text-zinc-600">
                  {task.requires_photo ? "Må ta bilde" : "Må bekreftes"}
                </p>

                {task.image_url && (
                  <img
                    src={task.image_url}
                    alt="Oppgavebilde"
                    className="mt-3 max-h-40 rounded-xl"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => router.push("/")}
          className="w-full rounded-xl border border-zinc-600 px-4 py-3 text-zinc-200"
        >
          Tilbake
        </button>
      </div>
    </main>
  )
}