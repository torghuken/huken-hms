"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

type FixItem = {
  id: string
  navn: string
}

export default function MeldPage() {
  const router = useRouter()

  useEffect(() => {
    const employeeId = localStorage.getItem("selectedEmployeeId")

    if (!employeeId) {
      router.replace("/ansatt")
    }
  }, [])

  const kategorier: FixItem[] = [
    { id: "noe-er-delagt", navn: "Noe er ødelagt" },
    { id: "noe-virker-ikke", navn: "Noe virker ikke" },
    { id: "renhold-mangler", navn: "Renhold mangler" },
    { id: "sikkerhet", navn: "Sikkerhet" },
    { id: "gjesteomrade", navn: "Gjesteområde" },
    { id: "lager-varer", navn: "Lager / varer" },
    { id: "annet", navn: "Annet" },
  ]

  function velgKategori(item: FixItem) {
    localStorage.setItem("selectedFixCategoryId", item.id)
    localStorage.setItem("selectedFixCategoryName", item.navn)
    router.push("/kamera-fiks")
  }

  return (
    <main className="min-h-screen bg-black px-6 pt-20 text-white">
      <h1 className="mb-12 text-center text-3xl font-bold">
        Dette må fikses
      </h1>

      <div className="flex flex-col items-center gap-6">
        {kategorier.map((item) => (
          <button
            key={item.id}
            onClick={() => velgKategori(item)}
            className="h-20 w-[85%] rounded-2xl bg-yellow-400 px-6 text-left text-xl font-semibold text-black shadow-lg active:scale-95 transition"
          >
            {item.navn}
          </button>
        ))}
      </div>
    </main>
  )
}