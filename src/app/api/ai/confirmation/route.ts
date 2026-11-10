import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { STATUS_LABEL, TICKET_LABEL, formatDate, type Registration, type EventItem } from "@/lib/types";

// Genera un correo de confirmación personalizado para una inscripción.
// Corre solo en el servidor: GEMINI_API_KEY nunca llega al navegador.
export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return Response.json({ error: "No autenticado" }, { status: 401 });

  const { registrationId } = (await request.json().catch(() => ({}))) as { registrationId?: string };
  if (!registrationId) return Response.json({ error: "Falta registrationId" }, { status: 400 });

  // Cliente con el token del organizador: RLS garantiza que solo acceda a inscripciones de SUS eventos.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } },
  );

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return Response.json({ error: "Sesión inválida" }, { status: 401 });

  const { data, error } = await supabase
    .from("registrations")
    .select("*, events(*)")
    .eq("id", registrationId)
    .maybeSingle();
  if (error || !data) return Response.json({ error: "Inscripción no encontrada" }, { status: 404 });

  const registration = data as Registration & { events: EventItem };
  const event = registration.events;

  let message: string;
  let source: "gemini" | "plantilla" = "plantilla";

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
        contents: buildPrompt(registration, event),
      });
      if (response.text?.trim()) {
        message = response.text.trim();
        source = "gemini";
      } else {
        message = buildTemplate(registration, event);
      }
    } catch (err) {
      console.error("Error de Gemini, se usa plantilla:", err);
      message = buildTemplate(registration, event);
    }
  } else {
    message = buildTemplate(registration, event);
  }

  const { error: updateError } = await supabase
    .from("registrations")
    .update({ ai_message: message })
    .eq("id", registrationId);
  if (updateError) return Response.json({ error: "No se pudo guardar el mensaje" }, { status: 500 });

  return Response.json({ message, source });
}

function buildPrompt(r: Registration, e: EventItem) {
  return `Eres el equipo organizador de un evento corporativo en Perú. Redacta en español un correo breve y profesional (máximo 140 palabras) dirigido a un asistente inscrito.

Datos del evento:
- Nombre: ${e.name}
- Fecha: ${formatDate(e.starts_at)}
- Lugar: ${e.venue ?? "por confirmar"}
- Descripción: ${e.description ?? "sin descripción"}

Datos del asistente:
- Nombre: ${r.full_name}
- Empresa: ${r.company ?? "no indicada"}
- Cargo: ${r.job_title ?? "no indicado"}
- Tipo de entrada: ${TICKET_LABEL[r.ticket_type]}
- Estado de la inscripción: ${STATUS_LABEL[r.status]}

Instrucciones:
- Incluye una línea "Asunto:" al inicio.
- Adapta el tono al estado: si está "Pendiente" indica que su registro está en revisión; si está "Confirmado" confirma su cupo; si está "Cancelado" informa la cancelación con amabilidad; si "Asistió" agradece su participación.
- Si tiene empresa o cargo, menciona brevemente por qué el evento le aporta valor en su rol.
- No inventes datos que no estén arriba (horarios, precios, enlaces).
- Firma como "Equipo organizador de ${e.name}".`;
}

function buildTemplate(r: Registration, e: EventItem) {
  const intro: Record<Registration["status"], string> = {
    pendiente: "hemos recibido tu inscripción y está en revisión. Te avisaremos apenas sea confirmada.",
    confirmado: "tu cupo está confirmado. ¡Te esperamos!",
    asistio: "gracias por acompañarnos. Fue un gusto contar con tu participación.",
    cancelado: "te informamos que tu inscripción ha sido cancelada. Si es un error, responde este correo.",
  };
  return `Asunto: ${e.name} - Inscripción ${STATUS_LABEL[r.status].toLowerCase()}

Hola ${r.full_name},

${intro[r.status]}

Evento: ${e.name}
Fecha: ${formatDate(e.starts_at)}
Lugar: ${e.venue ?? "por confirmar"}
Entrada: ${TICKET_LABEL[r.ticket_type]}

Saludos,
Equipo organizador de ${e.name}`;
}
