"use client"

import { useEffect, useState } from "react"

type LoggItem = {
  ansatt: string
  oppgave: string
  kommentar: string
  tidspunkt: string
  bilde?: string
}

export default function LoggPage() {
  const [logg, setLogg] = useState<LoggItem[]>([])

  useEffect(() => {
    const data = localStorage.getItem("hms-logg")
    if (data) {
      setLogg(JSON.parse(data))
    }
  }, [])

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <h1 className="mt-10 text-center text-3xl font-bold">HMS-logg</h1>

      <div className="mx-auto mt-10 flex max-w-md flex-col gap-4">
        {logg.length === 0 ? (
          <p className="text-center text-zinc-400">Ingen registreringer ennå</p>
        ) : (
          logg.map((item, index) => (
            <div key={index} className="rounded-xl bg-white p-4 text-black">
              <p><strong>Ansatt:</strong> {item.ansatt}</p>
              <p><strong>Oppgave:</strong> {item.oppgave}</p>
              <p><strong>Kommentar:</strong> {item.kommentar || "Ingen kommentar"}</p>

              {item.bilde && (
                <img
                  src={item.bilde}
                  alt="Registrert bilde"
                  className="mt-3 max-h-48 rounded-xl"
                />
              )}

              <p className="mt-2"><strong>Tid:</strong> {item.tidspunkt}</p>
            </div>
          ))
        )}
      </div>
    </main>
  )
}