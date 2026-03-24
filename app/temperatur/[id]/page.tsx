"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useLanguage } from "@/lib/language"

type UiLanguage = "no" | "en" | "es"

const temperatureUnitTexts: Record<
  UiLanguage,
  {
    employee: string
    couldNotFetchUnit: string
    fetchUnitError: string
    missingNameOrUnit: string
    selectTemperatureFirst: string
    saving: string
    couldNotSave: string
    saved: string
    error: string
    titleFallback: string
    back: string
  }
> = {
  no: {
    employee: "Ansatt",
    couldNotFetchUnit: "Kunne ikke hente enhet",
    fetchUnitError: "Feil ved henting av enhet",
    missingNameOrUnit: "Mangler navn eller enhet",
    selectTemperatureFirst: "Velg temperatur først",
    saving: "Lagrer...",
    couldNotSave: "Kunne ikke lagre",
    saved: "Lagret",
    error: "Feil",
    titleFallback: "Temperatur",
    back: "Tilbake",
  },
  en: {
    employee: "Employee",
    couldNotFetchUnit: "Could not fetch unit",
    fetchUnitError: "Error fetching unit",
    missingNameOrUnit: "Missing name or unit",
    selectTemperatureFirst: "Select temperature first",
    saving: "Saving...",
    couldNotSave: "Could not save",
    saved: "Saved",
    error: "Error",
    titleFallback: "Temperature",
    back: "Back",
  },
  es: {
    employee: "Empleado",
    couldNotFetchUnit: "No se pudo obtener la unidad",
    fetchUnitError: "Error al obtener la unidad",
    missingNameOrUnit: "Falta nombre o unidad",
    selectTemperatureFirst: "Selecciona primero la temperatura",
    saving: "Guardando...",
    couldNotSave: "No se pudo guardar",
    saved: "Guardado",
    error: "Error",
    titleFallback: "Temperatura",
    back: "Volver",
  },
}

export default function TemperaturEnhetPage() {
  const router = useRouter()
  const params = useParams()
  const { language } = useLanguage()
  const currentLanguage: UiLanguage =
    language === "en" || language === "es" ? language : "no"
  const text = temperatureUnitTexts[currentLanguage]
  const unitId = params?.id as string

  const [ansatt, setAnsatt] = useState("")
  const [unitName, setUnitName] = useState("")
  const [unitImageUrl, setUnitImageUrl] = useState<string | null>(null)
  const [employeeId, setEmployeeId] = useState<string | null>(null)
  const [value, setValue] = useState("")
  const [status, setStatus] = useState("")
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    const employeeName = localStorage.getItem("selectedEmployeeName")
    const employeeIdStored = localStorage.getItem("selectedEmployeeId")
    const unitNameStored = localStorage.getItem("selectedTemperatureUnitName")

    if (!employeeIdStored) {
      router.replace("/ansatt")
      return
    }

    setAnsatt(employeeName || "")
    setEmployeeId(employeeIdStored)
    setUnitName(unitNameStored || "")

    if (unitId) {
      loadUnit(unitId)
    }
  }, [router, unitId])

  async function loadUnit(id: string) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      const res = await fetch(
        `${url}/rest/v1/temperature_units?select=id,name,image_url&id=eq.${id}&limit=1`,
        {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        }
      )

      const data = await res.json()

      if (!res.ok) {
        setStatus(data.message || text.couldNotFetchUnit)
        return
      }

      const unit = data?.[0]

      if (unit?.name) {
        setUnitName(unit.name)
      }

      setUnitImageUrl(unit?.image_url || null)
    } catch (err) {
      setStatus(`${text.fetchUnitError}: ${String(err)}`)
    }
  }

  function pressKey(key: string) {
    if (key === "back") {
      setValue((prev) => prev.slice(0, -1))
      return
    }

    if (key === "ok") {
      lagre()
      return
    }

    setValue(key)
  }

  async function lagre() {
    if (!employeeId || !unitId) {
      setStatus(text.missingNameOrUnit)
      return
    }

    if (!value) {
      setStatus(text.selectTemperatureFirst)
      return
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const temperatureValue = value === "9+" ? 10 : Number(value)

    try {
      setFlash(true)
      setTimeout(() => setFlash(false), 120)
      setStatus(text.saving)

      const res = await fetch(`${url}/rest/v1/temperature_logs`, {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          unit_id: unitId,
          employee_id: employeeId,
          temperature_value: temperatureValue,
        }),
      })

      if (!res.ok) {
        const responseText = await res.text()
        setStatus(`${text.couldNotSave}: ${responseText}`)
        return
      }

      setStatus(text.saved)
      setValue("")

      setTimeout(() => {
        router.replace("/temperatur")
      }, 500)
    } catch (err) {
      setStatus(`${text.error}: ${String(err)}`)
    }
  }

  function visning() {
    if (!value) return "—"
    return value === "9+" ? "9+" : `${value}°`
  }

  const keys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9+"],
    ["back", "0", "ok"],
  ]

  return (
    <main className="min-h-screen bg-black px-6 pt-10 text-white">
      <div
        className={`pointer-events-none fixed inset-0 bg-white transition-opacity duration-100 ${
          flash ? "opacity-80" : "opacity-0"
        }`}
      />

      <div className="mx-auto flex max-w-md flex-col">
        <p className="text-sm text-zinc-400">
          {text.employee}: {ansatt}
        </p>
        <h1 className="mt-2 text-center text-3xl font-bold">
          {unitName || text.titleFallback}
        </h1>

        <div
          className="mt-8 overflow-hidden rounded-3xl border border-zinc-700"
          style={
            unitImageUrl
              ? {
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.7)), url(${unitImageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : {
                  background: "#18181b",
                }
          }
        >
          <div className="p-5">
            <div className="rounded-3xl border border-white/10 bg-black/35 py-8 text-center backdrop-blur-[1px]">
              <p className="text-7xl font-bold">{visning()}</p>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {keys.flat().map((key) => {
                const label = key === "back" ? "⌫" : key === "ok" ? "OK" : key
                const isOk = key === "ok"

                return (
                  <button
                    key={key}
                    onClick={() => pressKey(key)}
                    className={`h-24 rounded-2xl text-3xl font-bold shadow-lg transition active:scale-95 ${
                      isOk
                        ? "bg-white text-black"
                        : "border border-white/10 bg-black/45 text-white backdrop-blur-[1px]"
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {status && (
          <p className="mt-6 text-center text-sm text-zinc-300">{status}</p>
        )}

        <button
          onClick={() => router.push("/temperatur")}
          className="mt-8 w-full rounded-xl border border-zinc-600 py-3 text-zinc-300"
        >
          {text.back}
        </button>
      </div>
    </main>
  )
}