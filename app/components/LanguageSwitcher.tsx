"use client"

export default function LanguageSwitcher() {
  function setLang(lang: string) {
    localStorage.setItem("lang", lang)
    window.location.reload()
  }

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
        onClick={() => setLang("no")}
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
        onClick={() => setLang("en")}
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
        onClick={() => setLang("es")}
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
    </div>
  )
}