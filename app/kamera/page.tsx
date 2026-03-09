"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function KameraPage() {
  const [image, setImage] = useState<string | null>(null)
  const [kommentar, setKommentar] = useState("")
  const searchParams = useSearchParams()
  const router = useRouter()

  const oppgave = searchParams.get("oppgave") || ""
  const ansatt = searchParams.get("ansatt") || ""

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const url = URL.createObjectURL(file)
    setImage(url)
  }

  function handleSave() {
    const nyRegistrering = {
  ansatt,
  oppgave,
  kommentar,
  bilde: image,
  tidspunkt: new Date().toLocaleString("nb-NO"),
}

    const eksisterende = localStorage.getItem("hms-logg")
    const logg = eksisterende ? JSON.parse(eksisterende) : []

    logg.unshift(nyRegistrering)
    localStorage.setItem("hms-logg", JSON.stringify(logg))

    router.push("/logg")
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-black p-6 text-white">
      <h1 className="mt-10 text-3xl font-bold">Ta bilde</h1>

      {ansatt && (
        <p className="mt-4 text-lg text-zinc-300">
          Ansatt: {ansatt}
        </p>
      )}

      {oppgave && (
        <p className="mt-2 text-lg text-zinc-300">
          Oppgave: {oppgave}
        </p>
      )}

      <div className="mt-10 flex flex-col items-center gap-6">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImage}
          className="text-white"
        />

        {image && (
          <img
            src={image}
            alt="Valgt bilde"
            className="max-w-xs rounded-xl"
          />
        )}

        <textarea
          value={kommentar}
          onChange={(e) => setKommentar(e.target.value)}
          placeholder="Skriv kommentar..."
          className="w-full max-w-xs rounded-xl p-4 text-black"
        />

        <button
          onClick={handleSave}
          className="w-full max-w-xs rounded-xl bg-green-500 p-4 text-lg font-semibold"
        >
          Lagre
        </button>
      </div>
    </main>
  )
}