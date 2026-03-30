"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/language"

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
    name_no?: string | null
    name_en?: string | null
    name_es?: string | null
    name_ru?: string | null
  } | null
}

type GroupedLogs = {
  dateLabel: string
  items: LogItem[]
}

type UiLanguage = "no" | "en" | "es" | "ru"

const openingLogTexts: Record<
  UiLanguage,
  {
    registrations: string
    notFoundForVenue: string
    logSuffix: string
    unknownTask: string
    unknown: string
    registration: string
    noRegistrationsFound: string
  }
> = {
  no: {
    registrations: "registreringer",
    notFoundForVenue: "ikke funnet for valgt sted",
    logSuffix: "logg",
    unknownTask: "Ukjent oppgave",
    unknown: "Ukjent",
    registration: "Registrering",
    noRegistrationsFound: "Ingen registreringer funnet",
  },
  en: {
    registrations: "registrations",
    notFoundForVenue: "not found for selected venue",
    logSuffix: "log",
    unknownTask: "Unknown task",
    unknown: "Unknown",
    registration: "Registration",
    noRegistrationsFound: "No registrations found",
  },
  es: {
    registrations: "registros",
    notFoundForVenue: "no se encontró para el local seleccionado",
    logSuffix: "registro",
    unknownTask: "Tarea desconocida",
    unknown: "Desconocido",
    registration: "Registro",
    noRegistrationsFound: "No se encontraron registros",
  },
  ru: {
    registrations: "регистрации",
    notFoundForVenue: "не найдено для выбранного места",
    logSuffix: "журнал",
    unknownTask: "Неизвестная задача",
    unknown: "Неизвестно",
    registration: "Регистрация",
    noRegistrationsFound: "Регистрации не найдены",
  },
}

function normalizeListName(name: string) {
  return name.trim().toLowerCase()
}

function isOpeningList(name: string) {
  const normalized = normalizeListName(name)
  return (
    normalized === "åpning" ||
    normalized === "opening" ||
    normalized === "apertura"
  )
}

function getTaskDisplayName(
  task: LogItem["tasks"],
  language: "no" | "en" | "es" | "ru"
) {
  if (!task) return ""
  if (language === "en") return task.name_en || task.name_no || task.name
  if (language === "es") return task.name_es || task.name_no || task.name
  if (language === "ru") return task.name_ru || task.name_no || task.name
  return task.name_no || task.name
}

export default function ApningLoggPage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const currentLanguage: UiLanguage =
    language === "en" || language === "es" || language === "ru" ? language : "no"
  const text = openingLogTexts[currentLanguage]

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
        `${url}/rest/v1/task_lists?select=id,name,venue_id&venue_id=eq.${selectedVenue}`,
        {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        }
      )

      const listData = await listRes.json()

      if (!listRes.ok) {
        setFeil(listData.message || t("couldNotFetchTaskLists"))
        return
      }

      const openingList = (listData as Array<{ id: string; name: string }>).find(
        (list) => isOpeningList(list.name)
      )

      if (!openingList) {
        setFeil(`${t("error")}: ${t("opening")} ${text.notFoundForVenue}`)
        return
      }

      const listId = openingList.id

      const taskRes = await fetch(
        `${url}/rest/v1/tasks?select=id,name,name_no,name_en,name_es,name_ru,list_id,task_lists!inner(id,name,venue_id)&list_id=eq.${listId}&task_lists.venue_id=eq.${selectedVenue}`,
        {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        }
      )

      const taskData = await taskRes.json()

      if (!taskRes.ok) {
        setFeil(taskData.message || t("couldNotFetchTasks"))
        return
      }

      if (!taskData.length) {
        setGroups([])
        return
      }

      const taskIds = taskData.map((task: { id: string }) => task.id).join(",")

      const logRes = await fetch(
        `${url}/rest/v1/logs?select=id,comment,image_url,created_at,task_id,employees(name),tasks(name,name_no,name_en,name_es,name_ru)&task_id=in.(${taskIds})&order=created_at.desc`,
        {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        }
      )

      const logData = await logRes.json()

      if (!logRes.ok) {
        setFeil(logData.message || `${t("couldNotFetchTasks")} ${text.logSuffix}`)
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
      setFeil(`${t("fetchError")}: ${String(err)}`)
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
          {t("opening")}
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
                      {group.items.length} {text.registrations}
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
                          {getTaskDisplayName(log.tasks, language) || text.unknownTask}
                        </p>

                        <p className="mt-2 text-sm text-zinc-600">
                          {log.employees?.name || text.unknown}
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
                            alt={text.registration}
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
            <p className="text-zinc-400">{text.noRegistrationsFound}</p>
          )}
        </div>

        <button
          onClick={() => router.push("/logg")}
          className="mt-10 w-full rounded-xl border border-zinc-600 py-3 text-zinc-300"
        >
          {t("back")}
        </button>
      </div>
    </main>
  )
}