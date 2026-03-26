import { NextResponse } from "next/server"

type DeepLLang = "NB" | "EN" | "ES" | "RU"

const uiToDeepL: Record<string, DeepLLang> = {
  no: "NB",
  en: "EN",
  es: "ES",
  ru: "RU",
}

// Returnerer null ved feil istedenfor å kaste exception
async function translateSafe(
  text: string,
  target: DeepLLang,
  source?: DeepLLang
): Promise<{ text: string; detectedSource?: string } | null> {
  // Ikke oversett til samme språk som kilden
  if (source && source === target) return null

  const apiKey = process.env.DEEPL_API_KEY

  const body: Record<string, unknown> = {
    text: [text],
    target_lang: target,
  }

  if (source) {
    body.source_lang = source
  }

  try {
    const res = await fetch("https://api-free.deepl.com/v2/translate", {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) return null

    const data = await res.json()
    if (!data?.translations?.[0]) return null

    return {
      text: data.translations[0].text,
      detectedSource: data.translations[0].detected_source_language,
    }
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  try {
    const { text, sourceLang } = await req.json()

    if (!text?.trim()) {
      return NextResponse.json({ error: "Tom tekst" }, { status: 400 })
    }

    const result: Record<string, string> = {
      name_no: "",
      name_en: "",
      name_es: "",
      name_ru: "",
    }

    if (!sourceLang || sourceLang === "auto") {
      // Oversett til EN for å detektere kildespråk
      const enResult = await translateSafe(text, "EN")
      const detected = (enResult?.detectedSource as DeepLLang) || "NB"

      // Sett original tekst i riktig felt
      if (detected === "NB") result.name_no = text
      else if (detected === "EN") result.name_en = text
      else if (detected === "ES") result.name_es = text
      else if (detected === "RU") result.name_ru = text
      else result.name_no = text // ukjent språk → fallback til norsk

      // Sett EN-oversettelsen (hvis kilde ikke er EN)
      if (detected !== "EN" && enResult) {
        result.name_en = enResult.text
      }

      // Oversett til de resterende språkene
      const remaining: DeepLLang[] = (["NB", "ES", "RU"] as DeepLLang[]).filter(
        (l) => l !== detected
      )

      await Promise.all(
        remaining.map(async (target) => {
          const r = await translateSafe(text, target, detected)
          if (r) {
            if (target === "NB") result.name_no = r.text
            else if (target === "ES") result.name_es = r.text
            else if (target === "RU") result.name_ru = r.text
          }
        })
      )

      // Fallback: fyll tomme felt med originaltekst
      if (!result.name_no) result.name_no = text
      if (!result.name_en) result.name_en = text
      if (!result.name_es) result.name_es = text
      if (!result.name_ru) result.name_ru = text

      return NextResponse.json(result)
    }

    // Eksplisitt kildespråk (ny oppgave fra admin)
    const source: DeepLLang = uiToDeepL[sourceLang] || "NB"

    if (source === "NB") result.name_no = text
    else if (source === "EN") result.name_en = text
    else if (source === "ES") result.name_es = text
    else if (source === "RU") result.name_ru = text

    const targets: DeepLLang[] = (["NB", "EN", "ES", "RU"] as DeepLLang[]).filter(
      (l) => l !== source
    )

    await Promise.all(
      targets.map(async (target) => {
        const r = await translateSafe(text, target, source)
        if (r) {
          if (target === "NB") result.name_no = r.text
          else if (target === "EN") result.name_en = r.text
          else if (target === "ES") result.name_es = r.text
          else if (target === "RU") result.name_ru = r.text
        } else {
          // Fallback til originaltekst hvis oversettelse feiler
          if (target === "NB" && !result.name_no) result.name_no = text
          else if (target === "EN" && !result.name_en) result.name_en = text
          else if (target === "ES" && !result.name_es) result.name_es = text
          else if (target === "RU" && !result.name_ru) result.name_ru = text
        }
      })
    )

    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: "Feil ved oversettelse" }, { status: 500 })
  }
}
