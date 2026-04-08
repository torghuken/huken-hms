"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { isLeader } from "@/lib/session"

export default function AdminPage() {
  const router = useRouter()
  const [klar, setKlar] = useState(false)

  useEffect(() => {
    if (!isLeader()) {
      router.replace("/")
      return
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setKlar(true)
  }, [router])

  if (!klar) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "black",
          color: "white",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <p>Laster...</p>
      </main>
    )
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "black",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 500,
          textAlign: "center",
        }}
      >
        <h1 style={{ marginBottom: 24 }}>Admin</h1>

        <p style={{ marginBottom: 24 }}>
          Denne siden er kun synlig for leader.
        </p>

        <button
          onClick={() => router.push("/")}
          style={{
            padding: "14px 20px",
            fontSize: "16px",
            borderRadius: "12px",
            border: "1px solid #444",
            background: "white",
            color: "black",
            cursor: "pointer",
          }}
        >
          Tilbake
        </button>
      </div>
    </main>
  )
}