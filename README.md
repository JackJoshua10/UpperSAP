# EventoPro

Micro SaaS B2B para que organizaciones gestionen las **inscripciones de sus congresos y eventos corporativos**, con correos de confirmación redactados por IA.

- **App desplegada:** https://eventopro-nine.vercel.app
- **Repositorio:** https://github.com/JackJoshua10/UpperSAP
- **Propuesta del producto:** [docs/PROPUESTA.md](docs/PROPUESTA.md)
- **Uso de IA en el desarrollo:** [docs/USO_IA.md](docs/USO_IA.md)

## Funcionalidades

| Requisito del examen | Dónde está |
|---|---|
| Landing | `/` |
| Módulo principal | `/dashboard`: panel de inscripciones por evento |
| Registro de información | Formulario público `/e/<slug>` y botón "Registrar asistente" en el panel |
| Listado | Panel con búsqueda, filtro por estado y métricas |
| Edición / cambio de estado | Selector de estado en cada fila y modal "Editar" |
| Eliminación | Botón "Eliminar" con confirmación |
| Base de datos | Supabase (PostgreSQL) con RLS |
| Bonus | Login, datos separados por organizador, IA real (Gemini), diseño responsive, variables de entorno, README |

## Arquitectura

```
Navegador (Next.js / React, Tailwind)
  ├─ supabase-js ──► Supabase Auth (login del organizador)
  │                  PostgreSQL + Row Level Security
  │                    · events: lectura pública, escritura solo del dueño
  │                    · registrations: el público solo inserta "pendiente";
  │                      ver, editar y borrar solo el dueño del evento
  └─ POST /api/ai/confirmation (Route Handler, servidor)
        ├─ valida el token del organizador y lee la inscripción con RLS
        └─► Google Gemini (GEMINI_API_KEY solo en el servidor)
```

- **Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Supabase · Google Gemini (`@google/genai`) · Vercel.
- **Seguridad:** la clave publicable de Supabase es pública por diseño. El aislamiento entre organizaciones lo garantizan las políticas RLS en Postgres, no el frontend. La clave de Gemini nunca se expone al navegador.
- **Esquema SQL:** [supabase/migrations](supabase/migrations).

## Estructura

```
src/
├─ app/
│  ├─ page.tsx                      Landing del producto
│  ├─ login/page.tsx                Registro e inicio de sesión (Supabase Auth)
│  ├─ dashboard/page.tsx            Panel del organizador: eventos, inscripciones, estados, IA
│  ├─ e/[slug]/page.tsx             Página pública de inscripción de un evento
│  └─ api/ai/confirmation/route.ts  Generación del correo con Gemini (servidor)
├─ components/dashboard/            Modal, formularios y tarjetas de métricas del panel
└─ lib/
   ├─ supabase.ts                   Cliente de Supabase
   └─ types.ts                      Tipos del dominio, estados y utilidades
supabase/migrations/                Esquema SQL y políticas RLS
```

## Ejecutar en local

```bash
npm install
cp .env.example .env.local   # completar las variables
npm run dev                  # http://localhost:3000
```

### Variables de entorno

| Variable | Dónde se obtiene |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys |
| `GEMINI_API_KEY` | Gratis en https://aistudio.google.com/apikey (opcional: sin ella se usa una plantilla) |
| `GEMINI_MODEL` | Opcional, por defecto `gemini-3.5-flash-lite` |

### Base de datos
Ejecuta el SQL de `supabase/migrations/` en el SQL Editor de tu proyecto Supabase.

## Deploy en Vercel
1. Importa el repositorio en https://vercel.com/new (detecta Next.js automáticamente).
2. En **Environment Variables** agrega las cuatro variables de arriba.
3. Deploy. Cada `git push` a `main` vuelve a desplegar.
4. En Supabase → Authentication → URL Configuration, agrega la URL de Vercel como *Site URL*.

## Flujo de demo
1. Crear una cuenta en `/login` y crear un evento.
2. Abrir "Ver página pública" e inscribir a un asistente.
3. En el panel: verlo en la lista, cambiar su estado a *Confirmado*, generar su correo con IA, editarlo y eliminarlo.
