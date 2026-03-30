"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/language"

type UiLanguage = "no" | "en" | "es" | "ru"

const fixCameraTexts: Record<
  UiLanguage,
  {
    employee: string
    title: string
    couldNotOpenCamera: string
    mustTakePhotoFirst: string
    missingUser: string
    uploadingImage: string
    couldNotUploadImage: string
    couldNotSaveLog: string
    error: string
    preview: string
    whatNeedsFixing: string
    save: string
    takePhoto: string
    newPhoto: string
  }
> = {
  no: {
    employee: "Ansatt",
    title: "Dette må fikses",
    couldNotOpenCamera: "Kunne ikke åpne kamera",
    mustTakePhotoFirst: "Du må ta bilde først",
    missingUser: "Mangler bruker",
    uploadingImage: "Laster opp bilde...",
    couldNotUploadImage: "Kunne ikke laste opp bilde",
    couldNotSaveLog: "Kunne ikke lagre logg",
    error: "Feil",
    preview: "Forhåndsvisning",
    whatNeedsFixing: "Hva må fikses?",
    save: "Lagre",
    takePhoto: "Ta bilde",
    newPhoto: "Nytt bilde",
  },
  en: {
    employee: "Employee",
    title: "This needs fixing",
    couldNotOpenCamera: "Could not open camera",
    mustTakePhotoFirst: "You must take a photo first",
    missingUser: "Missing user",
    uploadingImage: "Uploading image...",
    couldNotUploadImage: "Could not upload image",
    couldNotSaveLog: "Could not save log",
    error: "Error",
    preview: "Preview",
    whatNeedsFixing: "What needs fixing?",
    save: "Save",
    takePhoto: "Take photo",
    newPhoto: "New photo",
  },
  es: {
    employee: "Empleado",
    title: "Esto necesita arreglo",
    couldNotOpenCamera: "No se pudo abrir la cámara",
    mustTakePhotoFirst: "Debes tomar una foto primero",
    missingUser: "Falta usuario",
    uploadingImage: "Subiendo imagen...",
    couldNotUploadImage: "No se pudo subir la imagen",
    couldNotSaveLog: "No se pudo guardar el registro",
    error: "Error",
    preview: "Vista previa",
    whatNeedsFixing: "¿Qué hay que arreglar?",
    save: "Guardar",
    takePhoto: "Tomar foto",
    newPhoto: "Nueva foto",
  },
  ru: {
    employee: "Сотрудник",
    title: "Это нужно исправить",
    couldNotOpenCamera: "Не удалось открыть камеру",
    mustTakePhotoFirst: "Сначала нужно сделать фото",
    missingUser: "Отсутствует пользователь",
    uploadingImage: "Загрузка изображения...",
    couldNotUploadImage: "Не удалось загрузить изображение",
    couldNotSaveLog: "Не удалось сохранить журнал",
    error: "Ошибка",
    preview: "Предпросмотр",
    whatNeedsFixing: "Что нужно исправить?",
    save: "Сохранить",
    takePhoto: "Сфотографировать",
    newPhoto: "Новое фото",
  },
}

export default function KameraFiksPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const currentLanguage: UiLanguage =
    language === "en" || language === "es" || language === "ru" ? language : "no"
  const text = fixCameraTexts[currentLanguage]

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [ansatt, setAnsatt] = useState("")
  const [kategori, setKategori] = useState("")
  const [employeeId, setEmployeeId] = useState<string | null>(null)

  const [imageBlob, setImageBlob] = useState<Blob | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [kommentar, setKommentar] = useState("")
  const [status, setStatus] = useState("")
  const [flash, setFlash] = useState(false)
  const [startingCamera, setStartingCamera] = useState(true)
  const [isFrontCamera, setIsFrontCamera] = useState(false)

  useEffect(() => {
    setAnsatt(localStorage.getItem("selectedEmployeeName") || "")
    setKategori(localStorage.getItem("selectedFixCategoryName") || "")
    setEmployeeId(localStorage.getItem("selectedEmployeeId"))

    startCamera()

    return () => {
      stopCamera()
      if (preview) URL.revokeObjectURL(preview)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function startCamera() {
    try {
      setStartingCamera(true)
      setStatus("")

      let stream: MediaStream | null = null

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1080 },
            height: { ideal: 1920 },
          },
          audio: false,
        })
        setIsFrontCamera(false)
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1080 },
            height: { ideal: 1920 },
          },
          audio: false,
        })
        setIsFrontCamera(true)
      }

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch {
      setStatus(text.couldNotOpenCamera)
    } finally {
      setStartingCamera(false)
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  function taBilde() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    if (isFrontCamera) {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    }

    setFlash(true)
    setTimeout(() => setFlash(false), 120)

    canvas.toBlob(
      (blob) => {
        if (!blob) return

        const objectUrl = URL.createObjectURL(blob)
        setImageBlob(blob)
        setPreview(objectUrl)
        stopCamera()
      },
      "image/jpeg",
      0.92
    )
  }

  async function nyttBilde() {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setImageBlob(null)
    setKommentar("")
    setStatus("")
    await startCamera()
  }

  async function lagre() {
    if (!imageBlob) {
      setStatus(text.mustTakePhotoFirst)
      return
    }

    if (!employeeId) {
      setStatus(text.missingUser)
      return
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const filename = `${Date.now()}-fix.jpg`

    try {
      setStatus(text.uploadingImage)

      const uploadRes = await fetch(
        `${url}/storage/v1/object/hms-images/${filename}`,
        {
          method: "POST",
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            "Content-Type": "image/jpeg",
          },
          body: imageBlob,
        }
      )

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text()
        setStatus(`${text.couldNotUploadImage}: ${errorText}`)
        return
      }

      const imageUrl = `${url}/storage/v1/object/public/hms-images/${filename}`

      const logRes = await fetch(`${url}/rest/v1/logs`, {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          employee_id: employeeId,
          comment: `${kategori}${kommentar ? `: ${kommentar}` : ""}`,
          image_url: imageUrl,
        }),
      })

      if (!logRes.ok) {
        const errorText = await logRes.text()
        setStatus(`${text.couldNotSaveLog}: ${errorText}`)
        return
      }

      localStorage.removeItem("selectedFixCategoryId")
      localStorage.removeItem("selectedFixCategoryName")

      router.replace("/")
    } catch (err) {
      setStatus(`${text.error}: ${String(err)}`)
    }
  }

  return (
    <main className="fixed inset-0 overflow-hidden bg-black text-white">
      {!preview && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 h-full w-full object-cover ${
            isFrontCamera ? "scale-x-[-1]" : ""
          }`}
        />
      )}

      {preview && (
        <img
          src={preview}
          alt={text.preview}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      <canvas ref={canvasRef} className="hidden" />

      <div
        className={`pointer-events-none absolute inset-0 bg-white transition-opacity duration-100 ${
          flash ? "opacity-80" : "opacity-0"
        }`}
      />

      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent p-5">
        <p className="text-sm opacity-80">
          {text.employee}: {ansatt}
        </p>
        <p className="text-2xl font-semibold">{text.title}</p>
        <p className="text-sm opacity-90">{kategori}</p>
      </div>

      {preview && (
        <div className="absolute inset-x-0 bottom-28 px-4">
          <textarea
            placeholder={text.whatNeedsFixing}
            value={kommentar}
            onChange={(e) => setKommentar(e.target.value)}
            className="w-full rounded-2xl bg-black/60 p-4 text-white outline-none backdrop-blur"
            rows={3}
          />
        </div>
      )}

      <div className="absolute inset-x-0 bottom-8 flex items-center justify-center gap-8">
        {!preview ? (
          <>
            <div className="w-16" />
            <button
              onClick={taBilde}
              disabled={startingCamera}
              aria-label={text.takePhoto}
              className="h-20 w-20 rounded-full border-4 border-white bg-white/20 shadow-xl"
            />
            <div className="w-16" />
          </>
        ) : (
          <>
            <button
              onClick={nyttBilde}
              aria-label={text.newPhoto}
              className="min-w-14 rounded-full bg-black/60 px-5 py-3 text-lg"
            >
              ✕
            </button>

            <button
              onClick={lagre}
              className="rounded-full bg-white px-8 py-4 text-lg font-semibold text-black"
            >
              {text.save}
            </button>
          </>
        )}
      </div>

      {status && (
        <div className="absolute left-1/2 top-24 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-sm">
          {status}
        </div>
      )}
    </main>
  )
}