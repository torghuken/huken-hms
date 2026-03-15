"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

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
}

export default function OppgaveHistorikkPage() {
  const router = useRouter()
  const params = useParams()
  const taskId = params?.id as string

  const [task, setTask] = useState<TaskInfo | null>(null)
  const [logs, setLogs] = useState<LogItem[]>([])
  const [feil, setFeil] = useState("")

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

    if (!taskId) return

    loadPage()
  }, [router, taskId])

  async function loadPage() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      const taskRes = await fetch(
        `${url}/rest/v1/tasks?select=id,name&id=eq.${taskId}`,
        {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        }
      )

      const taskData = await taskRes.json()

      if (!taskRes.ok || !taskData.length) {
        setFeil("Fant ikke oppgaven")
        return
      }

      setTask(taskData[0])

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
        setFeil(logData.message || "Kunne ikke hente historikk")
        return
      }

      setLogs(logData)
    } catch (err) {
      setFeil(`Fetch-feil: ${String(err)}`)
    }
  }

  return (
    <main className="min-h-screen bg-black px-6 pt-16 text-white">
      <div className="mx-auto max-w-md">
        <h1 className="mb-2 text-center text-3xl font-bold">
          {task?.name || "Historikk"}
        </h1>

        <p className="mb-10 text-center text-zinc-400">Full historikk</p>

        {feil && <p className="mb-6 text-red-400">{feil}</p>}

        <div className="space-y-4">
          {logs.map((log) => (
            <div
              key={log.id}
              className="rounded-2xl bg-white p-5 text-black"
            >
              <p className="text-sm text-zinc-600">
                {log.employees?.name || "Ukjent"}
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
                  alt="Registrering"
                  className="mt-3 max-h-64 rounded-xl"
                />
              )}
            </div>
          ))}

          {logs.length === 0 && !feil && (
            <p className="text-zinc-400">Ingen historikk ennå</p>
          )}
        </div>

        <button
          onClick={() => router.back()}
          className="mt-10 w-full rounded-xl border border-zinc-600 py-3 text-zinc-300"
        >
          Tilbake
        </button>
      </div>
    </main>
  )
}