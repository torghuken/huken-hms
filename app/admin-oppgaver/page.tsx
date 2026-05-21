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
  name_no?: string | null
  name_en?: string | null
  name_es?: string | null
  name_ru?: string | null
  active: boolean
  sort_order: number | null
  list_id: string | null
  image_url: string | null
  requires_photo: boolean
  show_monday: boolean
  show_tuesday: boolean
  show_wednesday: boolean
  show_thursday: boolean
  show_friday: boolean
  show_saturday: boolean
  show_sunday: boolean
  task_lists: {
    id: string
    name: string
    venue_id?: string | null
  } | null
}

type TaskList = {
  id: string
  name: string
}

type DaysState = {
  monday: boolean
  tuesday: boolean
  wednesday: boolean
  thursday: boolean
  friday: boolean
  saturday: boolean
  sunday: boolean
}

type UiLanguage = "no" | "en" | "es" | "ru"

const SKINS_VENUE_ID = "9302b7f7-300b-4373-9566-669412bc9383"
const HUKEN_BRYGG_VENUE_ID = "f0610b10-4b2d-4e00-9c8c-7d5c9845be4c"

function isHiddenForVenue(venueId: string, name: string): boolean {
  const n = (name || "").trim().toLowerCase()
  if (venueId === SKINS_VENUE_ID) {
    return n === "åpning" || n === "daglige oppgaver" || n === "stenging"
  }
  if (venueId === HUKEN_BRYGG_VENUE_ID) {
    return n === "åpning" || n === "stenging"
  }
  return false
}

const defaultDays: DaysState = {
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: true,
  sunday: true,
}

const adminTaskTexts: Record<
  UiLanguage,
  {
    title: string
    addTask: string
    taskNamePlaceholder: string
    chooseTaskType: string
    registrationMode: string
    requiresPhoto: string
    requiresConfirmation: string
    visibleDays: string
    allDays: string
    reset: string
    exampleImage: string
    add: string
    noTasksYet: string
    delete: string
    deleting: string
    drag: string
    moving: string
    useDragToMove: string
    back: string
    mustWriteTaskName: string
    mustChooseTaskType: string
    mustChooseAtLeastOneDay: string
    mustChooseExampleImage: string
    savingTask: string
    taskSaved: string
    taskRemoved: string
    couldNotFetchTaskTypes: string
    couldNotFetchTasks: string
    couldNotRemoveTask: string
    couldNotUploadImage: string
    couldNotAddTask: string
    couldNotSaveOrder: string
    orderSavedFor: string
    fetchError: string
    error: string
    confirmDeleteStart: string
    confirmDeleteEnd: string
    allDaysLabel: string
    opening: string
    dailyTasks: string
    closing: string
    otherTasks: string
    moreTasks: string
    unknownCategory: string
    monday: string
    tuesday: string
    wednesday: string
    thursday: string
    friday: string
    saturday: string
    sunday: string
    translating: string
    edit: string
    editTask: string
    saveChanges: string
    cancel: string
    taskUpdated: string
  }
> = {
  no: {
    title: "Administrer oppgaver",
    addTask: "Legg til oppgave",
    taskNamePlaceholder: "Navn på oppgave",
    chooseTaskType: "Velg oppgavetype",
    registrationMode: "Hvordan skal oppgaven registreres?",
    requiresPhoto: "Må ta bilde",
    requiresConfirmation: "Må bekreftes",
    visibleDays: "Vises på disse dagene",
    allDays: "Alle dager",
    reset: "Nullstill",
    exampleImage: "Eksempelbilde",
    add: "Legg til",
    noTasksYet: "Ingen oppgaver enda",
    delete: "Slett",
    deleting: "Fjerner...",
    drag: "Dra",
    moving: "Flytter...",
    useDragToMove: "Bruk Dra-knappen for å flytte",
    back: "Tilbake",
    mustWriteTaskName: "Skriv navn på oppgaven",
    mustChooseTaskType: "Velg oppgavetype",
    mustChooseAtLeastOneDay: "Velg minst én dag",
    mustChooseExampleImage: "Velg eksempelbilde",
    savingTask: "Lagrer oppgave...",
    taskSaved: "Oppgaven er lagret",
    taskRemoved: "Oppgaven er fjernet",
    couldNotFetchTaskTypes: "Kunne ikke hente oppgavetyper",
    couldNotFetchTasks: "Kunne ikke hente oppgaver",
    couldNotRemoveTask: "Kunne ikke fjerne oppgave",
    couldNotUploadImage: "Kunne ikke laste opp bilde",
    couldNotAddTask: "Kunne ikke legge til oppgave",
    couldNotSaveOrder: "Kunne ikke lagre rekkefølge",
    orderSavedFor: "Rekkefølgen er lagret for",
    fetchError: "Fetch-feil",
    error: "Feil",
    confirmDeleteStart: 'Er du sikker på at du vil fjerne oppgaven "',
    confirmDeleteEnd: '"? Den blir satt som inaktiv.',
    allDaysLabel: "Alle dager",
    opening: "Åpning",
    dailyTasks: "Daglige oppgaver",
    closing: "Stenging",
    otherTasks: "Andre oppgaver",
    moreTasks: "Flere oppgaver",
    unknownCategory: "Uten kategori",
    monday: "Mandag",
    tuesday: "Tirsdag",
    wednesday: "Onsdag",
    thursday: "Torsdag",
    friday: "Fredag",
    saturday: "Lørdag",
    sunday: "Søndag",
    translating: "Oversetter...",
    edit: "Rediger",
    editTask: "Rediger oppgave",
    saveChanges: "Lagre endringer",
    cancel: "Avbryt",
    taskUpdated: "Oppgaven er oppdatert",
  },
  en: {
    title: "Manage tasks",
    addTask: "Add task",
    taskNamePlaceholder: "Task name",
    chooseTaskType: "Choose task type",
    registrationMode: "How should the task be registered?",
    requiresPhoto: "Photo required",
    requiresConfirmation: "Confirmation required",
    visibleDays: "Visible on these days",
    allDays: "Every day",
    reset: "Reset",
    exampleImage: "Example image",
    add: "Add",
    noTasksYet: "No tasks yet",
    delete: "Delete",
    deleting: "Removing...",
    drag: "Drag",
    moving: "Moving...",
    useDragToMove: "Use the Drag button to move",
    back: "Back",
    mustWriteTaskName: "Enter task name",
    mustChooseTaskType: "Choose task type",
    mustChooseAtLeastOneDay: "Choose at least one day",
    mustChooseExampleImage: "Choose an example image",
    savingTask: "Saving task...",
    taskSaved: "Task saved",
    taskRemoved: "Task removed",
    couldNotFetchTaskTypes: "Could not fetch task types",
    couldNotFetchTasks: "Could not fetch tasks",
    couldNotRemoveTask: "Could not remove task",
    couldNotUploadImage: "Could not upload image",
    couldNotAddTask: "Could not add task",
    couldNotSaveOrder: "Could not save order",
    orderSavedFor: "Order saved for",
    fetchError: "Fetch error",
    error: "Error",
    confirmDeleteStart: 'Are you sure you want to remove the task "',
    confirmDeleteEnd: '"? It will be set as inactive.',
    allDaysLabel: "Every day",
    opening: "Opening",
    dailyTasks: "Daily tasks",
    closing: "Closing",
    otherTasks: "Other tasks",
    moreTasks: "More tasks",
    unknownCategory: "Uncategorized",
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
    translating: "Translating...",
    edit: "Edit",
    editTask: "Edit task",
    saveChanges: "Save changes",
    cancel: "Cancel",
    taskUpdated: "Task updated",
  },
  es: {
    title: "Administrar tareas",
    addTask: "Agregar tarea",
    taskNamePlaceholder: "Nombre de la tarea",
    chooseTaskType: "Elegir tipo de tarea",
    registrationMode: "¿Cómo debe registrarse la tarea?",
    requiresPhoto: "Requiere foto",
    requiresConfirmation: "Requiere confirmación",
    visibleDays: "Visible en estos días",
    allDays: "Todos los días",
    reset: "Restablecer",
    exampleImage: "Imagen de ejemplo",
    add: "Agregar",
    noTasksYet: "No hay tareas todavía",
    delete: "Eliminar",
    deleting: "Eliminando...",
    drag: "Arrastrar",
    moving: "Moviendo...",
    useDragToMove: "Usa el botón Arrastrar para mover",
    back: "Volver",
    mustWriteTaskName: "Escribe el nombre de la tarea",
    mustChooseTaskType: "Elige el tipo de tarea",
    mustChooseAtLeastOneDay: "Elige al menos un día",
    mustChooseExampleImage: "Elige una imagen de ejemplo",
    savingTask: "Guardando tarea...",
    taskSaved: "Tarea guardada",
    taskRemoved: "La tarea fue eliminada",
    couldNotFetchTaskTypes: "No se pudieron obtener los tipos de tarea",
    couldNotFetchTasks: "No se pudieron obtener las tareas",
    couldNotRemoveTask: "No se pudo eliminar la tarea",
    couldNotUploadImage: "No se pudo subir la imagen",
    couldNotAddTask: "No se pudo agregar la tarea",
    couldNotSaveOrder: "No se pudo guardar el orden",
    orderSavedFor: "Orden guardado para",
    fetchError: "Error de carga",
    error: "Error",
    confirmDeleteStart: '¿Seguro que quieres eliminar la tarea "',
    confirmDeleteEnd: '"? Se marcará como inactiva.',
    allDaysLabel: "Todos los días",
    opening: "Apertura",
    dailyTasks: "Tareas diarias",
    closing: "Cierre",
    otherTasks: "Otras tareas",
    moreTasks: "Más tareas",
    unknownCategory: "Sin categoría",
    monday: "Lunes",
    tuesday: "Martes",
    wednesday: "Miércoles",
    thursday: "Jueves",
    friday: "Viernes",
    saturday: "Sábado",
    sunday: "Domingo",
    translating: "Traduciendo...",
    edit: "Editar",
    editTask: "Editar tarea",
    saveChanges: "Guardar cambios",
    cancel: "Cancelar",
    taskUpdated: "Tarea actualizada",
  },
  ru: {
    title: "Управление задачами",
    addTask: "Добавить задачу",
    taskNamePlaceholder: "Название задачи",
    chooseTaskType: "Выбрать тип задачи",
    registrationMode: "Как должна регистрироваться задача?",
    requiresPhoto: "Требуется фото",
    requiresConfirmation: "Требуется подтверждение",
    visibleDays: "Видна в эти дни",
    allDays: "Каждый день",
    reset: "Сбросить",
    exampleImage: "Пример изображения",
    add: "Добавить",
    noTasksYet: "Задач пока нет",
    delete: "Удалить",
    deleting: "Удаление...",
    drag: "Перетащить",
    moving: "Перемещение...",
    useDragToMove: "Используйте кнопку «Перетащить» для перемещения",
    back: "Назад",
    mustWriteTaskName: "Введите название задачи",
    mustChooseTaskType: "Выберите тип задачи",
    mustChooseAtLeastOneDay: "Выберите хотя бы один день",
    mustChooseExampleImage: "Выберите изображение-пример",
    savingTask: "Сохранение задачи...",
    taskSaved: "Задача сохранена",
    taskRemoved: "Задача удалена",
    couldNotFetchTaskTypes: "Не удалось получить типы задач",
    couldNotFetchTasks: "Не удалось получить задачи",
    couldNotRemoveTask: "Не удалось удалить задачу",
    couldNotUploadImage: "Не удалось загрузить изображение",
    couldNotAddTask: "Не удалось добавить задачу",
    couldNotSaveOrder: "Не удалось сохранить порядок",
    orderSavedFor: "Порядок сохранён для",
    fetchError: "Ошибка загрузки",
    error: "Ошибка",
    confirmDeleteStart: "Вы уверены, что хотите удалить задачу «",
    confirmDeleteEnd: "»? Она будет отмечена как неактивная.",
    allDaysLabel: "Каждый день",
    opening: "Открытие",
    dailyTasks: "Ежедневные задачи",
    closing: "Закрытие",
    otherTasks: "Другие задачи",
    moreTasks: "Ещё задачи",
    unknownCategory: "Без категории",
    monday: "Понедельник",
    tuesday: "Вторник",
    wednesday: "Среда",
    thursday: "Четверг",
    friday: "Пятница",
    saturday: "Суббота",
    sunday: "Воскресенье",
    translating: "Перевод...",
    edit: "Редактировать",
    editTask: "Редактировать задачу",
    saveChanges: "Сохранить изменения",
    cancel: "Отмена",
    taskUpdated: "Задача обновлена",
  },
}

function getTaskDisplayName(task: Task, language: UiLanguage) {
  if (language === "en") return task.name_en || task.name_no || task.name
  if (language === "es") return task.name_es || task.name_no || task.name
  if (language === "ru") return task.name_ru || task.name_no || task.name
  return task.name_no || task.name
}

function getTaskListDisplayName(name: string, text: Record<string, string>) {
  const normalized = name.trim().toLowerCase()

  if (normalized === "åpning" || normalized === "opening" || normalized === "apertura") {
    return text.opening
  }

  if (
    normalized === "daglige oppgaver" ||
    normalized === "daily tasks" ||
    normalized === "tareas diarias"
  ) {
    return text.dailyTasks
  }

  if (normalized === "stenging" || normalized === "closing" || normalized === "cierre") {
    return text.closing
  }

  if (
    normalized === "andre oppgaver" ||
    normalized === "other tasks" ||
    normalized === "otras tareas"
  ) {
    return text.otherTasks
  }

  return name
}

function SortableTaskCard({
  task,
  flytterId,
  sletterId,
  onDelete,
  onEdit,
  language,
  text,
}: {
  task: Task
  flytterId: string | null
  sletterId: string | null
  onDelete: (task: Task) => void
  onEdit: (task: Task) => void
  language: UiLanguage
  text: Record<string, string>
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
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

  function formatDays(task: Task) {
    const activeDays: string[] = []

    if (task.show_monday) activeDays.push(text.monday)
    if (task.show_tuesday) activeDays.push(text.tuesday)
    if (task.show_wednesday) activeDays.push(text.wednesday)
    if (task.show_thursday) activeDays.push(text.thursday)
    if (task.show_friday) activeDays.push(text.friday)
    if (task.show_saturday) activeDays.push(text.saturday)
    if (task.show_sunday) activeDays.push(text.sunday)

    if (activeDays.length === 7) return text.allDaysLabel
    return activeDays.join(" • ")
  }

  const displayName = getTaskDisplayName(task, language)

  return (
    <>
      <div ref={setNodeRef} style={style}>
        <div className="rounded-xl bg-white p-4 text-black">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <span className="font-medium">{displayName}</span>
              <p className="mt-1 text-xs text-zinc-500">{text.useDragToMove}</p>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(task)
                }}
                disabled={flytterId === task.id || sletterId === task.id}
                className="rounded-lg bg-blue-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {text.edit}
              </button>

              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  setConfirmingDelete(true)
                }}
                disabled={flytterId === task.id || sletterId === task.id}
                className="rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {sletterId === task.id ? text.deleting : text.delete}
              </button>

              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                {...attributes}
                {...listeners}
                className="rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-700"
                style={{ touchAction: "none", cursor: "grab" }}
              >
                {flytterId === task.id ? text.moving : text.drag}
              </button>
            </div>
          </div>

          <p className="mt-2 text-sm text-zinc-600">{formatDays(task)}</p>
          <p className="mt-1 text-sm text-zinc-600">
            {task.requires_photo ? text.requiresPhoto : text.requiresConfirmation}
          </p>

          {task.image_url && (
            <img
              src={task.image_url}
              alt={text.exampleImage}
              className="mt-3 max-h-40 rounded-xl"
            />
          )}
        </div>
      </div>

      {confirmingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setConfirmingDelete(false)}
        >
          <div
            className="mx-6 w-full max-w-sm rounded-2xl bg-zinc-900 p-6 text-center text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-2 text-lg font-semibold">{text.confirmDeleteStart.replace('"', '')}</p>
            <p className="mb-6 text-sm text-zinc-400">{displayName}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="flex-1 rounded-xl border border-zinc-600 py-3 text-lg font-semibold text-zinc-300 transition active:scale-95"
              >
                {text.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmingDelete(false)
                  onDelete(task)
                }}
                className="flex-1 rounded-xl bg-red-500 py-3 text-lg font-semibold text-white transition active:scale-95"
              >
                {text.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function AdminOppgaverPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const currentLanguage: UiLanguage =
    language === "en" || language === "es" || language === "ru" ? language : "no"
  const text = adminTaskTexts[currentLanguage]

  const [tasks, setTasks] = useState<Task[]>([])
  const [taskLists, setTaskLists] = useState<TaskList[]>([])
  const [feil, setFeil] = useState("")
  const [status, setStatus] = useState("")
  const [nyOppgave, setNyOppgave] = useState("")
  const [valgtListeId, setValgtListeId] = useState("")
  const [requiresPhoto, setRequiresPhoto] = useState(true)
  const [days, setDays] = useState<DaysState>(defaultDays)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [sletterId, setSletterId] = useState<string | null>(null)
  const [flytterId, setFlytterId] = useState<string | null>(null)
  const [retranslating, setRetranslating] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)

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
    const employeeId = localStorage.getItem("selectedEmployeeId")
    const employeeRole = localStorage.getItem("selectedEmployeeRole")
    const selectedVenue = localStorage.getItem("selectedVenue")

    if (!selectedVenue) {
      router.replace("/velg-sted")
      return
    }

    if (!employeeId) {
      router.replace("/ansatt")
      return
    }

    if (employeeRole !== "leader") {
      router.replace("/")
      return
    }

    loadTaskLists(selectedVenue)
    loadTasks(selectedVenue)
  }, [router])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const alleDagerValgt = useMemo(() => {
    return Object.values(days).every(Boolean)
  }, [days])

  async function loadTaskLists(selectedVenue: string) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      setFeil("")

      const res = await fetch(
        `${url}/rest/v1/task_lists?select=id,name&venue_id=eq.${selectedVenue}&order=name`,
        {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        }
      )

      const data = await res.json()

      if (!res.ok) {
        setFeil(data.message || text.couldNotFetchTaskTypes)
        return
      }

      const visibleLists = (data as TaskList[]).filter(
        (list) => !isHiddenForVenue(selectedVenue, list.name)
      )
      setTaskLists(visibleLists)

      if (visibleLists.length > 0 && !valgtListeId) {
        const preferred = visibleLists.find(
          (item) =>
            item.name === "Andre oppgaver" ||
            item.name === "Other tasks" ||
            item.name === "Otras tareas" ||
            item.name === "Daglige oppgaver" ||
            item.name === "Daily tasks" ||
            item.name === "Tareas diarias"
        )
        setValgtListeId(preferred ? preferred.id : visibleLists[0].id)
      }
    } catch (err) {
      setFeil(`${text.fetchError}: ${String(err)}`)
    }
  }

  async function loadTasks(selectedVenue: string) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      setFeil("")

      const res = await fetch(
        `${url}/rest/v1/tasks?select=id,name,name_no,name_en,name_es,name_ru,active,sort_order,list_id,image_url,requires_photo,show_monday,show_tuesday,show_wednesday,show_thursday,show_friday,show_saturday,show_sunday,task_lists!inner(id,name,venue_id)&task_lists.venue_id=eq.${selectedVenue}&order=list_id.asc,sort_order.asc,name.asc`,
        {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        }
      )

      const data = await res.json()

      if (!res.ok) {
        setFeil(data.message || text.couldNotFetchTasks)
        return
      }

      const visibleTasks = (data as Task[]).filter(
        (t) => !isHiddenForVenue(selectedVenue, t.task_lists?.name || "")
      )
      setTasks(visibleTasks)
    } catch (err) {
      setFeil(`${text.fetchError}: ${String(err)}`)
    }
  }

  async function deleteTask(task: Task) {
    const displayName = getTaskDisplayName(task, currentLanguage)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const selectedVenue = localStorage.getItem("selectedVenue")

    try {
      setFeil("")
      setStatus("")
      setSletterId(task.id)

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
        setFeil(data || text.couldNotRemoveTask)
        return
      }

      setTasks((prev) => prev.filter((item) => item.id !== task.id))
      setStatus(`${text.taskRemoved}: "${displayName}"`)
    } catch (err) {
      setFeil(`${text.fetchError}: ${String(err)}`)
    } finally {
      setSletterId(null)
      if (selectedVenue) {
        loadTasks(selectedVenue)
      }
    }
  }

  function toggleDay(day: keyof DaysState) {
    setDays((prev) => ({
      ...prev,
      [day]: !prev[day],
    }))
  }

  function setAlleDager(value: boolean) {
    setDays({
      monday: value,
      tuesday: value,
      wednesday: value,
      thursday: value,
      friday: value,
      saturday: value,
      sunday: value,
    })
  }

  function startEditing(task: Task) {
    setEditingTaskId(task.id)
    setNyOppgave(getTaskDisplayName(task, currentLanguage))
    setValgtListeId(task.list_id || "")
    setRequiresPhoto(task.requires_photo)
    setDays({
      monday: task.show_monday,
      tuesday: task.show_tuesday,
      wednesday: task.show_wednesday,
      thursday: task.show_thursday,
      friday: task.show_friday,
      saturday: task.show_saturday,
      sunday: task.show_sunday,
    })
    setImageFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(task.image_url)
    setExistingImageUrl(task.image_url)
    setFeil("")
    setStatus("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function cancelEditing() {
    setEditingTaskId(null)
    setExistingImageUrl(null)
    setNyOppgave("")
    setValgtListeId("")
    setRequiresPhoto(true)
    setDays(defaultDays)
    setImageFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setFeil("")
    setStatus("")
  }

  function onPickImage(file: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl)

    setImageFile(file)

    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }

  async function uploadImageIfNeeded(): Promise<string | null> {
    if (!imageFile) return existingImageUrl

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const ext = imageFile.name.split(".").pop()?.toLowerCase() || "jpg"
    const filename = `task-template-${Date.now()}.${ext}`

    const res = await fetch(`${url}/storage/v1/object/hms-images/${filename}`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": imageFile.type || "image/jpeg",
      },
      body: imageFile,
    })

    if (!res.ok) {
      const responseText = await res.text()
      throw new Error(responseText || text.couldNotUploadImage)
    }

    return `${url}/storage/v1/object/public/hms-images/${filename}`
  }

  function getNextSortOrderForList(listId: string) {
    const sammeListe = tasks.filter((task) => task.list_id === listId)
    if (sammeListe.length === 0) return 1

    const høyeste = Math.max(
      ...sammeListe.map((task) => Number(task.sort_order ?? 0))
    )

    return høyeste + 1
  }

  async function retranslateAllTasks() {
    const selectedVenue = localStorage.getItem("selectedVenue")
    if (!selectedVenue) return

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    setRetranslating(true)
    setFeil("")

    const aktiveTasks = tasks.filter((t) => !!(t.name_no || t.name))
    let ok = 0
    let feilet = 0

    for (let i = 0; i < aktiveTasks.length; i++) {
      const task = aktiveTasks[i]
      const sourceText = task.name_no || task.name

      setStatus(`Oversetter ${i + 1} av ${aktiveTasks.length}...`)

      try {
        const translateRes = await fetch("/api/translate-task", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: sourceText, sourceLang: "auto" }),
        })

        if (!translateRes.ok) {
          feilet++
          // Vent litt ekstra ved feil (rate limit)
          await new Promise((r) => setTimeout(r, 1500))
          continue
        }

        const translated = await translateRes.json()

        const patchRes = await fetch(`${url}/rest/v1/tasks?id=eq.${task.id}`, {
          method: "PATCH",
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: translated.name_no,
            name_no: translated.name_no,
            name_en: translated.name_en,
            name_es: translated.name_es,
            name_ru: translated.name_ru,
          }),
        })

        if (patchRes.ok) {
          ok++
        } else {
          feilet++
        }
      } catch {
        feilet++
      }

      // Pause mellom hver forespørsel for å unngå DeepL rate limiting
      await new Promise((r) => setTimeout(r, 500))
    }

    setRetranslating(false)
    setStatus(`Ferdig: ${ok} oversatt${feilet > 0 ? `, ${feilet} feilet` : " ✓"}`)
    loadTasks(selectedVenue)
  }

  async function leggTilOppgave() {
    const selectedVenue = localStorage.getItem("selectedVenue")

    if (!selectedVenue) {
      setFeil(text.error)
      return
    }

    if (!nyOppgave.trim()) {
      setFeil(text.mustWriteTaskName)
      return
    }

    if (!valgtListeId) {
      setFeil(text.mustChooseTaskType)
      return
    }

    if (!Object.values(days).some(Boolean)) {
      setFeil(text.mustChooseAtLeastOneDay)
      return
    }

    if (!imageFile && !existingImageUrl) {
      setFeil(text.mustChooseExampleImage)
      return
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const nesteSortOrder = getNextSortOrderForList(valgtListeId)

    try {
      setFeil("")
      setStatus(text.translating)

      // Kall translate-API med riktig kildespråk basert på aktivt UI-språk
      const translateRes = await fetch("/api/translate-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: nyOppgave.trim(),
        }),
      })

      if (!translateRes.ok) {
        setFeil(text.couldNotAddTask)
        setStatus("")
        return
      }

      const translated = await translateRes.json()

      setStatus(text.savingTask)

      const imageUrl = await uploadImageIfNeeded()

      if (editingTaskId) {
        const res = await fetch(`${url}/rest/v1/tasks?id=eq.${editingTaskId}`, {
          method: "PATCH",
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            name: translated.name_no,
            name_no: translated.name_no,
            name_en: translated.name_en,
            name_es: translated.name_es,
            name_ru: translated.name_ru,
            list_id: valgtListeId,
            image_url: imageUrl,
            requires_photo: requiresPhoto,
            show_monday: days.monday,
            show_tuesday: days.tuesday,
            show_wednesday: days.wednesday,
            show_thursday: days.thursday,
            show_friday: days.friday,
            show_saturday: days.saturday,
            show_sunday: days.sunday,
          }),
        })

        if (!res.ok) {
          const responseText = await res.text()
          setFeil(responseText || text.couldNotAddTask)
          setStatus("")
          return
        }

        setEditingTaskId(null)
        setExistingImageUrl(null)
        setNyOppgave("")
        setRequiresPhoto(true)
        setDays(defaultDays)
        setImageFile(null)
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
        setStatus(text.taskUpdated)
      } else {
        const res = await fetch(`${url}/rest/v1/tasks`, {
          method: "POST",
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            name: translated.name_no,
            name_no: translated.name_no,
            name_en: translated.name_en,
            name_es: translated.name_es,
            name_ru: translated.name_ru,
            list_id: valgtListeId,
            active: true,
            sort_order: nesteSortOrder,
            image_url: imageUrl,
            requires_photo: requiresPhoto,
            show_monday: days.monday,
            show_tuesday: days.tuesday,
            show_wednesday: days.wednesday,
            show_thursday: days.thursday,
            show_friday: days.friday,
            show_saturday: days.saturday,
            show_sunday: days.sunday,
          }),
        })

        if (!res.ok) {
          const responseText = await res.text()
          setFeil(responseText || text.couldNotAddTask)
          setStatus("")
          return
        }

        setNyOppgave("")
        setRequiresPhoto(true)
        setDays(defaultDays)
        setImageFile(null)
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
        setStatus(text.taskSaved)
      }

      loadTasks(selectedVenue)
      loadTaskLists(selectedVenue)
    } catch (err) {
      setFeil(`${text.error}: ${String(err)}`)
      setStatus("")
    }
  }

  function getTasksForList(listName: string) {
    return tasks
      .filter((task) => task.active && task.task_lists?.name === listName)
      .sort((a, b) => {
        const aOrder = Number(a.sort_order ?? 0)
        const bOrder = Number(b.sort_order ?? 0)
        if (aOrder !== bOrder) return aOrder - bOrder
        return getTaskDisplayName(a, currentLanguage).localeCompare(
          getTaskDisplayName(b, currentLanguage)
        )
      })
  }

  async function saveSortOrderForList(updatedListTasks: Task[]) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    for (let i = 0; i < updatedListTasks.length; i++) {
      const task = updatedListTasks[i]

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
        const responseText = await res.text()
        throw new Error(responseText || text.couldNotSaveOrder)
      }
    }
  }

  async function handleDragEndForList(listName: string, event: DragEndEvent) {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const listTasks = getTasksForList(listName)
    const oldIndex = listTasks.findIndex((task) => task.id === active.id)
    const newIndex = listTasks.findIndex((task) => task.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const movedList = arrayMove(listTasks, oldIndex, newIndex)
    const movedIds = new Set(movedList.map((task) => task.id))

    const updatedMovedList = movedList.map((task, index) => ({
      ...task,
      sort_order: index + 1,
    }))

    setTasks((prev) => [
      ...prev.filter((task) => !movedIds.has(task.id)),
      ...updatedMovedList,
    ])

    try {
      setFeil("")
      setStatus("")
      setFlytterId(String(active.id))

      await saveSortOrderForList(updatedMovedList)
      setStatus(
        `${text.orderSavedFor} "${getTaskListDisplayName(listName, text)}"`
      )
    } catch (err) {
      setFeil(`${text.error}: ${String(err)}`)
      const selectedVenue = localStorage.getItem("selectedVenue")
      if (selectedVenue) {
        loadTasks(selectedVenue)
      }
    } finally {
      setFlytterId(null)
    }
  }

  function isListMatch(taskListName: string | undefined, target: string) {
    const n = (taskListName || "").trim().toLowerCase()
    return n === target.toLowerCase()
  }

  const apningOppgaver = tasks
    .filter((t) => t.active && isListMatch(t.task_lists?.name, "Åpning"))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  const dagligeOppgaver = tasks
    .filter((t) => t.active && isListMatch(t.task_lists?.name, "Daglige oppgaver"))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  const stengingOppgaver = tasks
    .filter((t) => t.active && isListMatch(t.task_lists?.name, "Stenging"))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  const knownNames = new Set(["åpning", "daglige oppgaver", "stenging"])
  const andreListerOppgaver = tasks
    .filter(
      (task) =>
        task.active &&
        !knownNames.has((task.task_lists?.name || "").trim().toLowerCase())
    )
    .sort((a, b) => {
      if (a.task_lists?.name !== b.task_lists?.name) {
        return (a.task_lists?.name || "").localeCompare(b.task_lists?.name || "")
      }
      return (a.sort_order ?? 0) - (b.sort_order ?? 0)
    })

  function CollapsibleSection({ title, sectionTasks }: { title: string; sectionTasks: Task[] }) {
    const [open, setOpen] = useState(false)

    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex w-full items-center justify-between rounded-2xl bg-zinc-800 px-5 py-4 text-left transition active:scale-[0.98]"
        >
          <span className="text-lg font-semibold">
            {getTaskListDisplayName(title, text)}
            <span className="ml-2 text-sm font-normal text-zinc-400">
              ({sectionTasks.length})
            </span>
          </span>
          <span className="text-2xl text-zinc-400">{open ? "−" : "+"}</span>
        </button>

        {open && (
          <div className="mt-3">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(event) => handleDragEndForList(title, event)}
            >
              <SortableContext
                items={sectionTasks.map((task) => task.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {sectionTasks.length === 0 && (
                    <div className="rounded-xl bg-zinc-900 p-4 text-zinc-300">
                      {text.noTasksYet}
                    </div>
                  )}

                  {sectionTasks.map((task) => (
                    <SortableTaskCard
                      key={task.id}
                      task={task}
                      flytterId={flytterId}
                      sletterId={sletterId}
                      onDelete={deleteTask}
                      onEdit={startEditing}
                      language={currentLanguage}
                      text={text}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <h1 className="mb-8 text-center text-3xl font-bold">{text.title}</h1>

      <div className="mx-auto max-w-md space-y-8">
        {feil && <p className="text-red-400">{feil}</p>}
        {status && <p className="text-green-400">{status}</p>}

        <button
          type="button"
          onClick={retranslateAllTasks}
          disabled={retranslating}
          className="w-full rounded-xl bg-zinc-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {retranslating ? "Oversetter..." : "🔄 Oversett alle eksisterende oppgaver på nytt"}
        </button>

        <div className="rounded-2xl bg-zinc-900 p-4">
          <h2 className="mb-4 text-xl font-semibold">
            {editingTaskId ? text.editTask : text.addTask}
          </h2>

          <div className="space-y-3">
            <input
              value={nyOppgave}
              onChange={(e) => setNyOppgave(e.target.value)}
              placeholder={text.taskNamePlaceholder}
              className="w-full rounded-xl border border-zinc-700 bg-white p-3 text-black outline-none"
            />

            <select
              value={valgtListeId}
              onChange={(e) => setValgtListeId(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-white p-3 text-black outline-none"
            >
              <option value="">{text.chooseTaskType}</option>
              {taskLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {getTaskListDisplayName(list.name, text)}
                </option>
              ))}
            </select>

            <div className="rounded-xl bg-zinc-800 p-3">
              <p className="mb-3 text-sm text-zinc-300">{text.registrationMode}</p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRequiresPhoto(true)}
                  className={`flex-1 rounded-lg px-3 py-3 text-sm font-semibold ${
                    requiresPhoto ? "bg-white text-black" : "bg-zinc-700 text-white"
                  }`}
                >
                  {text.requiresPhoto}
                </button>

                <button
                  type="button"
                  onClick={() => setRequiresPhoto(false)}
                  className={`flex-1 rounded-lg px-3 py-3 text-sm font-semibold ${
                    !requiresPhoto ? "bg-white text-black" : "bg-zinc-700 text-white"
                  }`}
                >
                  {text.requiresConfirmation}
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-zinc-800 p-3">
              <p className="mb-3 text-sm text-zinc-300">{text.visibleDays}</p>

              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setAlleDager(true)}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                    alleDagerValgt ? "bg-white text-black" : "bg-zinc-700 text-white"
                  }`}
                >
                  {text.allDays}
                </button>

                <button
                  type="button"
                  onClick={() => setAlleDager(false)}
                  className="rounded-lg bg-zinc-700 px-3 py-2 text-sm font-semibold text-white"
                >
                  {text.reset}
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  ["monday", text.monday],
                  ["tuesday", text.tuesday],
                  ["wednesday", text.wednesday],
                  ["thursday", text.thursday],
                  ["friday", text.friday],
                  ["saturday", text.saturday],
                  ["sunday", text.sunday],
                ].map(([key, label]) => {
                  const dayKey = key as keyof DaysState
                  const active = days[dayKey]

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleDay(dayKey)}
                      className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                        active ? "bg-green-500 text-white" : "bg-zinc-700 text-white"
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="rounded-xl bg-zinc-800 p-3">
              <p className="mb-3 text-sm text-zinc-300">{text.exampleImage}</p>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => onPickImage(e.target.files?.[0] || null)}
                className="w-full rounded-xl bg-white p-2 text-black"
              />

              {previewUrl && (
                <img
                  src={previewUrl}
                  alt={text.exampleImage}
                  className="mt-3 max-h-48 rounded-xl"
                />
              )}
            </div>

            <button
              type="button"
              onClick={leggTilOppgave}
              className="w-full rounded-xl bg-white px-4 py-3 text-lg font-semibold text-black"
            >
              {editingTaskId ? text.saveChanges : text.add}
            </button>

            {editingTaskId && (
              <button
                type="button"
                onClick={cancelEditing}
                className="w-full rounded-xl border border-zinc-600 px-4 py-3 text-lg font-semibold text-zinc-300"
              >
                {text.cancel}
              </button>
            )}
          </div>
        </div>

        <CollapsibleSection title="Åpning" sectionTasks={apningOppgaver} />
        <CollapsibleSection title="Daglige oppgaver" sectionTasks={dagligeOppgaver} />
        <CollapsibleSection title="Stenging" sectionTasks={stengingOppgaver} />
        {andreListerOppgaver.length > 0 && (
          <div>
            <h2 className="mb-3 text-xl font-semibold">{text.moreTasks}</h2>

            <div className="space-y-6">
              {Array.from(
                new Set(
                  andreListerOppgaver.map(
                    (task) => task.task_lists?.name || text.unknownCategory
                  )
                )
              ).map((listName) => {
                const sectionTasks = andreListerOppgaver.filter(
                  (task) => (task.task_lists?.name || text.unknownCategory) === listName
                )

                return (
                  <div key={listName}>
                    <CollapsibleSection title={listName} sectionTasks={sectionTasks} />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => router.push("/")}
          className="w-full rounded-xl border border-zinc-600 px-4 py-3 text-zinc-200"
        >
          {text.back}
        </button>
      </div>
    </main>
  )
}
