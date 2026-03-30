"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useLanguage } from "@/lib/language"

type LogItem = {
  id: string
  comment: string | null
  image_url: string | null
  created_at: string
  employees: {
    name: string
  } | null
}

type TaskInfo = {
  id: string
  name: string
  name_no?: string | null
  name_en?: string | null
  name_es?: string | null
  name_ru?: string | null
}

type UiLanguage = "no" | "en" | "es" | "ru"

const taskHistoryTexts: Record<
  UiLanguage,
  {
    history: string
    fullHistory: string
    taskNotFoundForVenue: string
    couldNotFetchHistory: string
    unknown: string
    registration: string
    noHistoryYet: string
  }
> = {
  no: {
    history: "Historikk",
    fullHistory: "Full historikk",
    taskNotFoundForVenue: "Fant ikke oppgaven for valgt sted",
    couldNotFetchHistory: "Kunne ikke hente historikk",
    unknown: "Ukjent",
    registration: "Registrering",
    noHistoryYet: "Ingen historikk ennå",
  },
  en: {
    history: "History",
    fullHistory: "Full history",
    taskNotFoundForVenue: "Could not find the task for the selected venue",
    couldNotFetchHistory: "Could not fetch history",
    unknown: "Unknown",
    registration: "Registration",
    noHistoryYet: "No history yet",
  },
  es: {
    history: "Historial",
    fullHistory: "Historial completo",
    taskNotFoundForVenue: "No se encontró la tarea para el local seleccionado",
    couldNotFetchHistory: "No se pudo obtener el historial",
    unknown: "Desconocido",
    registration: "Registro",
    noHistoryYet: "Aún no hay historial",
  },
  ru: {
    history: "История",
    fullHistory: "Полная история",
    taskNotFoundForVenue: "Задача не найдена для выбранного места",
    couldNotFetchHistory: "Не удалось получить историю",
    unknown: "Неизвестно",
    registration: "Регистрация",
    noHistoryYet: "История пока отсутствует",
  },
}

function getTaskDisplayName(
  task: TaskInfo | null,
  language: "no" | "en" | "es" | "ru"
) {
  if (!task) return ""
  if (language === "en") return task.name_en || task.name_no || task.name
  if (language === "es") return task.name_es || task.name_no || task.name
  if (language === "ru") return task.name_ru || task.name_no || task.name
  return task.name_no || task.name
}

export default function OppgaveHistorikkPage() {
  const router = useRouter()
  const params = useParams()
  const { t, language } = useLanguage()
  const currentLanguage: UiLanguage =
    language === "en" || language === "es" || language === "ru" ? language : "no"
  const text = taskHistoryTexts[currentLanguage]
  const taskId = params?.id as string

  const [task, setTask] = useState<TaskInfo | null>(null)
  const [logs, setLogs] = useState<LogItem[]>([])
  const [feil, setFeil] = useState("")

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

    if (!taskId) return

    loadPage(selectedVenue)
  }, [router, taskId])

  async function loadPage(selectedVenue: string) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      setFeil("")

      const taskRes = await fetch(
        `${url}/rest/v1/tasks?select=id,name,name_no,name_en,name_es,name_ru,list_id,task_lists!inner(id,name,venue_id)&id=eq.${taskId}&task_lists.venue_id=eq.${selectedVenue}`,
        {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        }
      )

      const taskData = await taskRes.json()

      if (!taskRes.ok || !taskData.length) {
        setFeil(`${t("error")}: ${text.taskNotFoundForVenue}`)
        return
      }

      setTask({
        id: taskData[0].id,
        name: taskData[0].name,
        name_no: taskData[0].name_no,
        name_en: taskData[0].name_en,
        name_es: taskData[0].name_es,
        name_ru: taskData[0].name_ru,
      })

      const logRes = await fetch(
        `${url}/rest/v1/logs?select=id,comment,image_url,created_at,employees(name)&task_id=eq.${taskId}&order=created_at.desc`,
        {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        }
      )

      const logData = await logRes.json()

      if (!logRes.ok) {
        setFeil(logData.message || `${t("error")}: ${text.couldNotFetchHistory}`)
        return
      }

      setLogs(logData)
    } catch (err) {
      setFeil(`${t("fetchError")}: ${String(err)}`)
    }
  }

  return (
    <main className="min-h-screen bg-black px-6 pt-16 text-white">
      <div className="mx-auto max-w-md">
        <h1 className="mb-2 text-center text-3xl font-bold">
          {getTaskDisplayName(task, language) || text.history}
        </h1>

        <p className="mb-10 text-center text-zinc-400">{text.fullHistory}</p>

        {feil && <p className="mb-6 text-red-400">{feil}</p>}

        <div className="space-y-4">
          {logs.map((log) => (
            <div
              key={log.id}
              className="rounded-2xl bg-white p-5 text-black"
            >
              <p className="text-sm text-zinc-600">
                {log.employees?.name || text.unknown}
              </p>

              <p className="text-sm text-zinc-600">
                {new Date(log.created_at).toLocaleString("no-NO")}
              </p>

              {log.comment && (
                <p className="mt-3 text-sm text-zinc-700">{log.comment}</p>
              )}

              {log.image_url && (
                <img
                  src={log.image_url}
                  alt={text.registration}
                  className="mt-3 max-h-64 rounded-xl"
                />
              )}
            </div>
          ))}

          {logs.length === 0 && !feil && (
            <p className="text-zinc-400">{text.noHistoryYet}</p>
          )}
        </div>

        <button
          onClick={() => router.back()}
          className="mt-10 w-full rounded-xl border border-zinc-600 py-3 text-zinc-300"
        >
          {t("back")}
        </button>
      </div>
    </main>
  )
}