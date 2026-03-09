"use client"

import { useRouter } from "next/navigation"

type OppgavevalgPageProps = {
  searchParams: {
    ansatt?: string
  }
}

export default function OppgavevalgPage({ searchParams }: OppgavevalgPageProps) {
  const router = useRouter()
  const ansatt = searchParams?.ansatt || ""

  const oppgaver = [
    "🚪 Sjekk nødutganger",
    "🧻 Renhold toalett",
    "🍺 Bar og kjøkken klar",
    "🗑 Avfall tømt",
    "💰 Kasse oppgjør"
  ]

  return (
    <main className="flex min-h-screen flex-col items-center bg-black p-6 text-white">
      <h1 className="mt-10 text-3xl font-bold">Velg oppgave</h1>

      {ansatt && (
        <p className="mt-4 text-lg text-zinc-300">
          Ansatt: {ansatt}
        </p>
      )}

      <div className="mt-10 flex w-full max-w-xs flex-col gap-4">
        {oppgaver.map((oppgave) => (
          <button
            key={oppgave}
            onClick={() =>
              router.push(
                `/kamera?ansatt=${encodeURIComponent(ansatt)}&oppgave=${encodeURIComponent(oppgave)}`
              )
            }
            className="rounded-xl bg-white p-4 text-lg font-semibold text-black"
          >
            {oppgave}
          </button>
        ))}
      </div>
    </main>
  )
}