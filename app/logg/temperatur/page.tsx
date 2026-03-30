"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/language"

type TemperatureLogItem = {
  id: string
  temperature_value: number
  created_at: string
  employees: {
    name: string
    venue_id?: string | null
  } | null
  temperature_units: {
    name: string
  } | null
}

type GroupedLogs = {
  dateLabel: string
  items: TemperatureLogItem[]
}

type UiLanguage = "no" | "en" | "es" | "ru"

const temperatureTexts: Record<
  UiLanguage,
  {
    title: string
    couldNotFetch: string
    fetchError: string
    registrations: string
    unknownUnit: string
    unknown: string
    noRegistrations: string
    registration: string
    back: string
  }
> = {
  no: {
    title: "Temperaturkontroll",
    couldNotFetch: "Kunne ikke hente temperaturkontroll",
    fetchError: "Fetch-feil",
    registrations: "registreringer",
    unknownUnit: "Ukjent enhet",
    unknown: "Ukjent",
    noRegistrations: "Ingen registreringer funnet",
    registration: "Registrering",
    back: "Tilbake",
  },
  en: {
    title: "Temperature control",
    couldNotFetch: "Could not fetch temperature control",
    fetchError: "Fetch error",
    registrations: "registrations",
    unknownUnit: "Unknown unit",
    unknown: "Unknown",
    noRegistrations: "No registrations found",
    registration: "Registration",
    back: "Back",
  },
  es: {
    title: "Control de temperatura",
    couldNotFetch: "No se pudo obtener el control de temperatura",
    fetchError: "Error de carga",
    registrations: "registros",
    unknownUnit: "Unidad desconocida",
    unknown: "Desconocido",
    noRegistrations: "No se encontraron registros",
    registration: "Registro",
    back: "Volver",
  },
  ru: {
    title: "Контроль температуры",
    couldNotFetch: "Не удалось получить данные температуры",
    fetchError: "Ошибка загрузки",
    registrations: "регистрации",
    unknownUnit: "Неизвестная единица",
    unknown: "Неизвестно",
    noRegistrations: "Регистрации не найдены",
    registration: "Регистрация",
    back: "Назад",
  },
}

export default function TemperaturLoggPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const currentLanguage: UiLanguage =
    language === "en" || language === "es" || language === "ru" ? language : "no"
  const text = temperatureTexts[currentLanguage]

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

      const res = await fetch(
        `${url}/rest/v1/temperature_logs?select=id,temperature_value,created_at,employees!inner(name,venue_id),temperature_units(name)&employees.venue_id=eq.${selectedVenue}&order=created_at.desc`,
        {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        }
      )

      const data = await res.json()

      if (!res.ok) {
        setFeil(data.message || text.couldNotFetch)
        return
      }

      const grouped = groupLogsByDate(data)
      setGroups(grouped)

      const initialOpenDates: Record<string, boolean> = {}
      grouped.forEach((group) => {
        initialOpenDates[group.dateLabel] = group.dateLabel === todayLabel
      })
      setOpenDates(initialOpenDates)
    } catch (err) {
      setFeil(`${text.fetchError}: ${String(err)}`)
    }
  }

  function groupLogsByDate(logs: TemperatureLogItem[]): GroupedLogs[] {
    const map = new Map<string, TemperatureLogItem[]>()

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

  function formatTemp(value: number) {
    return value >= 10 ? "9+" : `${value}°`
  }

  return (
    <main className="min-h-screen bg-black px-6 pt-16 text-white">
      <div className="mx-auto max-w-md">
        <h1 className="mb-10 text-center text-3xl font-bold">
          {text.title}
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
                          {log.temperature_units?.name || text.unknownUnit}
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

                        <p className="mt-3 text-3xl font-bold">
                          {formatTemp(log.temperature_value)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )
          })}

          {groups.length === 0 && !feil && (
            <p className="text-zinc-400">{text.noRegistrations}</p>
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