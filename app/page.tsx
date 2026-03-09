import Link from "next/link"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-black text-white p-6">

      {/* Header */}
      <div className="text-center mt-10">
        <h1 className="text-3xl font-bold">Huken Brygg HMS</h1>
      </div>

      {/* Main buttons */}
      <div className="flex flex-col gap-4 w-full max-w-xs">

        <Link href="/oppgave">
          <button className="bg-white text-black p-4 rounded-xl text-lg font-semibold w-full">
            Registrer oppgave
          </button>
        </Link>

        <button className="bg-red-500 p-4 rounded-xl text-lg font-semibold">
          Registrer avvik
        </button>

      </div>

      {/* Camera button */}
      <div className="mb-10">
        <button className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-black text-xl">
          📷
        </button>
      </div>

    </main>
  )
}