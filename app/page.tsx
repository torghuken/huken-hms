"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()
  const [navn, setNavn] = useState("")
  const [rolle, setRolle] = useState("staff")

  useEffect(() => {
    const employeeId = localStorage.getItem("selectedEmployeeId")
    const employeeName = localStorage.getItem("selectedEmployeeName")
    const employeeRole = localStorage.getItem("selectedEmployeeRole")

    if (!employeeId) {
      router.replace("/ansatt")
      return
    }

    setNavn(employeeName || "")
    setRolle(employeeRole || "staff")
  }, [router])

  function byttBruker() {
    localStorage.removeItem("selectedEmployeeId")
    localStorage.removeItem("selectedEmployeeName")
    localStorage.removeItem("selectedEmployeeRole")
    localStorage.removeItem("selectedTaskListId")
    localStorage.removeItem("selectedTaskListName")
    localStorage.removeItem("selectedTaskId")
    localStorage.removeItem("selectedTaskName")
    localStorage.removeItem("selectedTaskImageUrl")
    localStorage.removeItem("selectedTaskRequiresPhoto")
    localStorage.removeItem("selectedFixCategoryId")
    localStorage.removeItem("selectedFixCategoryName")
    router.replace("/ansatt")
  }

  return (
    <main className="min-h-screen bg-black px-6 pt-16 text-white">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <h1 className="mb-12 text-2xl font-semibold">{navn}</h1>

        <div className="flex w-full flex-col items-center gap-6">
          <button
            onClick={() => router.push("/oppgavevalg")}
            className="h-20 w-[90%] rounded-2xl bg-white text-xl font-semibold text-black shadow-lg active:scale-95 transition"
          >
            Oppgaver
          </button>

          <button
            onClick={() => router.push("/temperatur")}
            className="h-20 w-[85%] rounded-2xl bg-white text-xl font-semibold text-black shadow-lg active:scale-95 transition"
          >
            Temperaturkontroll
          </button>

          <button
            onClick={() => router.push("/meld")}
            className="h-20 w-[80%] rounded-2xl bg-yellow-400 text-xl font-semibold text-black shadow-lg active:scale-95 transition"
          >
            Dette må fikses
          </button>

          {rolle === "leader" && (
            <>
              <button
                onClick={() => router.push("/logg")}
                className="h-20 w-[80%] rounded-2xl bg-zinc-700 text-xl font-semibold text-white shadow-lg active:scale-95 transition"
              >
                Logg
              </button>

              <button
                onClick={() => router.push("/admin-oppgaver")}
                className="h-20 w-[80%] rounded-2xl bg-zinc-800 text-xl font-semibold text-white shadow-lg active:scale-95 transition"
              >
                Administrer oppgaver
              </button>

              <button
                onClick={() => router.push("/admin-temperatur")}
                className="h-20 w-[80%] rounded-2xl bg-zinc-800 text-xl font-semibold text-white shadow-lg active:scale-95 transition"
              >
                Administrer temperatur
              </button>
            </>
          )}

          <button
            onClick={byttBruker}
            className="mt-8 rounded-xl border border-zinc-600 px-5 py-3 text-sm text-zinc-300 active:scale-95 transition"
          >
            Bytt bruker
          </button>
        </div>
      </div>
    </main>
  )
}