"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { isLeader } from "@/lib/session"

type TaskList = {
  id: string
  name: string
  venue_id: string | null
}

export default function OppgavevalgPage() {
  const [taskLists, setTaskLists] = useState<TaskList[]>([])
  const [feil, setFeil] = useState("")
  const [ansatt, setAnsatt] = useState("")
  const [leader, setLeader] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const selectedVenue = localStorage.getItem("selectedVenue")
    const selectedEmployeeId = localStorage.getItem("selectedEmployeeId")
    const selectedEmployeeName = localStorage.getItem("selectedEmployeeName")

    if (!selectedVenue) {
      router.replace("/velg-sted")
      return
    }

    if (!selectedEmployeeId) {
      router.replace("/ansatt")
      return
    }

    if (selectedEmployeeName) {
      setAnsatt(selectedEmployeeName)
    }

    setLeader(isLeader())

    async function loadTaskLists() {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

      try {
        setFeil("")

        const res = await fetch(
          `${url}/rest/v1/task_lists?select=id,name,venue_id&venue_id=eq.${selectedVenue}&order=name`,
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
            "Fant ingen riktige oppgavelister for dette stedet. Sjekk at task_lists for valgt venue inneholder: Åpning, Andre oppgaver, Stenging"
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

  function gåTilAdminOppgaver() {
    router.push("/admin-oppgaver")
  }

  function tilbake() {
    router.push("/")
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Velg oppgavetype</h1>

      {ansatt && <p>Ansatt: {ansatt}</p>}
      {leader && <p>Rolle: Leader</p>}
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
            color: "#000",
          }}
        >
          {list.name}
        </button>
      ))}

      {leader && (
        <button
          onClick={gåTilAdminOppgaver}
          style={{
            display: "block",
            margin: "20px 0 12px 0",
            padding: "18px 24px",
            fontSize: "20px",
            borderRadius: "12px",
            border: "1px solid #ccc",
            cursor: "pointer",
            minWidth: "280px",
            textAlign: "left",
            background: "#f3f3f3",
            color: "#000",
            fontWeight: "bold",
          }}
        >
          Administrer oppgaver
        </button>
      )}

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
        Tilbake
      </button>
    </main>
  )
}