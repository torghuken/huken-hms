"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function LoggPage() {
  const router = useRouter()
  const [navn, setNavn] = useState("")

  useEffect(() => {
    const employeeId = localStorage.getItem("selectedEmployeeId")
    const employeeName = localStorage.getItem("selectedEmployeeName")
    const employeeRole = localStorage.getItem("selectedEmployeeRole")

    if (!employeeId) {
      router.replace("/ansatt")
      return
    }

    if (employeeRole !== "leader") {
      router.replace("/")
      return
    }

    setNavn(employeeName || "")
  }, [router])

  return (
    <main className="min-h-screen bg-black px-6 pt-16 text-white">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <h1 className="mb-2 text-3xl font-bold">Logg</h1>
        {navn && <p className="mb-10 text-zinc-400">{navn}</p>}

        <div className="flex w-full flex-col items-center gap-6">
          <button
            onClick={() => router.push("/logg/apning")}
            className="h-20 w-[90%] rounded-2xl bg-white text-xl font-semibold text-black shadow-lg active:scale-95 transition"
          >
            Åpning
          </button>

          <button
            onClick={() => router.push("/logg/andre")}
            className="h-20 w-[90%] rounded-2xl bg-white text-xl font-semibold text-black shadow-lg active:scale-95 transition"
          >
            Andre oppgaver
          </button>

          <button
            onClick={() => router.push("/logg/stenging")}
            className="h-20 w-[90%] rounded-2xl bg-white text-xl font-semibold text-black shadow-lg active:scale-95 transition"
          >
            Stenging
          </button>

          <button
            onClick={() => router.push("/logg/temperatur")}
            className="h-20 w-[90%] rounded-2xl bg-white text-xl font-semibold text-black shadow-lg active:scale-95 transition"
          >
            Temperatur
          </button>

          <button
            onClick={() => router.push("/logg/fiks")}
            className="h-20 w-[90%] rounded-2xl bg-yellow-400 text-xl font-semibold text-black shadow-lg active:scale-95 transition"
          >
            Dette må fikses
          </button>

          <button
            onClick={() => router.push("/")}
            className="mt-8 w-[70%] rounded-xl border border-zinc-600 px-5 py-3 text-sm text-zinc-300 active:scale-95 transition"
          >
            Tilbake
          </button>
        </div>
      </div>
    </main>
  )
}