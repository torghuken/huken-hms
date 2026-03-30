"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/language"

export default function LoggPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [navn, setNavn] = useState("")

  useEffect(() => {
    const selectedVenue = localStorage.getItem("selectedVenue")
    const employeeId = localStorage.getItem("selectedEmployeeId")
    const employeeName = localStorage.getItem("selectedEmployeeName")
    const employeeRole = localStorage.getItem("selectedEmployeeRole")

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

    setNavn(employeeName || "")
  }, [router])

  return (
    <main className="min-h-screen bg-black px-6 pt-16 text-white">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <h1 className="mb-2 text-3xl font-bold">{t("log")}</h1>
        {navn && <p className="mb-10 text-zinc-400">{navn}</p>}

        <div className="flex w-full flex-col items-center gap-6">
          <button
            onClick={() => router.push("/logg/apning")}
            className="h-20 w-[90%] rounded-2xl bg-white text-xl font-semibold text-black shadow-lg transition active:scale-95"
          >
            {t("opening")}
          </button>

          <button
            onClick={() => router.push("/logg/stenging")}
            className="h-20 w-[90%] rounded-2xl bg-white text-xl font-semibold text-black shadow-lg transition active:scale-95"
          >
            {t("closing")}
          </button>

          <button
            onClick={() => router.push("/logg/temperatur")}
            className="h-20 w-[90%] rounded-2xl bg-white text-xl font-semibold text-black shadow-lg transition active:scale-95"
          >
            {t("temperature")}
          </button>

          <button
            onClick={() => router.push("/logg/fiks")}
            className="h-20 w-[90%] rounded-2xl bg-yellow-400 text-xl font-semibold text-black shadow-lg transition active:scale-95"
          >
            {t("thisNeedsFixing")}
          </button>

          <button
            onClick={() => router.push("/")}
            className="mt-8 w-[70%] rounded-xl border border-zinc-600 px-5 py-3 text-sm text-zinc-300 transition active:scale-95"
          >
            {t("back")}
          </button>
        </div>
      </div>
    </main>
  )
}