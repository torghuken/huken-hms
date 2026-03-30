"use client"

import { useEffect, useState } from "react"

type Log = {
  id: string
  comment: string | null
  image_url: string | null
  created_at: string
  status: string
}

export default function ProblemerPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [feil, setFeil] = useState("")

  useEffect(() => {
    const selectedVenue = localStorage.getItem("selectedVenue")
    if (selectedVenue) {
      loadLogs(selectedVenue)
    } else {
      loadLogs(null)
    }
  }, [])

  async function loadLogs(venueId: string | null) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      let query = `${url}/rest/v1/logs?select=id,comment,image_url,created_at,status,employees(venue_id)&order=created_at.desc`

      const res = await fetch(query, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        setFeil(data.message || "Kunne ikke hente logg")
        return
      }

      // Filtrer på venue hvis valgt
      const filtered = venueId
        ? data.filter((log: Log & { employees?: { venue_id?: string } | null }) =>
            log.employees?.venue_id === venueId
          )
        : data

      setLogs(filtered)
    } catch (err) {
      setFeil(String(err))
    }
  }

  async function markerFikset(id: string) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    await fetch(`${url}/rest/v1/logs?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "fixed",
      }),
    })

    const selectedVenue = localStorage.getItem("selectedVenue")
    loadLogs(selectedVenue)
  }

  const open = logs.filter((l) => l.status !== "fixed")
  const fixed = logs.filter((l) => l.status === "fixed")

  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <h1 className="mb-10 text-center text-3xl font-bold">
        Dette må fikses
      </h1>

      {feil && <p>{feil}</p>}

      {/* ÅPNE */}
      <h2 className="mb-4 text-xl font-semibold">Åpne</h2>

      <div className="space-y-6 mb-12">
        {open.map((log) => (
          <div
            key={log.id}
            className="rounded-xl bg-white p-4 text-black"
          >
            {log.image_url && (
              <img
                src={log.image_url}
                className="mb-3 rounded-lg"
              />
            )}

            <p className="mb-2">{log.comment}</p>

            <button
              onClick={() => markerFikset(log.id)}
              className="rounded-lg bg-red-500 px-4 py-2 text-white"
            >
              Marker som fikset
            </button>
          </div>
        ))}
      </div>

      {/* FIKSET */}
      <h2 className="mb-4 text-xl font-semibold">Fikset</h2>

      <div className="space-y-6">
        {fixed.map((log) => (
          <div
            key={log.id}
            className="rounded-xl bg-gray-200 p-4 text-black"
          >
            {log.image_url && (
              <img
                src={log.image_url}
                className="mb-3 rounded-lg opacity-70"
              />
            )}

            <p className="mb-2">{log.comment}</p>

            <p className="text-green-700 font-semibold">
              ✔ Fikset
            </p>
          </div>
        ))}
      </div>
    </main>
  )
}