"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/language"

type FixLogItem = {
  id: string
  comment: string | null
  image_url: string | null
  created_at: string
  status: string | null
  fixed_at: string | null
  employees: {
    name: string
    venue_id?: string | null
  } | null
}

type GroupedLogs = {
  dateLabel: string
  items: FixLogItem[]
}

type UiLanguage = "no" | "en" | "es"

const fixTexts: Record<
  UiLanguage,
  {
    title: string
    open: string
    completed: string
    couldNotFetchLog: string
    fetchError: string
    markingDone: string
    couldNotUpdateStatus: string
    movedToCompleted: string
    openCount: string
    completedCount: string
    reportedBy: string
    reported: string
    completedAt: string
    unknown: string
    noText: string
    registration: string
    markCompleted: string
    completedLabel: string
    noOpenItems: string
    noCompletedItems: string
    back: string
  }
> = {
  no: {
    title: "Dette må fikses",
    open: "Åpne",
    completed: "Fullførte",
    couldNotFetchLog: "Kunne ikke hente logg",
    fetchError: "Fetch-feil",
    markingDone: "Markerer som fullført...",
    couldNotUpdateStatus: "Kunne ikke oppdatere status",
    movedToCompleted: "Oppgaven er flyttet til Fullførte",
    openCount: "åpne",
    completedCount: "fullførte",
    reportedBy: "Meldt av",
    reported: "Meldt",
    completedAt: "Fullført",
    unknown: "Ukjent",
    noText: "Ingen tekst",
    registration: "Registrering",
    markCompleted: "Fullført",
    completedLabel: "✔ Fullført",
    noOpenItems: "Ingen åpne ting",
    noCompletedItems: "Ingen fullførte ting ennå",
    back: "Tilbake",
  },
  en: {
    title: "This needs fixing",
    open: "Open",
    completed: "Completed",
    couldNotFetchLog: "Could not fetch log",
    fetchError: "Fetch error",
    markingDone: "Marking as completed...",
    couldNotUpdateStatus: "Could not update status",
    movedToCompleted: "The task was moved to Completed",
    openCount: "open",
    completedCount: "completed",
    reportedBy: "Reported by",
    reported: "Reported",
    completedAt: "Completed",
    unknown: "Unknown",
    noText: "No text",
    registration: "Registration",
    markCompleted: "Completed",
    completedLabel: "✔ Completed",
    noOpenItems: "No open items",
    noCompletedItems: "No completed items yet",
    back: "Back",
  },
  es: {
    title: "Esto necesita arreglo",
    open: "Abiertas",
    completed: "Completadas",
    couldNotFetchLog: "No se pudo obtener el registro",
    fetchError: "Error de carga",
    markingDone: "Marcando como completado...",
    couldNotUpdateStatus: "No se pudo actualizar el estado",
    movedToCompleted: "La tarea se movió a Completadas",
    openCount: "abiertas",
    completedCount: "completadas",
    reportedBy: "Reportado por",
    reported: "Reportado",
    completedAt: "Completado",
    unknown: "Desconocido",
    noText: "Sin texto",
    registration: "Registro",
    markCompleted: "Completado",
    completedLabel: "✔ Completado",
    noOpenItems: "No hay elementos abiertos",
    noCompletedItems: "Aún no hay elementos completados",
    back: "Volver",
  },
}

export default function FiksLoggPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const currentLanguage: UiLanguage =
    language === "en" || language === "es" ? language : "no"
  const text = fixTexts[currentLanguage]

  const [items, setItems] = useState<FixLogItem[]>([])
  const [openDates, setOpenDates] = useState<Record<string, boolean>>({})
  const [feil, setFeil] = useState("")
  const [status, setStatus] = useState("")

  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString("no-NO")
  }, [])

  useEffect(() => {
    const selectedVenue = localStorage.getItem("selectedVenue")
    const employeeId = localStorage.getItem("selectedEmployeeId")
    const employeeRole = localStorage.getItem("selectedEmployeeRole")

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

    loadPage(selectedVenue)
  }, [router])

  async function loadPage(selectedVenue: string) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      setFeil("")
      setStatus("")

      const res = await fetch(
        `${url}/rest/v1/logs?select=id,comment,image_url,created_at,status,fixed_at,employees!inner(name,venue_id)&task_id=is.null&employees.venue_id=eq.${selectedVenue}&order=created_at.desc`,
        {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        }
      )

      const data = await res.json()

      if (!res.ok) {
        setFeil(data.message || text.couldNotFetchLog)
        return
      }

      setItems(data)
    } catch (err) {
      setFeil(`${text.fetchError}: ${String(err)}`)
    }
  }

  async function markerFullført(id: string) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const selectedVenue = localStorage.getItem("selectedVenue")

    try {
      setFeil("")
      setStatus(text.markingDone)

      const res = await fetch(`${url}/rest/v1/logs?id=eq.${id}`, {
        method: "PATCH",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "fixed",
          fixed_at: new Date().toISOString(),
        }),
      })

      if (!res.ok) {
        const textResponse = await res.text()
        setFeil(textResponse || text.couldNotUpdateStatus)
        setStatus("")
        return
      }

      setStatus(text.movedToCompleted)

      if (selectedVenue) {
        loadPage(selectedVenue)
      }
    } catch (err) {
      setFeil(`${text.fetchError}: ${String(err)}`)
      setStatus("")
    }
  }

  function groupLogsByDate(logs: FixLogItem[], useFixedAt: boolean): GroupedLogs[] {
    const map = new Map<string, FixLogItem[]>()

    logs.forEach((log) => {
      const rawDate = useFixedAt ? log.fixed_at : log.created_at
      if (!rawDate) return

      const dateKey = new Date(rawDate).toLocaleDateString("no-NO")
      const existing = map.get(dateKey) || []
      existing.push(log)
      map.set(dateKey, existing)
    })

    return Array.from(map.entries()).map(([dateLabel, items]) => ({
      dateLabel,
      items,
    }))
  }

  function toggleDate(dateLabel: string) {
    setOpenDates((prev) => ({
      ...prev,
      [dateLabel]: !prev[dateLabel],
    }))
  }

  const åpne = items.filter((item) => item.status !== "fixed")
  const fullførte = items.filter((item) => item.status === "fixed")

  const groupedOpen = groupLogsByDate(åpne, false)
  const groupedDone = groupLogsByDate(fullførte, true)

  useEffect(() => {
    const initialOpenDates: Record<string, boolean> = {}

    groupedOpen.forEach((group) => {
      initialOpenDates[`open-${group.dateLabel}`] = group.dateLabel === todayLabel
    })

    groupedDone.forEach((group) => {
      initialOpenDates[`done-${group.dateLabel}`] = group.dateLabel === todayLabel
    })

    setOpenDates(initialOpenDates)
  }, [items, todayLabel])

  return (
    <main className="min-h-screen bg-black px-6 pt-16 text-white">
      <div className="mx-auto max-w-md">
        <h1 className="mb-10 text-center text-3xl font-bold">{text.title}</h1>

        {feil && <p className="mb-6 text-red-400">{feil}</p>}
        {status && <p className="mb-6 text-green-400">{status}</p>}

        <h2 className="mb-4 text-2xl font-semibold">{text.open}</h2>

        <div className="space-y-4">
          {groupedOpen.map((group) => {
            const key = `open-${group.dateLabel}`
            const isOpen = openDates[key]

            return (
              <section key={key} className="rounded-2xl bg-zinc-900 p-3">
                <button
                  onClick={() => toggleDate(key)}
                  className="flex w-full items-center justify-between rounded-xl bg-white p-4 text-left text-black"
                >
                  <div>
                    <p className="text-lg font-semibold">{group.dateLabel}</p>
                    <p className="text-sm text-zinc-600">
                      {group.items.length} {text.openCount}
                    </p>
                  </div>

                  <div className="text-2xl font-bold text-zinc-500">
                    {isOpen ? "−" : "+"}
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-4 space-y-4">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl bg-white p-5 text-black"
                      >
                        <p className="text-sm text-zinc-600">
                          {text.reportedBy}: {item.employees?.name || text.unknown}
                        </p>

                        <p className="text-sm text-zinc-600">
                          {new Date(item.created_at).toLocaleTimeString("no-NO", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>

                        <p className="mt-3 text-base">{item.comment || text.noText}</p>

                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={text.registration}
                            className="mt-3 max-h-48 rounded-xl"
                          />
                        )}

                        <button
                          onClick={() => markerFullført(item.id)}
                          className="mt-4 rounded-xl bg-black px-4 py-2 text-white"
                        >
                          {text.markCompleted}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )
          })}

          {groupedOpen.length === 0 && (
            <p className="text-zinc-400">{text.noOpenItems}</p>
          )}
        </div>

        <h2 className="mb-4 mt-10 text-2xl font-semibold">{text.completed}</h2>

        <div className="space-y-4">
          {groupedDone.map((group) => {
            const key = `done-${group.dateLabel}`
            const isOpen = openDates[key]

            return (
              <section key={key} className="rounded-2xl bg-zinc-900 p-3">
                <button
                  onClick={() => toggleDate(key)}
                  className="flex w-full items-center justify-between rounded-xl bg-zinc-200 p-4 text-left text-black"
                >
                  <div>
                    <p className="text-lg font-semibold">{group.dateLabel}</p>
                    <p className="text-sm text-zinc-600">
                      {group.items.length} {text.completedCount}
                    </p>
                  </div>

                  <div className="text-2xl font-bold text-zinc-500">
                    {isOpen ? "−" : "+"}
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-4 space-y-4">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl bg-zinc-200 p-5 text-black"
                      >
                        <p className="text-sm text-zinc-600">
                          {text.reportedBy}: {item.employees?.name || text.unknown}
                        </p>

                        <p className="text-sm text-zinc-600">
                          {text.reported}:{" "}
                          {new Date(item.created_at).toLocaleString("no-NO")}
                        </p>

                        {item.fixed_at && (
                          <p className="text-sm text-green-700">
                            {text.completedAt}:{" "}
                            {new Date(item.fixed_at).toLocaleString("no-NO")}
                          </p>
                        )}

                        <p className="mt-3 text-base">{item.comment || text.noText}</p>

                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={text.registration}
                            className="mt-3 max-h-48 rounded-xl opacity-90"
                          />
                        )}

                        <p className="mt-4 font-semibold text-green-700">
                          {text.completedLabel}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )
          })}

          {groupedDone.length === 0 && (
            <p className="text-zinc-400">{text.noCompletedItems}</p>
          )}
        </div>

        <button
          onClick={() => router.push("/logg")}
          className="mt-10 w-full rounded-xl border border-zinc-600 py-3 text-zinc-300"
        >
          {text.back}
        </button>
      </div>
    </main>
  )
}