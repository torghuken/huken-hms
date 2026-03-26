"use client"

import { useLanguage } from "@/lib/language"

export default function LanguageSwitcher() {
  const { setLanguage } = useLanguage()

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        justifyContent: "center",
        marginBottom: 20,
        flexWrap: "wrap",
      }}
    >
      <button
        onClick={() => setLanguage("no")}
        style={{
          padding: "8px 14px",
          borderRadius: "10px",
          border: "1px solid #ccc",
          background: "white",
          color: "#000",
          cursor: "pointer",
        }}
      >
        Norsk
      </button>

      <button
        onClick={() => setLanguage("en")}
        style={{
          padding: "8px 14px",
          borderRadius: "10px",
          border: "1px solid #ccc",
          background: "white",
          color: "#000",
          cursor: "pointer",
        }}
      >
        English
      </button>

      <button
        onClick={() => setLanguage("es")}
        style={{
          padding: "8px 14px",
          borderRadius: "10px",
          border: "1px solid #ccc",
          background: "white",
          color: "#000",
          cursor: "pointer",
        }}
      >
        Español
      </button>

      <button
        onClick={() => setLanguage("ru")}
        style={{
          padding: "8px 14px",
          borderRadius: "10px",
          border: "1px solid #ccc",
          background: "white",
          color: "#000",
          cursor: "pointer",
        }}
      >
        Русский
      </button>
    </div>
  )
}