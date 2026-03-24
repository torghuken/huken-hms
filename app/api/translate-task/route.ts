import { NextResponse } from "next/server"

async function translate(text: string, target: "EN" | "ES") {
  const apiKey = process.env.DEEPL_API_KEY

  const res = await fetch("https://api-free.deepl.com/v2/translate", {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: [text],
      source_lang: "NB",
      target_lang: target,
    }),
  })

  const data = await res.json()
  return data.translations[0].text
}

export async function POST(req: Request) {
  try {
    const { text } = await req.json()

    const [en, es] = await Promise.all([
      translate(text, "EN"),
      translate(text, "ES"),
    ])

    return NextResponse.json({
      name_no: text,
      name_en: en,
      name_es: es,
    })
  } catch (err) {
    return NextResponse.json({ error: "Feil ved oversettelse" }, { status: 500 })
  }
}