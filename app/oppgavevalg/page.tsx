"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { isLeader } from "@/lib/session"
import { useLanguage } from "@/lib/language"

type TaskList = {
  id: string
  name: string
  venue_id: string | null
  hide_for_6_hours: boolean
}

function normalizeListName(name: string) {
  return name.trim().toLowerCase()
}

function isOpeningList(name: string) {
  const normalized = normalizeListName(name)
  return (
    normalized === "åpning" ||
    normalized === "opening" ||
    normalized === "apertura"
  )
}

function isDailyTasksList(name: string) {
  const normalized = normalizeListName(name)
  return (
    normalized === "daglige oppgaver" ||
    normalized === "daily tasks" ||
    normalized === "tareas diarias" ||
    normalized === "ежедневные задачи"
  )
}

function isClosingList(name: string) {
  const normalized = normalizeListName(name)
  return (
    normalized === "stenging" ||
    normalized === "closing" ||
    normalized === "cierre"
  )
}

export default function OppgavevalgPage() {
  const [taskLists, setTaskLists] = useState<TaskList[]>([])
  const [feil, setFeil] = useState("")
  const [status, setStatus] = useState("")
  const [leader, setLeader] = useState(false)
  const [lagrerId, setLagrerId] = useState<string | null>(null)

  const router = useRouter()
  const { t } = useLanguage()

  useEffect(() => {
    const selectedVenue = localStorage.getItem("selectedVenue")
    const selectedEmployeeId = localStorage.getItem("selectedEmployeeId")

    if (!selectedVenue) {
      router.replace("/velg-sted")
      return
    }

    if (!selectedEmployeeId) {
      router.replace("/ansatt")
      return
    }

    setLeader(isLeader())
    loadTaskLists(selectedVenue)
  }, [router, t])

  function getListSortOrder(name: string) {
    if (isOpeningList(name)) return 0
    if (isDailyTasksList(name)) return 1
    if (isClosingList(name)) return 2
    return 999
  }

  function getTranslatedTaskListName(name: string) {
    if (isOpeningList(name)) return t("opening")
    if (isDailyTasksList(name)) return t("dailyTasks")
    if (isClosingList(name)) return t("closing")
    return name
  }

  async function loadTaskLists(selectedVenue: string) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      setFeil("")
      setStatus("")

      const res = await fetch(
        `${url}/rest/v1/task_lists?select=id,name,venue_id,hide_for_6_hours&venue_id=eq.${selectedVenue}&order=name`,
        {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        }
      )

      const data = await res.json()

      if (!res.ok) {
        setFeil(data.message || t("couldNotFetchTaskLists"))
        return
      }

      const filtrerteLister = (data as TaskList[])
        .filter(
          (list) =>
            isOpeningList(list.name) ||
            isDailyTasksList(list.name) ||
            isClosingList(list.name)
        )
        .sort((a, b) => getListSortOrder(a.name) - getListSortOrder(b.name))

      setTaskLists(filtrerteLister)

      if (filtrerteLister.length === 0) {
        setFeil(t("missingDefaultTaskLists"))
      }
    } catch (err) {
      setFeil(`${t("fetchError")}: ${String(err)}`)
    }
  }

  function velgListe(list: TaskList) {
    localStorage.setItem("selectedTaskListId", list.id)
    localStorage.setItem("selectedTaskListName", list.name)
    localStorage.setItem(
      "selectedTaskListHideFor6Hours",
      list.hide_for_6_hours ? "true" : "false"
    )
    router.push("/oppgave")
  }

  async function toggleHideMode(list: TaskList) {
    const selectedVenue = localStorage.getItem("selectedVenue")

    if (!selectedVenue) {
      setFeil(t("missingSelectedVenue"))
      return
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const nyttValg = !list.hide_for_6_hours

    try {
      setFeil("")
      setStatus("")
      setLagrerId(list.id)

      const res = await fetch(`${url}/rest/v1/task_lists?id=eq.${list.id}`, {
        method: "PATCH",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          hide_for_6_hours: nyttValg,
        }),
      })

      if (!res.ok) {
        const data = await res.text()
        setFeil(data || t("couldNotUpdateSetting"))
        return
      }

      setTaskLists((prev) =>
        prev.map((item) =>
          item.id === list.id
            ? { ...item, hide_for_6_hours: nyttValg }
            : item
        )
      )

      const listName = getTranslatedTaskListName(list.name)

      setStatus(
        nyttValg
          ? `${listName} ${t("hiddenFor6HoursAfterCompletion")}`
          : `${listName} ${t("shownAllTheTime")}`
      )
    } catch (err) {
      setFeil(`${t("fetchError")}: ${String(err)}`)
    } finally {
      setLagrerId(null)
      loadTaskLists(selectedVenue)
    }
  }

  return (
    <main className="min-h-screen bg-black px-6 pt-20 text-white">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <h1 className="mb-12 text-3xl font-bold">{t("chooseTaskType")}</h1>

        {status && <p className="mb-4 text-green-400">{status}</p>}
        {feil && <p className="mb-4 text-red-400">{feil}</p>}

        <div className="flex w-full flex-col items-center gap-5">
          {taskLists.map((list) => (
            <div key={list.id} className="flex w-[90%] items-stretch gap-3">
              <button
                onClick={() => velgListe(list)}
                className="h-20 flex-1 rounded-2xl bg-white text-xl font-semibold text-black shadow-lg transition active:scale-95"
              >
                {getTranslatedTaskListName(list.name)}
              </button>

              {leader && (
                <button
                  type="button"
                  onClick={() => toggleHideMode(list)}
                  disabled={lagrerId === list.id}
                  className={`flex-shrink-0 rounded-2xl px-4 text-sm font-bold transition active:scale-95 disabled:opacity-50 ${
                    list.hide_for_6_hours
                      ? "bg-blue-500 text-white"
                      : "bg-zinc-700 text-zinc-300"
                  }`}
                >
                  {lagrerId === list.id
                    ? t("saving")
                    : list.hide_for_6_hours
                    ? t("hide6h")
                    : t("showAlways")}
                </button>
              )}
            </div>
          ))}

          {leader && (
            <button
              onClick={() => router.push("/admin-oppgaver")}
              className="h-16 w-[85%] rounded-2xl bg-zinc-800 text-lg font-semibold text-white shadow-lg transition active:scale-95"
            >
              {t("manageTasks")}
            </button>
          )}
        </div>

        <button
          onClick={() => router.push("/")}
          className="mt-10 rounded-xl border border-zinc-600 px-5 py-3 text-sm text-zinc-300 transition active:scale-95"
        >
          {t("back")}
        </button>
      </div>
    </main>
  )
}
