"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { translations } from "@/lib/translations"
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
  active: boolean
  sort_order: number | null
  image_url: string | null
  requires_photo: boolean
  show_monday: boolean
  show_tuesday: boolean
  show_wednesday: boolean
  show_thursday: boolean
  show_friday: boolean
  show_saturday: boolean
  show_sunday: boolean
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

function SortableTaskCard({
  task,
  flytterId,
  onOpen,
}: {
  task: Task
  flytterId: string | null
  onOpen: (task: Task) => void
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
          <span>{task.name}</span>

          <button
            type="button"
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
              flexShrink: 0,
            }}
          >
            {flytterId === task.id ? "Flytter..." : "Dra"}
          </button>
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
  const [lang, setLang] = useState<"no" | "en" | "es">("no")
  const [isLeader, setIsLeader] = useState(false)
  const [selectedTaskListId, setSelectedTaskListId] = useState("")
  const [flytterId, setFlytterId] = useState<string | null>(null)
  const router = useRouter()

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
  const t = translations[lang]

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") as "no" | "en" | "es" | null
    setLang(savedLang || "no")

    const selectedEmployeeId = localStorage.getItem("selectedEmployeeId")
    const selectedEmployeeRole = localStorage.getItem("selectedEmployeeRole")
    const taskListId = localStorage.getItem("selectedTaskListId")
    const taskListName = localStorage.getItem("selectedTaskListName")

    if (!selectedEmployeeId) {
      router.replace("/ansatt")
      return
    }

    setIsLeader(selectedEmployeeRole === "leader")

    if (taskListName) {
      setListeNavn(taskListName)
    }

    if (!taskListId) {
      setFeil("Ingen oppgavetype valgt")
      return
    }

    setSelectedTaskListId(taskListId)
    loadTasks(taskListId, taskListName || "")
  }, [router, todayColumn])

  async function loadTasks(taskListId: string, taskListName: string) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      setFeil("")

      let query =
        `${url}/rest/v1/tasks?` +
        `select=id,name,active,sort_order,image_url,requires_photo,show_monday,show_tuesday,show_wednesday,show_thursday,show_friday,show_saturday,show_sunday` +
        `&list_id=eq.${taskListId}` +
        `&active=eq.true` +
        `&order=sort_order.asc,name.asc`

      if (taskListName === "Åpning" || taskListName === "Stenging") {
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
        setFeil(data.message || "Kunne ikke hente oppgaver")
        return
      }

      setTasks(data)
    } catch (err) {
      setFeil(`Fetch-feil: ${String(err)}`)
    }
  }

  function velgOppgave(task: Task) {
    localStorage.setItem("selectedTaskId", task.id)
    localStorage.setItem("selectedTaskName", task.name)
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
        throw new Error(data || "Kunne ikke lagre rekkefølge")
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
      setStatus(`Rekkefølgen for "${listeNavn}" er lagret`)
    } catch (err) {
      setFeil(`Feil: ${String(err)}`)
      if (selectedTaskListId) {
        loadTasks(selectedTaskListId, listeNavn)
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
    router.push("/oppgavevalg")
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>{t.selectTask}</h1>

      {listeNavn && (
        <p>
          {t.list}: {listeNavn}
        </p>
      )}

      {isLeader && (
        <p style={{ color: "#666", marginTop: 8 }}>
          Admin: bruk "Dra"-knappen oppe til høyre for å endre rekkefølge.
        </p>
      )}

      {status && <p style={{ color: "green" }}>{status}</p>}
      {feil && <p style={{ color: "red" }}>{feil}</p>}

      {tasks.length === 0 && !feil && (
        <p>
          {listeNavn === "Åpning" || listeNavn === "Stenging"
            ? t.noTasksToday
            : t.noTasksFound}
        </p>
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
            {task.name}
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
        {t.back}
      </button>
    </main>
  )
}