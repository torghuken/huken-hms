"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/language"

type Employee = {
  id: string
  name: string
  role: string | null
}

type UiLanguage = "no" | "en" | "es" | "ru"

const pageTexts: Record<
  UiLanguage,
  {
    title: string
    addEmployee: string
    namePlaceholder: string
    roleStaff: string
    roleLeader: string
    add: string
    remove: string
    confirmRemove: string
    cancel: string
    back: string
    noEmployees: string
    adding: string
    couldNotAdd: string
    couldNotRemove: string
    nameRequired: string
  }
> = {
  no: {
    title: "Brukere",
    addEmployee: "Legg til ansatt",
    namePlaceholder: "Navn",
    roleStaff: "Ansatt",
    roleLeader: "Leder",
    add: "Legg til",
    remove: "Fjern",
    confirmRemove: "Bekreft fjerning",
    cancel: "Avbryt",
    back: "Tilbake",
    noEmployees: "Ingen ansatte funnet",
    adding: "Legger til...",
    couldNotAdd: "Kunne ikke legge til ansatt",
    couldNotRemove: "Kunne ikke fjerne ansatt",
    nameRequired: "Navn er påkrevd",
  },
  en: {
    title: "Users",
    addEmployee: "Add employee",
    namePlaceholder: "Name",
    roleStaff: "Staff",
    roleLeader: "Leader",
    add: "Add",
    remove: "Remove",
    confirmRemove: "Confirm removal",
    cancel: "Cancel",
    back: "Back",
    noEmployees: "No employees found",
    adding: "Adding...",
    couldNotAdd: "Could not add employee",
    couldNotRemove: "Could not remove employee",
    nameRequired: "Name is required",
  },
  es: {
    title: "Usuarios",
    addEmployee: "Agregar empleado",
    namePlaceholder: "Nombre",
    roleStaff: "Empleado",
    roleLeader: "Líder",
    add: "Agregar",
    remove: "Eliminar",
    confirmRemove: "Confirmar eliminación",
    cancel: "Cancelar",
    back: "Volver",
    noEmployees: "No se encontraron empleados",
    adding: "Agregando...",
    couldNotAdd: "No se pudo agregar el empleado",
    couldNotRemove: "No se pudo eliminar el empleado",
    nameRequired: "El nombre es obligatorio",
  },
  ru: {
    title: "Пользователи",
    addEmployee: "Добавить сотрудника",
    namePlaceholder: "Имя",
    roleStaff: "Персонал",
    roleLeader: "Руководитель",
    add: "Добавить",
    remove: "Удалить",
    confirmRemove: "Подтвердить удаление",
    cancel: "Отмена",
    back: "Назад",
    noEmployees: "Сотрудники не найдены",
    adding: "Добавление...",
    couldNotAdd: "Не удалось добавить сотрудника",
    couldNotRemove: "Не удалось удалить сотрудника",
    nameRequired: "Имя обязательно",
  },
}

export default function BrukerePage() {
  const router = useRouter()
  const { language } = useLanguage()
  const lang: UiLanguage =
    language === "en" || language === "es" || language === "ru" ? language : "no"
  const text = pageTexts[lang]

  const [employees, setEmployees] = useState<Employee[]>([])
  const [newName, setNewName] = useState("")
  const [newRole, setNewRole] = useState("staff")
  const [feil, setFeil] = useState("")
  const [status, setStatus] = useState("")
  const [adding, setAdding] = useState(false)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  useEffect(() => {
    const role = localStorage.getItem("selectedEmployeeRole")
    if (role !== "leader") {
      router.replace("/")
      return
    }
    loadEmployees()
  }, [router])

  async function loadEmployees() {
    const venueId = localStorage.getItem("selectedVenue")
    if (!venueId) return
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const res = await fetch(
      `${url}/rest/v1/employees?select=id,name,role&venue_id=eq.${venueId}&order=name`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    )
    const data = await res.json()
    if (Array.isArray(data)) setEmployees(data)
  }

  async function addEmployee() {
    if (!newName.trim()) {
      setFeil(text.nameRequired)
      return
    }
    const venueId = localStorage.getItem("selectedVenue")
    if (!venueId) return
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    setAdding(true)
    setFeil("")
    setStatus("")

    try {
      const res = await fetch(`${url}/rest/v1/employees`, {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          name: newName.trim(),
          role: newRole,
          venue_id: venueId,
        }),
      })

      if (!res.ok) {
        setFeil(text.couldNotAdd)
        return
      }

      setNewName("")
      setNewRole("staff")
      loadEmployees()
    } catch {
      setFeil(text.couldNotAdd)
    } finally {
      setAdding(false)
    }
  }

  async function removeEmployee(id: string) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    setFeil("")
    setStatus("")
    setConfirmingId(null)

    try {
      const res = await fetch(`${url}/rest/v1/employees?id=eq.${id}`, {
        method: "DELETE",
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      })

      if (!res.ok) {
        // If FK constraint, null out venue instead
        const patchRes = await fetch(`${url}/rest/v1/employees?id=eq.${id}`, {
          method: "PATCH",
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ venue_id: null }),
        })
        if (!patchRes.ok) {
          setFeil(text.couldNotRemove)
          return
        }
      }

      loadEmployees()
    } catch {
      setFeil(text.couldNotRemove)
    }
  }

  return (
    <main className="min-h-screen bg-black px-6 pb-12 pt-16 text-white">
      <div className="mx-auto max-w-md">
        <h1 className="mb-8 text-center text-3xl font-bold">{text.title}</h1>

        {feil && <p className="mb-4 text-red-400">{feil}</p>}
        {status && <p className="mb-4 text-green-400">{status}</p>}

        <div className="mb-8 rounded-2xl bg-zinc-900 p-4">
          <h2 className="mb-4 text-lg font-semibold">{text.addEmployee}</h2>
          <div className="space-y-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={text.namePlaceholder}
              className="w-full rounded-xl border border-zinc-700 bg-white p-3 text-black outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") addEmployee()
              }}
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setNewRole("staff")}
                className={`flex-1 rounded-xl py-3 text-sm font-semibold transition active:scale-95 ${
                  newRole === "staff"
                    ? "bg-white text-black"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {text.roleStaff}
              </button>
              <button
                type="button"
                onClick={() => setNewRole("leader")}
                className={`flex-1 rounded-xl py-3 text-sm font-semibold transition active:scale-95 ${
                  newRole === "leader"
                    ? "bg-white text-black"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {text.roleLeader}
              </button>
            </div>

            <button
              type="button"
              onClick={addEmployee}
              disabled={adding}
              className="w-full rounded-xl bg-white py-3 text-lg font-semibold text-black transition active:scale-95 disabled:opacity-50"
            >
              {adding ? text.adding : text.add}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="flex items-center justify-between rounded-2xl bg-zinc-800 px-5 py-4"
            >
              <div>
                <span className="font-medium">{emp.name}</span>
                <span className="ml-2 text-xs text-zinc-500">
                  {emp.role === "leader" ? text.roleLeader : text.roleStaff}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setConfirmingId(emp.id)}
                className="rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white transition active:scale-95"
              >
                {text.remove}
              </button>
            </div>
          ))}

          {employees.length === 0 && (
            <p className="text-center text-zinc-400">{text.noEmployees}</p>
          )}
        </div>

        <button
          onClick={() => router.push("/")}
          className="mt-10 w-full rounded-xl border border-zinc-600 py-3 text-sm text-zinc-300 transition active:scale-95"
        >
          {text.back}
        </button>
      </div>

      {confirmingId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setConfirmingId(null)}
        >
          <div
            className="mx-6 w-full max-w-sm rounded-2xl bg-zinc-900 p-6 text-center text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-2 text-lg font-semibold">{text.confirmRemove}</p>
            <p className="mb-6 text-sm text-zinc-400">
              {employees.find((e) => e.id === confirmingId)?.name}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmingId(null)}
                className="flex-1 rounded-xl border border-zinc-600 py-3 text-lg font-semibold text-zinc-300 transition active:scale-95"
              >
                {text.cancel}
              </button>
              <button
                type="button"
                onClick={() => removeEmployee(confirmingId)}
                className="flex-1 rounded-xl bg-red-500 py-3 text-lg font-semibold text-white transition active:scale-95"
              >
                {text.remove}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
