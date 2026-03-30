"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/language"
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

type Task = {
  id: string
  name: string
  name_no: string | null
  name_en: string | null
  name_es: string | null
  name_ru: string | null
  active: boolean
  sort_order: number | null
  image_url: string | null
  requires_photo: boolean
  is_monthly: boolean
  show_monday: boolean
  show_tuesday: boolean
  show_wednesday: boolean
  show_thursday: boolean
  show_friday: boolean
  show_saturday: boolean
  show_sunday: boolean
}

type RecentLog = {
  task_id: string | null
  created_at: string
}

function getTodayColumn() {
  const day = new Date().getDay()

  switch (day) {
    case 1:
      return "show_monday"
    case 2:
      return "show_tuesday"
    case 3:
      return "show_wednesday"
    case 4:
      return "show_thursday"
    case 5:
      return "show_friday"
    case 6:
      return "show_saturday"
    case 0:
      return "show_sunday"
    default:
      return "show_monday"
  }
}

function getSixHoursAgoIso() {
  return new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
}

function get21DaysAgoIso() {
  return new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
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

function isClosingList(name: string) {
  const normalized = normalizeListName(name)
  return (
    normalized === "stenging" ||
    normalized === "closing" ||
    normalized === "cierre"
  )
}

function getTaskDisplayName(
  task: Task,
  language: string
) {
  if (language === "en") return task.name_en || task.name_no || task.name
  if (language === "es") return task.name_es || task.name_no || task.name
  if (language === "ru") return task.name_ru || task.name_no || task.name
  return task.name_no || task.name
}

function SortableTaskCard({
  task,
  flytterId,
  onOpen,
  onDelete,
  deleteLabel,
  dragLabel,
  movingLabel,
  displayName,
}: {
  task: Task
  flytterId: string | null
  onOpen: (task: Task) => void
  onDelete: (task: Task) => void
  deleteLabel: string
  dragLabel: string
  movingLabel: string
  displayName: string
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onOpen(task)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onOpen(task)
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div
        style={{
          display: "block",
          width: "100%",
          padding: "18px 24px",
          fontSize: "20px",
          borderRadius: "12px",
          border: "1px solid #ccc",
          textAlign: "left",
          background: "white",
          color: "#000",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <span>{displayName}</span>

          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                onDelete(task)
              }}
              style={{
                padding: "8px 12px",
                fontSize: "14px",
                borderRadius: "10px",
                border: "1px solid #dc2626",
                background: "#ef4444",
                color: "white",
                cursor: "pointer",
              }}
            >
              {deleteLabel}
            </button>

            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              {...attributes}
              {...listeners}
              style={{
                padding: "8px 12px",
                fontSize: "14px",
                borderRadius: "10px",
                border: "1px solid #ccc",
                background: "#f3f3f3",
                color: "#666",
                cursor: "grab",
                touchAction: "none",
              }}
            >
              {flytterId === task.id ? movingLabel : dragLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OppgavePage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [feil, setFeil] = useState("")
  const [status, setStatus] = useState("")
  const [listeNavn, setListeNavn] = useState("")
  const [isLeader, setIsLeader] = useState(false)
  const [selectedTaskListId, setSelectedTaskListId] = useState("")
  const [hideFor6Hours, setHideFor6Hours] = useState(false)
  const [flytterId, setFlytterId] = useState<string | null>(null)
  const router = useRouter()
  const { t, language } = useLanguage()

  const todayColumn = useMemo(() => getTodayColumn(), [])
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    })
  )

  useEffect(() => {
    const selectedEmployeeId = localStorage.getItem("selectedEmployeeId")
    const selectedEmployeeRole = localStorage.getItem("selectedEmployeeRole")
    const taskListId = localStorage.getItem("selectedTaskListId")
    const taskListName = localStorage.getItem("selectedTaskListName")
    const taskListHideFor6Hours =
      localStorage.getItem("selectedTaskListHideFor6Hours") === "true"

    if (!selectedEmployeeId) {
      router.replace("/ansatt")
      return
    }

    setIsLeader(selectedEmployeeRole === "leader")

    if (taskListName) {
      setListeNavn(taskListName)
    }

    if (!taskListId) {
      setFeil(t("noTaskTypeSelected"))
      return
    }

    setSelectedTaskListId(taskListId)
    setHideFor6Hours(taskListHideFor6Hours)
    loadTasks(taskListId, taskListName || "", taskListHideFor6Hours)
  }, [router, todayColumn, t])

  function getTranslatedListName(name: string) {
    if (isOpeningList(name)) {
      return t("opening")
    }

    if (isClosingList(name)) {
      return t("closing")
    }

    return name
  }

  async function loadTasks(
    taskListId: string,
    taskListName: string,
    hideListFor6Hours: boolean
  ) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      setFeil("")

      let query =
        `${url}/rest/v1/tasks?` +
        `select=id,name,name_no,name_en,name_es,name_ru,active,sort_order,image_url,requires_photo,is_monthly,show_monday,show_tuesday,show_wednesday,show_thursday,show_friday,show_saturday,show_sunday` +
        `&list_id=eq.${taskListId}` +
        `&active=eq.true` +
        `&order=sort_order.asc,name.asc`

      if (isOpeningList(taskListName) || isClosingList(taskListName)) {
        query += `&${todayColumn}=eq.true`
      }

      const res = await fetch(query, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        setFeil(data.message || t("couldNotFetchTasks"))
        return
      }

      const allTasks: Task[] = data

      if (allTasks.length === 0) {
        setTasks(allTasks)
        return
      }

      const monthlyTasks = allTasks.filter((t) => t.is_monthly)
      const regularTasks = allTasks.filter((t) => !t.is_monthly)

      // Hent logs for månedlige oppgaver (alltid, uavhengig av hide_for_6_hours)
      // Hent logs for vanlige oppgaver (kun hvis hide_for_6_hours er satt)
      const needsLogCheck = monthlyTasks.length > 0 || hideListFor6Hours

      if (!needsLogCheck) {
        setTasks(allTasks)
        return
      }

      const taskIdsToCheck: string[] = []
      if (monthlyTasks.length > 0) {
        monthlyTasks.forEach((t) => taskIdsToCheck.push(t.id))
      }
      if (hideListFor6Hours && regularTasks.length > 0) {
        regularTasks.forEach((t) => taskIdsToCheck.push(t.id))
      }

      const oldestCutoff = monthlyTasks.length > 0 ? get21DaysAgoIso() : getSixHoursAgoIso()

      const logsQuery =
        `${url}/rest/v1/logs?select=task_id,created_at` +
        `&task_id=in.(${taskIdsToCheck.join(",")})` +
        `&created_at=gte.${encodeURIComponent(oldestCutoff)}` +
        `&order=created_at.desc`

      const logsRes = await fetch(logsQuery, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      })

      const logsData = await logsRes.json()

      if (!logsRes.ok) {
        setFeil(logsData.message || t("couldNotFetchRecentLogs"))
        return
      }

      const recentLogs: RecentLog[] = logsData

      // Månedlige oppgaver: skjul hvis utført siste 21 dager
      const twentyOneDaysAgoIso = get21DaysAgoIso()
      const monthlyHiddenIds = new Set(
        recentLogs
          .filter((log) => log.created_at >= twentyOneDaysAgoIso)
          .filter((log) => monthlyTasks.some((t) => t.id === log.task_id))
          .map((log) => log.task_id)
          .filter((id): id is string => Boolean(id))
      )

      // Vanlige oppgaver: skjul hvis utført siste 6 timer (kun hvis hide_for_6_hours)
      const sixHoursAgoIso = getSixHoursAgoIso()
      const regularHiddenIds = hideListFor6Hours
        ? new Set(
            recentLogs
              .filter((log) => log.created_at >= sixHoursAgoIso)
              .filter((log) => regularTasks.some((t) => t.id === log.task_id))
              .map((log) => log.task_id)
              .filter((id): id is string => Boolean(id))
          )
        : new Set<string>()

      const visibleTasks = allTasks.filter(
        (task) =>
          !monthlyHiddenIds.has(task.id) && !regularHiddenIds.has(task.id)
      )
      setTasks(visibleTasks)
    } catch (err) {
      setFeil(`${t("fetchError")}: ${String(err)}`)
    }
  }

  function velgOppgave(task: Task) {
    const displayName = getTaskDisplayName(task, language)

    localStorage.setItem("selectedTaskId", task.id)
    localStorage.setItem("selectedTaskName", displayName)
    localStorage.setItem(
      "selectedTaskRequiresPhoto",
      task.requires_photo ? "true" : "false"
    )

    if (task.image_url) {
      localStorage.setItem("selectedTaskImageUrl", task.image_url)
    } else {
      localStorage.removeItem("selectedTaskImageUrl")
    }

    if (task.requires_photo) {
      router.replace("/kamera")
    } else {
      router.replace("/bekreft")
    }
  }

  async function slettOppgave(task: Task) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      setFeil("")
      setStatus("")

      const res = await fetch(`${url}/rest/v1/tasks?id=eq.${task.id}`, {
        method: "PATCH",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          active: false,
        }),
      })

      if (!res.ok) {
        const data = await res.text()
        throw new Error(data || t("couldNotDeleteTask"))
      }

      setTasks((prev) => prev.filter((item) => item.id !== task.id))
      setStatus(`${t("taskDeleted")}: "${getTaskDisplayName(task, language)}"`)
    } catch (err) {
      setFeil(`${t("deleteError")}: ${String(err)}`)
    }
  }

  async function saveSortOrder(updatedTasks: Task[]) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    for (let i = 0; i < updatedTasks.length; i++) {
      const task = updatedTasks[i]

      const res = await fetch(`${url}/rest/v1/tasks?id=eq.${task.id}`, {
        method: "PATCH",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sort_order: i + 1,
        }),
      })

      if (!res.ok) {
        const data = await res.text()
        throw new Error(data || t("couldNotSaveOrder"))
      }
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = tasks.findIndex((task) => task.id === active.id)
    const newIndex = tasks.findIndex((task) => task.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const movedTasks = arrayMove(tasks, oldIndex, newIndex).map((task, index) => ({
      ...task,
      sort_order: index + 1,
    }))

    setTasks(movedTasks)

    try {
      setFeil("")
      setStatus("")
      setFlytterId(String(active.id))

      await saveSortOrder(movedTasks)
      setStatus(`${t("orderSavedFor")}: "${getTranslatedListName(listeNavn)}"`)
    } catch (err) {
      setFeil(`${t("error")}: ${String(err)}`)
      if (selectedTaskListId) {
        loadTasks(selectedTaskListId, listeNavn, hideFor6Hours)
      }
    } finally {
      setFlytterId(null)
    }
  }

  function tilbake() {
    localStorage.removeItem("selectedTaskId")
    localStorage.removeItem("selectedTaskName")
    localStorage.removeItem("selectedTaskImageUrl")
    localStorage.removeItem("selectedTaskRequiresPhoto")
    localStorage.removeItem("selectedTaskListHideFor6Hours")
    router.push("/oppgavevalg")
  }

  const translatedListName = getTranslatedListName(listeNavn)
  const isOpeningOrClosing =
    isOpeningList(listeNavn) || isClosingList(listeNavn)

  return (
    <main style={{ padding: 40 }}>
      <h1>{t("selectTask")}</h1>

      {listeNavn && (
        <p>
          {t("list")}: {translatedListName}
        </p>
      )}

      {isLeader && (
        <p style={{ color: "#666", marginTop: 8 }}>{t("adminTaskHelp")}</p>
      )}

      {status && <p style={{ color: "green" }}>{status}</p>}
      {feil && <p style={{ color: "red" }}>{feil}</p>}

      {tasks.length === 0 && !feil && (
        <p>{isOpeningOrClosing ? t("noTasksToday") : t("noTasksFound")}</p>
      )}

      {!isLeader &&
        tasks.map((task) => (
          <button
            key={task.id}
            onClick={() => velgOppgave(task)}
            style={{
              display: "block",
              margin: "12px 0",
              padding: "18px 24px",
              fontSize: "20px",
              borderRadius: "12px",
              border: "1px solid #ccc",
              cursor: "pointer",
              minWidth: "280px",
              textAlign: "left",
              background: "white",
              color: "#000",
            }}
          >
            {getTaskDisplayName(task, language)}
          </button>
        ))}

      {isLeader && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={tasks.map((task) => task.id)}
            strategy={verticalListSortingStrategy}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                marginTop: 12,
              }}
            >
              {tasks.map((task) => (
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  flytterId={flytterId}
                  onOpen={velgOppgave}
                  onDelete={slettOppgave}
                  deleteLabel={t("delete")}
                  dragLabel={t("drag")}
                  movingLabel={t("moving")}
                  displayName={getTaskDisplayName(task, language)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <button
        onClick={tilbake}
        style={{
          marginTop: 24,
          padding: "12px 18px",
          fontSize: "16px",
          borderRadius: "10px",
          border: "1px solid #ccc",
          cursor: "pointer",
          background: "white",
          color: "#000",
        }}
      >
        {t("back")}
      </button>
    </main>
  )
}