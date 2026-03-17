"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

type LogItem = {
  id: string
  comment: string | null
  image_url: string | null
  created_at: string
  task_id: string | null
  employees: {
    name: string
  } | null
  tasks: {
    name: string
  } | null
}

type GroupedLogs = {
  dateLabel: string
  items: LogItem[]
}

export default function DagligeLoggPage() {
  const router = useRouter()
  const [groups, setGroups] = useState<GroupedLogs[]>([])
  const [openDates, setOpenDates] = useState<Record<string, boolean>>({})
  const [feil, setFeil] = useState("")

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

      const listRes = await fetch(
        `${url}/rest/v1/task_lists?select=id,name,venue_id&name=eq.Daglige oppgaver&venue_id=eq.${selectedVenue}`,
        {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        }
      )

      const listData = await listRes.json()

      if (!listRes.ok || !listData.length) {
        setFeil("Fant ikke oppgavetypen Daglige oppgaver for valgt sted")
        return
      }

      const listId = listData[0].id

      const taskRes = await fetch(
        `${url}/rest/v1/tasks?select=id,name,list_id,task_lists!inner(id,name,venue_id)&list_id=eq.${listId}&task_lists.venue_id=eq.${selectedVenue}`,
        {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        }
      )

      const taskData = await taskRes.json()

      if (!taskRes.ok) {
        setFeil(taskData.message || "Kunne ikke hente oppgaver")
        return
      }

      if (!taskData.length) {
        setGroups([])
        return
      }

      const taskIds = taskData.map((task: { id: string }) => task.id).join(",")

      const logRes = await fetch(
        `${url}/rest/v1/logs?select=id,comment,image_url,created_at,task_id,employees(name),tasks(name)&task_id=in.(${taskIds})&order=created_at.desc`,
        {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        }
      )

      const logData = await logRes.json()

      if (!logRes.ok) {
        setFeil(logData.message || "Kunne ikke hente logg")
        return
      }

      const grouped = groupLogsByDate(logData)
      setGroups(grouped)

      const initialOpenDates: Record<string, boolean> = {}
      grouped.forEach((group) => {
        initialOpenDates[group.dateLabel] = group.dateLabel === todayLabel
      })
      setOpenDates(initialOpenDates)
    } catch (err) {
      setFeil(`Fetch-feil: ${String(err)}`)
    }
  }

  function groupLogsByDate(logs: LogItem[]): GroupedLogs[] {
    const map = new Map<string, LogItem[]>()

    logs.forEach((log) => {
      const dateKey = new Date(log.created_at).toLocaleDateString("no-NO")
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

  return (
    <main className="min-h-screen bg-black px-6 pt-16 text-white">
      <div className="mx-auto max-w-md">
        <h1 className="mb-10 text-center text-3xl font-bold">
          Daglige oppgaver
        </h1>

        {feil && <p className="mb-6 text-red-400">{feil}</p>}

        <div className="space-y-4">
          {groups.map((group) => {
            const isOpen = openDates[group.dateLabel]

            return (
              <section key={group.dateLabel} className="rounded-2xl bg-zinc-900 p-3">
                <button
                  onClick={() => toggleDate(group.dateLabel)}
                  className="flex w-full items-center justify-between rounded-xl bg-white p-4 text-left text-black"
                >
                  <div>
                    <p className="text-lg font-semibold">{group.dateLabel}</p>
                    <p className="text-sm text-zinc-600">
                      {group.items.length} registreringer
                    </p>
                  </div>

                  <div className="text-2xl font-bold text-zinc-500">
                    {isOpen ? "−" : "+"}
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-4 space-y-4">
                    {group.items.map((log) => (
                      <div
                        key={log.id}
                        className="rounded-2xl bg-white p-5 text-black"
                      >
                        <p className="text-lg font-semibold">
                          {log.tasks?.name || "Ukjent oppgave"}
                        </p>

                        <p className="mt-2 text-sm text-zinc-600">
                          {log.employees?.name || "Ukjent"}
                        </p>

                        <p className="text-sm text-zinc-600">
                          {new Date(log.created_at).toLocaleTimeString("no-NO", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>

                        {log.comment && (
                          <p className="mt-2 text-sm text-zinc-700">
                            {log.comment}
                          </p>
                        )}

                        {log.image_url && (
                          <img
                            src={log.image_url}
                            alt="Registrering"
                            className="mt-3 max-h-48 rounded-xl"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )
          })}

          {groups.length === 0 && !feil && (
            <p className="text-zinc-400">Ingen registreringer funnet</p>
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