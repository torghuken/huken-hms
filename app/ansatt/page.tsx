"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type Employee = {
  id: string
  name: string
  role: string | null
}

export default function AnsattPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [feil, setFeil] = useState("")
  const router = useRouter()

  useEffect(() => {
    async function loadEmployees() {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

      try {
        const res = await fetch(
          `${url}/rest/v1/employees?select=id,name,role`,
          {
            headers: {
              apikey: key,
              Authorization: `Bearer ${key}`,
            },
          }
        )

        const data = await res.json()

        if (!res.ok) {
          setFeil(data.message || "Kunne ikke hente ansatte")
          return
        }

        setEmployees(data)
      } catch (err) {
        setFeil(`Fetch-feil: ${String(err)}`)
      }
    }

    loadEmployees()
  }, [])

  function velgAnsatt(emp: Employee) {
    localStorage.setItem("selectedEmployeeId", emp.id)
    localStorage.setItem("selectedEmployeeName", emp.name)
    localStorage.setItem("selectedEmployeeRole", emp.role || "staff")
    router.replace("/")
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Velg ansatt</h1>

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
    </main>
  )
}