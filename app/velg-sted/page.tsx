"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/language"

type Venue = {
  id: string
  name: string
  slug: string
}

type UiLanguage = "no" | "en" | "es" | "ru"

const venuePageTexts: Record<
  UiLanguage,
  {
    title: string
    couldNotFetchVenues: string
    fetchError: string
    noVenuesFound: string
  }
> = {
  no: {
    title: "Velg sted",
    couldNotFetchVenues: "Kunne ikke hente steder",
    fetchError: "Fetch-feil",
    noVenuesFound: "Ingen steder funnet",
  },
  en: {
    title: "Choose venue",
    couldNotFetchVenues: "Could not fetch venues",
    fetchError: "Fetch error",
    noVenuesFound: "No venues found",
  },
  es: {
    title: "Elegir local",
    couldNotFetchVenues: "No se pudieron obtener los locales",
    fetchError: "Error de carga",
    noVenuesFound: "No se encontraron locales",
  },
  ru: {
    title: "Выбрать заведение",
    couldNotFetchVenues: "Не удалось получить заведения",
    fetchError: "Ошибка загрузки",
    noVenuesFound: "Заведения не найдены",
  },
}

export default function VelgStedPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [feil, setFeil] = useState("")
  const router = useRouter()
  const { language } = useLanguage()

  const currentLanguage: UiLanguage =
    language === "en" || language === "es" || language === "ru" ? language : "no"
  const text = venuePageTexts[currentLanguage]

  useEffect(() => {
    async function loadVenues() {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

      try {
        const res = await fetch(`${url}/rest/v1/venues?select=id,name,slug`, {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        })

        const data = await res.json()

        if (!res.ok) {
          setFeil(data.message || text.couldNotFetchVenues)
          return
        }

        setVenues(data)
      } catch (err) {
        setFeil(`${text.fetchError}: ${String(err)}`)
      }
    }

    loadVenues()
  }, [text.couldNotFetchVenues, text.fetchError])

  function velgSted(venue: Venue) {
    localStorage.setItem("selectedVenue", venue.id)
    localStorage.setItem("selectedVenueName", venue.name)
    localStorage.setItem("selectedVenueSlug", venue.slug)

    router.push("/ansatt")
  }

  return (
    <main className="min-h-screen bg-black px-6 pt-20 text-white">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <h1 className="mb-12 text-3xl font-bold">{text.title}</h1>

        {feil && <p className="mb-4 text-red-400">{feil}</p>}

        <div className="flex w-full flex-col items-center gap-5">
          {venues.map((venue) => (
            <button
              key={venue.id}
              onClick={() => velgSted(venue)}
              className="h-20 w-[90%] rounded-2xl bg-white text-xl font-semibold text-black shadow-lg transition active:scale-95"
            >
              {venue.name}
            </button>
          ))}
        </div>

        {venues.length === 0 && !feil && (
          <p className="mt-8 text-zinc-400">{text.noVenuesFound}</p>
        )}
      </div>
    </main>
  )
}
