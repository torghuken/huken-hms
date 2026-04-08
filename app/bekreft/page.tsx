"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/language"

type UiLanguage = "no" | "en" | "es" | "ru"

const confirmTexts: Record<
  UiLanguage,
  {
    employee: string
    missingNameOrTask: string
    saving: string
    done: string
    couldNotSave: string
    error: string
    taskExampleImage: string
    confirm: string
  }
> = {
  no: {
    employee: "Ansatt",
    missingNameOrTask: "Mangler navn eller oppgave",
    saving: "Lagrer...",
    done: "Gjort",
    couldNotSave: "Kunne ikke lagre",
    error: "Feil",
    taskExampleImage: "Eksempel på oppgaven",
    confirm: "Bekreft",
  },
  en: {
    employee: "Employee",
    missingNameOrTask: "Missing name or task",
    saving: "Saving...",
    done: "Done",
    couldNotSave: "Could not save",
    error: "Error",
    taskExampleImage: "Task example image",
    confirm: "Confirm",
  },
  es: {
    employee: "Empleado",
    missingNameOrTask: "Falta nombre o tarea",
    saving: "Guardando...",
    done: "Hecho",
    couldNotSave: "No se pudo guardar",
    error: "Error",
    taskExampleImage: "Imagen de ejemplo de la tarea",
    confirm: "Confirmar",
  },
  ru: {
    employee: "Сотрудник",
    missingNameOrTask: "Отсутствует имя или задача",
    saving: "Сохранение...",
    done: "Готово",
    couldNotSave: "Не удалось сохранить",
    error: "Ошибка",
    taskExampleImage: "Пример изображения задачи",
    confirm: "Подтвердить",
  },
}

export default function BekreftPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const currentLanguage: UiLanguage =
    language === "en" || language === "es" || language === "ru" ? language : "no"
  const text = confirmTexts[currentLanguage]

  const [ansatt, setAnsatt] = useState("")
  const [oppgave, setOppgave] = useState("")
  const [oppgaveBilde, setOppgaveBilde] = useState<string | null>(null)
  const [employeeId, setEmployeeId] = useState<string | null>(null)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [status, setStatus] = useState("")
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnsatt(localStorage.getItem("selectedEmployeeName") || "")
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOppgave(localStorage.getItem("selectedTaskName") || "")
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOppgaveBilde(localStorage.getItem("selectedTaskImageUrl"))
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEmployeeId(localStorage.getItem("selectedEmployeeId"))
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTaskId(localStorage.getItem("selectedTaskId"))
  }, [])

  async function lagreBekreftelse() {
    if (!employeeId || !taskId) {
      setStatus(text.missingNameOrTask)
      return
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      setFlash(true)
      setTimeout(() => setFlash(false), 120)
      setStatus(text.saving)

      const logRes = await fetch(`${url}/rest/v1/logs`, {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          employee_id: employeeId,
          task_id: taskId,
          comment: text.done,
          image_url: null,
        }),
      })

      if (!logRes.ok) {
        const errorText = await logRes.text()
        setStatus(`${text.couldNotSave}: ${errorText}`)
        return
      }

      localStorage.removeItem("selectedTaskId")
      localStorage.removeItem("selectedTaskName")
      localStorage.removeItem("selectedTaskImageUrl")
      localStorage.removeItem("selectedTaskRequiresPhoto")

      router.replace("/oppgave")
    } catch (err) {
      setStatus(`${text.error}: ${String(err)}`)
    }
  }

  return (
    <main className="fixed inset-0 overflow-hidden bg-black text-white">
      <div
        className={`pointer-events-none absolute inset-0 bg-white transition-opacity duration-100 ${
          flash ? "opacity-80" : "opacity-0"
        }`}
      />

      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent p-5">
        <p className="text-sm opacity-80">
          {text.employee}: {ansatt}
        </p>
        <p className="text-2xl font-semibold">{oppgave}</p>
      </div>

      <div className="flex h-full w-full flex-col items-center justify-center px-6">
        {oppgaveBilde && (
          <img
            src={oppgaveBilde}
            alt={text.taskExampleImage}
            className="mb-8 max-h-[50vh] rounded-2xl border border-white/20"
          />
        )}
      </div>

      <div className="absolute inset-x-0 bottom-8 flex items-center justify-center gap-8">
        <div className="w-16" />
        <button
          onClick={lagreBekreftelse}
          aria-label={text.confirm}
          className="h-20 w-20 rounded-full border-4 border-white bg-white/20 shadow-xl"
        />
        <div className="w-16" />
      </div>

      {status && (
        <div className="absolute left-1/2 top-24 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-sm">
          {status}
        </div>
      )}
    </main>
  )
}