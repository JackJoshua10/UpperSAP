# Uso de IA durante el desarrollo

> Completa y ajusta este documento con tus propias palabras antes de entregarlo: debes poder defender cada punto.

## 1. Herramienta utilizada
- **Claude Code** (CLI de Anthropic, modelo Claude Opus 5.5) como asistente de desarrollo en la terminal, conectado a Supabase (MCP) y al navegador.
- **Google Gemini** (API gratuita de Google AI Studio) como IA dentro del producto.

## 2. Prompts principales
1. "Lee el PDF del examen y, antes de codear, definamos la arquitectura y el stack siguiendo los requerimientos."
2. "Evalúa la landing que hice para el CIMP (cimp.soniemperu.com) y dime cómo orientarla a lo que pide el examen."
3. "EventoPro con inscripciones de asistentes, crea el proyecto Supabase desde aquí, usemos una IA gratuita."
4. Iteraciones para corregir errores de build y lint (ver sección 5).

## 3. Código generado con apoyo de IA
- Esquema SQL con políticas RLS (`supabase/migrations/`).
- Páginas Next.js: landing (`/`), login (`/login`), panel (`/dashboard`) e inscripción pública (`/e/[slug]`).
- Route Handler de IA (`/api/ai/confirmation`) con el prompt a Gemini y la plantilla de respaldo.
- README y documentación.

## 4. Decisiones que tomé yo
- **Idea del producto:** partir de mi experiencia real construyendo la landing del I Congreso de la Industria Musical en el Perú y convertirla en un SaaS B2B para organizadores, en lugar de entregar una landing informativa (que el examen prohíbe).
- **Módulo principal:** inscripciones de asistentes en lugar de patrocinadores, por ser más demostrable en vivo y por resolver el dolor más frecuente.
- **IA gratuita:** Gemini en lugar de una API de pago. Si falla o no hay clave, la app sigue funcionando con una plantilla.
- **Stack:** opción A del examen (Next.js + Supabase + Vercel) por velocidad y porque Supabase incluye autenticación y RLS.
- **Seguridad:** el aislamiento entre organizadores se hace en la base de datos (RLS), no en el frontend. El público solo puede crear inscripciones "pendientes" y no puede leer datos de otros asistentes.

## 5. Errores encontrados y cómo se resolvieron
| Error | Causa | Solución |
|---|---|---|
| No se podía leer el PDF desde la terminal | La configuración bloqueaba lecturas fuera del proyecto | Se agregó el Escritorio como directorio de trabajo (`/add-dir`) |
| La landing del CIMP no podía leerse con una descarga simple | Se renderiza con JavaScript | Se revisó con el navegador |
| Build falló en `/e/[slug]`: `useParams()` fuera de `<Suspense>` | Cambio de Next.js 16: los hooks de URL bloquean el prerender | Se envolvió el componente en `<Suspense>` |
| Lint `react-hooks/set-state-in-effect` (3 errores) | Regla nueva de React 19 contra `setState` síncrono en efectos | Se movieron las actualizaciones de estado a callbacks async y el estado de carga se derivó en lugar de guardarlo |
| La IA respondía con la plantilla aunque la API key estaba configurada | El log mostró `404 NOT_FOUND`: el alias `gemini-flash-lite-latest` solo existe en la API `v1beta` y el SDK `@google/genai` v3 usa `v1` | Se listaron los modelos disponibles con la API, se probó cada uno en `v1` y `v1beta` y se fijó `gemini-3.5-flash-lite` (estable y disponible en ambas) |
| Variables de entorno en Vercel con 3 caracteres extra (`ï»¿https://...`) | Al pasar los valores por tubería, PowerShell 5.1 antepone un BOM UTF-8 | Se detectó comparando con `vercel env pull` y se volvieron a cargar desde Git Bash con `printf '%s'` |
| `eventopro.vercel.app` mostraba otro sitio | Ese subdominio pertenece a otro usuario de Vercel | Se usó el alias real del proyecto: `eventopro-nine.vercel.app` |
| `.env.example` quedaba ignorado por git | El `.gitignore` por defecto ignora `.env*` | Se agregó la excepción `!.env.example` |

## 6. Verificación
- `npm run build` y `npm run lint` sin errores.
- Políticas RLS probadas con SQL en una transacción revertida:
  - el público inserta, pero ve 0 registros
  - otro organizador ve y borra 0 registros
  - el dueño ve, cambia de estado y elimina su registro
