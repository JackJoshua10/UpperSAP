export type EventItem = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  venue: string | null;
  starts_at: string | null;
  capacity: number | null;
  created_at: string;
};

export type RegistrationStatus = "pendiente" | "confirmado" | "asistio" | "cancelado";
export type TicketType = "general" | "vip" | "estudiante";

export type Registration = {
  id: string;
  event_id: string;
  full_name: string;
  email: string;
  company: string | null;
  job_title: string | null;
  phone: string | null;
  ticket_type: TicketType;
  status: RegistrationStatus;
  notes: string | null;
  ai_message: string | null;
  created_at: string;
  updated_at: string;
};

export const STATUS_LABEL: Record<RegistrationStatus, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  asistio: "Asistió",
  cancelado: "Cancelado",
};

export const STATUS_STYLE: Record<RegistrationStatus, string> = {
  pendiente: "bg-amber-100 text-amber-800",
  confirmado: "bg-blue-100 text-blue-800",
  asistio: "bg-emerald-100 text-emerald-800",
  cancelado: "bg-slate-200 text-slate-600",
};

export const TICKET_LABEL: Record<TicketType, string> = {
  general: "General",
  vip: "VIP",
  estudiante: "Estudiante",
};

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function formatDate(date: string | null) {
  if (!date) return "Fecha por definir";
  return new Date(`${date}T12:00:00`).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
