"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type TemperatureUnit = {
  id: string
  name: string
  active: boolean
  venue_id?: string | null
}

export default function TemperaturPage() {
  const router = useRouter()
  const [units, setUnits] = useState<TemperatureUnit[]>([])
  const [feil, setFeil] = useState("")

  useEffect(() => {
    const selectedVenue = localStorage.getItem("selectedVenue")
    const employeeId = localStorage.getItem("selectedEmployeeId")

    if (!selectedVenue) {
      router.replace("/velg-sted")
      return
    }

    if (!employeeId) {
      router.replace("/ansatt")
      return
    }

    loadUnits(selectedVenue)
  }, [router])

  async function loadUnits(selectedVenue: string) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      setFeil("")

      const res = await fetch(
        `${url}/rest/v1/temperature_units?select=id,name,active,venue_id&venue_id=eq.${selectedVenue}&active=eq.true&order=sort_order.asc,name.asc`,
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

  function velgEnhet(unit: TemperatureUnit) {
    localStorage.setItem("selectedTemperatureUnitId", unit.id)
    localStorage.setItem("selectedTemperatureUnitName", unit.name)
    router.push(`/temperatur/${unit.id}`)
  }

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <h1 className="mb-10 text-center text-3xl font-bold">Temperaturkontroll</h1>

      <div className="mx-auto flex max-w-md flex-col gap-4">
        {feil && <p className="text-red-400">{feil}</p>}

        {units.map((unit) => (
          <button
            key={unit.id}
            onClick={() => velgEnhet(unit)}
            className="rounded-2xl bg-white px-6 py-6 text-left text-xl font-semibold text-black shadow-lg transition active:scale-95"
          >
            {unit.name}
          </button>
        ))}

        {units.length === 0 && !feil && (
          <p className="text-center text-zinc-400">Ingen enheter funnet</p>
        )}

        <button
          onClick={() => router.push("/")}
          className="mt-6 w-full rounded-xl border border-zinc-600 py-3 text-zinc-300"
        >
          Tilbake
        </button>
      </div>
    </main>
  )
}