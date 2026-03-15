"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

export default function TemperaturEnhetPage() {
  const router = useRouter()
  const params = useParams()
  const unitId = params?.id as string

  const [ansatt, setAnsatt] = useState("")
  const [unitName, setUnitName] = useState("")
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
  }, [router])

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
      setStatus("Mangler navn eller enhet")
      return
    }

    if (!value) {
      setStatus("Velg temperatur først")
      return
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const temperatureValue = value === "9+" ? 10 : Number(value)

    try {
      setFlash(true)
      setTimeout(() => setFlash(false), 120)
      setStatus("Lagrer...")

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
        const text = await res.text()
        setStatus(`Kunne ikke lagre: ${text}`)
        return
      }

      setStatus("Lagret")
      setValue("")

      setTimeout(() => {
        router.replace("/temperatur")
      }, 500)
    } catch (err) {
      setStatus(`Feil: ${String(err)}`)
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
        <p className="text-sm text-zinc-400">Ansatt: {ansatt}</p>
        <h1 className="mt-2 text-center text-3xl font-bold">{unitName || "Temperatur"}</h1>

        <div className="mt-10 rounded-3xl border border-zinc-700 bg-zinc-900 py-8 text-center">
          <p className="text-7xl font-bold">{visning()}</p>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-3">
          {keys.flat().map((key) => {
            const label =
              key === "back" ? "⌫" : key === "ok" ? "OK" : key

            const isOk = key === "ok"

            return (
              <button
                key={key}
                onClick={() => pressKey(key)}
                className={`h-24 rounded-2xl text-3xl font-bold shadow-lg active:scale-95 transition ${
                  isOk
                    ? "bg-white text-black"
                    : "bg-zinc-800 text-white"
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        {status && (
          <p className="mt-6 text-center text-sm text-zinc-300">{status}</p>
        )}

        <button
          onClick={() => router.push("/temperatur")}
          className="mt-8 w-full rounded-xl border border-zinc-600 py-3 text-zinc-300"
        >
          Tilbake
        </button>
      </div>
    </main>
  )
}