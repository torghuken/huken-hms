"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type TemperatureUnit = {
  id: string
  name: string
  active: boolean
  sort_order: number
  image_url: string | null
  venue_id?: string | null
}

export default function AdminTemperaturPage() {
  const router = useRouter()
  const [units, setUnits] = useState<TemperatureUnit[]>([])
  const [feil, setFeil] = useState("")
  const [status, setStatus] = useState("")
  const [nyEnhet, setNyEnhet] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [laster, setLaster] = useState(false)
  const [lasterId, setLasterId] = useState<string | null>(null)

  useEffect(() => {
    const employeeId = localStorage.getItem("selectedEmployeeId")
    const employeeRole = localStorage.getItem("selectedEmployeeRole")
    const selectedVenue = localStorage.getItem("selectedVenue")

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

    loadUnits(selectedVenue)
  }, [router])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  async function loadUnits(selectedVenue: string) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      setFeil("")

      const res = await fetch(
        `${url}/rest/v1/temperature_units?select=id,name,active,sort_order,image_url,venue_id&venue_id=eq.${selectedVenue}&order=sort_order.asc,name.asc`,
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

  function onPickImage(file: File | null) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setImageFile(file)

    if (file) {
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      setPreviewUrl(null)
    }
  }

  async function uploadImageIfNeeded(): Promise<string | null> {
    if (!imageFile) return null

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const ext = imageFile.name.split(".").pop()?.toLowerCase() || "jpg"
    const filename = `temperature-unit-${Date.now()}.${ext}`

    const res = await fetch(
      `${url}/storage/v1/object/temperature-images/${filename}`,
      {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": imageFile.type || "image/jpeg",
        },
        body: imageFile,
      }
    )

    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || "Kunne ikke laste opp bilde")
    }

    return `${url}/storage/v1/object/public/temperature-images/${filename}`
  }

  async function leggTilEnhet() {
    const selectedVenue = localStorage.getItem("selectedVenue")

    if (!selectedVenue) {
      setFeil("Fant ikke valgt sted")
      return
    }

    if (!nyEnhet.trim()) {
      setFeil("Skriv navn på enhet")
      return
    }

    if (!imageFile) {
      setFeil("Velg bilde av enheten")
      return
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      setFeil("")
      setStatus("Lagrer enhet...")
      setLaster(true)

      const nextSort = units.length + 1
      const imageUrl = await uploadImageIfNeeded()

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
          image_url: imageUrl,
          venue_id: selectedVenue,
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        setFeil(text || "Kunne ikke lagre enhet")
        setStatus("")
        return
      }

      setNyEnhet("")
      setImageFile(null)

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      setPreviewUrl(null)

      setStatus("Enheten er lagret")
      loadUnits(selectedVenue)
    } catch (err) {
      setFeil(`Feil: ${String(err)}`)
      setStatus("")
    } finally {
      setLaster(false)
    }
  }

  async function toggleActive(unit: TemperatureUnit) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const selectedVenue = localStorage.getItem("selectedVenue")

    try {
      setFeil("")
      setStatus("")
      setLasterId(unit.id)

      const res = await fetch(
        `${url}/rest/v1/temperature_units?id=eq.${unit.id}`,
        {
          method: "PATCH",
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            active: !unit.active,
          }),
        }
      )

      if (!res.ok) {
        const text = await res.text()
        setFeil(text || "Kunne ikke endre enhet")
        return
      }

      setStatus(
        unit.active
          ? `Enheten "${unit.name}" er slått av`
          : `Enheten "${unit.name}" er slått på`
      )

      if (selectedVenue) {
        loadUnits(selectedVenue)
      }
    } catch (err) {
      setFeil(`Fetch-feil: ${String(err)}`)
    } finally {
      setLasterId(null)
    }
  }

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <h1 className="mb-8 text-center text-3xl font-bold">
        Administrer temperatur
      </h1>

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

            <div className="rounded-xl bg-zinc-800 p-3">
              <p className="mb-3 text-sm text-zinc-300">Bilde av enheten</p>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => onPickImage(e.target.files?.[0] || null)}
                className="w-full rounded-xl bg-white p-2 text-black"
              />

              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Forhåndsvisning av enhet"
                  className="mt-3 max-h-56 w-full rounded-xl object-cover"
                />
              )}
            </div>

            <button
              onClick={leggTilEnhet}
              disabled={laster}
              className="w-full rounded-xl bg-white px-4 py-3 text-lg font-semibold text-black disabled:opacity-60"
            >
              {laster ? "Lagrer..." : "Legg til"}
            </button>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-semibold">Enheter</h2>

          <div className="space-y-3">
            {units.map((unit) => (
              <div key={unit.id} className="rounded-xl bg-white p-4 text-black">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <span className="font-medium">{unit.name}</span>

                    {unit.image_url && (
                      <img
                        src={unit.image_url}
                        alt={unit.name}
                        className="mt-3 max-h-40 w-full rounded-xl object-cover"
                      />
                    )}
                  </div>

                  <button
                    onClick={() => toggleActive(unit)}
                    disabled={lasterId === unit.id}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                      unit.active
                        ? "bg-green-500 text-white"
                        : "bg-zinc-400 text-white"
                    } disabled:opacity-60`}
                  >
                    {lasterId === unit.id
                      ? "Lagrer..."
                      : unit.active
                      ? "På"
                      : "Av"}
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