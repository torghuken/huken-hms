"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/language"

type Employee = {
  id: string
  name: string
  role: string | null
  venue_id: string | null
}

type UiLanguage = "no" | "en" | "es" | "ru"

const employeePageTexts: Record<
  UiLanguage,
  {
    title: string
    couldNotFetchEmployees: string
    fetchError: string
    noEmployeesFound: string
  }
> = {
  no: {
    title: "Velg ansatt",
    couldNotFetchEmployees: "Kunne ikke hente ansatte",
    fetchError: "Fetch-feil",
    noEmployeesFound: "Ingen ansatte funnet",
  },
  en: {
    title: "Choose employee",
    couldNotFetchEmployees: "Could not fetch employees",
    fetchError: "Fetch error",
    noEmployeesFound: "No employees found",
  },
  es: {
    title: "Elegir empleado",
    couldNotFetchEmployees: "No se pudieron obtener los empleados",
    fetchError: "Error de carga",
    noEmployeesFound: "No se encontraron empleados",
  },
  ru: {
    title: "Выбрать сотрудника",
    couldNotFetchEmployees: "Не удалось получить список сотрудников",
    fetchError: "Ошибка загрузки",
    noEmployeesFound: "Сотрудники не найдены",
  },
}

export default function AnsattPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [feil, setFeil] = useState("")
  const router = useRouter()
  const { language } = useLanguage()

  const currentLanguage: UiLanguage =
    language === "en" || language === "es" || language === "ru" ? language : "no"
  const text = employeePageTexts[currentLanguage]

  useEffect(() => {
    async function loadEmployees() {
      const selectedVenue = localStorage.getItem("selectedVenue")

      if (!selectedVenue) {
        router.replace("/velg-sted")
        return
      }

      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

      try {
        const res = await fetch(
          `${url}/rest/v1/employees?select=id,name,role,venue_id&venue_id=eq.${selectedVenue}`,
          {
            headers: {
              apikey: key,
              Authorization: `Bearer ${key}`,
            },
          }
        )

        const data = await res.json()

        if (!res.ok) {
          setFeil(data.message || text.couldNotFetchEmployees)
          return
        }

        setEmployees(data)
      } catch (err) {
        setFeil(`${text.fetchError}: ${String(err)}`)
      }
    }

    loadEmployees()
  }, [router, text.couldNotFetchEmployees, text.fetchError])

  function velgAnsatt(emp: Employee) {
    localStorage.setItem("selectedEmployeeId", emp.id)
    localStorage.setItem("selectedEmployeeName", emp.name)
    localStorage.setItem("selectedEmployeeRole", emp.role || "staff")

    router.replace("/")
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>{text.title}</h1>

      {feil && <p style={{ color: "red" }}>{feil}</p>}

      {employees.map((emp) => (
        <button
          key={emp.id}
          onClick={() => velgAnsatt(emp)}
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
          {emp.name}
        </button>
      ))}

      {employees.length === 0 && !feil && <p>{text.noEmployeesFound}</p>}
    </main>
  )
}