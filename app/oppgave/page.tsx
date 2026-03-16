"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { translations } from "@/lib/translations"

type Task = {
  id: string
  name: string
  active: boolean
  image_url: string | null
  requires_photo: boolean
  show_monday: boolean
  show_tuesday: boolean
  show_wednesday: boolean
  show_thursday: boolean
  show_friday: boolean
  show_saturday: boolean
  show_sunday: boolean
}

function getTodayColumn() {
  const day = new Date().getDay()

  switch (day) {
    case 1:
      return "show_monday"
    case 2:
      return "show_tuesday"
    case 3:
      return "show_wednesday"
    case 4:
      return "show_thursday"
    case 5:
      return "show_friday"
    case 6:
      return "show_saturday"
    case 0:
      return "show_sunday"
    default:
      return "show_monday"
  }
}

export default function OppgavePage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [feil, setFeil] = useState("")
  const [listeNavn, setListeNavn] = useState("")
  const [lang, setLang] = useState<"no" | "en" | "es">("no")
  const router = useRouter()

  const todayColumn = useMemo(() => getTodayColumn(), [])

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") as "no" | "en" | "es" | null
    setLang(savedLang || "no")

    const selectedEmployeeId = localStorage.getItem("selectedEmployeeId")
    if (!selectedEmployeeId) {
      router.replace("/ansatt")
      return
    }

    const selectedTaskListId = localStorage.getItem("selectedTaskListId")
    const selectedTaskListName = localStorage.getItem("selectedTaskListName")

    if (selectedTaskListName) {
      setListeNavn(selectedTaskListName)
    }

    if (!selectedTaskListId) {
      setFeil("Ingen oppgavetype valgt")
      return
    }

    async function loadTasks() {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

      try {
        let query = `${url}/rest/v1/tasks?select=id,name,active,image_url,requires_photo,show_monday,show_tuesday,show_wednesday,show_thursday,show_friday,show_saturday,show_sunday&list_id=eq.${selectedTaskListId}&active=eq.true&order=name`

        if (
          selectedTaskListName === "Åpning" ||
          selectedTaskListName === "Stenging"
        ) {
          query += `&${todayColumn}=eq.true`
        }

        const res = await fetch(query, {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        })

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

    loadTasks()
  }, [router, todayColumn])

  const t = translations[lang]

  function velgOppgave(task: Task) {
    localStorage.setItem("selectedTaskId", task.id)
    localStorage.setItem("selectedTaskName", task.name)
    localStorage.setItem(
      "selectedTaskRequiresPhoto",
      task.requires_photo ? "true" : "false"
    )

    if (task.image_url) {
      localStorage.setItem("selectedTaskImageUrl", task.image_url)
    } else {
      localStorage.removeItem("selectedTaskImageUrl")
    }

    if (task.requires_photo) {
      router.replace("/kamera")
    } else {
      router.replace("/bekreft")
    }
  }

  function tilbake() {
    localStorage.removeItem("selectedTaskId")
    localStorage.removeItem("selectedTaskName")
    localStorage.removeItem("selectedTaskImageUrl")
    localStorage.removeItem("selectedTaskRequiresPhoto")
    router.push("/oppgavevalg")
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>{t.selectTask}</h1>

      {listeNavn && <p>{t.list}: {listeNavn}</p>}
      {feil && <p style={{ color: "red" }}>{feil}</p>}

      {tasks.length === 0 && !feil && (
        <p>
          {listeNavn === "Åpning" || listeNavn === "Stenging"
            ? t.noTasksToday
            : t.noTasksFound}
        </p>
      )}

      {tasks.map((task) => (
        <button
          key={task.id}
          onClick={() => velgOppgave(task)}
          style={{
            display: "block",
            margin: "12px 0",
            padding: "18px 24px",
            fontSize: "20px",
            borderRadius: "12px",
            border: "1px solid #ccc",
            cursor: "pointer",
            minWidth: "280px",
            textAlign: "left",
            background: "white",
            color: "#000",
          }}
        >
          {task.name}
        </button>
      ))}

      <button
        onClick={tilbake}
        style={{
          marginTop: 24,
          padding: "12px 18px",
          fontSize: "16px",
          borderRadius: "10px",
          border: "1px solid #ccc",
          cursor: "pointer",
          background: "white",
          color: "#000",
        }}
      >
        {t.back}
      </button>
    </main>
  )
}