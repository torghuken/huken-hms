"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/language"

type FixItem = {
  id: string
  name_no: string
  name_en: string
  name_es: string
  name_ru: string
}

export default function MeldPage() {
  const router = useRouter()
  const { language, t } = useLanguage()

  useEffect(() => {
    const employeeId = localStorage.getItem("selectedEmployeeId")

    if (!employeeId) {
      router.replace("/ansatt")
    }
  }, [router])

  const kategorier: FixItem[] = [
    {
      id: "noe-er-delagt",
      name_no: "Noe er ødelagt",
      name_en: "Something is broken",
      name_es: "Algo está roto",
      name_ru: "Что-то сломано",
    },
    {
      id: "noe-virker-ikke",
      name_no: "Noe virker ikke",
      name_en: "Something is not working",
      name_es: "Algo no funciona",
      name_ru: "Что-то не работает",
    },
    {
      id: "renhold-mangler",
      name_no: "Renhold mangler",
      name_en: "Cleaning needed",
      name_es: "Falta limpieza",
      name_ru: "Нужна уборка",
    },
    {
      id: "sikkerhet",
      name_no: "Sikkerhet",
      name_en: "Safety",
      name_es: "Seguridad",
      name_ru: "Безопасность",
    },
    {
      id: "gjesteomrade",
      name_no: "Gjesteområde",
      name_en: "Guest area",
      name_es: "Área de clientes",
      name_ru: "Зона гостей",
    },
    {
      id: "lager-varer",
      name_no: "Lager / varer",
      name_en: "Stock / supplies",
      name_es: "Almacén / suministros",
      name_ru: "Склад / товары",
    },
    {
      id: "annet",
      name_no: "Annet",
      name_en: "Other",
      name_es: "Otro",
      name_ru: "Другое",
    },
  ]

  function getName(item: FixItem) {
    if (language === "en") return item.name_en
    if (language === "es") return item.name_es
    if (language === "ru") return item.name_ru
    return item.name_no
  }

  function velgKategori(item: FixItem) {
    const name = getName(item)

    localStorage.setItem("selectedFixCategoryId", item.id)
    localStorage.setItem("selectedFixCategoryName", name)

    router.push("/kamera-fiks")
  }

  return (
    <main className="min-h-screen bg-black px-6 pt-20 text-white">
      <h1 className="mb-12 text-center text-3xl font-bold">
        {t("thisNeedsFixing")}
      </h1>

      <div className="flex flex-col items-center gap-6">
        {kategorier.map((item) => (
          <button
            key={item.id}
            onClick={() => velgKategori(item)}
            className="h-20 w-[85%] rounded-2xl bg-yellow-400 px-6 text-left text-xl font-semibold text-black shadow-lg active:scale-95 transition"
          >
            {getName(item)}
          </button>
        ))}
      </div>
    </main>
  )
}