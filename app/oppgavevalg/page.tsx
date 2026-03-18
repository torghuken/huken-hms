"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { isLeader } from "@/lib/session"

type TaskList = {
  id: string
  name: string
  venue_id: string | null
  hide_for_6_hours: boolean
}

export default function OppgavevalgPage() {
  const [taskLists, setTaskLists] = useState<TaskList[]>([])
  const [feil, setFeil] = useState("")
  const [status, setStatus] = useState("")
  const [ansatt, setAnsatt] = useState("")
  const [leader, setLeader] = useState(false)
  const [lagrerId, setLagrerId] = useState<string | null>(null)
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
    loadTaskLists(selectedVenue)
  }, [router])

  async function loadTaskLists(selectedVenue: string) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      setFeil("")

      const res = await fetch(
        `${url}/rest/v1/task_lists?select=id,name,venue_id,hide_for_6_hours&venue_id=eq.${selectedVenue}&order=name`,
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

  function velgListe(list: TaskList) {
    localStorage.setItem("selectedTaskListId", list.id)
    localStorage.setItem("selectedTaskListName", list.name)
    localStorage.setItem(
      "selectedTaskListHideFor6Hours",
      list.hide_for_6_hours ? "true" : "false"
    )
    router.push("/oppgave")
  }

  async function toggleHideMode(list: TaskList) {
    const selectedVenue = localStorage.getItem("selectedVenue")

    if (!selectedVenue) {
      setFeil("Fant ikke valgt sted")
      return
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const nyttValg = !list.hide_for_6_hours

    try {
      setFeil("")
      setStatus("")
      setLagrerId(list.id)

      const res = await fetch(`${url}/rest/v1/task_lists?id=eq.${list.id}`, {
        method: "PATCH",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          hide_for_6_hours: nyttValg,
        }),
      })

      if (!res.ok) {
        const data = await res.text()
        setFeil(data || "Kunne ikke oppdatere innstilling")
        return
      }

      setTaskLists((prev) =>
        prev.map((item) =>
          item.id === list.id
            ? { ...item, hide_for_6_hours: nyttValg }
            : item
        )
      )

      setStatus(
        nyttValg
          ? `${list.name} skjules i 6 timer etter utføring`
          : `${list.name} vises hele tiden`
      )
    } catch (err) {
      setFeil(`Fetch-feil: ${String(err)}`)
    } finally {
      setLagrerId(null)
      loadTaskLists(selectedVenue)
    }
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
      {status && <p style={{ color: "green" }}>{status}</p>}
      {feil && <p style={{ color: "red" }}>{feil}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {taskLists.map((list) => (
          <div
            key={list.id}
            style={{
              display: "flex",
              alignItems: "stretch",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => velgListe(list)}
              style={{
                display: "block",
                padding: "18px 24px",
                fontSize: "20px",
                borderRadius: "12px",
                border: "1px solid #ccc",
                cursor: "pointer",
                minWidth: "280px",
                textAlign: "left",
                background: "white",
                color: "#000",
                flex: "1 1 280px",
              }}
            >
              {list.name}
            </button>

            {leader && (
              <button
                type="button"
                onClick={() => toggleHideMode(list)}
                disabled={lagrerId === list.id}
                style={{
                  padding: "18px 20px",
                  fontSize: "16px",
                  borderRadius: "12px",
                  border: "1px solid #ccc",
                  cursor: lagrerId === list.id ? "default" : "pointer",
                  minWidth: "150px",
                  background: list.hide_for_6_hours ? "#dbeafe" : "#f3f4f6",
                  color: "#000",
                  fontWeight: "bold",
                  opacity: lagrerId === list.id ? 0.7 : 1,
                }}
              >
                {lagrerId === list.id
                  ? "Lagrer..."
                  : list.hide_for_6_hours
                  ? "Skjul 6t"
                  : "Vis alltid"}
              </button>
            )}
          </div>
        ))}
      </div>

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