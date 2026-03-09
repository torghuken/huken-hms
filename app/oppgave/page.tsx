"use client"
import { useRouter } from "next/navigation"

export default function OppgavePage() {
  const router = useRouter()
  const ansatte = ["Ali", "Emma", "Jonas", "Sara", "Mina"]

  return (
    <main className="flex min-h-screen flex-col items-center bg-black p-6 text-white">
      <h1 className="mt-10 text-3xl font-bold">Velg ansatt</h1>

      <div className="mt-10 flex w-full max-w-xs flex-col gap-4">
        {ansatte.map((navn) => (
          <button
            key={navn}
            onClick={() => router.push(`/oppgavevalg?ansatt=${encodeURIComponent(navn)}`)}
            className="rounded-xl bg-white p-4 text-lg font-semibold text-black"
          >
            {navn}
          </button>
        ))}
      </div>
    </main>
  )
}