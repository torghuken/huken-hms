# Huken HMS – Prosjektnotat for Claude

Denne filen leses av Claude ved starten av hver økt for å gjenopprette kontekst.

---

## Prosjektoversikt

**Huken HMS** er et internt HMS-verktøy for serveringssteder (f.eks. Huken).
Ansatte logger daglige oppgaver, temperaturer og avvik. Ledere administrerer oppgaver og ser logger.

- **Repo:** https://github.com/torghuken/huken-hms
- **Hostet på:** Vercel (auto-deploy fra main)
- **Database:** Supabase (REST API — ingen SDK, direkte fetch-kall)
- **Stack:** Next.js App Router, TypeScript, Tailwind CSS

---

## Viktige regler

- **Alltid spør før du gjør endringer.** Ikke start med kodeendringer uten bekreftelse.
- Sandkasse-nettverket er blokkert → kan ikke nå Supabase API eller pushe til GitHub. Brukeren må kjøre SQL og `git push` selv.
- Brukeren pusher kode selv via `git push origin main` i terminalen.

---

## Språkstøtte

Appen støtter 4 språk: `no` (norsk), `en` (engelsk), `es` (spansk), `ru` (russisk).

- `UiLanguage = "no" | "en" | "es" | "ru"` brukes på alle sider
- `currentLanguage`-mønster: `language === "en" || language === "es" || language === "ru" ? language : "no"`
- Oversettelser finnes i `lib/translations.ts` (globale nøkler) og lokale `*Texts`-objekter per side
- `getTaskDisplayName(task, language)` henter riktig `name_ru / name_es / name_en / name_no`

---

## Databasetabeller (relevante)

| Tabell | Viktige felt |
|--------|-------------|
| `tasks` | `id`, `name`, `name_no`, `name_en`, `name_es`, `name_ru`, `active`, `sort_order`, `list_id`, `image_url`, `requires_photo`, `is_monthly`, `show_monday`…`show_sunday` |
| `task_lists` | `id`, `name`, `venue_id`, `hide_for_6_hours` |
| `logs` | `id`, `task_id`, `created_at`, … |
| `task_logs` | mulig alias for logs |

---

## Faste oppgavelister (per venue)

| Navn i DB | Vises som |
|-----------|-----------|
| `Åpning` | Opening / Åpning |
| `Daglige oppgaver` | Daily tasks / Daglige oppgaver |
| `Stenging` | Closing / Stenging |

**NB:** `Andre oppgaver` eksisterer ikke lenger — slettet og slått sammen med Daglige oppgaver (migrert i Supabase + kode fjernet).

---

## Hva som er bygget / endret (kronologisk)

### Russisk språkstøtte
Lagt til `ru` i alle sider: `bekreft`, `kamera`, `kamera-fiks`, `temperatur`, `temperatur/[id]`, alle `logg/*`-sider, `admin-oppgaver`, `oppgave`, `oppgavevalg`, `lib/translations.ts`.

### Rediger-knapp i admin-oppgaver
- Knapp på hvert oppgavekort som pre-fyller skjemaet for redigering
- PATCH ved lagring, POST ved ny oppgave
- `editingTaskId` state styrer modus
- Avbryt-knapp nullstiller skjemaet

### Sammenslåing: Andre oppgaver → Daglige oppgaver
- SQL kjørt: flytte tasks + slette `Andre oppgaver`-lister
- All kode som refererte til "Andre oppgaver" fjernet fra: `oppgavevalg`, `oppgave`, `admin-oppgaver`, `logg/page`, `logg/andre` (slettet), `lib/translations.ts`
- `dailyTasks` lagt til i `lib/translations.ts` for alle 4 språk

### Månedlige oppgaver (`is_monthly`)
- Ny boolean-kolonne i `tasks`-tabellen: `ALTER TABLE tasks ADD COLUMN is_monthly boolean DEFAULT false;`
- Toggle i admin-oppgaver (lilla, skjuler dagvalgene)
- Lilla badge på kortet i listen
- Filtreringslogikk i `oppgave/page.tsx`: månedlige oppgaver skjules i **21 dager** etter utføring (sjekker `logs`-tabellen)
- Vanlige oppgaver: eksisterende 6-timers logikk uendret

### Delete-knapp mobilfix
- `window.confirm()` erstattet med inline bekreftelse direkte på kortet
- Trykk Slett → viser ✓ Slett + ✕ — trykk én gang til for å bekrefte
- Fungerer på alle enheter (window.confirm er blokkert på mobil/PWA)

---

## Kjente begrensninger / TODO

- [ ] SQL for `is_monthly`-kolonnen må kjøres av bruker i Supabase: `ALTER TABLE tasks ADD COLUMN is_monthly boolean DEFAULT false;`
- [ ] `confirmDeleteStart` og `confirmDeleteEnd` i admin-oppgaver tekst-objekter er nå ubrukte (kan ryddes bort)

---

## Git

- Branch: `main`
- Siste commit: "Fix delete button on mobile by replacing window.confirm with inline confirmation"
- Push gjøres av bruker: `git push origin main`
