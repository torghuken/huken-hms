"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/language"

type UiLanguage = "no" | "en" | "es" | "ru"

type HseSection = {
  key: string
  title: Record<UiLanguage, string>
  items: Record<UiLanguage, string[]>
}

const HSE_SECTIONS: HseSection[] = [
  {
    key: "general_hse",
    title: {
      no: "1. Generell HMS",
      en: "1. General HSE",
      es: "1. HSE General",
      ru: "1. Общая охрана труда",
    },
    items: {
      no: [
        "Bedriftens HMS-policy, mål og organisering",
        "Plikter for arbeidsgiver og arbeidstaker etter arbeidsmiljøloven",
        "Internkontrollsystem og bedriftens HMS-prosedyrer",
        "Prosedyrer for rapportering av hendelser, nestenulykker og skader",
        "Varslingsrutiner for rapportering av uakseptable forhold",
      ],
      en: [
        "The company's HSE policy, objectives and organization",
        "Duties of employer and employee under the Norwegian Working Environment Act",
        "Internal control system and company HSE procedures",
        "Reporting procedures for incidents, near misses and injuries",
        "Whistleblowing procedures for reporting unacceptable conditions",
      ],
      es: [
        "Política, objetivos y organización de SST de la empresa",
        "Deberes del empleador y empleado según la Ley de Ambiente de Trabajo",
        "Sistema de control interno y procedimientos de SST",
        "Procedimientos de reporte de incidentes, cuasi-accidentes y lesiones",
        "Procedimientos de denuncia de condiciones inaceptables",
      ],
      ru: [
        "Политика, цели и организация охраны труда компании",
        "Обязанности работодателя и работника по Закону об охране труда",
        "Система внутреннего контроля и процедуры охраны труда",
        "Процедуры отчётности об инцидентах, предпосылках и травмах",
        "Процедуры информирования о неприемлемых условиях",
      ],
    },
  },
  {
    key: "nightlife_safety",
    title: {
      no: "2. Sikkerhet i utelivsbransjen",
      en: "2. Safety in the Nightlife Industry",
      es: "2. Seguridad en la industria nocturna",
      ru: "2. Безопасность в индустрии ночной жизни",
    },
    items: {
      no: [
        "Roller og ansvar mellom personale, ledelse og sikkerhetspersonell",
        "Forebygging og håndtering av vold, trusler og konflikter",
        "Prosedyrer for å bortvise eller nekte gjester adgang",
        "Samarbeid med vektere og politi",
        "Håndtering av berusede eller aggressive gjester",
      ],
      en: [
        "Roles and responsibilities between staff, management and security personnel",
        "Prevention and management of violence, threats and conflicts",
        "Procedures for removing or denying entry to guests",
        "Cooperation with security guards and police",
        "Handling intoxicated or aggressive guests",
      ],
      es: [
        "Roles y responsabilidades entre personal, gerencia y seguridad",
        "Prevención y manejo de violencia, amenazas y conflictos",
        "Procedimientos para retirar o negar acceso a invitados",
        "Cooperación con guardias de seguridad y policía",
        "Manejo de invitados intoxicados o agresivos",
      ],
      ru: [
        "Роли и обязанности персонала, руководства и охраны",
        "Предотвращение и управление насилием, угрозами и конфликтами",
        "Процедуры удаления или отказа во входе гостям",
        "Сотрудничество с охраной и полицией",
        "Работа с пьяными или агрессивными гостями",
      ],
    },
  },
  {
    key: "alcohol_service",
    title: {
      no: "3. Alkoholservering",
      en: "3. Alcohol Service",
      es: "3. Servicio de alcohol",
      ru: "3. Обслуживание алкоголем",
    },
    items: {
      no: [
        "Ansvarlig skjenking av alkohol",
        "Alderskontroll og ID-sjekk",
        "Gjenkjenne tegn på sterk beruselse",
        "Prosedyrer for å nekte servering",
        "Bedriftens rus- og alkoholpolicy for ansatte",
      ],
      en: [
        "Responsible service of alcohol",
        "Age verification and ID control procedures",
        "Recognizing signs of severe intoxication",
        "Procedures for refusing service",
        "Company substance and alcohol policy for employees",
      ],
      es: [
        "Servicio responsable de alcohol",
        "Verificación de edad y control de identificación",
        "Reconocer señales de intoxicación severa",
        "Procedimientos para negar servicio",
        "Política de sustancias y alcohol para empleados",
      ],
      ru: [
        "Ответственная подача алкоголя",
        "Проверка возраста и документов",
        "Распознавание признаков сильного опьянения",
        "Процедуры отказа в обслуживании",
        "Политика компании по алкоголю и веществам для сотрудников",
      ],
    },
  },
  {
    key: "fire_safety",
    title: {
      no: "4. Brannsikkerhet og evakuering",
      en: "4. Fire Safety and Evacuation",
      es: "4. Seguridad contra incendios y evacuación",
      ru: "4. Пожарная безопасность и эвакуация",
    },
    items: {
      no: [
        "Brannforebyggende tiltak (inkludert utendørs varmekilder som fakler og varmeovner)",
        "Nødutganger og rømningsveier",
        "Evakueringsprosedyrer ved brann eller andre nødsituasjoner",
        "Plassering og bruk av brannslokkingsutstyr",
        "Utpekt møteplass ved evakuering",
      ],
      en: [
        "Fire prevention measures (including outdoor heat sources such as torches and heaters)",
        "Emergency exits and escape routes",
        "Evacuation procedures in case of fire or other emergencies",
        "Location and use of fire extinguishing equipment",
        "Designated assembly point during evacuation",
      ],
      es: [
        "Medidas de prevención de incendios (incluidas fuentes de calor externas)",
        "Salidas de emergencia y rutas de escape",
        "Procedimientos de evacuación en caso de incendio u otras emergencias",
        "Ubicación y uso de equipos de extinción de incendios",
        "Punto de encuentro designado durante la evacuación",
      ],
      ru: [
        "Меры противопожарной защиты (включая наружные источники тепла)",
        "Аварийные выходы и пути эвакуации",
        "Процедуры эвакуации при пожаре или других чрезвычайных ситуациях",
        "Расположение и использование средств пожаротушения",
        "Назначенное место сбора при эвакуации",
      ],
    },
  },
  {
    key: "work_environment",
    title: {
      no: "5. Arbeidsmiljø",
      en: "5. Work Environment",
      es: "5. Ambiente de trabajo",
      ru: "5. Рабочая среда",
    },
    items: {
      no: [
        "Ergonomi knyttet til stående arbeid og tunge løft",
        "Forebygging av muskel- og skjelettskader",
        "Støyeksponering og bruk av hørselsvern ved behov",
        "Psykososialt arbeidsmiljø",
        "Forebygging av trakassering, diskriminering og upassende atferd",
      ],
      en: [
        "Ergonomics related to standing work and heavy lifting",
        "Prevention of musculoskeletal injuries",
        "Noise exposure and use of hearing protection when required",
        "Psychosocial work environment",
        "Prevention of harassment, discrimination and inappropriate behavior",
      ],
      es: [
        "Ergonomía relacionada con trabajo de pie y levantamiento de peso",
        "Prevención de lesiones musculoesqueléticas",
        "Exposición al ruido y uso de protección auditiva",
        "Ambiente de trabajo psicosocial",
        "Prevención de acoso, discriminación y comportamiento inapropiado",
      ],
      ru: [
        "Эргономика стоячей работы и подъёма тяжестей",
        "Профилактика травм опорно-двигательного аппарата",
        "Воздействие шума и использование средств защиты слуха",
        "Психосоциальная рабочая среда",
        "Предотвращение домогательств, дискриминации и ненадлежащего поведения",
      ],
    },
  },
  {
    key: "hygiene",
    title: {
      no: "6. Hygiene og smittevern",
      en: "6. Hygiene and Infection Control",
      es: "6. Higiene y control de infecciones",
      ru: "6. Гигиена и инфекционный контроль",
    },
    items: {
      no: [
        "Krav til personlig hygiene",
        "Hygienisk håndtering av mat og drikkevarer",
        "Renholdsrutiner og avfallshåndtering",
      ],
      en: [
        "Personal hygiene requirements",
        "Hygienic handling of food and beverages",
        "Cleaning routines and waste management",
      ],
      es: [
        "Requisitos de higiene personal",
        "Manejo higiénico de alimentos y bebidas",
        "Rutinas de limpieza y gestión de residuos",
      ],
      ru: [
        "Требования к личной гигиене",
        "Гигиеническое обращение с едой и напитками",
        "Процедуры уборки и управление отходами",
      ],
    },
  },
  {
    key: "emergency",
    title: {
      no: "7. Ulykker og beredskap",
      en: "7. Accidents and Emergency Preparedness",
      es: "7. Accidentes y preparación para emergencias",
      ru: "7. Несчастные случаи и готовность к ЧС",
    },
    items: {
      no: [
        "Prosedyrer ved ulykker og nødsituasjoner",
        "Førstehjelp",
        "Plassering av førstehjelpsutstyr",
      ],
      en: [
        "Procedures for accidents and emergency situations",
        "First aid procedures",
        "Location of first aid equipment",
      ],
      es: [
        "Procedimientos para accidentes y emergencias",
        "Procedimientos de primeros auxilios",
        "Ubicación del equipo de primeros auxilios",
      ],
      ru: [
        "Процедуры при несчастных случаях и чрезвычайных ситуациях",
        "Процедуры оказания первой помощи",
        "Расположение аптечек первой помощи",
      ],
    },
  },
  {
    key: "drugs",
    title: {
      no: "8. Narkotika",
      en: "8. Illegal Drugs and Narcotics",
      es: "8. Drogas ilegales y narcóticos",
      ru: "8. Наркотические вещества",
    },
    items: {
      no: [
        "Prosedyrer ved mistanke om bruk eller salg av narkotika på stedet",
        "Plikt til å varsle ansvarlig leder eller sikkerhetspersonell",
        "Samarbeid med politi i alvorlige situasjoner",
      ],
      en: [
        "Procedures when there is suspicion of drug use or dealing on the premises",
        "Obligation to inform the responsible manager or security personnel",
        "Cooperation with police in serious situations",
      ],
      es: [
        "Procedimientos ante sospecha de uso o venta de drogas en el local",
        "Obligación de informar al gerente o personal de seguridad",
        "Cooperación con la policía en situaciones graves",
      ],
      ru: [
        "Процедуры при подозрении на употребление или продажу наркотиков",
        "Обязанность информировать ответственного менеджера или охрану",
        "Сотрудничество с полицией в серьёзных ситуациях",
      ],
    },
  },
  {
    key: "cash_security",
    title: {
      no: "9. Kontanthåndtering og sikkerhet",
      en: "9. Cash Handling and Security",
      es: "9. Manejo de efectivo y seguridad",
      ru: "9. Обращение с наличными и безопасность",
    },
    items: {
      no: [
        "Prosedyrer for sikker håndtering av kontanter og transaksjoner",
        "Forebygging av tyveri og ran",
        "Ansattes opptreden ved ran eller trusselsituasjoner",
      ],
      en: [
        "Procedures for safe handling of cash and financial transactions",
        "Prevention of theft and robbery",
        "Employee conduct during robbery or threat situations",
      ],
      es: [
        "Procedimientos para el manejo seguro de efectivo y transacciones",
        "Prevención de robos y asaltos",
        "Conducta del empleado durante robos o amenazas",
      ],
      ru: [
        "Процедуры безопасного обращения с наличными и транзакциями",
        "Предотвращение краж и ограблений",
        "Действия сотрудника при ограблении или угрозе",
      ],
    },
  },
  {
    key: "incident_reporting",
    title: {
      no: "10. Hendelsesrapportering",
      en: "10. Incident Reporting",
      es: "10. Reporte de incidentes",
      ru: "10. Отчётность об инцидентах",
    },
    items: {
      no: [
        "Plikt til å rapportere hendelser, ulykker og nestenulykker",
        "Dokumentasjon av hendelser som involverer gjester eller ansatte",
        "Bruk av bedriftens avvikssystem",
      ],
      en: [
        "Obligation to report incidents, accidents and near misses",
        "Documentation of incidents involving guests or staff",
        "Use of the company's incident reporting system",
      ],
      es: [
        "Obligación de reportar incidentes, accidentes y cuasi-accidentes",
        "Documentación de incidentes que involucren invitados o personal",
        "Uso del sistema de reporte de incidentes de la empresa",
      ],
      ru: [
        "Обязанность сообщать об инцидентах, авариях и предпосылках",
        "Документирование инцидентов с участием гостей или персонала",
        "Использование системы отчётности об инцидентах компании",
      ],
    },
  },
]

const pageTexts: Record<
  UiLanguage,
  {
    title: string
    subtitle: string
    readAndUnderstood: string
    completed: string
    back: string
    progress: string
    allCompleted: string
    teamOverview: string
    myTraining: string
    notStarted: string
  }
> = {
  no: {
    title: "HMS-opplæring",
    subtitle: "Les gjennom alle punkter og kryss av når du har lest og forstått.",
    readAndUnderstood: "Jeg har lest og forstått",
    completed: "Fullført",
    back: "Tilbake",
    progress: "fullført",
    allCompleted: "Du har fullført all HMS-opplæring!",
    teamOverview: "Teamoversikt",
    myTraining: "Min opplæring",
    notStarted: "Ikke startet",
  },
  en: {
    title: "HSE Training",
    subtitle: "Read through all sections and check off when you have read and understood.",
    readAndUnderstood: "I have read and understood",
    completed: "Completed",
    back: "Back",
    progress: "completed",
    allCompleted: "You have completed all HSE training!",
    teamOverview: "Team overview",
    myTraining: "My training",
    notStarted: "Not started",
  },
  es: {
    title: "Formación SST",
    subtitle: "Lee todas las secciones y marca cuando hayas leído y comprendido.",
    readAndUnderstood: "He leído y comprendido",
    completed: "Completado",
    back: "Volver",
    progress: "completado",
    allCompleted: "¡Has completado toda la formación SST!",
    teamOverview: "Vista del equipo",
    myTraining: "Mi formación",
    notStarted: "No iniciado",
  },
  ru: {
    title: "Обучение ОТ",
    subtitle: "Прочитайте все разделы и отметьте, когда прочитаете и поймёте.",
    readAndUnderstood: "Я прочитал(а) и понял(а)",
    completed: "Завершено",
    back: "Назад",
    progress: "завершено",
    allCompleted: "Вы завершили всё обучение по охране труда!",
    teamOverview: "Обзор команды",
    myTraining: "Моё обучение",
    notStarted: "Не начато",
  },
}

export default function OpplaringPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const lang: UiLanguage =
    language === "en" || language === "es" || language === "ru" ? language : "no"
  const text = pageTexts[lang]

  const [openSection, setOpenSection] = useState<string | null>(null)
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [isLeader, setIsLeader] = useState(false)
  const [showTeam, setShowTeam] = useState(false)
  const [teamData, setTeamData] = useState<{ name: string; completed: number }[]>([])

  const employeeId =
    typeof window !== "undefined"
      ? localStorage.getItem("selectedEmployeeId")
      : null
  const venueId =
    typeof window !== "undefined"
      ? localStorage.getItem("selectedVenue")
      : null

  useEffect(() => {
    if (!employeeId) {
      router.replace("/ansatt")
      return
    }
    const role = localStorage.getItem("selectedEmployeeRole")
    setIsLeader(role === "leader")
    loadCompletions()
  }, [router, employeeId])

  async function loadCompletions() {
    if (!employeeId) return
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      const res = await fetch(
        `${url}/rest/v1/hse_completions?select=section_key&employee_id=eq.${employeeId}`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` } }
      )
      const data = await res.json()
      if (Array.isArray(data)) {
        setCompletedSections(new Set(data.map((d: { section_key: string }) => d.section_key)))
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  async function loadTeamData() {
    if (!venueId) return
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      const [empRes, compRes] = await Promise.all([
        fetch(
          `${url}/rest/v1/employees?select=id,name&venue_id=eq.${venueId}&order=name`,
          { headers: { apikey: key, Authorization: `Bearer ${key}` } }
        ),
        fetch(
          `${url}/rest/v1/hse_completions?select=employee_id,section_key&venue_id=eq.${venueId}`,
          { headers: { apikey: key, Authorization: `Bearer ${key}` } }
        ),
      ])
      const employees: { id: string; name: string }[] = await empRes.json()
      const completions: { employee_id: string; section_key: string }[] = await compRes.json()

      const countMap = new Map<string, number>()
      for (const c of completions) {
        countMap.set(c.employee_id, (countMap.get(c.employee_id) || 0) + 1)
      }

      setTeamData(
        employees.map((e) => ({
          name: e.name,
          completed: countMap.get(e.id) || 0,
        }))
      )
    } catch {
      // silent
    }
  }

  async function toggleSection(sectionKey: string) {
    if (!employeeId || !venueId) return
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const isCompleted = completedSections.has(sectionKey)

    if (isCompleted) {
      // Remove completion
      setCompletedSections((prev) => {
        const next = new Set(prev)
        next.delete(sectionKey)
        return next
      })
      await fetch(
        `${url}/rest/v1/hse_completions?employee_id=eq.${employeeId}&section_key=eq.${sectionKey}`,
        {
          method: "DELETE",
          headers: { apikey: key, Authorization: `Bearer ${key}` },
        }
      )
    } else {
      // Add completion
      setCompletedSections((prev) => new Set(prev).add(sectionKey))
      await fetch(`${url}/rest/v1/hse_completions`, {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employee_id: employeeId,
          venue_id: venueId,
          section_key: sectionKey,
        }),
      })
    }
  }

  const completedCount = completedSections.size
  const totalCount = HSE_SECTIONS.length

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-zinc-400">...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black px-6 pb-12 pt-16 text-white">
      <div className="mx-auto max-w-md">
        <h1 className="mb-2 text-center text-3xl font-bold">{text.title}</h1>
        <p className="mb-4 text-center text-sm text-zinc-400">{text.subtitle}</p>

        <div className="mb-8 text-center">
          <span className="text-lg font-semibold text-white">
            {completedCount}/{totalCount}
          </span>
          <span className="ml-2 text-sm text-zinc-400">{text.progress}</span>
          <div className="mx-auto mt-2 h-2 max-w-xs overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-500"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>

        {isLeader && (
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setShowTeam(false)}
              className={`flex-1 rounded-xl py-3 text-sm font-semibold transition active:scale-95 ${
                !showTeam ? "bg-white text-black" : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {text.myTraining}
            </button>
            <button
              onClick={() => {
                setShowTeam(true)
                loadTeamData()
              }}
              className={`flex-1 rounded-xl py-3 text-sm font-semibold transition active:scale-95 ${
                showTeam ? "bg-white text-black" : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {text.teamOverview}
            </button>
          </div>
        )}

        {showTeam && isLeader ? (
          <div className="space-y-2">
            {teamData.map((emp) => (
              <div
                key={emp.name}
                className="flex items-center justify-between rounded-2xl bg-zinc-800 px-5 py-4"
              >
                <span className="font-medium">{emp.name}</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-semibold ${
                      emp.completed === totalCount
                        ? "text-green-400"
                        : emp.completed > 0
                        ? "text-yellow-400"
                        : "text-zinc-500"
                    }`}
                  >
                    {emp.completed === 0
                      ? text.notStarted
                      : `${emp.completed}/${totalCount}`}
                  </span>
                  {emp.completed === totalCount && (
                    <span className="text-green-400">✓</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
        <>

        {completedCount === totalCount && (
          <div className="mb-6 rounded-2xl bg-green-500/10 border border-green-500/20 p-4 text-center text-green-400">
            ✓ {text.allCompleted}
          </div>
        )}

        <div className="space-y-3">
          {HSE_SECTIONS.map((section) => {
            const isOpen = openSection === section.key
            const isDone = completedSections.has(section.key)

            return (
              <div key={section.key}>
                <button
                  type="button"
                  onClick={() =>
                    setOpenSection(isOpen ? null : section.key)
                  }
                  className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left transition active:scale-[0.98] ${
                    isDone
                      ? "bg-green-500/10 border border-green-500/20"
                      : "bg-zinc-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isDone && (
                      <span className="text-green-400">✓</span>
                    )}
                    <span className={`text-sm font-semibold ${isDone ? "text-green-400" : ""}`}>
                      {section.title[lang]}
                    </span>
                  </div>
                  <span className="text-xl text-zinc-400">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>

                {isOpen && (
                  <div className="mt-2 rounded-2xl bg-zinc-900 p-5">
                    <ul className="mb-5 space-y-3">
                      {section.items[lang].map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-sm text-zinc-300"
                        >
                          <span className="mt-0.5 text-zinc-500">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      onClick={() => toggleSection(section.key)}
                      className={`w-full rounded-xl py-3 text-sm font-semibold transition active:scale-95 ${
                        isDone
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-white text-black"
                      }`}
                    >
                      {isDone
                        ? `✓ ${text.completed}`
                        : text.readAndUnderstood}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        </>
        )}

        <button
          onClick={() => router.push("/")}
          className="mt-10 w-full rounded-xl border border-zinc-600 py-3 text-sm text-zinc-300 transition active:scale-95"
        >
          {text.back}
        </button>
      </div>
    </main>
  )
}
