"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type TemperatureUnit = {
  id: string
  name: string
  active: boolean
  sort_order: number
}

export default function AdminTemperaturPage() {
  const router = useRouter()
  const [units, setUnits] = useState<TemperatureUnit[]>([])
  const [feil, setFeil] = useState("")
  const [status, setStatus] = useState("")
  const [nyEnhet, setNyEnhet] = useState("")

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

    loadUnits()
  }, [router])

  async function loadUnits() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      const res = await fetch(
        `${url}/rest/v1/temperature_units?select=id,name,active,sort_order&order=sort_order.asc,name.asc`,
        {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        }
      )

      const data = await res.json()

      if (!res.ok) {
        setFeil(data.message || "Kunne ikke hente enheter")
        return
      }

      setUnits(data)
    } catch (err) {
      setFeil(`Fetch-feil: ${String(err)}`)
    }
  }

  async function leggTilEnhet() {
    if (!nyEnhet.trim()) {
      setFeil("Skriv navn på enhet")
      return
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      setFeil("")
      setStatus("Lagrer enhet...")

      const nextSort = units.length + 1

      const res = await fetch(`${url}/rest/v1/temperature_units`, {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          name: nyEnhet.trim(),
          active: true,
          sort_order: nextSort,
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        setFeil(text || "Kunne ikke lagre enhet")
        setStatus("")
        return
      }

      setNyEnhet("")
      setStatus("Enheten er lagret")
      loadUnits()
    } catch (err) {
      setFeil(`Feil: ${String(err)}`)
      setStatus("")
    }
  }

  async function toggleActive(unit: TemperatureUnit) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      const res = await fetch(`${url}/rest/v1/temperature_units?id=eq.${unit.id}`, {
        method: "PATCH",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          active: !unit.active,
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        setFeil(text || "Kunne ikke endre enhet")
        return
      }

      loadUnits()
    } catch (err) {
      setFeil(`Fetch-feil: ${String(err)}`)
    }
  }

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <h1 className="mb-8 text-center text-3xl font-bold">Administrer temperatur</h1>

      <div className="mx-auto max-w-md space-y-8">
        {feil && <p className="text-red-400">{feil}</p>}
        {status && <p className="text-green-400">{status}</p>}

        <div className="rounded-2xl bg-zinc-900 p-4">
          <h2 className="mb-4 text-xl font-semibold">Legg til enhet</h2>

          <div className="space-y-3">
            <input
              value={nyEnhet}
              onChange={(e) => setNyEnhet(e.target.value)}
              placeholder="Navn på enhet"
              className="w-full rounded-xl border border-zinc-700 bg-white p-3 text-black outline-none"
            />

            <button
              onClick={leggTilEnhet}
              className="w-full rounded-xl bg-white px-4 py-3 text-lg font-semibold text-black"
            >
              Legg til
            </button>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-semibold">Enheter</h2>

          <div className="space-y-3">
            {units.map((unit) => (
              <div
                key={unit.id}
                className="rounded-xl bg-white p-4 text-black"
              >
                <div className="flex items-center justify-between gap-4">
                  <span>{unit.name}</span>

                  <button
                    onClick={() => toggleActive(unit)}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                      unit.active
                        ? "bg-green-500 text-white"
                        : "bg-zinc-400 text-white"
                    }`}
                  >
                    {unit.active ? "På" : "Av"}
                  </button>
                </div>
              </div>
            ))}

            {units.length === 0 && (
              <p className="text-zinc-400">Ingen enheter lagt til ennå</p>
            )}
          </div>
        </div>

        <button
          onClick={() => router.push("/")}
          className="w-full rounded-xl border border-zinc-600 px-4 py-3 text-zinc-200"
        >
          Tilbake
        </button>
      </div>
    </main>
  )
}