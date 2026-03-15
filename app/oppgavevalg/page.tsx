"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type TaskList = {
  id: string
  name: string
}

export default function OppgavevalgPage() {
  const [taskLists, setTaskLists] = useState<TaskList[]>([])
  const [feil, setFeil] = useState("")
  const [ansatt, setAnsatt] = useState("")
  const router = useRouter()

  useEffect(() => {
    const selectedEmployeeId = localStorage.getItem("selectedEmployeeId")

    if (!selectedEmployeeId) {
      router.replace("/ansatt")
      return
    }

    const selectedEmployeeName = localStorage.getItem("selectedEmployeeName")
    if (selectedEmployeeName) {
      setAnsatt(selectedEmployeeName)
    }

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
          setFeil(data.message || "Kunne ikke hente oppgavelister")
          return
        }

        const ønsketRekkefølge = ["Åpning", "Andre oppgaver", "Stenging"]

        const filtrerteLister = (data as TaskList[])
          .filter((list) => ønsketRekkefølge.includes(list.name.trim()))
          .sort(
            (a, b) =>
              ønsketRekkefølge.indexOf(a.name.trim()) -
              ønsketRekkefølge.indexOf(b.name.trim())
          )

        setTaskLists(filtrerteLister)

        if (filtrerteLister.length === 0) {
          setFeil(
            `Fant ingen riktige oppgavelister. Sjekk at task_lists inneholder: Åpning, Andre oppgaver, Stenging`
          )
        }
      } catch (err) {
        setFeil(`Fetch-feil: ${String(err)}`)
      }
    }

    loadTaskLists()
  }, [router])

  function velgListe(list: TaskList) {
    localStorage.setItem("selectedTaskListId", list.id)
    localStorage.setItem("selectedTaskListName", list.name)
    router.push("/oppgave")
  }

  function tilbake() {
    router.push("/")
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Velg oppgavetype</h1>

      {ansatt && <p>Ansatt: {ansatt}</p>}
      {feil && <p style={{ color: "red" }}>{feil}</p>}

      {taskLists.map((list) => (
        <button
          key={list.id}
          onClick={() => velgListe(list)}
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
          }}
        >
          {list.name}
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
        }}
      >
        Tilbake
      </button>
    </main>
  )
}