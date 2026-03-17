"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type Venue = {
  id: string
  name: string
  slug: string
}

export default function VelgStedPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [feil, setFeil] = useState("")
  const router = useRouter()

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
          setFeil(data.message || "Kunne ikke hente steder")
          return
        }

        setVenues(data)
      } catch (err) {
        setFeil(`Fetch-feil: ${String(err)}`)
      }
    }

    loadVenues()
  }, [])

  function velgSted(venue: Venue) {
    localStorage.setItem("selectedVenue", venue.id)
    localStorage.setItem("selectedVenueName", venue.name)
    localStorage.setItem("selectedVenueSlug", venue.slug)

    router.push("/ansatt")
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Velg sted</h1>

      {feil && <p style={{ color: "red" }}>{feil}</p>}

      {venues.map((venue) => (
        <button
          key={venue.id}
          onClick={() => velgSted(venue)}
          style={{
            display: "block",
            margin: "12px 0",
            padding: "18px 24px",
            fontSize: "20px",
            borderRadius: "12px",
            border: "1px solid #ccc",
            cursor: "pointer",
            minWidth: "220px",
            textAlign: "left",
            background: "white",
          }}
        >
          {venue.name}
        </button>
      ))}
    </main>
  )
}