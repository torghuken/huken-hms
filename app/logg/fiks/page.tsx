"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

type FixLogItem = {
  id: string
  comment: string | null
  image_url: string | null
  created_at: string
  status: string | null
  fixed_at: string | null
  employees: {
    name: string
  } | null
}

type GroupedLogs = {
  dateLabel: string
  items: FixLogItem[]
}

export default function FiksLoggPage() {
  const router = useRouter()
  const [items, setItems] = useState<FixLogItem[]>([])
  const [openDates, setOpenDates] = useState<Record<string, boolean>>({})
  const [feil, setFeil] = useState("")
  const [status, setStatus] = useState("")

  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString("no-NO")
  }, [])

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

    loadPage()
  }, [router])

  async function loadPage() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      const res = await fetch(
        `${url}/rest/v1/logs?select=id,comment,image_url,created_at,status,fixed_at,employees(name)&task_id=is.null&order=created_at.desc`,
        {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        }
      )

      const data = await res.json()

      if (!res.ok) {
        setFeil(data.message || "Kunne ikke hente logg")
        return
      }

      setItems(data)
    } catch (err) {
      setFeil(`Fetch-feil: ${String(err)}`)
    }
  }

  async function markerFullført(id: string) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      setFeil("")
      setStatus("Markerer som fullført...")

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
        const text = await res.text()
        setFeil(text || "Kunne ikke oppdatere status")
        setStatus("")
        return
      }

      setStatus("Oppgaven er flyttet til Fullførte")
      loadPage()
    } catch (err) {
      setFeil(`Fetch-feil: ${String(err)}`)
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
        <h1 className="mb-10 text-center text-3xl font-bold">
          Dette må fikses
        </h1>

        {feil && <p className="mb-6 text-red-400">{feil}</p>}
        {status && <p className="mb-6 text-green-400">{status}</p>}

        <h2 className="mb-4 text-2xl font-semibold">Åpne</h2>

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
                      {group.items.length} åpne
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
                          Meldt av: {item.employees?.name || "Ukjent"}
                        </p>

                        <p className="text-sm text-zinc-600">
                          {new Date(item.created_at).toLocaleTimeString("no-NO", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>

                        <p className="mt-3 text-base">
                          {item.comment || "Ingen tekst"}
                        </p>

                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt="Registrering"
                            className="mt-3 max-h-48 rounded-xl"
                          />
                        )}

                        <button
                          onClick={() => markerFullført(item.id)}
                          className="mt-4 rounded-xl bg-black px-4 py-2 text-white"
                        >
                          Fullført
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )
          })}

          {groupedOpen.length === 0 && (
            <p className="text-zinc-400">Ingen åpne ting</p>
          )}
        </div>

        <h2 className="mb-4 mt-10 text-2xl font-semibold">Fullførte</h2>

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
                      {group.items.length} fullførte
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
                          Meldt av: {item.employees?.name || "Ukjent"}
                        </p>

                        <p className="text-sm text-zinc-600">
                          Meldt: {new Date(item.created_at).toLocaleString("no-NO")}
                        </p>

                        {item.fixed_at && (
                          <p className="text-sm text-green-700">
                            Fullført: {new Date(item.fixed_at).toLocaleString("no-NO")}
                          </p>
                        )}

                        <p className="mt-3 text-base">
                          {item.comment || "Ingen tekst"}
                        </p>

                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt="Registrering"
                            className="mt-3 max-h-48 rounded-xl opacity-90"
                          />
                        )}

                        <p className="mt-4 font-semibold text-green-700">
                          ✔ Fullført
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )
          })}

          {groupedDone.length === 0 && (
            <p className="text-zinc-400">Ingen fullførte ting ennå</p>
          )}
        </div>

        <button
          onClick={() => router.push("/logg")}
          className="mt-10 w-full rounded-xl border border-zinc-600 py-3 text-zinc-300"
        >
          Tilbake
        </button>
      </div>
    </main>
  )
}